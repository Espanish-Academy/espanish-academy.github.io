import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { Emitter, type Store } from './store'
import type { Attachment, Insight, Lesson, LessonNote, Message, Profile, Questionnaire, Submission, Task } from './types'
import { compressImage, uid } from './util'

type Row = Record<string, unknown>

// Column names are snake_case in Postgres, camelCase in the app. Only top-level keys are converted,
// so jsonb contents (answers, questions, vocab…) stay exactly as the app wrote them.
const snake = (s: string) => s.replace(/[A-Z]/g, c => '_' + c.toLowerCase())
const camel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
const toRow = (o: object): Row => Object.fromEntries(Object.entries(o).map(([k, v]) => [snake(k), v]))
const fromRow = <T,>(r: Row): T => Object.fromEntries(Object.entries(r).map(([k, v]) => [camel(k), v])) as T
const many = <T,>(rows: Row[] | null) => (rows ?? []).map(r => fromRow<T>(r))

const BUCKET = 'files'

export class SupabaseStore implements Store {
  mode = 'supabase' as const
  private sb: SupabaseClient
  private ev = new Emitter()

  constructor(url: string, key: string) {
    this.sb = createClient(url, key)
    this.sb.auth.onAuthStateChange(() => this.ev.emit())
    this.sb
      .channel('espanish')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => this.ev.emit())
      .subscribe()
  }

  private async q<T>(p: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<T> {
    const { data, error } = await p
    if (error) throw new Error(error.message)
    return data as T
  }
  private async write(p: PromiseLike<{ error: { message: string } | null }>) {
    const { error } = await p
    if (error) throw new Error(error.message)
    this.ev.emit()
  }

  async currentUser() {
    const { data } = await this.sb.auth.getSession()
    const id = data.session?.user.id
    return id ? this.getProfile(id) : null
  }
  async signIn(email: string, password: string) {
    const { error } = await this.sb.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }
  async signUp(name: string, email: string, password: string) {
    const { data, error } = await this.sb.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: location.origin + import.meta.env.BASE_URL } })
    if (error) throw new Error(error.message)
    if (!data.session) throw new Error('Check your email to confirm your account, then sign in.')
  }
  async signOut() { await this.sb.auth.signOut() }

  async updateProfile(id: string, patch: { name?: string }) {
    await this.write(this.sb.from('profiles').update(patch).eq('id', id))
  }
  async getTeacher() {
    const rows = await this.q<Row[]>(this.sb.from('profiles').select('*').eq('role', 'teacher').limit(1))
    return rows[0] ? fromRow<Profile>(rows[0]) : null
  }
  async getProfile(id: string) {
    const r = await this.q<Row | null>(this.sb.from('profiles').select('*').eq('id', id).maybeSingle())
    return r ? fromRow<Profile>(r) : null
  }
  async listStudents() {
    return many<Profile>(await this.q(this.sb.from('profiles').select('*').eq('role', 'student').order('created_at')))
  }

  async getQuestionnaire(studentId: string) {
    const r = await this.q<Row | null>(this.sb.from('questionnaires').select('*').eq('student_id', studentId).maybeSingle())
    return r ? fromRow<Questionnaire>(r) : null
  }
  async listQuestionnaires() { return many<Questionnaire>(await this.q(this.sb.from('questionnaires').select('*'))) }
  async saveQuestionnaire(q: Questionnaire) { await this.write(this.sb.from('questionnaires').upsert(toRow(q))) }

  async listMessages(studentId?: string) {
    let query = this.sb.from('messages').select('*').order('created_at')
    if (studentId) query = query.eq('student_id', studentId)
    return many<Message>(await this.q(query))
  }
  async sendMessage(m: Omit<Message, 'id' | 'createdAt' | 'readAt'>) {
    await this.write(this.sb.from('messages').insert(toRow({ ...m, id: uid() })))
  }
  async markRead(studentId: string, readerId: string) {
    const { data } = await this.sb.from('messages').update({ read_at: new Date().toISOString() })
      .eq('student_id', studentId).neq('sender_id', readerId).is('read_at', null).select('id')
    if (data?.length) this.ev.emit()
  }

  async listLessons(studentId?: string) {
    let query = this.sb.from('lessons').select('*').order('starts_at')
    if (studentId) query = query.eq('student_id', studentId)
    return many<Lesson>(await this.q(query))
  }
  async saveLesson(l: Lesson) { await this.write(this.sb.from('lessons').upsert(toRow(l))) }
  async deleteLesson(id: string) { await this.write(this.sb.from('lessons').delete().eq('id', id)) }

  async listLessonNotes(studentId?: string) {
    let query = this.sb.from('lesson_notes').select('*')
    if (studentId) query = query.eq('student_id', studentId)
    return many<LessonNote>(await this.q(query))
  }
  async saveLessonNote(n: LessonNote) { await this.write(this.sb.from('lesson_notes').upsert(toRow(n))) }

  async listTasks(studentId?: string) {
    let query = this.sb.from('tasks').select('*').order('created_at', { ascending: false })
    if (studentId) query = query.eq('student_id', studentId)
    return many<Task>(await this.q(query))
  }
  async saveTask(t: Task) { await this.write(this.sb.from('tasks').upsert(toRow(t))) }
  async deleteTask(id: string) { await this.write(this.sb.from('tasks').delete().eq('id', id)) }

  async listSubmissions(studentId?: string) {
    let query = this.sb.from('submissions').select('*')
    if (studentId) query = query.eq('student_id', studentId)
    return many<Submission>(await this.q(query))
  }
  async saveSubmission(s: Submission) {
    await this.write(this.sb.from('submissions').upsert(toRow(s), { onConflict: 'task_id' }))
  }

  async getInsight(studentId: string) {
    const r = await this.q<Row | null>(this.sb.from('insights').select('*').eq('student_id', studentId).maybeSingle())
    return r ? fromRow<Insight>(r) : null
  }
  async saveInsight(i: Insight) { await this.write(this.sb.from('insights').upsert(toRow(i))) }

  async upload(file: File): Promise<Attachment> {
    const isImage = file.type.startsWith('image/')
    const body = isImage ? await compressImage(file) : file
    const ext = isImage ? 'jpg' : (file.name.split('.').pop() || 'bin')
    const path = `${uid()}.${ext}`
    const { error } = await this.sb.storage.from(BUCKET).upload(path, body, { contentType: isImage ? 'image/jpeg' : file.type })
    if (error) throw new Error(error.message)
    const url = this.sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
    return { name: file.name, url, kind: isImage ? 'image' : 'file' }
  }

  subscribe(cb: () => void) { return this.ev.on(cb) }
}
