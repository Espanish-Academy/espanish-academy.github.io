import confetti from 'canvas-confetti'
import { Check, Volume2 } from 'lucide-react'
import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Mascot } from '../components/Mascot'
import { Button, Field, Input, cx } from '../components/ui'
import { QuestionInput } from './Onboarding'
import { store } from '../lib'
import { t } from '../lib/i18n'
import { setLocale } from '../lib/i18n'
import { DONT_KNOW, PASS, levelFrom, stageQuestions, type PQ } from '../lib/placement'
import { QUESTIONS, SECTIONS, isAnswered } from '../lib/questionnaire'
import type { Answers, Placement, PlacementAnswer } from '../lib/types'
import { speak, uid } from '../lib/util'

/** Public Spanish level check — no account needed. English on purpose: the glosses are the test. */

/** The "about you" questions, from the full questionnaire (the level check covers the rest). */
const PROFILE_IDS = ['purpose', 'timeframe', 'pace', 'studied', 'memorize', 'studyWays', 'content', 'interests', 'culture', 'dreamCountry']
const PROFILE_QS = QUESTIONS.filter(q => PROFILE_IDS.includes(q.id))

const SEC_PROFILE = 12 // seconds per "about you" question, for the time estimate
const SEC_QUIZ = 20
const SEGMENTS = ['About you', 'Part 1 · First words', 'Part 2 · Simple sentences', 'Part 3 · A little more']

