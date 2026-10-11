import { store } from '../../lib'
import { useData } from '../../lib/hooks'

/** The teacher's whole world in one load — small enough for a private tutor. */
export function useTeacherData() {
  return useData(async () => {
    const [students, questionnaires, lessons, notes, tasks, subs, messages, placements] = await Promise.all([
      store.listStudents(), store.listQuestionnaires(), store.listLessons(), store.listLessonNotes(),
      store.listTasks(), store.listSubmissions(), store.listMessages(), store.listPlacements(),
    ])
    return { students, questionnaires, lessons, notes, tasks, subs, messages, placements }
  })
}

export type TeacherData = NonNullable<ReturnType<typeof useTeacherData>['data']>

export function todosFor(d: TeacherData, meId: string, studentId?: string) {
  const mine = <T extends { studentId: string }>(xs: T[]) => (studentId ? xs.filter(x => x.studentId === studentId) : xs)
  const now = Date.now()
  const toReview = mine(d.subs).filter(s => !s.feedback).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
  const toLog = mine(d.lessons).filter(l => l.status === 'planned' && new Date(l.startsAt).getTime() + l.durationMin * 60_000 < now)
  const unread = mine(d.messages).filter(m => m.senderId !== meId && !m.readAt)
  const upcoming = mine(d.lessons).filter(l => l.status === 'planned' && new Date(l.startsAt).getTime() > now)
  return { toReview, toLog, unread, upcoming }
}
