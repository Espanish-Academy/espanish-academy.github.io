import { Lock } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { KIND } from '../../components/Bits'
import { ChatThread } from '../../components/Chat'
import { Avatar, Button, Card, Chip, Empty, LinkButton, Page, Row, SectionTitle, Spinner, Tabs, TextArea, cx, toast } from '../../components/ui'
import { store } from '../../lib'
import { useMe } from '../../lib/hooks'
import { t } from '../../lib/i18n'
import { estimateLevel, lessonIdeas, topTags } from '../../lib/insights'
import { QUESTIONS, consentStatus, labels } from '../../lib/questionnaire'
import type { Answers, Insight, Placement } from '../../lib/types'
import { LEVEL_INFO } from '../../lib/placement'
import { fmtDate, friendlyDay, friendlyWhen } from '../../lib/util'
import { useTeacherData, type TeacherData } from './data'

type Tab = 'profile' | 'classes' | 'tasks' | 'chat' | 'notebook'

export default function StudentDetail() {
  const { id = '' } = useParams()
  const me = useMe()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'profile'
  const { data } = useTeacherData()
  if (!data) return <Spinner />
  const s = data.students.find(x => x.id === id)
  if (!s) return <Page back="/students"><Empty emoji="🔍" title={t('Student not found')} /></Page>

  const q = data.questionnaires.find(x => x.studentId === id)
  const answers = q?.completedAt ? q.answers : null
  const lvl = answers ? estimateLevel(answers) : null
  const check = data.placements.find(p => p.studentId === id)
  const unread = data.messages.filter(m => m.studentId === id && m.senderId !== me.id && !m.readAt).length

  return (
    <Page back="/students">
      <div className="flex items-center gap-4 -mt-2 mb-4">
        <Avatar name={s.name} size={72} />
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-black leading-tight">{s.name}</h1>
          <div className="text-muted font-bold">{check ? `${LEVEL_INFO[check.level].emoji} ${LEVEL_INFO[check.level].es} · ${check.level}` : lvl ? `${lvl.emoji} ${t(lvl.label)} · ${lvl.code}` : t('Questionnaire pending')}</div>
        </div>
      </div>
      <LinkButton to={`/students/${id}/preview`} variant="white" size="sm" full className="mb-5" icon={<span>👁️</span>}>{t('View the app as {name} sees it', { name: s.name.split(' ')[0] })}</LinkButton>
      <Tabs value={tab} onChange={v => setParams({ tab: v }, { replace: true })} options={[
        { value: 'profile', label: `🌟 ${t('Profile')}` },
        { value: 'classes', label: `📚 ${t('Classes')}` },
        { value: 'tasks', label: `📝 ${t('Tasks')}` },
        { value: 'chat', label: <span className="flex items-center gap-1.5">💬 {t('Chat')}{unread > 0 && <span className="size-2.5 rounded-full bg-berry-500" />}</span> },
        { value: 'notebook', label: `🔒 ${t('Notebook')}` },
      ]} />
      {tab === 'profile' && <Profile studentId={id} name={s.name} answers={answers} check={check} />}
      {tab === 'classes' && <Classes d={data} studentId={id} />}
      {tab === 'tasks' && <TasksTab d={data} studentId={id} />}
      {tab === 'chat' && <ChatThread studentId={id} me={me} other={s} />}
      {tab === 'notebook' && <Notebook d={data} studentId={id} name={s.name} answers={answers} />}
    </Page>
  )
}

/** Who the student is: everything from the questionnaire, in one calm place. */
function Profile({ studentId, name, answers, check }: { studentId: string; name: string; answers: Answers | null; check?: Placement }) {
  const checkCard = check && (
    <Row to={`/placements/${check.id}`} icon={LEVEL_INFO[check.level].emoji} className="mb-4" title={`${t('Level check')}: ${check.level} · ${LEVEL_INFO[check.level].es}`} subtitle={fmtDate(check.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })} />
  )
  if (!answers) {
    return <div>{checkCard}<Empty emoji="⏳" mascot="nap" title={t('Waiting for the questionnaire')} text={t('{name} has not finished it yet. Their profile will fill in here.', { name: name.split(' ')[0] })} /></div>
  }
  return (
    <div key={studentId}>
      {checkCard}
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

      <details className="mt-6 bg-white rounded-3xl border-2 border-sand p-5">
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
    </div>
  )
}

/**
 * The teacher's private notebook for one student: a free page with a few titles.
 * Saves by itself while she types — there is no Save button to forget.
 */
const SHEET: { key: 'nextLesson' | 'practice' | 'homework' | 'notes'; emoji: string; title: string; hint: string }[] = [
  { key: 'nextLesson', emoji: '🎯', title: 'To improve for the next class', hint: 'What to change, add or do differently…' },
  { key: 'practice', emoji: '🔁', title: 'To practise more', hint: 'Topics, words or sounds that need more repetition…' },
  { key: 'homework', emoji: '📝', title: 'Homework to send', hint: 'Ideas for the next homework…' },
  { key: 'notes', emoji: '🗒️', title: 'Free notes', hint: 'Personality, what motivates them, what to avoid…' },
]

