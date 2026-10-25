import type { Attachment, Insight, Lang, Placement, PresenceInfo, PresenceSession, StudentMaterial, Lesson, LessonNote, Message, Profile, Questionnaire, Submission, Task } from './types'

/**
 * Everything the app reads or writes goes through this interface.
 * Two implementations: a local demo (browser only) and Supabase (real, shared).
 */
export interface Store {
  mode: 'demo' | 'supabase'

  currentUser(): Promise<Profile | null>
  signIn(email: string, password: string): Promise<void>
  signUp(name: string, email: string, password: string, lang: Lang): Promise<void>
  signOut(): Promise<void>
  /** Password reset: email a link; opening it signs the person in with `recovering` set until they pick a new password. */
  requestPasswordReset?(email: string): Promise<void>
  setNewPassword?(password: string): Promise<void>
  recovering?: boolean
  demoLogin?(who: 'teacher' | 'student' | 'new'): Promise<void>
  resetDemo?(): Promise<void>

  updateProfile(id: string, patch: { name?: string; lang?: Lang }): Promise<void>
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

  /** The level check is public: saving works without signing in. Reading is teacher-only. */
  savePlacement(p: Placement): Promise<void>
  listPlacements(): Promise<Placement[]>
  markPlacementSeen(id: string): Promise<void>
  linkPlacement(id: string, studentId: string | null): Promise<void>

  /** Students call this while the app is open; the teacher reads the summary. */
  pingPresence(sessionId: string): Promise<void>
  presenceOverview(): Promise<PresenceInfo[]>
  presenceSessions(studentId: string, limit?: number): Promise<PresenceSession[]>

  listStudentMaterials(studentId: string): Promise<StudentMaterial[]>
  addStudentMaterials(items: Omit<StudentMaterial, 'id' | 'createdAt'>[]): Promise<void>
  deleteStudentMaterial(id: string): Promise<void>

  getStudentFolder(studentId: string): Promise<string | null>
  saveStudentFolder(studentId: string, folderId: string | null): Promise<void>

  savePushSubscription(sub: { endpoint: string; p256dh: string; auth: string }): Promise<void>
  deletePushSubscription(endpoint: string): Promise<void>

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
