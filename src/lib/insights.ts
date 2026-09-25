import type { Answers, LessonNote } from './types'

export interface Level {
  code: string
  label: string
  emoji: string
  score: number
}

const pts = (v: unknown, map: Record<string, number>) => map[String(v)] ?? 0

/** Rough starting level from the questionnaire, to be refined by the teacher. */
export function estimateLevel(a: Answers): Level {
  const score =
    pts(a.studied, { never: 0, little: 1, classes: 2 }) +
    pts(a.basics, { none: 0, few: 1, many: 2 }) +
    pts(a.comfort, { '1': 0, '2': 1, '3': 2, '4': 3 }) +
    pts(a.listening, { none: 0, some: 1, most: 2 }) +
    pts(a.reading, { none: 0, some: 1, most: 2 })
  if (score <= 1) return { code: 'A0', label: 'Brand-new beginner', emoji: '🐣', score }
  if (score <= 4) return { code: 'A1', label: 'Beginner', emoji: '🌱', score }
  if (score <= 7) return { code: 'A2', label: 'Elementary', emoji: '🌿', score }
  if (score <= 9) return { code: 'B1', label: 'Intermediate', emoji: '🌳', score }
  return { code: 'B2', label: 'Confident', emoji: '🌻', score }
}

const TOPICS: Record<string, { title: string; es: string }> = {
  gastronomy: { title: 'Ordering tapas at a bar', es: 'En el bar: pedir tapas' },
  cinema: { title: 'Talking about a favourite film', es: 'Mi película favorita' },
  music: { title: 'Translating a song together', es: 'Traducimos una canción' },
  travel: { title: 'Planning a trip and asking for directions', es: 'De viaje: pedir direcciones' },
  art: { title: 'Describing a painting', es: 'Describir un cuadro' },
  literature: { title: 'Reading a micro-story', es: 'Leemos un microrrelato' },
  writing: { title: 'Writing a postcard', es: 'Escribir una postal' },
  history: { title: 'A short story from Spanish history', es: 'Un poco de historia' },
  sport: { title: 'Sports and free time — jugar / practicar', es: 'Deportes y tiempo libre' },
  politics: { title: 'Reading a simple news headline', es: 'Leer un titular' },
  traditions: { title: 'Festivals: Las Fallas, La Tomatina, Día de Muertos', es: 'Fiestas y tradiciones' },
}

const FORMATS: Record<string, string> = {
  games: 'as an interactive game',
  oral: 'with lots of speaking out loud',
  conversation: 'as a relaxed role-play',
  theory: 'with a clear grammar chart',
  series: 'using a short series clip',
  songs: 'through a song',
  homework: 'plus a worksheet for home',
  visual: 'with a visual mind-map',
  stories: 'through a short dialogue',
  writing: 'with a short writing task',
}

export interface Suggestion {
  title: string
  es: string
  how: string
}

/** Ideas for the next class, mixing what the student loves with how they learn. */
export function lessonIdeas(a: Answers, workOn: string[] = []): Suggestion[] {
  const interests = (a.interests as string[] | undefined) ?? []
  const styles = [...((a.studyWays as string[] | undefined) ?? []), ...((a.memorize as string[] | undefined) ?? [])]
  const uniqueStyles = [...new Set(styles)].filter(s => FORMATS[s])
  const out: Suggestion[] = []
  if (workOn[0]) {
    out.push({ title: `Review: ${workOn[0]}`, es: 'Repaso', how: FORMATS[uniqueStyles[0]] ?? 'with a short warm-up game' })
  }
  interests.forEach((i, idx) => {
    const topic = TOPICS[i]
    if (!topic) return
    out.push({ ...topic, how: FORMATS[uniqueStyles[idx % Math.max(uniqueStyles.length, 1)]] ?? 'as a relaxed conversation' })
  })
  if (out.length === 0) out.push({ title: 'Introducing yourself', es: 'Me presento', how: 'as a relaxed conversation' })
  return out.slice(0, 3)
}

/** Most frequent tags across lesson notes, e.g. what the student struggles with most. */
export function topTags(notes: LessonNote[], field: 'struggles' | 'workOn' | 'skip', limit = 6) {
  const count = new Map<string, number>()
  for (const n of notes) for (const tag of n[field]) {
    const k = tag.trim().toLowerCase()
    if (k) count.set(k, (count.get(k) ?? 0) + 1)
  }
  return [...count.entries()].sort((x, y) => y[1] - x[1]).slice(0, limit).map(([tag, n]) => ({ tag, n }))
}