/** Shows where you are, how many questions are left in this part and roughly how long that takes. */
function TestProgress({ seg, idx, len, sec }: { seg: number; idx: number; len: number; sec: number }) {
  const left = len - idx
  const time = left * sec < 50 ? 'less than a minute left' : `about ${Math.ceil((left * sec) / 60)} min left`
  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <span className="text-sm font-extrabold text-berry-500 uppercase tracking-wide">{SEGMENTS[seg]}</span>
        <span className="text-sm font-extrabold text-muted text-end">Question {idx + 1} of {len} · {time}</span>
      </div>
      <div className="flex gap-1.5">
        {SEGMENTS.map((_, k) => (
          <div key={k} className="flex-1 h-3.5 rounded-full bg-sand overflow-hidden">
            <div className="h-full rounded-full bg-sage-500 transition-all duration-500"
              style={{ width: k < seg ? '100%' : k === seg ? `${Math.max(8, (idx / len) * 100)}%` : '0%' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

/** True unless we know this device has no Spanish voice (then the audio question shows its text instead). */
function useSpanishVoice() {
  const [ok, setOk] = useState<boolean | null>(() => ('speechSynthesis' in window ? null : false))
  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const check = () => { const v = speechSynthesis.getVoices(); if (v.length) setOk(v.some(x => x.lang.toLowerCase().startsWith('es'))) }
    check()
    speechSynthesis.addEventListener('voiceschanged', check)
    const tm = setTimeout(() => setOk(o => (o === null ? true : o)), 1500)
    return () => { speechSynthesis.removeEventListener('voiceschanged', check); clearTimeout(tm) }
  }, [])
  return ok !== false
}

const shuffle = <T,>(xs: T[]) => [...xs].sort(() => Math.random() - 0.5)

/** *word* → bold */
function rich(text: string): ReactNode {
  return text.split('*').map((part, i) => (i % 2 ? <b key={i} lang="es" className="text-sage-700">{part}</b> : <Fragment key={i}>{part}</Fragment>))
}

export default function PlacementTest() {
  useState(() => setLocale('en', false)) // this page is always in English
  const [phase, setPhase] = useState<'intro' | 'profile' | 'quiz' | 'between' | 'done'>('intro')
  const [after, setAfter] = useState<'profile' | 1 | 2>('profile')
  const [pi, setPi] = useState(0)
  const [profile, setProfile] = useState<Answers>({})
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [stage, setStage] = useState(1)
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [answers, setAnswers] = useState<PlacementAnswer[]>([])
  const [scores, setScores] = useState<number[]>([])
  const [saveState, setSaveState] = useState<'saving' | 'ok' | 'error'>('saving')
  const [result, setResult] = useState<Placement | null>(null)

  const voiceOk = useSpanishVoice()
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact.trim())
  const questions = useMemo(() => stageQuestions(stage), [stage])
  const q: PQ | undefined = questions[i]
  const options = useMemo(() => (q ? shuffle(q.options) : []), [q])

  const finish = async (finalScores: number[], finalAnswers: PlacementAnswer[]) => {
    const p: Placement = {
      id: uid(), name: name.trim(), contact: contact.trim().toLowerCase(), goal: null, profile,
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
    if (stage < 3 && stageScore >= PASS[stage - 1]) { setAfter(stage as 1 | 2); setPhase('between'); return }
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
            <li>⏱️ Usually 5–8 minutes — you’ll always see how many questions are left</li>
            <li>🙌 There are no wrong answers: if you don’t know, just tap <b>“I don’t know”</b></li>
            <li>🌱 It gets a little harder as you go — stop whenever it’s too much</li>
          </ul>
          <div className="mt-6">
            <Field label="Your name"><Input value={name} onChange={e => setName(e.target.value)} autoComplete="given-name" placeholder="e.g. Miriam" /></Field>
            <Field label="Your email" hint="So your teacher can get back to you"><Input type="email" inputMode="email" autoComplete="email" autoCapitalize="off" value={contact} onChange={e => setContact(e.target.value)} placeholder="name@example.com" /></Field>
          </div>
        </div>
        <Button size="lg" full pulse disabled={!name.trim() || !validEmail} onClick={() => setPhase('profile')}>Start</Button>
      </Shell>
    )
  }

  if (phase === 'profile') {
    const pq = PROFILE_QS[pi]
    const section = SECTIONS.find(x => x.id === pq.section)
    const go = () => {
      window.scrollTo({ top: 0 })
      if (pi < PROFILE_QS.length - 1) setPi(pi + 1)
      else { setAfter('profile'); setPhase('between') }
    }
    return (
      <Shell>
        <TestProgress seg={0} idx={pi} len={PROFILE_QS.length} sec={SEC_PROFILE} />
        <div key={pq.id} className="flex-1 animate-rise">
          {section && <div className="text-sm font-extrabold text-berry-500 uppercase tracking-wide mb-2">{section.emoji} {t(section.title)}</div>}
          <h1 className="text-[1.6rem] leading-snug font-black">{t(pq.title)}</h1>
          {pq.hint && <p className="text-sage-600 font-bold mt-2 text-[15px]">{t(pq.hint)}</p>}
          <div className="mt-6"><QuestionInput q={pq} answers={profile} set={(id, v) => setProfile(a => ({ ...a, [id]: v }))} /></div>
        </div>
        <div className="pt-6 space-y-2">
          <Button size="lg" full pulse={isAnswered(pq, profile)} disabled={!isAnswered(pq, profile)} onClick={go}>Continue</Button>
          {pq.optional && !profile[pq.id] && <button onClick={go} className="w-full py-2 font-extrabold text-muted">Skip</button>}
        </div>
      </Shell>
    )
  }

  if (phase === 'between') {
    const first = name.trim().split(' ')[0]
    const nextStage = after === 'profile' ? 1 : after + 1
    const n = stageQuestions(nextStage).length
    const mins = Math.max(1, Math.round((n * SEC_QUIZ) / 60))
    const copy = after === 'profile'
      ? { title: `Thank you, ${first}!`, text: 'Thanks for telling us about yourself. Now the Spanish check.' }
      : after === 1
        ? { title: `Nice work, ${first}!`, text: 'Let’s try a few slightly harder ones.' }
        : { title: 'Almost there!', text: 'Just one last part.' }
    return (
      <Shell>
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-pop">
          <Mascot mood="cheer" size={200} />
          <h1 className="text-3xl font-black mt-4">{copy.title}</h1>
          <p className="text-lg text-muted mt-2 max-w-sm">{copy.text}</p>
          <div className="mt-5 rounded-3xl bg-white border-2 border-sand px-5 py-3 font-extrabold">
            Next: {nextStage === 1 ? 'Part 1' : nextStage === 2 ? 'Part 2' : 'Part 3'} · {n} questions · about {mins} min
          </div>
          <p className="mt-3 text-muted">Remember, “I don’t know” is always fine.</p>
        </div>
        <Button size="lg" full pulse onClick={() => { if (after !== 'profile') setStage(nextStage); setI(0); setPhase('quiz') }}>Continue</Button>
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

  return (
    <Shell>
      <TestProgress seg={stage} idx={i} len={questions.length} sec={SEC_QUIZ} />
      <div key={q!.id} className="flex-1 animate-rise">
        {q!.audio && (voiceOk ? (
          <button type="button" onClick={() => speak(q!.audio!)}
            className="w-full mb-5 flex items-center gap-4 rounded-3xl bg-berry-500 border-b-[6px] border-berry-700 text-white p-5 active:translate-y-[2px] transition">
            <span className="size-16 rounded-full bg-white/20 grid place-items-center"><Volume2 className="size-8" /></span>
            <span className="text-start">
              <span className="block text-xl font-black">Tap to listen</span>
              <span className="block text-white/85">You can play it as many times as you like</span>
            </span>
          </button>
        ) : (
          <div className="mb-5 rounded-3xl bg-white border-2 border-sand p-5 text-xl leading-relaxed font-bold" lang="es">
            <div className="text-sm font-extrabold text-muted mb-1">Your device can’t play Spanish audio, so here is the text:</div>“{q!.audio}”
          </div>
        ))}
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
