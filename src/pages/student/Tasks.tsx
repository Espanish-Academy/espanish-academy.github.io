import { KIND } from '../../components/Bits'
import { Chip, Empty, Page, Row, SectionTitle, Spinner } from '../../components/ui'
import { store } from '../../lib'
import { useData, useMe } from '../../lib/hooks'
import { t } from '../../lib/i18n'
import { dayDiff, friendlyDay } from '../../lib/util'

export default function StudentTasks() {
  const me = useMe()
  const { data } = useData(async () => {
    const [tasks, subs] = await Promise.all([store.listTasks(me.id), store.listSubmissions(me.id)])
    return { tasks, subs }
  }, [me.id])
  if (!data) return <Spinner />
  const sub = (id: string) => data.subs.find(s => s.taskId === id)
  const todo = data.tasks.filter(x => !sub(x.id)).sort((a, b) => (a.dueAt ?? '9').localeCompare(b.dueAt ?? '9'))
  const done = data.tasks.filter(x => sub(x.id))

  return (
    <Page title={t('My tasks')} subtitle={t('Homework, exercises and tests from your teacher')}>
      {todo.length === 0 ? (
        <Empty emoji="🌿" mascot="nap" title={t('Nothing to do!')} text={t('When your teacher sends homework, it will appear here.')} />
      ) : (
        <div className="grid gap-3">
          {todo.map((x, i) => {
            const late = x.dueAt && dayDiff(x.dueAt) < 0
            return (
              <Row key={x.id} to={`/tasks/${x.id}`} icon={KIND[x.kind].emoji} title={x.title}
                className={i === 0 ? '!border-sage-300 animate-soft-pulse' : ''}
                subtitle={x.dueAt ? (late ? t('Was due {day}', { day: friendlyDay(x.dueAt) }) : t('Due {day}', { day: friendlyDay(x.dueAt) })) : t(KIND[x.kind].label)} />
            )
          })}
        </div>
      )}
      {done.length > 0 && (
        <>
          <SectionTitle>{t('Done')} ✅</SectionTitle>
          <div className="grid gap-3">
            {done.map(x => {
              const s = sub(x.id)!
              return (
                <Row key={x.id} to={`/tasks/${x.id}`} icon={KIND[x.kind].emoji} title={x.title}
                  subtitle={s.feedback ? `💬 ${s.feedback}` : t('Handed in {day}', { day: friendlyDay(s.submittedAt) })}
                  right={s.total ? <Chip tone={s.score! / s.total >= 0.6 ? 'sage' : 'sun'}>{s.score}/{s.total}</Chip> : <Chip>✓</Chip>} />
              )
            })}
          </div>
        </>
      )}
    </Page>
  )
}
