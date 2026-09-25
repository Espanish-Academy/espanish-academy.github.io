import { Link } from 'react-router-dom'
import { Avatar, Chip, Empty, NextStep, Row, SectionTitle, Spinner } from '../../components/ui'
import { useMe } from '../../lib/hooks'
import { t } from '../../lib/i18n'
import { estimateLevel } from '../../lib/insights'
import { firstName, friendlyDay, friendlyWhen, greeting } from '../../lib/util'
import { todosFor, useTeacherData } from './data'

export default function TeacherToday() {
  const me = useMe()
  const { data } = useTeacherData()
  if (!data) return <Spinner />
  const name = (id: string) => firstName(data.students.find(s => s.id === id)?.name ?? '')
  const { toReview, toLog, unread, upcoming } = todosFor(data, me.id)
  const newStudents = data.students.filter(s => !data.lessons.some(l => l.studentId === s.id))

  // Everything waiting for the teacher, most urgent first. The first one becomes the big card.
  type Todo = { key: string; emoji: string; title: string; subtitle?: string; to: string; cta: string; tone?: 'berry' }
  const todos: Todo[] = [
    ...toLog.map(l => ({ key: 'log' + l.id, emoji: '✍️', title: t('How did the class with {name} go?', { name: name(l.studentId) }), subtitle: t('Write a short summary and notes'), to: `/students/${l.studentId}/lesson/${l.id}`, cta: t('Write summary') })),
    ...[...new Set(unread.map(m => m.studentId))].map(sid => ({ key: 'msg' + sid, emoji: '💌', tone: 'berry' as const, title: t('New message from {name}', { name: name(sid) }), subtitle: unread.filter(m => m.studentId === sid).at(-1)?.text.slice(0, 60), to: `/students/${sid}?tab=chat`, cta: t('Reply') })),
    ...toReview.map(s => ({ key: 'rev' + s.id, emoji: '📝', title: t('{name} handed in homework', { name: name(s.studentId) }), subtitle: data.tasks.find(x => x.id === s.taskId)?.title, to: `/students/${s.studentId}/task/${s.taskId}`, cta: t('Review') })),
  ]
  if (!todos.length && upcoming[0]) todos.push({ key: 'prep', emoji: '📅', title: t('Prepare: {name}, {day}', { name: name(upcoming[0].studentId), day: friendlyDay(upcoming[0].startsAt) }), subtitle: upcoming[0].title, to: `/students/${upcoming[0].studentId}/lesson/${upcoming[0].id}`, cta: t('Open plan') })
  for (const s of newStudents) todos.push({ key: 'new' + s.id, emoji: '🌱', title: t('Plan a first class for {name}', { name: firstName(s.name) }), to: `/students/${s.id}`, cta: t('See their profile') })
  const [first, ...rest] = todos

  return (
    <div className="animate-rise">
      <header className="flex items-center gap-3 mb-6">
        <div className="flex-1">
          <p className="text-muted font-bold">{greeting()},</p>
          <h1 className="text-3xl font-black">{firstName(me.name)}! 🌿</h1>
        </div>
        <Link to="/me" aria-label={t('My profile')}><Avatar name={me.name} size={52} /></Link>
      </header>

      {first
        ? <NextStep emoji={first.emoji} tone={first.tone} title={first.title} subtitle={first.subtitle} to={first.to} cta={first.cta} />
        : <Empty emoji="☕" title={t('All caught up')} text={t('Nothing waiting for you. ¡Disfruta!')} />}

      {rest.length > 0 && (
        <>
          <SectionTitle>{t('Also waiting')}</SectionTitle>
          <div className="grid gap-3">{rest.map(x => <Row key={x.key} to={x.to} icon={x.emoji} title={x.title} subtitle={x.subtitle} />)}</div>
        </>
      )}

      <SectionTitle>{t('Next classes')}</SectionTitle>
      <div className="grid gap-3">
        {upcoming.slice(0, 5).map(l => <Row key={l.id} to={`/students/${l.studentId}/lesson/${l.id}`} icon="📅" title={`${name(l.studentId)} · ${friendlyWhen(l.startsAt)}`} subtitle={l.title} />)}
        {!upcoming.length && <p className="text-muted">{t('No classes scheduled.')}</p>}
      </div>

      <SectionTitle action={<Link to="/students" className="font-extrabold text-sage-600">{t('See all')}</Link>}>{t('My students')}</SectionTitle>
      <div className="grid sm:grid-cols-2 gap-3">
        {data.students.map(s => {
          const q = data.questionnaires.find(x => x.studentId === s.id)
          const lvl = q?.completedAt ? estimateLevel(q.answers) : null
          return (
            <Row key={s.id} to={`/students/${s.id}`} icon={<Avatar name={s.name} size={48} />} title={s.name}
              subtitle={lvl ? `${lvl.emoji} ${t(lvl.label)}` : t('Questionnaire pending')}
              right={unread.some(m => m.studentId === s.id) ? <Chip tone="berry">💬</Chip> : undefined} />
          )
        })}
      </div>
    </div>
  )
}
