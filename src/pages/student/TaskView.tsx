import confetti from 'canvas-confetti'
import { Camera, CheckCircle2, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Attachments, KIND } from '../../components/Bits'
import { Button, Chip, Empty, Input, Page, ProgressBar, SectionTitle, Spinner, TextArea, cx, toast } from '../../components/ui'
import { store } from '../../lib'
import { isCorrect, score } from '../../lib/grading'
import { useData, useMe } from '../../lib/hooks'
import { t } from '../../lib/i18n'
import type { Attachment, Submission, Task } from '../../lib/types'
import { friendlyDay, uid } from '../../lib/util'

export default function TaskView() {
  const { id } = useParams()
  const me = useMe()
  const { data, loading } = useData(async () => {
    const [tasks, subs] = await Promise.all([store.listTasks(me.id), store.listSubmissions(me.id)])
    return { task: tasks.find(x => x.id === id), sub: subs.find(s => s.taskId === id) }
  }, [id, me.id])
  const [playing, setPlaying] = useState(false)
  const [editing, setEditing] = useState(false)

  if (loading) return <Spinner />
  if (!data?.task) return <Page back="/tasks"><Empty emoji="🔍" title={t('Task not found')} /></Page>
  const { task, sub } = data

  if (playing) return <Player task={task} studentId={me.id} onExit={() => setPlaying(false)} />

  return (
    <Page back="/tasks" title={task.title}
      subtitle={<span className="flex flex-wrap gap-2 mt-1"><Chip tone="berry">{KIND[task.kind].emoji} {t(KIND[task.kind].label)}</Chip>{task.dueAt && <Chip tone="sand">{t('Due {day}', { day: friendlyDay(task.dueAt) })}</Chip>}</span>}>

      {sub && !editing && <Result task={task} sub={sub} />}

      {task.instructions && <p className="text-lg leading-relaxed whitespace-pre-wrap bg-white rounded-3xl border-2 border-sand p-5">{task.instructions}</p>}
      {task.attachments.length > 0 && <div className="mt-4"><Attachments items={task.attachments} /></div>}

      <div className="mt-8">
        {task.questions.length > 0 ? (
          <Button size="lg" full pulse={!sub} variant={sub ? 'soft' : 'primary'} onClick={() => setPlaying(true)}>
            {sub ? t('Try again') : t('Start · {n} questions', { n: task.questions.length })}
          </Button>
        ) : sub && !editing ? (
          <Button size="lg" full variant="soft" onClick={() => setEditing(true)}>{t('Change my answer')}</Button>
        ) : (
          <HandIn task={task} studentId={me.id} prev={sub} onDone={() => setEditing(false)} />
        )}
      </div>
    </Page>
  )
}

function Result({ task, sub }: { task: Task; sub: Submission }) {
  return (
    <div className="mb-6 rounded-3xl bg-sage-50 border-2 border-sage-200 p-5 animate-pop">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="size-9 text-sage-500" />
        <div className="flex-1">
          <div className="font-black text-lg text-sage-700">{t('Handed in')} · {friendlyDay(sub.submittedAt)}</div>
          {sub.total ? <div className="text-muted">{t('{score} of {total} correct', { score: sub.score ?? 0, total: sub.total })}</div> : null}
        </div>
      </div>
      {sub.feedback && (
        <div className="mt-4 bg-white rounded-2xl p-4">
          <div className="text-sm font-extrabold text-berry-500 mb-1">💬 {t('From your teacher')}</div>
          <p className="whitespace-pre-wrap">{sub.feedback}</p>
        </div>
      )}
      {task.questions.length > 0 && (
        <details className="mt-3">
          <summary className="font-extrabold text-sage-700 cursor-pointer">{t('See my answers')}</summary>
          <div className="mt-3 grid gap-2">
            {task.questions.map(q => {
              const a = sub.answers[q.id] ?? ''
              const ok = isCorrect(q, a)
              return (
                <div key={q.id} className="bg-white rounded-2xl p-3">
                  <div className="text-muted text-sm">{q.prompt}</div>
                  <div className={cx('font-extrabold', ok === false ? 'text-berry-600' : 'text-ink')}>{ok === true ? '✅ ' : ok === false ? '✏️ ' : ''}{a || '—'}</div>
                  {ok === false && <div className="text-sm text-sage-700">{t('Answer')}: {q.answer?.split('/')[0]}</div>}
                </div>
              )
            })}
          </div>
        </details>
      )}
    </div>
  )
}

function HandIn({ task, studentId, prev, onDone }: { task: Task; studentId: string; prev?: Submission; onDone: () => void }) {
  const [text, setText] = useState(prev?.textAnswer ?? '')
  const [files, setFiles] = useState<Attachment[]>(prev?.attachments ?? [])
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  const add = async (f?: File) => {
    if (!f) return
    setBusy(true)
    try { const a = await store.upload(f); setFiles(x => [...x, a]) } catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false) }
  }
  const submit = async () => {
    setBusy(true)
    try {
      await store.saveSubmission({ id: prev?.id ?? uid(), taskId: task.id, studentId, answers: {}, textAnswer: text, attachments: files, score: null, total: null, submittedAt: new Date().toISOString(), feedback: prev?.feedback ?? null })
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 }, colors: ['#5C9468', '#B05C70', '#F0C067'] })
      toast(t('¡Muy bien! Sent to your teacher'))
      onDone()
    } catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false) }
  }

  return (
    <div>
      <SectionTitle>{t('My answer')}</SectionTitle>
      <TextArea rows={5} value={text} onChange={e => setText(e.target.value)} placeholder={t('Write here… (optional)')} className="text-lg" />
      {files.length > 0 && (
        <div className="mt-3 grid gap-2">
          {files.map((f, i) => (
            <div key={i} className="relative">
              <Attachments items={[f]} />
              <button onClick={() => setFiles(x => x.filter((_, j) => j !== i))} className="absolute top-2 end-2 size-8 rounded-full bg-white shadow grid place-items-center" aria-label={t('Remove')}><X className="size-4" /></button>
            </div>
          ))}
        </div>
      )}
      <input ref={ref} type="file" accept="image/*,application/pdf" hidden onChange={e => add(e.target.files?.[0])} />
      <Button variant="soft" full className="mt-3" icon={<Camera className="size-5" />} onClick={() => ref.current?.click()} busy={busy && !text}>
        {t('Add a photo of my work')}
      </Button>
      <Button size="lg" full pulse disabled={!text.trim() && !files.length} busy={busy} className="mt-6" onClick={submit}>
        {t('Hand it in')}
      </Button>
    </div>
  )
}

