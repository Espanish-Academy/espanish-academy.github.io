import { Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { KIND } from '../../components/Bits'
import { ChatThread } from '../../components/Chat'
import { Avatar, Button, Card, Chip, Empty, LinkButton, NextStep, Page, Row, SectionTitle, Spinner, Tabs, TextArea, cx, toast } from '../../components/ui'
import { store } from '../../lib'
import { useMe } from '../../lib/hooks'
import { t } from '../../lib/i18n'
import { estimateLevel, lessonIdeas, topTags } from '../../lib/insights'
import { QUESTIONS, consentStatus, labels } from '../../lib/questionnaire'
import type { Answers, Insight } from '../../lib/types'
import { fmtDate, firstName, friendlyDay, friendlyWhen } from '../../lib/util'
import { todosFor, useTeacherData, type TeacherData } from './data'

type Tab = 'overview' | 'classes' | 'tasks' | 'chat'

export default function StudentDetail() {
  const { id = '' } = useParams()
  const me = useMe()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'overview'
  const { data } = useTeacherData()
  if (!data) return <Spinner />
  const s = data.students.find(x => x.id === id)
  if (!s) return <Page back="/students"><Empty emoji="🔍" title={t('Student not found')} /></Page>

  const q = data.questionnaires.find(x => x.studentId === id)
  const lvl = q?.completedAt ? estimateLevel(q.answers) : null
  const unread = data.messages.filter(m => m.studentId === id && m.senderId !== me.id && !m.readAt).length

  return (
    <Page back="/students">
      <div className="flex items-center gap-4 -mt-2 mb-6">
        <Avatar name={s.name} size={72} />
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-black leading-tight">{s.name}</h1>
          <div className="text-muted font-bold">{lvl ? `${lvl.emoji} ${t(lvl.label)} · ${lvl.code}` : t('Questionnaire pending')}</div>
        </div>
      </div>
      <Tabs value={tab} onChange={v => setParams({ tab: v }, { replace: true })} options={[
        { value: 'overview', label: `🌟 ${t('Portfolio')}` },
        { value: 'classes', label: `📚 ${t('Classes')}` },
        { value: 'tasks', label: `📝 ${t('Tasks')}` },
        { value: 'chat', label: <span className="flex items-center gap-1.5">💬 {t('Chat')}{unread > 0 && <span className="size-2.5 rounded-full bg-berry-500" />}</span> },
      ]} />
      {tab === 'overview' && <Overview d={data} studentId={id} answers={q?.completedAt ? q.answers : null} meId={me.id} />}
      {tab === 'classes' && <Classes d={data} studentId={id} />}
      {tab === 'tasks' && <TasksTab d={data} studentId={id} />}
      {tab === 'chat' && <ChatThread studentId={id} me={me} other={s} />}
    </Page>
  )
}

function Overview({ d, studentId, answers, meId }: { d: TeacherData; studentId: string; answers: Answers | null; meId: string }) {
  const nav = useNavigate()
  const notes = d.notes.filter(n => n.studentId === studentId)
  const lessons = d.lessons.filter(l => l.studentId === studentId)
  const latestNote = [...notes].sort((a, b) => {
    const la = lessons.find(l => l.id === a.lessonId)?.startsAt ?? ''
    const lb = lessons.find(l => l.id === b.lessonId)?.startsAt ?? ''
    return lb.localeCompare(la)
  })[0]
  const struggles = topTags(notes, 'struggles')
  const skip = topTags(notes, 'skip')
  const { toReview, toLog, upcoming } = todosFor(d, meId, studentId)
  const name = firstName(d.students.find(s => s.id === studentId)?.name ?? '')

  let next: React.ReactNode
  if (toLog[0]) next = <NextStep emoji="✍️" title={t('Write the summary of {day}’s class', { day: friendlyDay(toLog[0].startsAt) })} to={`/students/${studentId}/lesson/${toLog[0].id}`} cta={t('Write summary')} />
  else if (toReview[0]) next = <NextStep emoji="📝" title={t('Review the homework')} subtitle={d.tasks.find(x => x.id === toReview[0].taskId)?.title} to={`/students/${studentId}/task/${toReview[0].taskId}`} cta={t('Review')} />
  else if (!upcoming[0]) next = <NextStep emoji="📅" title={t('Schedule the next class')} to={`/students/${studentId}/lesson/new`} cta={t('Plan a class')} />
  else next = <NextStep emoji="🎒" title={t('Prepare {day}’s class', { day: friendlyDay(upcoming[0].startsAt) })} subtitle={upcoming[0].title} to={`/students/${studentId}/lesson/${upcoming[0].id}`} cta={t('Open plan')} />

  return (
    <div>
      {next}

      {!answers ? (
        <div className="mt-6"><Empty emoji="⏳" title={t('Waiting for the questionnaire')} text={t('{name} has not finished it yet. Their profile will fill in here.', { name })} /></div>
      ) : (
        <>
          <SectionTitle>{t('Who they are')}</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-3">
            <Fact title={t('Why Spanish')} items={labels('purpose', answers)} />
            <Fact title={t('Class style')} items={[...labels('pace', answers), ...labels('timeframe', answers)]} />
            <Fact title={t('Learns best by')} items={[...labels('memorize', answers), ...labels('studyWays', answers)]} tone="sage" />
            <Fact title={t('Loves')} items={labels('interests', answers)} tone="berry" />
            <Fact title={t('Dream trip')} items={labels('dreamCountry', answers)} text={answers.dreamWhy as string} />
            <Fact title={t('Already says')} text={(answers.knownWords as string) || '—'} items={labels('content', answers)} />
          </div>
          {answers.culture && <Card className="mt-3"><div className="text-sm font-extrabold text-muted mb-1">{t('Culture that excites them')}</div><p>{answers.culture as string}</p></Card>}
          <Consent answers={answers} />
        </>
      )}

      <SectionTitle><span className="flex items-center gap-2"><Lock className="size-4 text-berry-500" />{t('Where they need help')}</span></SectionTitle>
      <Card className="!bg-berry-50/60 !border-berry-100">
        {struggles.length || latestNote?.workOn.length ? (
          <>
            {struggles.length > 0 && (
              <>
                <div className="text-sm font-extrabold text-berry-600 mb-2">{t('Struggles with (most often first)')}</div>
                <div className="flex flex-wrap gap-2 mb-4">{struggles.map(x => <Chip key={x.tag} tone="berry">{x.tag}{x.n > 1 && <b className="opacity-60">×{x.n}</b>}</Chip>)}</div>
              </>
            )}
            {latestNote?.workOn.length ? (
              <>
                <div className="text-sm font-extrabold text-sage-700 mb-2">{t('Work on next (from last class)')}</div>
                <div className="flex flex-wrap gap-2 mb-4">{latestNote.workOn.map(x => <Chip key={x}>{x}</Chip>)}</div>
              </>
            ) : null}
            {skip.length > 0 && (
              <>
                <div className="text-sm font-extrabold text-muted mb-2">{t('Not needed for now')}</div>
                <div className="flex flex-wrap gap-2">{skip.map(x => <Chip key={x.tag} tone="sand">{x.tag}</Chip>)}</div>
              </>
            )}
          </>
        ) : <p className="text-muted">{t('After each class, add notes — patterns will show up here.')}</p>}
      </Card>

      {answers && (
        <>
          <SectionTitle>💡 {t('Ideas for the next class')}</SectionTitle>
          <div className="grid gap-3">
            {lessonIdeas(answers, latestNote?.workOn).map(i => (
              <Row key={i.title} icon="✨" title={t(i.title)} subtitle={`${i.es} · ${t(i.how)}`}
                onClick={() => nav(`/students/${studentId}/lesson/new?title=${encodeURIComponent(i.es + ' — ' + i.title)}`)} />
            ))}
          </div>
        </>
      )}

      <PrivateNotes studentId={studentId} />

      {answers && (
        <details className="mt-8 bg-white rounded-3xl border-2 border-sand p-5">
          <summary className="font-black cursor-pointer">{t('All questionnaire answers')}</summary>
          <div className="mt-4 grid gap-4">
            {QUESTIONS.map(qq => {
              const v = answers[qq.id]
              const text = qq.kind === 'consent' ? (consentStatus(answers).agreed ? `✓ ${t('Agreed')}` : '—') : qq.options ? labels(qq.id, answers).map(l => `${l.emoji} ${t(l.label)}`).join(' · ') : (v as string)
              return (
                <div key={qq.id}>
                  <div className="text-sm text-muted italic">{qq.es}</div>
                  <div className="font-bold">{text || '—'}{qq.id === 'dreamCountry' && answers.dreamWhy ? ` — ${answers.dreamWhy}` : ''}</div>
                </div>
              )
            })}
          </div>
        </details>
      )}
    </div>
  )
}

/** Recording consent with its full, timestamped history — kept as evidence. */
function Consent({ answers }: { answers: Answers }) {
  const c = consentStatus(answers)
  const when = (iso: string) => fmtDate(iso, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  return (
    <Card className={cx('mt-3 !p-4', c.agreed ? '!bg-sage-50 !border-sage-200' : '')}>
      <div className="flex items-center gap-3">
        <span className={cx('size-9 rounded-xl grid place-items-center text-white font-black', c.agreed ? 'bg-sage-500' : 'bg-sand-dark')}>{c.agreed ? '✓' : '–'}</span>
        <div className="flex-1">
          <div className="font-extrabold">🎥 {c.agreed ? t('Agreed to class recording') : t('No consent to record')}</div>
          {c.at && <div className="text-sm text-muted">{when(c.at)}</div>}
        </div>
      </div>
      {c.log.length > 1 && (
        <details className="mt-2 text-sm">
          <summary className="cursor-pointer font-bold text-muted">{t('History')}</summary>
          <ul className="mt-1 space-y-0.5">{c.log.map((x, i) => <li key={i}>{x.agreed ? '✓' : '–'} {when(x.at)}</li>)}</ul>
        </details>
      )}
    </Card>
  )
}

function Fact({ title, items = [], text, tone = 'sand' }: { title: string; items?: { label: string; emoji: string }[]; text?: string; tone?: 'sage' | 'berry' | 'sand' }) {
  return (
    <Card className="!p-4">
      <div className="text-sm font-extrabold text-muted mb-2">{title}</div>
      <div className="flex flex-wrap gap-1.5">{items.map(i => <Chip key={i.label} tone={tone}>{i.emoji} {t(i.label)}</Chip>)}</div>
      {text && <p className="mt-2 text-[15px]">{text}</p>}
    </Card>
  )
}

function PrivateNotes({ studentId }: { studentId: string }) {
  const [ins, setIns] = useState<Insight | null>(null)
  const [dirty, setDirty] = useState(false)
  useEffect(() => {
    store.getInsight(studentId).then(i => setIns(i ?? { studentId, notes: '', nextLesson: '', updatedAt: '' }))
  }, [studentId])
  if (!ins) return null
  const set = (patch: Partial<Insight>) => { setIns({ ...ins, ...patch }); setDirty(true) }
  return (
    <>
      <SectionTitle><span className="flex items-center gap-2"><Lock className="size-4 text-berry-500" />{t('My private notes')}</span></SectionTitle>
      <Card className="!bg-berry-50/60 !border-berry-100">
        <label className="block text-sm font-extrabold text-berry-600 mb-1">{t('About this student')}</label>
        <TextArea rows={3} value={ins.notes} onChange={e => set({ notes: e.target.value })} placeholder={t('Personality, what motivates them, what to avoid…')} />
        <label className="block text-sm font-extrabold text-berry-600 mt-4 mb-1">{t('Plan for the next class')}</label>
        <TextArea rows={2} value={ins.nextLesson} onChange={e => set({ nextLesson: e.target.value })} />
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm text-muted">🔒 {t('Only you can see this')}</span>
          <Button size="sm" disabled={!dirty} onClick={async () => { await store.saveInsight({ ...ins, updatedAt: new Date().toISOString() }); setDirty(false); toast(t('Saved')) }}>{t('Save')}</Button>
        </div>
      </Card>
    </>
  )
}

function Classes({ d, studentId }: { d: TeacherData; studentId: string }) {
  const lessons = d.lessons.filter(l => l.studentId === studentId)
  const planned = lessons.filter(l => l.status === 'planned')
  const past = lessons.filter(l => l.status !== 'planned').reverse()
  const hasNote = (id: string) => d.notes.some(n => n.lessonId === id)
  return (
    <div>
      <LinkButton to={`/students/${studentId}/lesson/new`} full pulse={!planned.length}>＋ {t('Plan a class')}</LinkButton>
      {planned.length > 0 && (
        <>
          <SectionTitle>{t('Planned')}</SectionTitle>
          <div className="grid gap-3">{planned.map(l => <Row key={l.id} to={`/students/${studentId}/lesson/${l.id}`} icon="📅" title={friendlyWhen(l.startsAt)} subtitle={l.title || t('No title yet')} />)}</div>
        </>
      )}
      <SectionTitle>{t('Class history')}</SectionTitle>
      {!past.length && <p className="text-muted">{t('No classes yet.')}</p>}
      <div className="grid gap-3">
        {past.map((l, i) => (
          <Row key={l.id} to={`/students/${studentId}/lesson/${l.id}`} icon={l.status === 'cancelled' ? '🚫' : String(past.length - i)}
            title={l.title || t('Class')} subtitle={fmtDate(l.startsAt, { day: 'numeric', month: 'short', year: 'numeric' })}
            right={hasNote(l.id) ? <Chip>🔒 {t('notes')}</Chip> : <Chip tone="sun">{t('add notes')}</Chip>} />
        ))}
      </div>
    </div>
  )
}

function TasksTab({ d, studentId }: { d: TeacherData; studentId: string }) {
  const tasks = d.tasks.filter(x => x.studentId === studentId)
  const sub = (id: string) => d.subs.find(s => s.taskId === id)
  return (
    <div>
      <LinkButton to={`/students/${studentId}/task/new`} full>＋ {t('New task')}</LinkButton>
      <div className="grid gap-3 mt-5">
        {!tasks.length && <Empty emoji="📝" title={t('No tasks yet')} text={t('Send homework, a PDF, an exercise or a test.')} />}
        {tasks.map(x => {
          const s = sub(x.id)
          return (
            <Row key={x.id} to={`/students/${studentId}/task/${x.id}`} icon={KIND[x.kind].emoji} title={x.title}
              subtitle={x.dueAt ? t('Due {day}', { day: friendlyDay(x.dueAt) }) : t(KIND[x.kind].label)}
              right={!s ? <Chip tone="sand">{t('Waiting')}</Chip> : !s.feedback ? <Chip tone="sun">{t('To review')}</Chip> : <Chip>{s.total ? `${s.score}/${s.total}` : '✓'}</Chip>} />
          )
        })}
      </div>
    </div>
  )
}

