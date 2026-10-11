import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MascotSay, type Mood } from '../../components/Mascot'
import { PushPrompt } from '../../components/PushCard'
import { Avatar, Chip, Empty, NextStep, Row, SectionTitle, Spinner, cx } from '../../components/ui'
import { useMe } from '../../lib/hooks'
import { t } from '../../lib/i18n'
import { estimateLevel } from '../../lib/insights'
import { firstName, fmtTime, friendlyDay, friendlyWhen, greeting, sameDay } from '../../lib/util'
import { LEVEL_INFO } from '../../lib/placement'
import { todosFor, useTeacherData } from './data'

export default function TeacherToday() {
  const me = useMe()
  const { data } = useTeacherData()
  if (!data) return <Spinner />
  const name = (id: string) => firstName(data.students.find(s => s.id === id)?.name ?? '')
  const all = todosFor(data, me.id)
  const today = new Date()
  const todayLessons = data.lessons.filter(l => l.status === 'planned' && sameDay(new Date(l.startsAt), today))
  const newChecks = data.placements.filter(p => !p.seenAt)
  const waiting = all.toLog.length + all.toReview.length + new Set(all.unread.map(m => m.studentId)).size + newChecks.length

  // The single most urgent thing becomes the big card; everything else is grouped per student below.
  type Todo = { key: string; emoji: string; title: string; subtitle?: string; to: string; cta: string; tone?: 'berry' }
  const todos: Todo[] = [
    ...newChecks.map(p => ({ key: 'pl' + p.id, emoji: '📊', title: t('{name} took the level check', { name: p.name }), subtitle: `${p.level} · ${LEVEL_INFO[p.level].es}`, to: `/placements/${p.id}`, cta: t('See result') })),
    ...all.toLog.map(l => ({ key: 'log' + l.id, emoji: '✍️', title: t('How did the class with {name} go?', { name: name(l.studentId) }), subtitle: t('Write a short summary and notes'), to: `/students/${l.studentId}/lesson/${l.id}`, cta: t('Write summary') })),
    ...[...new Set(all.unread.map(m => m.studentId))].map(sid => ({ key: 'msg' + sid, emoji: '💌', tone: 'berry' as const, title: t('New message from {name}', { name: name(sid) }), subtitle: all.unread.filter(m => m.studentId === sid).at(-1)?.text.slice(0, 60), to: `/students/${sid}?tab=chat`, cta: t('Reply') })),
    ...all.toReview.map(s => ({ key: 'rev' + s.id, emoji: '📝', title: t('{name} handed in homework', { name: name(s.studentId) }), subtitle: data.tasks.find(x => x.id === s.taskId)?.title, to: `/students/${s.studentId}/task/${s.taskId}`, cta: t('Review') })),
  ]
  const first = todos[0]

  const mood: Mood = waiting ? 'hello' : 'nap'
  const line = waiting
    ? (todayLessons.length ? t('{n} classes today and {w} things waiting', { n: todayLessons.length, w: waiting }) : t('{w} things are waiting for you', { w: waiting }))
    : (todayLessons.length ? t('{n} classes today — everything else is ready!', { n: todayLessons.length }) : t('All caught up. ¡Disfruta!'))

  // Students that need something come first.
  const cards = data.students.map(s => {
    const mine = todosFor(data, me.id, s.id)
    const q = data.questionnaires.find(x => x.studentId === s.id)
    return { s, ...mine, level: q?.completedAt ? estimateLevel(q.answers) : null, attention: mine.toLog.length + mine.toReview.length + (mine.unread.length ? 1 : 0) }
  }).sort((a, b) => b.attention - a.attention)

  return (
    <div className="animate-rise">
      <header className="flex items-center gap-3 mb-2">
        <div className="flex-1">
          <p className="text-muted font-bold">{greeting()},</p>
          <h1 className="text-3xl font-black">{firstName(me.name)}! 🌿</h1>
        </div>
        <Link to="/me" aria-label={t('My profile')}><Avatar name={me.name} size={52} /></Link>
      </header>

      <MascotSay mood={mood} size={104} className="mb-1">{line}</MascotSay>

      {first && <NextStep emoji={first.emoji} tone={first.tone} title={first.title} subtitle={first.subtitle} to={first.to} cta={first.cta} />}

      <PushPrompt />

      {todayLessons.length > 0 && (
        <>
          <SectionTitle>📅 {t('Today’s classes')}</SectionTitle>
          <div className="grid gap-3">
            {todayLessons.map(l => <Row key={l.id} to={`/students/${l.studentId}/lesson/${l.id}`} icon="🎒" title={`${fmtTime(l.startsAt)} · ${name(l.studentId)}`} subtitle={l.title || `${l.durationMin} min`} />)}
          </div>
        </>
      )}

      {newChecks.length > 1 && (
        <>
          <SectionTitle>📊 {t('Level checks')}</SectionTitle>
          <div className="grid gap-3">{newChecks.slice(1).map(p => <Row key={p.id} to={`/placements/${p.id}`} icon={LEVEL_INFO[p.level].emoji} title={p.name} subtitle={`${p.level} · ${LEVEL_INFO[p.level].es}`} right={<Chip tone="berry">{t('New')}</Chip>} />)}</div>
        </>
      )}

      <SectionTitle action={<Link to="/students" className="font-extrabold text-sage-600">{t('See all')}</Link>}>👥 {t('My students')}</SectionTitle>
      {!cards.length && <Empty emoji="🌱" mascot="idle" title={t('No students yet')} text={t('Invite your first student to join.')} />}
      <div className="grid gap-4">
        {cards.map(({ s, level, toLog, toReview, unread, upcoming, attention }) => (
          <div key={s.id} className={cx('bg-white rounded-3xl border-2 overflow-hidden', attention ? 'border-sage-200' : 'border-sand')}>
            <Link to={`/students/${s.id}`} className="flex items-center gap-3 p-4 hover:bg-sage-50/50">
              <Avatar name={s.name} size={52} />
              <div className="flex-1 min-w-0">
                <div className="text-xl font-black leading-tight truncate">{s.name}</div>
                <div className="text-muted text-[15px]">{level ? `${level.emoji} ${t(level.label)}` : t('Questionnaire pending')}</div>
              </div>
              <ChevronRight className="size-5 text-muted" />
            </Link>
            <div className="border-t-2 border-sand divide-y-2 divide-sand">
              {toLog.map(l => <Item key={l.id} to={`/students/${s.id}/lesson/${l.id}`} icon="✍️" text={t('Summary of {day}’s class', { day: friendlyDay(l.startsAt) })} chip={<Chip tone="sun">{t('To do')}</Chip>} />)}
              {toReview.map(x => <Item key={x.id} to={`/students/${s.id}/task/${x.taskId}`} icon="📝" text={t('Review: {title}', { title: data.tasks.find(k => k.id === x.taskId)?.title ?? '' })} chip={<Chip tone="sun">{t('To review')}</Chip>} />)}
              {unread.length > 0 && <Item to={`/students/${s.id}?tab=chat`} icon="💬" text={t('{n} new messages', { n: unread.length })} chip={<Chip tone="berry">{unread.length}</Chip>} />}
              {upcoming[0]
                ? <Item to={`/students/${s.id}/lesson/${upcoming[0].id}`} icon="📅" text={`${t('Next class')}: ${friendlyWhen(upcoming[0].startsAt)}`} muted />
                : <Item to={`/students/${s.id}/lesson/new`} icon="➕" text={t('Plan the next class')} muted />}
            </div>
            {attention === 0 && <div className="px-4 py-2 text-sm font-extrabold text-sage-600 bg-sage-50">✓ {t('All up to date')}</div>}
          </div>
        ))}
      </div>

      <div className="mt-6"><Row to="/placements" icon="📊" title={t('Level check — send link')} subtitle={t('For someone who is not a student yet')} /></div>
    </div>
  )
}

function Item({ to, icon, text, chip, muted }: { to: string; icon: string; text: string; chip?: React.ReactNode; muted?: boolean }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3 hover:bg-sage-50/50 min-w-0">
      <span className="text-xl w-7 text-center">{icon}</span>
      <span className={cx('flex-1 min-w-0 truncate', muted ? 'text-muted font-bold' : 'font-extrabold')}>{text}</span>
      {chip}
    </Link>
  )
}
