import type { TaskQuestion } from './types'

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[¿?¡!.,;:"“”]/g, '').replace(/\s+/g, ' ').trim().toLowerCase()

/** null = not auto-graded (open answers go to the teacher). */
export function isCorrect(q: TaskQuestion, answer: string): boolean | null {
  if (q.type === 'open') return null
  if (!q.answer) return null
  if (q.type === 'choice') return answer === q.answer
  return q.answer.split('/').some(a => norm(a) === norm(answer))
}

export function score(questions: TaskQuestion[], answers: Record<string, string>) {
  const graded = questions.filter(q => isCorrect(q, '') !== null)
  const ok = graded.filter(q => isCorrect(q, answers[q.id] ?? ''))
  return { score: ok.length, total: graded.length }
}
