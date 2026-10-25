import { Emitter, type Store } from './store'
import type { Attachment, Insight, Lang, Placement, PresenceInfo, PresenceSession, StudentMaterial, Lesson, LessonNote, Message, Profile, Questionnaire, Submission, Task } from './types'
import { getLocale } from './i18n'
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
  placements?: Placement[]
  folders?: Record<string, string>
  materials?: StudentMaterial[]
}

const KEY = 'espanish-demo-v2'
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
      { id: TEACHER, role: 'teacher', name: 'Profe', lang: 'es', createdAt: at(-30) },
      { id: STUDENT, role: 'student', name: 'Miriam', lang: 'en', createdAt: at(-22) },
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
      practice: 'Gender: el / la.\nRolling the r.',
      homework: 'Short dialogue at the market (5 lines).',
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
    if (import.meta.env.DEV) {
      const q = new URLSearchParams(location.search)
      const as = q.get('as')
      if (as) localStorage.setItem(USER_KEY, as === 'teacher' ? TEACHER : STUDENT)
      const lang = q.get('lang')
      if (lang === 'es' || lang === 'en') this.db.profiles.forEach(p => { if (p.role === 'student') p.lang = lang })
      if (q.get('as')) {
          if (!this.db.materials?.length) this.db.materials = [
            { id: 'mat1', studentId: STUDENT, category: 'theory', driveId: 'demo-theory-1', name: '02 - Verbos en presente.pdf', mimeType: 'application/pdf', url: 'https://drive.google.com/', createdAt: at(-6) },
            { id: 'mat2', studentId: STUDENT, category: 'theory', driveId: 'demo-theory-2', name: '03 - Cómo son las personas.pdf', mimeType: 'application/pdf', url: 'https://drive.google.com/', createdAt: at(-5) },
            { id: 'mat3', studentId: STUDENT, category: 'exercises', driveId: 'demo-ex-1', name: '03 - Cómo son las personas — Miriam', mimeType: 'application/vnd.google-apps.document', url: 'https://docs.google.com/', editable: true, createdAt: at(-5) },
            { id: 'mat4', studentId: STUDENT, category: 'songs', driveId: 'demo-song-1', name: 'Bailando — letra', mimeType: 'application/pdf', url: 'https://drive.google.com/', createdAt: at(-3) },
            { id: 'mat5', studentId: STUDENT, category: 'presentations', driveId: 'demo-pres-1', name: 'La familia', mimeType: 'application/vnd.google-apps.presentation', url: 'https://docs.google.com/', createdAt: at(-7) },
          ]
      }
      if (lang === 'es') {
        // Spanish demo content for tutorial screenshots (development only).
        const es: Record<string, string> = {
          'Reminder: class in two days — we are going to the market! 🍅🍋': '¡Recuerda! Dentro de dos días tenemos clase: iremos al mercado 🍅🍋',
          '¡Gracias! I love it 😍': '¡Gracias! Me encanta 😍',
          '¡Hola Miriam! Here is the song we talked about 🎵 ': '¡Hola Miriam! Aquí tienes la canción de la que hablamos 🎵 ',
          'Café words': 'Palabras del café', 'Draw your family tree': 'Dibuja tu árbol genealógico', 'Mi familia — quick practice': 'Mi familia: práctica rápida',
          'Me presento — introducing myself': 'Me presento', 'En el café — ordering a coffee': 'En el café: pedir un café', 'Mi familia — my family': 'Mi familia', 'En el mercado — at the market': 'En el mercado',
          'We talked about your family — your granddaughter in Valencia will be proud!': 'Hablamos de tu familia. ¡Tu nieta de Valencia estará orgullosa!',
          'We said hello and introduced ourselves. Your “me llamo Miriam” already sounds lovely!': 'Nos saludamos y nos presentamos. ¡Tu «me llamo Miriam» ya suena genial!',
          'We ordered at a café, asked for the bill and practised prices.': 'Pedimos en un café, pedimos la cuenta y practicamos los precios.',
          'A quick practice of the words from our café class.': 'Un repaso rápido de las palabras de nuestra clase del café.',
          'Five minutes, no stress. You can try again as many times as you like.': 'Cinco minutos, sin estrés. Puedes repetirlo las veces que quieras.',
          'Market vocabulary + colours. Bring real fruit photos.': 'Vocabulario del mercado y colores. Llevar fotos de fruta.',
          'Gender: el / la.\\nRolling the r.': 'Género: el / la.\\nLa erre fuerte.',
          'Short dialogue at the market (5 lines).': 'Diálogo corto en el mercado (5 líneas).',
          'Loves talking about her grandchildren. Gets tired after ~50 min — keep the last part light (song or chat).': 'Le encanta hablar de sus nietos. Se cansa a los 50 min: dejar el final ligero (canción o charla).',
          'Dictionary: familia': 'Diccionario: familia', 'Family words': 'La familia', 'Greetings': 'Saludos', 'Numbers 1–10': 'Números 1–10', 'At the café': 'En el café', 'Prices': 'Precios', 'Fruit and vegetables': 'Frutas y verduras', 'Colours': 'Colores', 'Menu words': 'La carta',
          'Draw your family tree and write el padre, la madre, la nieta… next to each person. Take a photo and send it here 📸': 'Dibuja tu árbol genealógico y escribe el padre, la madre, la nieta… junto a cada persona. Hazle una foto y envíamela aquí 📸',
        }
        let json = JSON.stringify(this.db)
        for (const [k, v] of Object.entries(es)) json = json.split(JSON.stringify(k).slice(1, -1)).join(JSON.stringify(v).slice(1, -1))
        this.db = JSON.parse(json)
      }
    }
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
      this.db.profiles.push({ id, role: 'student', name: 'New student', lang: getLocale(), createdAt: new Date().toISOString() })
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

  async updateProfile(id: string, patch: { name?: string; lang?: Lang }) {
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

  async savePlacement(p: Placement) { (this.db.placements ??= []).push(clone(p)); this.commit() }
  async listPlacements() { return clone([...(this.db.placements ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) }
  async linkPlacement(id: string, studentId: string | null) {
    const p = this.db.placements?.find(x => x.id === id)
    if (p) { p.studentId = studentId; this.commit() }
  }
  async markPlacementSeen(id: string) {
    const p = this.db.placements?.find(x => x.id === id)
    if (p && !p.seenAt) { p.seenAt = new Date().toISOString(); this.commit() }
  }

  // Demo: sample numbers so the teacher screens can be seen.
  async pingPresence() {}
  async presenceOverview(): Promise<PresenceInfo[]> {
    return this.db.profiles.filter(p => p.role === 'student').map((p, i) => ({ studentId: p.id, lastSeenAt: new Date(Date.now() - (i ? 3 * 3600e3 : 20e3)).toISOString(), online: i === 0, minutesToday: i ? 0 : 14, minutesWeek: 62 }))
  }
  async presenceSessions(): Promise<PresenceSession[]> {
    const now = Date.now()
    return [{ startedAt: new Date(now - 14 * 60e3).toISOString(), lastSeenAt: new Date(now - 20e3).toISOString(), minutes: 14, ended: false },
      { startedAt: new Date(now - 26 * 3600e3).toISOString(), lastSeenAt: new Date(now - 26 * 3600e3 + 22 * 60e3).toISOString(), minutes: 22, ended: true },
      { startedAt: new Date(now - 50 * 3600e3).toISOString(), lastSeenAt: new Date(now - 50 * 3600e3 + 9 * 60e3).toISOString(), minutes: 9, ended: true }]
  }

  async listStudentMaterials(studentId: string) { return clone((this.db.materials ?? []).filter(m => m.studentId === studentId)) }
  async addStudentMaterials(items: Omit<StudentMaterial, 'id' | 'createdAt'>[]) {
    const list = (this.db.materials ??= [])
    for (const i of items) list.push({ ...i, id: uid(), createdAt: new Date().toISOString() })
    this.commit()
  }
  async deleteStudentMaterial(id: string) { this.db.materials = (this.db.materials ?? []).filter(m => m.id !== id); this.commit() }

  async getStudentFolder(studentId: string) { return this.db.folders?.[studentId] ?? null }
  async saveStudentFolder(studentId: string, folderId: string | null) {
    const f = (this.db.folders ??= {})
    if (folderId) f[studentId] = folderId; else delete f[studentId]
    this.commit()
  }

  async savePushSubscription() {}
  async deletePushSubscription() {}

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