function Notebook({ d, studentId, name, answers }: { d: TeacherData; studentId: string; name: string; answers: Answers | null }) {
  const nav = useNavigate()
  const [ins, setIns] = useState<Insight | null>(null)
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const latest = useRef<Insight | null>(null)
  const dirty = useRef(false)
  const timer = useRef<number | undefined>(undefined)

  const flush = async () => {
    if (!latest.current) return
    dirty.current = false
    setState('saving')
    try {
      await store.saveInsight({ ...latest.current, updatedAt: new Date().toISOString() })
      setState('saved')
    } catch (e) {
      dirty.current = true
      setState('idle')
      toast((e as Error).message, 'error')
    }
  }

  useEffect(() => {
    store.getInsight(studentId).then(i => {
      const v: Insight = { studentId, notes: '', nextLesson: '', practice: '', homework: '', updatedAt: '', ...i }
      latest.current = v
      setIns(v)
    })
    return () => {
      window.clearTimeout(timer.current)
      if (dirty.current && latest.current) store.saveInsight({ ...latest.current, updatedAt: new Date().toISOString() }).catch(() => {})
    }
  }, [studentId])

  if (!ins) return <Spinner />
  const set = (patch: Partial<Insight>) => {
    const v = { ...latest.current!, ...patch }
    latest.current = v
    setIns(v)
    dirty.current = true
    setState('idle')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(flush, 900)
  }

  const notes = d.notes.filter(n => n.studentId === studentId)
  const lessons = d.lessons.filter(l => l.studentId === studentId)
  const latestNote = [...notes].sort((a, b) => (lessons.find(l => l.id === b.lessonId)?.startsAt ?? '').localeCompare(lessons.find(l => l.id === a.lessonId)?.startsAt ?? ''))[0]
  const struggles = topTags(notes, 'struggles')
  const skip = topTags(notes, 'skip')

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-2 font-extrabold text-berry-600"><Lock className="size-4" />{t('Only you can see this')}</span>
        <span className="text-sm font-bold text-muted">{state === 'saving' ? t('Saving…') : state === 'saved' ? `✓ ${t('Saved')}` : ''}</span>
      </div>

      <div className="grid gap-4">
        {SHEET.map(sec => (
          <Card key={sec.key} className="!bg-berry-50/50 !border-berry-100">
            <label className="block font-black text-lg mb-2">{sec.emoji} {t(sec.title)}</label>
            <TextArea rows={4} value={ins[sec.key] ?? ''} onChange={e => set({ [sec.key]: e.target.value })} placeholder={t(sec.hint)} />
            {sec.key === 'homework' && (
              <Button size="sm" variant="white" className="mt-3" disabled={!ins.homework.trim()}
                onClick={async () => { if (dirty.current) await flush(); nav(`/students/${studentId}/task/new?text=${encodeURIComponent(ins.homework)}`) }}>
                📤 {t('Send as homework to {name}', { name: name.split(' ')[0] })}
              </Button>
            )}
          </Card>
        ))}
      </div>

      <SectionTitle>🔎 {t('Spotted in your class notes')}</SectionTitle>
      <Card>
        {struggles.length || latestNote?.workOn.length || skip.length ? (
          <>
            {struggles.length > 0 && (<>
              <div className="text-sm font-extrabold text-berry-600 mb-2">{t('Struggles with (most often first)')}</div>
              <div className="flex flex-wrap gap-2 mb-4">{struggles.map(x => <Chip key={x.tag} tone="berry">{x.tag}{x.n > 1 && <b className="opacity-60">×{x.n}</b>}</Chip>)}</div>
            </>)}
            {latestNote?.workOn.length ? (<>
              <div className="text-sm font-extrabold text-sage-700 mb-2">{t('Work on next (from last class)')}</div>
              <div className="flex flex-wrap gap-2 mb-4">{latestNote.workOn.map(x => <Chip key={x}>{x}</Chip>)}</div>
            </>) : null}
            {skip.length > 0 && (<>
              <div className="text-sm font-extrabold text-muted mb-2">{t('Not needed for now')}</div>
              <div className="flex flex-wrap gap-2">{skip.map(x => <Chip key={x.tag} tone="sand">{x.tag}</Chip>)}</div>
            </>)}
          </>
        ) : <p className="text-muted">{t('After each class, add notes — patterns will show up here.')}</p>}
      </Card>

      {answers && (
        <>
          <SectionTitle>💡 {t('Ideas for the next class')}</SectionTitle>
          <div className="grid gap-3">
            {lessonIdeas(answers, latestNote?.workOn).map(i => (
              <Row key={i.title} icon="✨" title={i.title === 'Review: {topic}' ? t('Review: {topic}', { topic: latestNote?.workOn[0] ?? '' }) : t(i.title)} subtitle={`${i.es} · ${t(i.how)}`}
                onClick={() => nav(`/students/${studentId}/lesson/new?title=${encodeURIComponent(i.es + ' — ' + t(i.title))}`)} />
            ))}
          </div>
        </>
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

