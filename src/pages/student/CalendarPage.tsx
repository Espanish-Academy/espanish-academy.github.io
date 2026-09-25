import { useState } from 'react'
import { MonthCalendar } from '../../components/Calendar'
import { KIND } from '../../components/Bits'
import { Page, Row, SectionTitle, Spinner } from '../../components/ui'
import { store } from '../../lib'
import { useData, useMe } from '../../lib/hooks'
import { t } from '../../lib/i18n'
import { fmtDate, fmtTime, friendlyWhen, sameDay } from '../../lib/util'

export default function StudentCalendar() {
  const me = useMe()
  const [day, setDay] = useState(new Date())
  const { data } = useData(async () => {
    const [lessons, tasks, subs] = await Promise.all([store.listLessons(me.id), store.listTasks(me.id), store.listSubmissions(me.id)])
    return { lessons: lessons.filter(l => l.status !== 'cancelled'), tasks: tasks.filter(x => x.dueAt && !subs.some(s => s.taskId === x.id)) }
  }, [me.id])
  if (!data) return <Spinner />

  const events = [
    ...data.lessons.map(l => ({ date: l.startsAt, tone: (l.status === 'done' ? 'sage' : 'berry') as 'sage' | 'berry' })),
    ...data.tasks.map(x => ({ date: x.dueAt!, tone: 'sun' as const })),
  ]
  const dayLessons = data.lessons.filter(l => sameDay(new Date(l.startsAt), day))
  const dayTasks = data.tasks.filter(x => sameDay(new Date(x.dueAt!), day))
  const upcoming = data.lessons.filter(l => l.status === 'planned' && new Date(l.startsAt) > new Date()).slice(0, 4)

  return (
    <Page title={t('Calendar')} subtitle={t('Your classes and due dates')}>
      <MonthCalendar events={events} selected={day} onSelect={setDay} />
      <div className="flex gap-4 justify-center mt-3 text-sm font-bold text-muted">
        <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-berry-500" />{t('Next classes')}</span>
        <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-sage-500" />{t('Past classes')}</span>
        <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-sun-400" />{t('Due')}</span>
      </div>

      <SectionTitle>{fmtDate(day.toISOString())}</SectionTitle>
      <div className="grid gap-3">
        {dayLessons.map(l => <Row key={l.id} to={`/journey/${l.id}`} icon="📅" title={`${fmtTime(l.startsAt)} · ${l.title || t('Class')}`} subtitle={`${l.durationMin} min`} />)}
        {dayTasks.map(x => <Row key={x.id} to={`/tasks/${x.id}`} icon={KIND[x.kind].emoji} title={x.title} subtitle={t('Due')} />)}
        {!dayLessons.length && !dayTasks.length && <p className="text-muted text-center py-4">{t('Nothing on this day')} 🌿</p>}
      </div>

      {upcoming.length > 0 && (
        <>
          <SectionTitle>{t('Next classes')}</SectionTitle>
          <div className="grid gap-3">{upcoming.map(l => <Row key={l.id} to={`/journey/${l.id}`} icon="🗓️" title={friendlyWhen(l.startsAt)} subtitle={l.title} />)}</div>
        </>
      )}
    </Page>
  )
}
