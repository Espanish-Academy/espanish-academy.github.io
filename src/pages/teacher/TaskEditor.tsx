import { Check, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AttachmentEditor } from '../../components/AttachmentEditor'
import { Attachments, KIND } from '../../components/Bits'
import { Button, Card, Field, Input, Page, Segmented, Select, SectionTitle, Spinner, TextArea, cx, toast } from '../../components/ui'
import { store } from '../../lib'
import { isCorrect } from '../../lib/grading'
import { useMe } from '../../lib/hooks'
import { t } from '../../lib/i18n'
import type { Lesson, Profile, QuestionType, Submission, Task, TaskKind, TaskQuestion } from '../../lib/types'
import { firstName, fmtDate, friendlyDay, uid } from '../../lib/util'

const TEMPLATES: { emoji: string; label: string; make: () => Partial<Task> }[] = [
  { emoji: '🎵', label: 'Translate a song', make: () => ({ kind: 'homework', title: 'Translate a song', instructions: 'Listen to the song and translate the chorus. We will sing it together next class 🎶' }) },
  { emoji: '📄', label: 'Worksheet (PDF)', make: () => ({ kind: 'homework', title: 'Vocabulary worksheet', instructions: 'Complete the worksheet and send a photo of it.' }) },
  { emoji: '🎯', label: 'Quick quiz', make: () => ({ kind: 'exercise', title: 'Quick practice', instructions: 'A few minutes, no stress. You can try again as many times as you like.', questions: [newQ('choice'), newQ('fill')] }) },
  { emoji: '🏆', label: 'Test', make: () => ({ kind: 'exam', title: 'Test', instructions: 'Topics: …\nTake your time. Good luck! 🍀', questions: [newQ('choice')] }) },
]

function newQ(type: QuestionType): TaskQuestion {
  return type === 'choice' ? { id: uid(), type, prompt: '', options: ['', ''], answer: '' } : { id: uid(), type, prompt: '', answer: '' }
}

