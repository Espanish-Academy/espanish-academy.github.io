import type { Attachment, Insight, Lesson, LessonNote, Message, Profile, Questionnaire, Submission, Task } from './types'

/**
 * Everything the app reads or writes goes through this interface.
 * Two implementations: a local demo (browser only) and Supabase (real, shared).
 */
export interface Store {
  mode: 'demo' | 'supabase'

  currentUser(): Promise<Profile | null>
  signIn(email: string, password: string): Promise<void>
  signUp(name: string, email: string, password: string): Promise<void>
  signOut(): Promise<void>
  demoLogin?(who: 'teacher' | 'student' | 'new'): Promise<void>
  resetDemo?(): Promise<void>

  updateProfile(id: string, patch: { name?: string }): Promise<void>
  getTeacher(): Promise<Profile | null>
  getProfile(id: string): Promise<Profile | null>
  listStudents(): Promise<Profile[]>

  getQuestionnaire(studentId: string): Promise<Questionnaire | null>
  listQuestionnaires(): Promise<Questionnaire[]>
  saveQuestionnaire(q: Questionnaire): Promise<void>

  listMessages(studentId?: string): Promise<Message[]>
  sendMessage(m: Omit<Message, 'id' | 'createdAt' | 'readAt'>): Promise<void>
  markRead(studentId: string, readerId: string): Promise<void>

  listLessons(studentId?: string): Promise<Lesson[]>
  saveLesson(l: Lesson): Promise<void>
  deleteLesson(id: string): Promise<void>

  listLessonNotes(studentId?: string): Promise<LessonNote[]>
  saveLessonNote(n: LessonNote): Promise<void>

  listTasks(studentId?: string): Promise<Task[]>
  saveTask(t: Task): Promise<void>
  deleteTask(id: string): Promise<void>

  listSubmissions(studentId?: string): Promise<Submission[]>
  saveSubmission(s: Submission): Promise<void>

  getInsight(studentId: string): Promise<Insight | null>
  saveInsight(i: Insight): Promise<void>

  upload(file: File): Promise<Attachment>

  /** Called whenever data may have changed (own writes, realtime events, auth). */
  subscribe(cb: () => void): () => void
}

export class Emitter {
  private subs = new Set<() => void>()
  on(cb: () => void) {
    this.subs.add(cb)
    return () => { this.subs.delete(cb) }
  }
  emit() {
    this.subs.forEach(cb => cb())
  }
}
