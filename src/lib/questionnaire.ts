import type { Answers } from './types'

export type QKind = 'single' | 'multi' | 'text' | 'scale' | 'listen' | 'read' | 'country' | 'consent'

export interface Option {
  value: string
  label: string
  emoji: string
}

export interface Question {
  id: string
  section: string
  kind: QKind
  title: string
  /** The teacher's original question in Spanish, shown softly under the English one. */
  es: string
  hint?: string
  options?: Option[]
  optional?: boolean
  placeholder?: string
  /** Spanish sample for the listening / reading check. */
  sample?: string
}

export const SECTIONS = [
  { id: 'why', title: 'Your why', emoji: '💛' },
  { id: 'today', title: 'Your Spanish today', emoji: '🌱' },
  { id: 'learn', title: 'How you learn', emoji: '🧠' },
  { id: 'love', title: 'What you love', emoji: '🌻' },
]

const understand: Option[] = [
  { value: 'none', label: 'Not yet', emoji: '🙈' },
  { value: 'some', label: 'Some words', emoji: '🤏' },
  { value: 'most', label: 'Most of it', emoji: '🙌' },
]

export const QUESTIONS: Question[] = [
  {
    id: 'purpose', section: 'why', kind: 'multi',
    title: 'Why do you want to learn Spanish?',
    es: '¿Por qué quieres aprender español?',
    hint: 'Choose all that fit',
    options: [
      { value: 'travel', label: 'Travel', emoji: '✈️' },
      { value: 'work', label: 'Work', emoji: '💼' },
      { value: 'culture', label: 'Love of the culture', emoji: '🎭' },
      { value: 'personal', label: 'Family, friends or love', emoji: '💞' },
      { value: 'self', label: 'Just for me', emoji: '🧠' },
    ],
  },
  {
    id: 'timeframe', section: 'why', kind: 'single',
    title: 'How soon do you want to see results?',
    es: '¿Cuál es tu margen de tiempo? ¿Necesitas ver resultados rápido o buscas un aprendizaje a largo plazo?',
    options: [
      { value: 'urgent', label: 'Soon — I have a deadline', emoji: '⚡' },
      { value: 'months', label: 'Steadily, over a few months', emoji: '🌱' },
      { value: 'long', label: 'No rush — a long journey', emoji: '🐢' },
    ],
  },
  {
    id: 'pace', section: 'why', kind: 'single',
    title: 'Which class style suits you best?',
    es: '¿Qué estilo de clase encaja mejor contigo: relajado y conversacional, o intensivo con más gramática y vocabulario?',
    options: [
      { value: 'relaxed', label: 'Relaxed and chatty', emoji: '☕' },
      { value: 'mixed', label: 'A bit of both', emoji: '⚖️' },
      { value: 'intensive', label: 'Intensive — more grammar and words', emoji: '📚' },
    ],
  },
  {
    id: 'studied', section: 'today', kind: 'single',
    title: 'Have you studied Spanish before?',
    es: '¿Has estudiado el idioma alguna vez o es tu primer contacto?',
    options: [
      { value: 'never', label: 'This is my very first time', emoji: '🐣' },
      { value: 'little', label: 'A little, some time ago', emoji: '📓' },
      { value: 'classes', label: 'Yes, I have taken classes', emoji: '🎓' },
    ],
  },
  {
    id: 'basics', section: 'today', kind: 'single',
    title: 'Do you know some basic words?',
    es: '¿Conoces palabras básicas?',
    options: [
      { value: 'none', label: 'Not yet', emoji: '🙈' },
      { value: 'few', label: 'A few — hola, gracias…', emoji: '👋' },
      { value: 'many', label: 'Quite a lot', emoji: '💬' },
    ],
  },
  {
    id: 'knownWords', section: 'today', kind: 'text', optional: true,
    title: 'Which words or phrases can you already say?',
    es: 'Exactamente, ¿qué palabras o expresiones sabes decir ya en español?',
    placeholder: 'e.g. hola, gracias, ¿cómo estás?',
  },
  {
    id: 'comfort', section: 'today', kind: 'scale',
    title: 'Could you order a coffee or ask for directions in Spanish?',
    es: '¿Te sientes cómoda comunicándote en un bar o en la calle?',
    options: [
      { value: '1', label: 'Not at all', emoji: '😰' },
      { value: '2', label: 'A little', emoji: '😕' },
      { value: '3', label: 'Mostly', emoji: '🙂' },
      { value: '4', label: 'Easily', emoji: '😄' },
    ],
  },
  {
    id: 'listening', section: 'today', kind: 'listen',
    title: 'Listen — how much do you understand?',
    es: 'Escucha la grabación. ¿La entiendes?',
    sample: 'Hola, me llamo Ana. Vivo en Madrid y me encanta tomar café con mis amigos.',
    options: understand,
  },
  {
    id: 'reading', section: 'today', kind: 'read',
    title: 'Read this — how much do you understand?',
    es: '¿Puedes leerlo? ¿Lo entiendes?',
    sample: 'Hoy hace sol. Voy al mercado a comprar fruta y después como con mi familia.',
    options: understand,
  },
  {
    id: 'memorize', section: 'learn', kind: 'multi',
    title: 'How do you remember new things best?',
    es: '¿Cómo sientes que memorizas mejor la información nueva?',
    hint: 'Choose all that fit',
    options: [
      { value: 'games', label: 'Playing games', emoji: '🎮' },
      { value: 'visual', label: 'Seeing it in a chart or map', emoji: '🗺️' },
      { value: 'oral', label: 'Saying it out loud', emoji: '🗣️' },
      { value: 'stories', label: 'Short stories and dialogues', emoji: '📖' },
      { value: 'writing', label: 'Writing it down', emoji: '✍️' },
    ],
  },
  {
    id: 'studyWays', section: 'learn', kind: 'multi',
    title: 'What would you enjoy doing in class?',
    es: 'Formas preferidas de estudiar',
    hint: 'Choose all that fit',
    options: [
      { value: 'games', label: 'Interactive games', emoji: '🎮' },
      { value: 'oral', label: 'Speaking practice', emoji: '🗣️' },
      { value: 'conversation', label: 'Free conversation', emoji: '💬' },
      { value: 'theory', label: 'Grammar, step by step', emoji: '📐' },
      { value: 'series', label: 'Series and films', emoji: '📺' },
      { value: 'songs', label: 'Translating songs', emoji: '🎵' },
      { value: 'homework', label: 'Homework to practise', emoji: '📝' },
    ],
  },
  {
    id: 'content', section: 'learn', kind: 'multi',
    title: 'Do you watch or listen to anything in Spanish?',
    es: '¿Consumes algún tipo de contenido en español en tu rutina diaria?',
    hint: 'Choose all that fit',
    options: [
      { value: 'series', label: 'Series or films', emoji: '📺' },
      { value: 'music', label: 'Music', emoji: '🎵' },
      { value: 'podcasts', label: 'Podcasts or radio', emoji: '🎧' },
      { value: 'reading', label: 'Books or news', emoji: '📰' },
      { value: 'nothing', label: 'Nothing yet', emoji: '🌙' },
    ],
  },
  {
    id: 'interests', section: 'love', kind: 'multi',
    title: 'What do you love?',
    es: '¿Cuáles son tus aficiones? ¿Qué te interesa?',
    hint: 'We will build your lessons around these',
    options: [
      { value: 'gastronomy', label: 'Food and cooking', emoji: '🥘' },
      { value: 'cinema', label: 'Cinema', emoji: '🎬' },
      { value: 'music', label: 'Music', emoji: '🎶' },
      { value: 'travel', label: 'Cultural travel', emoji: '🧳' },
      { value: 'art', label: 'Art', emoji: '🎨' },
      { value: 'literature', label: 'Books', emoji: '📚' },
      { value: 'writing', label: 'Writing', emoji: '✍️' },
      { value: 'history', label: 'History', emoji: '🏛️' },
      { value: 'sport', label: 'Sport', emoji: '⚽' },
      { value: 'politics', label: 'Current affairs', emoji: '🗞️' },
      { value: 'traditions', label: 'Festivals and traditions', emoji: '💃' },
    ],
  },
  {
    id: 'culture', section: 'love', kind: 'text', optional: true,
    title: 'What catches your eye about Spanish or Latin culture?',
    es: '¿Qué aspectos de la cultura española o hispana te llaman más la atención?',
    placeholder: 'e.g. flamenco, tapas, Frida Kahlo…',
  },
  {
    id: 'dreamCountry', section: 'love', kind: 'country',
    title: 'If you could fly tomorrow, where would you go?',
    es: 'Si pudieras viajar mañana a cualquier país hispanohablante, ¿cuál elegirías y por qué?',
    options: [
      { value: 'Spain', label: 'Spain', emoji: '🇪🇸' },
      { value: 'Mexico', label: 'Mexico', emoji: '🇲🇽' },
      { value: 'Argentina', label: 'Argentina', emoji: '🇦🇷' },
      { value: 'Colombia', label: 'Colombia', emoji: '🇨🇴' },
      { value: 'Peru', label: 'Peru', emoji: '🇵🇪' },
      { value: 'Cuba', label: 'Cuba', emoji: '🇨🇺' },
      { value: 'Chile', label: 'Chile', emoji: '🇨🇱' },
      { value: 'Other', label: 'Somewhere else', emoji: '🌎' },
    ],
    placeholder: 'Why there?',
  },
  {
    id: 'recording', section: 'love', kind: 'consent', optional: true,
    title: 'Recording our classes',
    es: '¿Podemos grabar las clases?',
    hint: 'So you can watch them again at home. You can change this any time.',
    placeholder: 'I agree that my classes may be recorded',
  },
]