const toDateInput = (iso?: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function TaskEditor() {
  const { id: studentId = '', taskId = 'new' } = useParams()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const prefill = params.get('text') ?? ''
  const me = useMe()
  const [task, setTask] = useState<Task | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [student, setStudent] = useState<Profile | null>(null)
  const [sub, setSub] = useState<Submission | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    (async () => {
      const [tasks, ls, st, subs] = await Promise.all([store.listTasks(studentId), store.listLessons(studentId), store.getProfile(studentId), store.listSubmissions(studentId)])
      setLessons(ls); setStudent(st)
      const existing = tasks.find(x => x.id === taskId)
      setIsNew(!existing)
      const lastDone = ls.filter(l => l.status === 'done').at(-1)
      const nextClass = ls.find(l => l.status === 'planned' && new Date(l.startsAt) > new Date())
      setTask(existing ?? { id: uid(), studentId, lessonId: lastDone?.id ?? null, kind: 'homework', title: '', instructions: prefill, dueAt: nextClass?.startsAt ?? null, attachments: [], questions: [], createdAt: new Date().toISOString() })
      setSub(subs.find(s => s.taskId === taskId) ?? null)
    })()
  }, [studentId, taskId, prefill])

  if (!task) return <Spinner />
  const set = (p: Partial<Task>) => setTask({ ...task, ...p })
  const setQ = (i: number, p: Partial<TaskQuestion>) => set({ questions: task.questions.map((q, j) => (j === i ? { ...q, ...p } : q)) })
  const name = firstName(student?.name ?? '')

  const save = async () => {
    if (!task.title.trim()) { toast(t('Add a title first'), 'error'); return }
    setBusy(true)
    try {
      const questions = task.questions.filter(q => q.prompt.trim()).map(q => (q.type === 'choice' ? { ...q, options: q.options?.filter(o => o.trim()) } : q))
      await store.saveTask({ ...task, questions })
      if (isNew) await store.sendMessage({ studentId, senderId: me.id, text: `${KIND[task.kind].emoji} ${t('New task for you')}: ${task.title}` })
      toast(isNew ? t('Sent to {name}!', { name }) : t('Saved'))
      nav(`/students/${studentId}?tab=tasks`)
    } catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false) }
  }

  const remove = async () => {
    if (!confirm(t('Delete this task?'))) return
    await store.deleteTask(task.id)
    nav(`/students/${studentId}?tab=tasks`)
  }

  return (
    <Page back={`/students/${studentId}?tab=tasks`} title={isNew ? t('New task for {name}', { name }) : task.title}
      action={!isNew && <button onClick={remove} aria-label={t('Delete')} className="size-11 rounded-2xl grid place-items-center text-berry-500 hover:bg-berry-50"><Trash2 className="size-5" /></button>}>

      {sub && <Review task={task} sub={sub} onSaved={setSub} />}

      {isNew && (
        <>
          <div className="text-sm font-extrabold text-muted mb-2">{t('Start from')}</div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 mb-6">
            {TEMPLATES.map(tp => (
              <button key={tp.label} onClick={() => set(tp.make())} className="shrink-0 bg-white rounded-2xl border-2 border-sand px-4 py-3 font-extrabold hover:border-sage-200">
                {tp.emoji} {t(tp.label)}
              </button>
            ))}
          </div>
        </>
      )}

      <Segmented value={task.kind} onChange={(kind: TaskKind) => set({ kind })}
        options={(Object.keys(KIND) as TaskKind[]).map(k => ({ value: k, label: `${KIND[k].emoji} ${t(KIND[k].label)}` }))} />

      <div className="mt-5">
        <Field label={t('Title')}><Input value={task.title} onChange={e => set({ title: e.target.value })} placeholder={t('e.g. Mi familia — practice')} /></Field>
        <Field label={t('Instructions')}><TextArea rows={4} value={task.instructions} onChange={e => set({ instructions: e.target.value })} placeholder={t('What should {name} do?', { name })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('Due date')}><Input type="date" value={toDateInput(task.dueAt)} onChange={e => set({ dueAt: e.target.value ? new Date(e.target.value + 'T20:00').toISOString() : null })} /></Field>
          <Field label={t('From class')}>
            <Select value={task.lessonId ?? ''} onChange={e => set({ lessonId: e.target.value || null })}>
              <option value="">—</option>
              {lessons.filter(l => l.status === 'done').map(l => <option key={l.id} value={l.id}>{fmtDate(l.startsAt, { day: 'numeric', month: 'short' })} · {l.title}</option>)}
            </Select>
          </Field>
        </div>
      </div>

      <SectionTitle>{t('Files and links')}</SectionTitle>
      <AttachmentEditor value={task.attachments} onChange={attachments => set({ attachments })} />

      <SectionTitle>{t('Questions')} <span className="text-muted font-bold text-base">({t('optional')})</span></SectionTitle>
      <div className="grid gap-3">
        {task.questions.map((q, i) => (
          <Card key={q.id} className="!p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-extrabold text-berry-500">{i + 1}. {q.type === 'choice' ? t('Multiple choice') : q.type === 'fill' ? t('Fill the gap') : t('Open answer')}</span>
              <button onClick={() => set({ questions: task.questions.filter((_, j) => j !== i) })} className="size-9 rounded-full grid place-items-center hover:bg-sand" aria-label={t('Remove')}><X className="size-4" /></button>
            </div>
            <Input value={q.prompt} lang="es" onChange={e => setQ(i, { prompt: e.target.value })}
              placeholder={q.type === 'fill' ? t('Yo ___ dos hijos. (tener)') : q.type === 'choice' ? t('“la hermana” means…') : t('Translate: I live in Madrid')} />
            {q.type === 'choice' && (
              <div className="grid gap-2 mt-3">
                {q.options?.map((o, k) => (
                  <div key={k} className="flex items-center gap-2">
                    <button type="button" onClick={() => setQ(i, { answer: o })} aria-label={t('Mark as correct')}
                      className={cx('size-10 shrink-0 rounded-full border-2 grid place-items-center', o && q.answer === o ? 'bg-sage-500 border-sage-500 text-white' : 'border-sand-dark text-sand-dark')}>
                      <Check className="size-5" strokeWidth={3} />
                    </button>
                    <Input value={o} placeholder={t('Option {n}', { n: k + 1 })} onChange={e => {
                      const options = q.options!.map((x, m) => (m === k ? e.target.value : x))
                      setQ(i, { options, answer: q.answer === o ? e.target.value : q.answer })
                    }} />
                  </div>
                ))}
                <button type="button" onClick={() => setQ(i, { options: [...(q.options ?? []), ''] })} className="text-sage-600 font-extrabold text-start ps-12">＋ {t('Add option')}</button>
                <p className="text-sm text-muted ps-12">{t('Tap ✓ next to the correct answer')}</p>
              </div>
            )}
            {q.type === 'fill' && (
              <div className="mt-3"><Input value={q.answer ?? ''} lang="es" onChange={e => setQ(i, { answer: e.target.value })} placeholder={t('Correct answer (use / for alternatives)')} /></div>
            )}
          </Card>
        ))}
        <div className="grid grid-cols-3 gap-2">
          <Button variant="soft" size="sm" icon={<Plus className="size-4" />} onClick={() => set({ questions: [...task.questions, newQ('choice')] })}>{t('Choice')}</Button>
          <Button variant="soft" size="sm" icon={<Plus className="size-4" />} onClick={() => set({ questions: [...task.questions, newQ('fill')] })}>{t('Gap')}</Button>
          <Button variant="soft" size="sm" icon={<Plus className="size-4" />} onClick={() => set({ questions: [...task.questions, newQ('open')] })}>{t('Open')}</Button>
        </div>
      </div>

      <Button size="lg" full pulse busy={busy} className="mt-8" onClick={save}>{isNew ? t('Send to {name}', { name }) : t('Save')}</Button>
    </Page>
  )
}

