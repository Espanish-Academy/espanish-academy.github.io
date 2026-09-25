import { Emitter, type Store } from './store'
import type { Attachment, Insight, Lesson, LessonNote, Message, Profile, Questionnaire, Submission, Task } from './types'
import { compressImage, uid } from './util'

/** Demo store: everything lives in this browser's localStorage. */

interface DB {
  profiles: Profile[]
  questionnaires: Questionnaire[]
  messages: Message[]
  lessons: Lesson[]
  notes: LessonNote[]
  tasks: Task[]
  submissions: Submission[]
  insights: Insight[]
}

const KEY = 'espanish-demo-v1'
const USER_KEY = 'espanish-demo-user'
const TEACHER = 'demo-teacher'
const STUDENT = 'demo-student'

const at = (days: number, hour = 18, min = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, min, 0, 0)
  return d.toISOString()
}

function seed(): DB {
  const L = ['l1', 'l2', 'l3', 'l4', 'l5']
  return {
    profiles: [
      { id: TEACHER, role: 'teacher', name: 'Profe', createdAt: at(-30) },
      { id: STUDENT, role: 'student', name: 'Miriam', createdAt: at(-22) },
    ],
    questionnaires: [{
      studentId: STUDENT, completedAt: at(-22),
      answers: {
        purpose: ['travel', 'personal'], timeframe: 'months', pace: 'relaxed', studied: 'never', basics: 'few',
        knownWords: 'hola, gracias, adiós, una cerveza por favor', comfort: '2', listening: 'some', reading: 'some',
        memorize: ['oral', 'stories'], studyWays: ['conversation', 'songs', 'homework'], content: ['music'],
        interests: ['gastronomy', 'travel', 'music', 'traditions'],
        culture: 'The food, flamenco, and how warm people are', dreamCountry: 'Spain',
        dreamWhy: 'My granddaughter lives in Valencia', recording: 'yes', recordingLog: [`yes|${at(-22, 17, 42)}`],
      },
    }],
    lessons: [
      {
        id: L[0], studentId: STUDENT, startsAt: at(-21), durationMin: 60, status: 'done',
        title: 'Me presento — introducing myself', topics: ['Greetings', 'Me llamo…', 'Numbers 1–10'],
        vocab: [
          { es: 'hola', en: 'hello' }, { es: 'buenos días', en: 'good morning' }, { es: 'me llamo', en: 'my name is' },
          { es: 'encantada', en: 'nice to meet you' }, { es: 'gracias', en: 'thank you' }, { es: 'adiós', en: 'goodbye' },
        ],
        summary: 'We said hello and introduced ourselves. Your “me llamo Miriam” already sounds lovely!',
        materials: [],
      },
      {
        id: L[1], studentId: STUDENT, startsAt: at(-14), durationMin: 60, status: 'done',
        title: 'En el café — ordering a coffee', topics: ['At the café', 'Quiero / me gustaría', 'Prices'],
        vocab: [
          { es: 'un café con leche', en: 'a coffee with milk' }, { es: 'la cuenta', en: 'the bill' },
          { es: 'quiero', en: 'I want' }, { es: 'por favor', en: 'please' },
          { es: '¿cuánto cuesta?', en: 'how much is it?' }, { es: 'el agua', en: 'water' },
        ],
        summary: 'We ordered at a café, asked for the bill and practised prices.',
        materials: [],
      },
      {
        id: L[2], studentId: STUDENT, startsAt: at(-7), durationMin: 60, status: 'done',
        title: 'Mi familia — my family', topics: ['Family words', 'Tener', 'Mi / tu'],
        vocab: [
          { es: 'la madre', en: 'mother' }, { es: 'el padre', en: 'father' }, { es: 'la hermana', en: 'sister' },
          { es: 'el hijo', en: 'son' }, { es: 'la nieta', en: 'granddaughter' }, { es: 'tengo', en: 'I have' },
        ],
        summary: 'We talked about your family — your granddaughter in Valencia will be proud!',
        materials: [{ name: 'Dictionary: familia', url: 'https://dle.rae.es/familia', kind: 'link' }],
      },
      {
        id: L[3], studentId: STUDENT, startsAt: at(2), durationMin: 60, status: 'planned',
        title: 'En el mercado — at the market', topics: ['Fruit and vegetables', '¿Cuánto cuesta?', 'Colours'],
        vocab: [], summary: '', materials: [],
      },
      {
        id: L[4], studentId: STUDENT, startsAt: at(9), durationMin: 60, status: 'planned',
        title: 'Tapas y restaurante', topics: ['Menu words', 'Me gusta / no me gusta'],
        vocab: [], summary: '', materials: [],
      },
    ],
    notes: [
      { lessonId: L[0], studentId: STUDENT, mood: 3, struggles: ['rolling the r', 'numbers 11–20'], skip: ['usted (formal) for now'], workOn: ['numbers'], privateText: 'Very motivated. Loves talking about her grandchildren.' },
      { lessonId: L[1], studentId: STUDENT, mood: 3, struggles: ['rolling the r', 'el / la gender'], skip: [], workOn: ['el / la gender', 'asking questions'], privateText: 'Great with café phrases. Tired after 50 minutes.' },
      { lessonId: L[2], studentId: STUDENT, mood: 2, struggles: ['el / la gender', 'tener conjugation'], skip: [], workOn: ['tener', 'el / la gender'], privateText: 'Mixed up tengo / tiene. Needs more repetition out loud.' },
    ],
    tasks: [
      {
        id: 't1', studentId: STUDENT, lessonId: L[1], kind: 'exercise', title: 'Café words', createdAt: at(-14, 19),
        instructions: 'A quick practice of the words from our café class.', dueAt: at(-10), attachments: [],
        questions: [
          { id: 'q1', type: 'choice', prompt: 'How do you say “the bill”?', options: ['la cuenta', 'el café', 'la leche'], answer: 'la cuenta' },
          { id: 'q2', type: 'fill', prompt: 'Quiero un café con ___ (milk)', answer: 'leche' },
          { id: 'q3', type: 'choice', prompt: '“¿Cuánto cuesta?” means…', options: ['How much is it?', 'Where is it?', 'What time is it?'], answer: 'How much is it?' },
          { id: 'q4', type: 'open', prompt: 'Write how you would order a coffee.' },
        ],
      },
      {
        id: 't2', studentId: STUDENT, lessonId: L[2], kind: 'homework', title: 'Draw your family tree', createdAt: at(-7, 19),
        instructions: 'Draw your family tree and write el padre, la madre, la nieta… next to each person. Take a photo and send it here 📸',
        dueAt: at(1, 20), attachments: [], questions: [],
      },
      {
        id: 't3', studentId: STUDENT, lessonId: L[2], kind: 'exercise', title: 'Mi familia — quick practice', createdAt: at(-7, 19),
        instructions: 'Five minutes, no stress. You can try again as many times as you like.', dueAt: at(2, 17), attachments: [],
        questions: [
          { id: 'q1', type: 'choice', prompt: '“la hermana” means…', options: ['sister', 'mother', 'daughter'], answer: 'sister' },
          { id: 'q2', type: 'fill', prompt: 'Yo ___ dos hijos. (tener)', answer: 'tengo' },
          { id: 'q3', type: 'choice', prompt: 'Which one is correct?', options: ['la madre', 'el madre'], answer: 'la madre' },
          { id: 'q4', type: 'fill', prompt: 'Mi ___ vive en Valencia. (granddaughter)', answer: 'nieta' },
        ],
      },
    ],
    submissions: [{
      id: 's1', taskId: 't1', studentId: STUDENT, submittedAt: at(-11, 11),
      answers: { q1: 'la cuenta', q2: 'leche', q3: 'How much is it?', q4: 'Hola, quiero un café con leche, por favor.' },
      textAnswer: '', attachments: [], score: 3, total: 3, feedback: '¡Muy bien, Miriam! Perfect café order 🌟',
    }],
    messages: [
      { id: 'm1', studentId: STUDENT, senderId: TEACHER, createdAt: at(-8, 10), readAt: at(-8, 12), text: '¡Hola Miriam! Here is the song we talked about 🎵 https://www.youtube.com/results?search_query=bailando+enrique+iglesias' },
      { id: 'm2', studentId: STUDENT, senderId: STUDENT, createdAt: at(-8, 12), readAt: at(-8, 13), text: '¡Gracias! I love it 😍' },
      { id: 'm3', studentId: STUDENT, senderId: TEACHER, createdAt: at(-1, 9), readAt: null, text: 'Reminder: class in two days — we are going to the market! 🍅🍋' },
    ],
    insights: [{
      studentId: STUDENT, updatedAt: at(-7),
      notes: 'Loves talking about her grandchildren. Gets tired after ~50 min — keep the last part light (song or chat).',
      nextLesson: 'Market vocabulary + colours. Bring real fruit photos.',
    }],
  }
}

