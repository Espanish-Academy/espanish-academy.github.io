import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MonthCalendar } from '../../components/Calendar'
import { MascotSay } from '../../components/Mascot'
import { Avatar, Button, Page, Row, SectionTitle, Sheet, Spinner } from '../../components/ui'
import { t } from '../../lib/i18n'
import { fmtDate, fmtTime, firstName, sameDay } from '../../lib/util'
import { useTeacherData } from './data'

export default function TeacherCalendar() {
  const nav = useNavigate()
  const [day, setDay] = useState(new Date())
  const [pick, setPick] = useState(false)
  const { data } = useTeacherData()
  if (!data) return <Spinner />
  const lessons = data.lessons.filter(l => l.status !== 'cancelled')
  const name = (id: string) => firstName(data.students.find(s => s.id === id)?.name ?? '')
  const todayCount = lessons.filter(l => l.status === 'planned' && sameDay(new Date(l.startsAt), new Date())).length
  const dayLessons = lessons.filter(l => sameDay(new Date(l.startsAt), day))

  return (
    <Page title={t('Calendar')} subtitle={t('All your classes')}
      action={<Button size="sm" onClick={() => setPick(true)}>＋ {t('Class')}</Button>}>
      <MascotSay mood={todayCount ? 'hello' : 'nap'} size={92} className="-mt-2 mb-1">
        {todayCount ? t('{n} classes today', { n: todayCount }) : t('No classes today — ¡descansa!')}
      </MascotSay>
      <MonthCalendar selected={day} onSelect={setDay}
        events={lessons.map(l => ({ date: l.startsAt, tone: l.status === 'done' ? 'sage' : 'berry' }))} />
      <SectionTitle>{fmtDate(day.toISOString())}</SectionTitle>
      <div className="grid gap-3">
        {dayLessons.map(l => (
          <Row key={l.id} to={`/students/${l.studentId}/lesson/${l.id}`} icon="📅"
            title={`${fmtTime(l.startsAt)} · ${name(l.studentId)}`} subtitle={l.title || `${l.durationMin} min`} />
        ))}
        {!dayLessons.length && <p className="text-muted text-center py-4">{t('No classes on this day')} 🌿</p>}
      </div>

      <Sheet open={pick} onClose={() => setPick(false)} title={t('Class with…')}>
        <div className="grid gap-3">
          {data.students.map(s => <Row key={s.id} onClick={() => nav(`/students/${s.id}/lesson/new`)} icon={<Avatar name={s.name} size={44} />} title={s.name} />)}
        </div>
      </Sheet>
    </Page>
  )
}