function Review({ task, sub, onSaved }: { task: Task; sub: Submission; onSaved: (s: Submission) => void }) {
  const [feedback, setFeedback] = useState(sub.feedback ?? '')
  const [busy, setBusy] = useState(false)
  return (
    <Card className="mb-8 !border-sage-200 !bg-sage-50/60">
      <div className="flex items-center justify-between mb-3">
        <div className="font-black text-lg">📬 {t('Handed in')} · {friendlyDay(sub.submittedAt)}</div>
        {sub.total ? <span className="font-black text-sage-700 text-xl">{sub.score}/{sub.total}</span> : null}
      </div>
      {task.questions.length > 0 && (
        <div className="grid gap-2 mb-3">
          {task.questions.map((q, i) => {
            const a = sub.answers[q.id] ?? ''
            const ok = isCorrect(q, a)
            return (
              <div key={q.id} className="bg-white rounded-2xl p-3">
                <div className="text-sm text-muted">{i + 1}. {q.prompt}</div>
                <div className={cx('font-extrabold', ok === false && 'text-berry-600')}>{ok === true ? '✅ ' : ok === false ? '❌ ' : '📝 '}{a || '—'}</div>
                {ok === false && <div className="text-sm text-sage-700">→ {q.answer}</div>}
              </div>
            )
          })}
        </div>
      )}
      {sub.textAnswer && <p className="bg-white rounded-2xl p-4 whitespace-pre-wrap mb-3">{sub.textAnswer}</p>}
      {sub.attachments.length > 0 && <div className="mb-3"><Attachments items={sub.attachments} /></div>}
      <Field label={t('Your feedback')}><TextArea rows={2} value={feedback} onChange={e => setFeedback(e.target.value)} placeholder={t('¡Muy bien! …')} /></Field>
      <Button full busy={busy} disabled={!feedback.trim() || feedback === sub.feedback} onClick={async () => {
        setBusy(true)
        const next = { ...sub, feedback }
        await store.saveSubmission(next)
        onSaved(next); setBusy(false); toast(t('Feedback sent'))
      }}>{t('Send feedback')}</Button>
    </Card>
  )
}