/** Duolingo-style: one question at a time, check, then continue. */
function Player({ task, studentId, onExit }: { task: Task; studentId: string; onExit: () => void }) {
  const qs = task.questions
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState(false)
  const [finished, setFinished] = useState<{ score: number; total: number } | null>(null)
  const q = qs[i]
  const a = answers[q?.id] ?? ''
  const ok = q ? isCorrect(q, a) : null

  const cont = async () => {
    if (!checked) { setChecked(true); return }
    setChecked(false)
    if (i < qs.length - 1) { setI(i + 1); return }
    const s = score(qs, answers)
    try {
      await store.saveSubmission({ id: uid(), taskId: task.id, studentId, answers, textAnswer: '', attachments: [], ...s, submittedAt: new Date().toISOString(), feedback: null })
    } catch (e) { toast((e as Error).message, 'error') }
    if (!s.total || s.score / s.total >= 0.6) confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 }, colors: ['#5C9468', '#B05C70', '#F0C067'] })
    setFinished(s)
  }

  if (finished) {
    const great = !finished.total || finished.score / finished.total >= 0.6
    return (
      <div className="min-h-[70dvh] flex flex-col items-center justify-center text-center animate-pop">
        <div className="text-7xl">{great ? '🌟' : '💪'}</div>
        <h1 className="text-3xl font-black mt-4">{great ? t('¡Fantástico!') : t('¡Buen trabajo!')}</h1>
        {finished.total > 0 && <p className="text-xl text-muted mt-2">{t('{score} of {total} correct', finished)}</p>}
        <p className="text-muted mt-1">{t('Your teacher can see your answers.')}</p>
        <Button size="lg" pulse className="mt-8 min-w-60" onClick={onExit}>{t('Continue')}</Button>
      </div>
    )
  }

  return (
    <div className="min-h-[75dvh] flex flex-col">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onExit} aria-label={t('Close')} className="size-10 rounded-full grid place-items-center text-muted hover:bg-sand"><X className="size-6" /></button>
        <ProgressBar value={(i + (checked ? 1 : 0)) / qs.length} className="flex-1" />
      </div>

      <div key={q.id} className="flex-1 animate-rise">
        <div className="text-sm font-extrabold text-berry-500 uppercase tracking-wide mb-2">
          {q.type === 'choice' ? t('Choose the answer') : q.type === 'fill' ? t('Fill in the gap') : t('Write your answer')}
        </div>
        <h2 className="text-2xl font-black leading-snug mb-6" lang="es">{q.prompt}</h2>

        {q.type === 'choice' && (
          <div className="grid gap-3">
            {q.options?.map(o => {
              const sel = a === o
              const showOk = checked && o === q.answer
              const showBad = checked && sel && o !== q.answer
              return (
                <button key={o} disabled={checked} onClick={() => setAnswers(x => ({ ...x, [q.id]: o }))}
                  className={cx('rounded-3xl border-2 border-b-4 p-4 text-start text-lg font-extrabold transition',
                    showOk ? 'bg-sage-100 border-sage-400 text-sage-700' : showBad ? 'bg-berry-50 border-berry-300 text-berry-700' :
                      sel ? 'bg-sage-50 border-sage-400 text-sage-700' : 'bg-white border-sand hover:border-sage-200')}>
                  {o}
                </button>
              )
            })}
          </div>
        )}
        {q.type === 'fill' && (
          <Input autoFocus value={a} disabled={checked} className="text-xl" placeholder={t('Type your answer')} lang="es" autoCapitalize="off"
            onChange={e => setAnswers(x => ({ ...x, [q.id]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && a.trim() && cont()} />
        )}
        {q.type === 'open' && (
          <TextArea autoFocus rows={5} value={a} disabled={checked} className="text-lg" lang="es" onChange={e => setAnswers(x => ({ ...x, [q.id]: e.target.value }))} />
        )}
      </div>

      <div className={cx('-mx-4 px-4 pt-4 pb-4 mt-6 rounded-t-3xl transition', checked && (ok === false ? 'bg-berry-50' : 'bg-sage-50'))}>
        {checked && (
          <div className="mb-3 animate-pop">
            {ok === true && <div className="text-xl font-black text-sage-700">✅ {t('¡Correcto!')}</div>}
            {ok === null && <div className="text-xl font-black text-sage-700">📝 {t('Saved for your teacher')}</div>}
            {ok === false && (
              <>
                <div className="text-xl font-black text-berry-600">{t('Almost!')}</div>
                <div className="text-berry-700">{t('Correct answer')}: <b lang="es">{q.answer?.split('/')[0]}</b></div>
              </>
            )}
          </div>
        )}
        <Button size="lg" full pulse={!!a.trim()} disabled={!a.trim()} variant={checked && ok === false ? 'berry' : 'primary'} onClick={cont}>
          {checked ? t('Continue') : t('Check')}
        </Button>
      </div>
    </div>
  )
}