const clone = <T,>(x: T): T => structuredClone(x)
const upsert = <T,>(list: T[], item: T, key: (x: T) => string) => {
  const i = list.findIndex(x => key(x) === key(item))
  if (i >= 0) list[i] = item
  else list.push(item)
}

export class LocalStore implements Store {
  mode = 'demo' as const
  private ev = new Emitter()
  private db: DB

  constructor() {
    let db: DB | null = null
    try { db = JSON.parse(localStorage.getItem(KEY) || 'null') } catch { /* ignore */ }
    this.db = db ?? seed()
    // Keep tabs in sync (e.g. teacher in one tab, student in another).
    window.addEventListener('storage', e => {
      if (e.key === KEY && e.newValue) { this.db = JSON.parse(e.newValue); this.ev.emit() }
      if (e.key === USER_KEY) this.ev.emit()
    })
  }

  private commit() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.db))
    } catch {
      throw new Error('The demo storage is full. Try a smaller file.')
    }
    this.ev.emit()
  }

  private get userId() {
    try { return localStorage.getItem(USER_KEY) } catch { return null }
  }

  async currentUser() {
    const id = this.userId
    return clone(this.db.profiles.find(p => p.id === id) ?? null)
  }
  async signIn() { throw new Error('Demo mode — choose a demo account below.') }
  async signUp() { throw new Error('Demo mode — choose a demo account below.') }
  async signOut() {
    localStorage.removeItem(USER_KEY)
    this.ev.emit()
  }
  async demoLogin(who: 'teacher' | 'student' | 'new') {
    let id = who === 'teacher' ? TEACHER : STUDENT
    if (who === 'new') {
      id = uid()
      this.db.profiles.push({ id, role: 'student', name: 'New student', createdAt: new Date().toISOString() })
      this.commit()
    }
    localStorage.setItem(USER_KEY, id)
    this.ev.emit()
  }
  async resetDemo() {
    this.db = seed()
    localStorage.removeItem(USER_KEY)
    this.commit()
  }

  async updateProfile(id: string, patch: { name?: string }) {
    const p = this.db.profiles.find(x => x.id === id)
    if (p) Object.assign(p, patch)
    this.commit()
  }
  async getTeacher() { return clone(this.db.profiles.find(p => p.role === 'teacher') ?? null) }
  async getProfile(id: string) { return clone(this.db.profiles.find(p => p.id === id) ?? null) }
  async listStudents() { return clone(this.db.profiles.filter(p => p.role === 'student')) }

  async getQuestionnaire(studentId: string) { return clone(this.db.questionnaires.find(q => q.studentId === studentId) ?? null) }
  async listQuestionnaires() { return clone(this.db.questionnaires) }
  async saveQuestionnaire(q: Questionnaire) { upsert(this.db.questionnaires, clone(q), x => x.studentId); this.commit() }

  async listMessages(studentId?: string) {
    return clone(this.db.messages.filter(m => !studentId || m.studentId === studentId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)))
  }
  async sendMessage(m: Omit<Message, 'id' | 'createdAt' | 'readAt'>) {
    this.db.messages.push({ ...m, id: uid(), createdAt: new Date().toISOString(), readAt: null })
    this.commit()
  }
  async markRead(studentId: string, readerId: string) {
    let changed = false
    for (const m of this.db.messages) if (m.studentId === studentId && m.senderId !== readerId && !m.readAt) { m.readAt = new Date().toISOString(); changed = true }
    if (changed) this.commit()
  }

  async listLessons(studentId?: string) {
    return clone(this.db.lessons.filter(l => !studentId || l.studentId === studentId).sort((a, b) => a.startsAt.localeCompare(b.startsAt)))
  }
  async saveLesson(l: Lesson) { upsert(this.db.lessons, clone(l), x => x.id); this.commit() }
  async deleteLesson(id: string) {
    this.db.lessons = this.db.lessons.filter(l => l.id !== id)
    this.db.notes = this.db.notes.filter(n => n.lessonId !== id)
    this.commit()
  }

  async listLessonNotes(studentId?: string) { return clone(this.db.notes.filter(n => !studentId || n.studentId === studentId)) }
  async saveLessonNote(n: LessonNote) { upsert(this.db.notes, clone(n), x => x.lessonId); this.commit() }

  async listTasks(studentId?: string) {
    return clone(this.db.tasks.filter(t => !studentId || t.studentId === studentId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
  }
  async saveTask(t: Task) { upsert(this.db.tasks, clone(t), x => x.id); this.commit() }
  async deleteTask(id: string) {
    this.db.tasks = this.db.tasks.filter(t => t.id !== id)
    this.db.submissions = this.db.submissions.filter(s => s.taskId !== id)
    this.commit()
  }

  async listSubmissions(studentId?: string) { return clone(this.db.submissions.filter(s => !studentId || s.studentId === studentId)) }
  async saveSubmission(s: Submission) { upsert(this.db.submissions, clone(s), x => x.taskId); this.commit() }

  async getInsight(studentId: string) { return clone(this.db.insights.find(i => i.studentId === studentId) ?? null) }
  async saveInsight(i: Insight) { upsert(this.db.insights, clone(i), x => x.studentId); this.commit() }

  async upload(file: File): Promise<Attachment> {
    const isImage = file.type.startsWith('image/')
    const blob = isImage ? await compressImage(file) : file
    if (blob.size > 2_500_000) throw new Error('In demo mode files must be under 2.5 MB.')
    const url = await new Promise<string>((res, rej) => {
      const r = new FileReader()
      r.onload = () => res(r.result as string)
      r.onerror = rej
      r.readAsDataURL(blob)
    })
    return { name: file.name, url, kind: isImage ? 'image' : 'file' }
  }

  subscribe(cb: () => void) { return this.ev.on(cb) }
}