export function isAnswered(q: Question, a: Answers) {
  const v = a[q.id]
  if (q.optional) return true
  if (Array.isArray(v)) return v.length > 0
  return v !== undefined && v !== ''
}

export function optionLabel(qid: string, value: string) {
  return QUESTIONS.find(q => q.id === qid)?.options?.find(o => o.value === value)
}

export function labels(qid: string, a: Answers): { label: string; emoji: string }[] {
  const v = a[qid]
  const vals = Array.isArray(v) ? v : v === undefined ? [] : [String(v)]
  return vals.map(x => optionLabel(qid, x) ?? { label: x, emoji: '•' })
}

/**
 * Recording consent is kept as evidence: every change is appended to `recordingLog`
 * as "yes|<iso date>" or "no|<iso date>", and never removed.
 */
export function withConsentLog(a: Answers): Answers {
  const value = a.recording === 'yes' ? 'yes' : 'no'
  const log = (a.recordingLog as string[] | undefined) ?? []
  if (log.at(-1)?.split('|')[0] === value) return a
  return { ...a, recording: value, recordingLog: [...log, `${value}|${new Date().toISOString()}`] }
}

export function consentStatus(a: Answers) {
  const log = (a.recordingLog as string[] | undefined) ?? []
  const [value, at] = (log.at(-1) ?? '').split('|')
  return { agreed: value === 'yes', at: at || null, log: log.map(x => { const [v, d] = x.split('|'); return { agreed: v === 'yes', at: d } }) }
}
