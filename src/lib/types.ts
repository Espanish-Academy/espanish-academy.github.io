export type Role = 'teacher' | 'student'
export type Lang = 'en' | 'es'

export interface Profile {
  id: string
  role: Role
  name: string
  email?: string | null
  lang: Lang
  createdAt: string
}

export type AnswerValue = string | string[] | number
export type Answers = Record<string, AnswerValue>

export interface Questionnaire {
  studentId: string
  answers: Answers
  completedAt: string | null
}

export interface Attachment {
  name: string
  url: string
  kind: 'file' | 'image' | 'link'
}

export interface Message {
  id: string
  studentId: string
  senderId: string
  text: string
  imageUrl?: string | null
  createdAt: string
  readAt?: string | null
}

export interface VocabItem {
  es: string
  en: string
}

export type LessonStatus = 'planned' | 'done' | 'cancelled'

export interface Lesson {
  id: string
  studentId: string
  startsAt: string
  durationMin: number
  status: LessonStatus
  title: string
  topics: string[]
  vocab: VocabItem[]
  summary: string
  materials: Attachment[]
  recordingUrl?: string | null
}

/** Teacher-only notes about a lesson. Never visible to the student. */
export interface LessonNote {
  lessonId: string
  studentId: string
  mood: number | null
  struggles: string[]
  skip: string[]
  workOn: string[]
  privateText: string
}

export type TaskKind = 'homework' | 'exercise' | 'exam'
export type QuestionType = 'choice' | 'fill' | 'open'

export interface TaskQuestion {
  id: string
  type: QuestionType
  prompt: string
  options?: string[]
  /** choice: the correct option text. fill: accepted answers separated by "/". open: unused. */
  answer?: string
}

export interface Task {
  id: string
  studentId: string
  lessonId?: string | null
  kind: TaskKind
  title: string
  instructions: string
  dueAt?: string | null
  attachments: Attachment[]
  questions: TaskQuestion[]
  createdAt: string
}

export interface Submission {
  id: string
  taskId: string
  studentId: string
  answers: Record<string, string>
  textAnswer: string
  attachments: Attachment[]
  score: number | null
  total: number | null
  submittedAt: string
  feedback?: string | null
}

/** Teacher-only notes about a student (portfolio). */
export interface Insight {
  studentId: string
  /** Free notes. */
  notes: string
  /** To improve for the next class. */
  nextLesson: string
  /** To practise more. */
  practice: string
  /** Homework to send. */
  homework: string
  updatedAt: string
}
