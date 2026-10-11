import { store } from '../../lib'
import { useData, useMe } from '../../lib/hooks'
import { t } from '../../lib/i18n'
import { dayDiff, firstName, fmtTime, friendlyDay, friendlyWhen, greeting, speak } from '../../lib/util'
import { MascotSay, type Mood } from '../../components/Mascot'
import { Avatar, NextStep, Row, SectionTitle, Spinner } from '../../components/ui'
import { KIND } from '../../components/Bits'
import { unreadFor } from '../../components/Chat'
import { Link } from 'react-router-dom'
import { Volume2 } from 'lucide-react'

export default function StudentHome() {
  const me = useMe()
  const { data } = useData(async () => {
    const [lessons, tasks, subs, messages, teacher] = await Promise.all([
      store.listLessons(me.id), store.listTasks(me.id), store.listSubmissions(me.id), store.listMessages(me.id), store.getTeacher(),
    ])
    return { lessons, tasks, subs, messages, teacher }
  }, [me.id])
  if (!data) return <Spinner />

  const { lessons, tasks, subs, messages, teacher } = data
  const now = Date.now()
  const upcoming = lessons.filter(l => l.status === 'planned' && new Date(l.startsAt).getTime() > now - 3600_000)
  const nextLesson = upcoming[0]
  const done = lessons.filter(l => l.status === 'done')
  const todo = tasks.filter(tk => !subs.some(s => s.taskId === tk.id))
    .sort((a, b) => (a.dueAt ?? '9').localeCompare(b.dueAt ?? '9'))
  const unread = unreadFor(messages, me.id)
  const words = done.flatMap(l => l.vocab)
  const wordOfDay = words.length ? words[new Date().getDate() % words.length] : null
  const teacherName = teacher ? firstName(teacher.name) : t('Your teacher')

  // Pick the single most useful thing to do right now.
  let next: React.ReactNode
  if (nextLesson && dayDiff(nextLesson.startsAt) === 0) {
    next = <NextStep emoji="📅" label={t('Today')} title={t('Class at {time}', { time: fmtTime(nextLesson.startsAt) })} subtitle={nextLesson.title} to={`/journey/${nextLesson.id}`} cta={t('Get ready')} />
  } else if (unread > 0) {
    next = <NextStep emoji="💌" tone="berry" title={t('{name} sent you a message', { name: teacherName })} subtitle={messages.filter(m => m.senderId !== me.id).at(-1)?.text.slice(0, 60)} to="/chat" cta={t('Read it')} />
  } else if (todo[0]) {
    const tk = todo[0]
    next = <NextStep emoji={KIND[tk.kind].emoji} title={tk.title} subtitle={tk.dueAt ? t('Due {day}', { day: friendlyDay(tk.dueAt) }) : t(KIND[tk.kind].label)} to={`/tasks/${tk.id}`} cta={t('Start')} />
  } else if (nextLesson) {
    next = <NextStep emoji="📅" title={t('Next class: {day}', { day: friendlyDay(nextLesson.startsAt) })} subtitle={nextLesson.title} to={`/journey/${nextLesson.id}`} cta={t('See what we will learn')} />
  } else if (words.length) {
    next = <NextStep emoji="🔁" title={t('Practise your words')} subtitle={t('{n} words so far — ¡genial!', { n: words.length })} to="/practice" />
  } else {
    next = <NextStep emoji="👋" tone="berry" title={t('Say hola to {name}', { name: teacherName })} to="/chat" cta={t('Open chat')} />
  }

  // The mascot's mood and line follow what is going on.
  let mood: Mood = 'hello'
  let line = t('A little practice goes a long way!')
  if (nextLesson && dayDiff(nextLesson.startsAt) === 0) { mood = 'alert'; line = t('Your class is today — you are ready!') }
  else if (unread > 0) { mood = 'alert'; line = t('You have a new message!') }
  else if (!todo.length && !nextLesson) { mood = 'nap'; line = t('All caught up. Rest well!') }

  return (
    <div className="animate-rise">
      <header className="flex items-center gap-3 mb-2">
        <div className="flex-1">
          <p className="text-muted font-bold">{greeting()},</p>
          <h1 className="text-3xl font-black">{firstName(me.name)}! 👋</h1>
        </div>
        <Link to="/me" aria-label={t('My profile')}><Avatar name={me.name} size={52} /></Link>
      </header>

      <MascotSay mood={mood} size={104} className="mb-1">{line}</MascotSay>

      {next}

      <SectionTitle>{t('Coming up')}</SectionTitle>
      <div className="grid gap-3">
        {nextLesson && <Row to={`/journey/${nextLesson.id}`} icon="📅" title={t('Class · {when}', { when: friendlyWhen(nextLesson.startsAt) })} subtitle={nextLesson.title} />}
        {todo.slice(0, 3).map(tk => (
          <Row key={tk.id} to={`/tasks/${tk.id}`} icon={KIND[tk.kind].emoji} title={tk.title}
            subtitle={tk.dueAt ? t('Due {day}', { day: friendlyDay(tk.dueAt) }) : t(KIND[tk.kind].label)} />
        ))}
        {!nextLesson && !todo.length && <Row icon="🌿" title={t('All caught up')} subtitle={t('Nothing to do right now. ¡Disfruta!')} />}
      </div>

      {wordOfDay && (
        <>
          <SectionTitle>{t('Word of the day')}</SectionTitle>
          <button onClick={() => speak(wordOfDay.es)} className="w-full text-start rounded-3xl bg-berry-50 border-2 border-berry-100 p-5 flex items-center gap-4">
            <span className="size-14 rounded-2xl bg-berry-500 text-white grid place-items-center"><Volume2 className="size-7" /></span>
            <span>
              <span className="block text-2xl font-black text-berry-700" lang="es">{wordOfDay.es}</span>
              <span className="block text-muted">{wordOfDay.en}</span>
            </span>
          </button>
        </>
      )}

      <SectionTitle>{t('Your progress')}</SectionTitle>
      <div className="grid grid-cols-3 gap-3">
        <Stat to="/journey" emoji="🎓" n={done.length} label={t('classes')} />
        <Stat to="/practice" emoji="💬" n={words.length} label={t('words')} />
        <Stat to="/tasks" emoji="✅" n={subs.length} label={t('tasks done')} />
      </div>
    </div>
  )
}

function Stat({ emoji, n, label, to }: { emoji: string; n: number; label: string; to: string }) {
  return (
    <Link to={to} className="bg-white rounded-3xl border-2 border-sand p-4 text-center hover:border-sage-200">
      <div className="text-2xl">{emoji}</div>
      <div className="text-2xl font-black text-sage-700">{n}</div>
      <div className="text-sm font-bold text-muted">{label}</div>
    </Link>
  )
}
