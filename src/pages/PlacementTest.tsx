import confetti from 'canvas-confetti'
import { Check } from 'lucide-react'
import { Fragment, useMemo, useState, type ReactNode } from 'react'
import { Mascot } from '../components/Mascot'
import { Button, Field, Input, ProgressBar, TextArea, cx } from '../components/ui'
import { store } from '../lib'
import { DONT_KNOW, PASS, levelFrom, stageQuestions, type PQ } from '../lib/placement'
import type { Placement, PlacementAnswer } from '../lib/types'
import { uid } from '../lib/util'

/** Public Spanish level check — no account needed. English on purpose: the glosses are the test. */

const shuffle = <T,>(xs: T[]) => [...xs].sort(() => Math.random() - 0.5)

/** *word* → bold */
function rich(text: string): ReactNode {
  return text.split('*').map((part, i) => (i % 2 ? <b key={i} lang="es" className="text-sage-700">{part}</b> : <Fragment key={i}>{part}</Fragment>))
}

export default function PlacementTest() {
  const [phase, setPhase] = useState<'intro' | 'quiz' | 'between' | 'done'>('intro')
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [goal, setGoal] = useState('')
  const [stage, setStage] = useState(1)
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [answers, setAnswers] = useState<PlacementAnswer[]>([])
  const [scores, setScores] = useState<number[]>([])
  const [saveState, setSaveState] = useState<'saving' | 'ok' | 'error'>('saving')
  const [result, setResult] = useState<Placement | null>(null)

  const questions = useMemo(() => stageQuestions(stage), [stage])
  const q: PQ | undefined = questions[i]
  const options = useMemo(() => (q ? shuffle(q.options) : []), [q])

  const finish = async (finalScores: number[], finalAnswers: PlacementAnswer[]) => {
    const p: Placement = {
      id: uid(), name: name.trim(), contact: contact.trim() || null, goal: goal.trim() || null,
      answers: finalAnswers, scores: finalScores, level: levelFrom(finalScores), createdAt: new Date().toISOString(),
    }
    setResult(p)
    setPhase('done')
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#5C9468', '#B05C70', '#F0C067'] })
    await send(p)
  }
  const send = async (p: Placement) => {
    setSaveState('saving')
    try { await store.savePlacement(p); setSaveState('ok') } catch { setSaveState('error') }
  }

  const next = () => {
    if (!q || picked === null) return
    const nextAnswers = [...answers, { id: q.id, picked, correct: picked === q.answer }]
    setAnswers(nextAnswers)
    setPicked(null)
    window.scrollTo({ top: 0 })
    if (i < questions.length - 1) { setI(i + 1); return }
    const stageScore = nextAnswers.filter(a => a.id.startsWith(`s${stage}q`) && a.correct).length
    const nextScores = [...scores, stageScore]
    setScores(nextScores)
    if (stage < 3 && stageScore >= PASS[stage - 1]) { setPhase('between'); return }
    finish(nextScores, nextAnswers)
  }

  if (phase === 'intro') {
    return (
      <Shell>
        <div className="flex-1 animate-rise">
          <div className="text-center"><Mascot mood="hello" size={190} /></div>
          <h1 className="text-3xl font-black text-center mt-2">Spanish level check</h1>
          <p className="text-lg text-muted text-center mt-2">A few quick questions so your teacher can see where you are today.</p>
          <ul className="mt-5 space-y-1.5 text-[17px]">
            <li>⏱️ About 5 minutes</li>
            <li>🙌 There are no wrong answers: if you don’t know, just tap <b>“I don’t know”</b></li>
            <li>🌱 It gets a little harder as you go — stop whenever it’s too much</li>
          </ul>
          <div className="mt-6">
            <Field label="Your name"><Input value={name} onChange={e => setName(e.target.value)} autoComplete="given-name" placeholder="e.g. Miriam" /></Field>
            <Field label="WhatsApp or email (optional)" hint="So your teacher can get back to you"><Input value={contact} onChange={e => setContact(e.target.value)} placeholder="" /></Field>
            <Field label="Why do you want to learn Spanish? (optional)"><TextArea rows={2} value={goal} onChange={e => setGoal(e.target.value)} /></Field>
          </div>
        </div>
        <Button size="lg" full pulse disabled={!name.trim()} onClick={() => setPhase('quiz')}>Start</Button>
      </Shell>
    )
  }

  if (phase === 'between') {
    return (
      <Shell>
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-pop">
          <Mascot mood="cheer" size={200} />
          <h1 className="text-3xl font-black mt-4">Nice work, {name.trim().split(' ')[0]}!</h1>
          <p className="text-lg text-muted mt-2 max-w-sm">Let’s try a few slightly harder ones. Remember, “I don’t know” is always fine.</p>
        </div>
        <Button size="lg" full pulse onClick={() => { setStage(stage + 1); setI(0); setPhase('quiz') }}>Continue</Button>
      </Shell>
    )
  }

  if (phase === 'done') {
    return (
      <Shell>
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-pop">
          <Mascot mood="cheer" size={210} />
          <h1 className="text-3xl font-black mt-4">¡Gracias, {name.trim().split(' ')[0]}!</h1>
          <p className="text-lg text-muted mt-3 max-w-sm">Thank you! Your teacher will look at your answers and get in touch with you.</p>
          {saveState === 'saving' && <p className="mt-6 text-muted font-bold">Sending…</p>}
          {saveState === 'ok' && <p className="mt-6 text-sage-700 font-extrabold">✓ Sent to your teacher. You can close this page.</p>}
          {saveState === 'error' && (
            <div className="mt-6">
              <p className="text-berry-600 font-extrabold mb-3">We couldn’t send your answers. Please check your connection and try again.</p>
              <Button onClick={() => result && send(result)}>Try again</Button>
            </div>
          )}
        </div>
      </Shell>
    )
  }

  const stageLabel = stage === 1 ? 'Part 1 · First words' : stage === 2 ? 'Part 2 · Simple sentences' : 'Part 3 · A little more'
  return (
    <Shell>
      <div className="mb-6">
        <div className="text-sm font-extrabold text-berry-500 uppercase tracking-wide mb-2">{stageLabel}</div>
        <ProgressBar value={i / questions.length} />
      </div>
      <div key={q!.id} className="flex-1 animate-rise">
        {q!.passage && <div className="mb-5 rounded-3xl bg-white border-2 border-sand p-5 text-xl leading-relaxed font-bold" lang="es">“{q!.passage}”</div>}
        <h1 className="text-[1.6rem] leading-snug font-black mb-6">{rich(q!.prompt)}</h1>
        <div className="grid gap-3">
          {options.map(o => <Option key={o} selected={picked === o} onClick={() => setPicked(o)}>{o}</Option>)}
          <button type="button" onClick={() => setPicked(DONT_KNOW)}
            className={cx('rounded-3xl border-2 border-dashed p-3.5 font-extrabold transition', picked === DONT_KNOW ? 'border-sage-400 bg-sage-50 text-sage-700' : 'border-sand-dark text-muted hover:bg-white')}>
            🤷 I don’t know
          </button>
        </div>
      </div>
      <div className="pt-6"><Button size="lg" full pulse={picked !== null} disabled={picked === null} onClick={next}>Continue</Button></div>
    </Shell>
  )
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-cream">
      <div className="max-w-lg mx-auto min-h-dvh flex flex-col px-5 pt-6 pb-8">{children}</div>
    </div>
  )
}

function Option({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={cx('w-full flex items-center gap-4 rounded-3xl border-2 border-b-4 p-4 text-start text-[18px] font-extrabold transition active:translate-y-[2px]',
        selected ? 'bg-sage-50 border-sage-400 text-sage-700' : 'bg-white border-sand hover:border-sage-200')}>
      <span className="flex-1" lang="es">{children}</span>
      <span className={cx('size-7 grid place-items-center rounded-full border-2 transition', selected ? 'bg-sage-500 border-sage-500 text-white' : 'border-sand-dark')}>
        {selected && <Check className="size-4" strokeWidth={3.5} />}
      </span>
    </button>
  )
}
