/**
 * Spanish level check (public, no sign-up): three short stages that adapt.
 *  1) basics            → fewer than PASS[0] right  = A0 (absolute beginner), stop
 *  2) simple sentences  → fewer than PASS[1] right  = A1, stop
 *  3) past, future, etc → fewer than PASS[2] right  = A2, otherwise B1 (the test does not go higher)
 * "I don't know" always counts as a miss, so guessing is not rewarded.
 */
export type Level = 'A0' | 'A1' | 'A2' | 'B1'

export interface PQ {
  id: string
  stage: 1 | 2 | 3
  prompt: string
  passage?: string
  /** Spoken aloud (browser voice) instead of shown. */
  audio?: string
  options: string[]
  answer: string
}

export const PASS = [3, 5, 5]
export const DONT_KNOW = "I don't know"

const A1_TEXT = 'Me llamo Carlos. Tengo 30 años y vivo en Sevilla. Trabajo en un banco. Los sábados juego al fútbol con mis amigos.'
const A2_TEXT = 'El sábado pasado fuimos a la playa con mis primos. Hacía mucho calor, así que nadamos casi todo el día. Por la noche cenamos en un restaurante pequeño y volvimos a casa muy cansados.'

export const QUESTIONS: PQ[] = [
  // Stage 1 — first words
  { id: 's1q1', stage: 1, prompt: 'What does *hola* mean?', options: ['Goodbye', 'Hello', 'Thank you'], answer: 'Hello' },
  { id: 's1q2', stage: 1, prompt: 'How do you say *thank you*?', options: ['Adiós', 'Por favor', 'Gracias'], answer: 'Gracias' },
  { id: 's1q3', stage: 1, prompt: '*¿Cómo te llamas?* means…', options: ['How are you?', "What's your name?", 'Where do you live?'], answer: "What's your name?" },
  { id: 's1q4', stage: 1, prompt: 'Complete: *Yo ___ Ana.*', options: ['te llamas', 'se llama', 'me llamo'], answer: 'me llamo' },
  { id: 's1q5', stage: 1, prompt: 'Which number is *tres*?', options: ['2', '5', '3'], answer: '3' },
  { id: 's1q6', stage: 1, prompt: '*Buenos días* is said…', options: ['at night', 'in the morning', 'when leaving'], answer: 'in the morning' },
  { id: 's1q7', stage: 1, prompt: '*Una cerveza, por favor.* means…', options: ['The bill, please.', "I'm hungry.", 'A beer, please.'], answer: 'A beer, please.' },

  { id: 's1q8', stage: 1, prompt: 'Listen. What is the woman’s name?', audio: 'Buenos días. Me llamo Ana.', options: ['Elena', 'Ana', 'Marta'], answer: 'Ana' },

  // Stage 2 — simple sentences
  { id: 's2q1', stage: 2, prompt: 'Complete: *Mi hermana ___ en Madrid.*', options: ['es', 'tiene', 'está'], answer: 'está' },
  { id: 's2q2', stage: 2, prompt: 'Complete: *Yo ___ dos hijos.*', options: ['soy', 'tengo', 'estoy'], answer: 'tengo' },
  { id: 's2q3', stage: 2, prompt: 'Complete: *___ casa es muy grande.*', options: ['El', 'Los', 'La'], answer: 'La' },
  { id: 's2q4', stage: 2, prompt: 'Complete: *Me ___ el café.*', options: ['gusto', 'gusta', 'gustan'], answer: 'gusta' },
  { id: 's2q5', stage: 2, prompt: 'What is *el desayuno*?', options: ['Dinner', 'Lunch', 'Breakfast'], answer: 'Breakfast' },
  { id: 's2q6', stage: 2, prompt: 'Where does Carlos live?', passage: A1_TEXT, options: ['Madrid', 'Sevilla', 'Barcelona'], answer: 'Sevilla' },
  { id: 's2q7', stage: 2, prompt: 'What does Carlos do on Saturdays?', passage: A1_TEXT, options: ['Works at the bank', 'Visits his family', 'Plays football with friends'], answer: 'Plays football with friends' },
  { id: 's2q8', stage: 2, prompt: 'Complete: *¿Cuántos años ___ (tú)?*', options: ['eres', 'tienes', 'estás'], answer: 'tienes' },

  { id: 's2q9', stage: 2, prompt: 'Listen. What is his job?', audio: 'Mi hermano trabaja en un hospital. Es médico.', options: ['Teacher', 'Doctor', 'Driver'], answer: 'Doctor' },

  // Stage 3 — past, future, comparisons
  { id: 's3q1', stage: 3, prompt: 'Complete: *Ayer yo ___ al mercado.*', options: ['voy', 'fui', 'iba'], answer: 'fui' },
  { id: 's3q2', stage: 3, prompt: 'Complete: *Todos los días me ___ a las siete.*', options: ['levanto', 'levantas', 'levantar'], answer: 'levanto' },
  { id: 's3q3', stage: 3, prompt: 'Complete: *Este regalo es ___ ti.*', options: ['por', 'de', 'para'], answer: 'para' },
  { id: 's3q4', stage: 3, prompt: 'Complete: *Mañana ___ a visitar a mi madre.*', options: ['fui', 'voy', 'iba'], answer: 'voy' },
  { id: 's3q5', stage: 3, prompt: 'Complete: *Mi casa es ___ grande que la tuya.*', options: ['mucho', 'más', 'tan'], answer: 'más' },
  { id: 's3q6', stage: 3, prompt: 'Why did they swim?', passage: A2_TEXT, options: ['They were tired', 'It was very hot', "It was the cousins' idea"], answer: 'It was very hot' },
  { id: 's3q7', stage: 3, prompt: 'How did they feel when they got home?', passage: A2_TEXT, options: ['Very tired', 'Hungry', 'Cold'], answer: 'Very tired' },
  { id: 's3q8', stage: 3, prompt: 'Complete: *Cuando era niña, ___ en un pueblo pequeño.*', options: ['viví', 'vivo', 'vivía'], answer: 'vivía' },
  { id: 's3q9', stage: 3, prompt: 'Complete: *Quiero que tú ___ conmigo a la fiesta.*', options: ['vienes', 'vengas', 'venir'], answer: 'vengas' },
  { id: 's3q10', stage: 3, prompt: 'Listen. What did she like the most?', audio: 'El año pasado viajé a México con mis padres. Visitamos muchas ciudades y comimos platos deliciosos, pero lo que más me gustó fue la música en la calle.', options: ['The food', 'The street music', 'The cities'], answer: 'The street music' },
]

export const stageQuestions = (stage: number) => QUESTIONS.filter(q => q.stage === stage)

export function levelFrom(scores: number[]): Level {
  if ((scores[0] ?? 0) < PASS[0]) return 'A0'
  if ((scores[1] ?? 0) < PASS[1]) return 'A1'
  if ((scores[2] ?? 0) < PASS[2]) return 'A2'
  return 'B1'
}

export function checkLevel(level: Level) {
  const i = LEVEL_INFO[level]
  return { code: level, label: i.es, emoji: i.emoji }
}

export const LEVEL_INFO: Record<Level, { label: string; es: string; emoji: string }> = {
  A0: { label: 'Absolute beginner', es: 'Principiante absoluto', emoji: '🐣' },
  A1: { label: 'Beginner', es: 'Principiante', emoji: '🌱' },
  A2: { label: 'Elementary', es: 'Elemental', emoji: '🌿' },
  B1: { label: 'Intermediate or above', es: 'Intermedio o superior', emoji: '🌳' },
}
