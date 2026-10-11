import confetti from 'canvas-confetti'
import { ArrowLeft, Check, Volume2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mascot } from '../components/Mascot'
import { Button, Input, ProgressBar, Segmented, TextArea, cx } from '../components/ui'
import { store } from '../lib'
import { useMe } from '../lib/hooks'
import { getLocale, setLocale, t } from '../lib/i18n'
import { estimateLevel } from '../lib/insights'
import { QUESTIONS, SECTIONS, isAnswered, withConsentLog, type Question } from '../lib/questionnaire'
import type { Answers } from '../lib/types'
import { firstName, speak } from '../lib/util'

/** The opening questionnaire: one friendly question per screen. */
export default function Onboarding({ edit = false }: { edit?: boolean }) {
  const me = useMe()
  const nav = useNavigate()
  const [answers, setAnswers] = useState<Answers>({})
  const [name, setName] = useState(me.name === 'New student' ? '' : me.name)
  // step: -1 intro, 0 name, 1..N questions, N+1 done
  const [step, setStep] = useState(edit ? 1 : -1)
  const total = QUESTIONS.length

  useEffect(() => {
    store.getQuestionnaire(me.id).then(q => {
      if (!q) return
      setAnswers(q.answers)
      if (!edit) {
        const firstOpen = QUESTIONS.findIndex(x => q.answers[x.id] === undefined)
        if (firstOpen > 0) setStep(firstOpen + 1)
      }
    })
  }, [me.id, edit])

  const save = (a: Answers, done = false) => {
    const answers = done ? withConsentLog(a) : a
    if (done) setAnswers(answers)
    return store.saveQuestionnaire({ studentId: me.id, answers, completedAt: done ? new Date().toISOString() : null }).catch(() => {})
  }

  const q = step >= 1 && step <= total ? QUESTIONS[step - 1] : null
  const set = (id: string, v: Answers[string]) => setAnswers(a => ({ ...a, [id]: v }))

  const next = async () => {
    if (step === 0 && name.trim() && name !== me.name) await store.updateProfile(me.id, { name: name.trim() })
    if (q) save(answers)
    if (step === total) {
      // Mark complete only on "Let's begin", so the celebration screen isn't unmounted by the router.
      if (edit) await save(answers, true)
      confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 }, colors: ['#5C9468', '#B05C70', '#F0C067', '#C3DCC8'] })
    }
    setStep(s => s + 1)
    window.scrollTo({ top: 0 })
  }

  if (step === -1) {
    return (
      <Shell>
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-rise">
          <Mascot mood="hello" size={210} />
          <h1 className="text-3xl font-black mt-4">{t('¡Te damos la bienvenida!')}</h1>
          <p className="text-lg text-muted mt-3 max-w-sm">{t('A few friendly questions so your teacher can prepare classes just for you.')}</p>
          <div className="flex gap-2 mt-6 flex-wrap justify-center">
            {SECTIONS.map(s => <span key={s.id} className="bg-white rounded-full px-3 py-1.5 font-bold text-sm border-2 border-sand">{s.emoji} {t(s.title)}</span>)}
          </div>
          <p className="text-muted mt-4">⏱️ {t('About 5 minutes')}</p>
          <div className="mt-5 w-56">
            <Segmented value={getLocale()} options={[{ value: 'es', label: 'Español' }, { value: 'en', label: 'English' }]}
              onChange={l => { setLocale(l); store.updateProfile(me.id, { lang: l }).catch(() => {}) }} />
          </div>
        </div>
        <Button size="lg" full pulse onClick={next}>{t('Start')}</Button>
      </Shell>
    )
  }

  if (step > total) {
    const level = estimateLevel(answers)
    return (
      <Shell>
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-pop">
          <Mascot mood="cheer" size={200} />
          <h1 className="text-3xl font-black mt-4">{t('¡Listo, {name}!', { name: firstName(name || me.name) })}</h1>
          <p className="text-lg text-muted mt-3 max-w-sm">{t('Thank you! Your teacher will use this to plan your first classes.')}</p>
          <div className="mt-8 bg-white rounded-3xl border-2 border-sand p-6 w-full max-w-sm">
            <div className="text-5xl">{level.emoji}</div>
            <div className="text-sm font-extrabold text-muted uppercase tracking-wide mt-2">{t('Your starting point')}</div>
            <div className="text-2xl font-black text-sage-700">{t(level.label)}</div>
            <p className="text-muted mt-1 text-[15px]">{t('Every journey starts somewhere. Vamos poco a poco 🌱')}</p>
          </div>
        </div>
        <Button size="lg" full pulse onClick={async () => { await save(answers, true); nav('/', { replace: true }) }}>{t("Let's begin")}</Button>
      </Shell>
    )
  }

  const canGo = step === 0 ? name.trim().length > 0 : q ? isAnswered(q, answers) : true
  const section = q ? SECTIONS.find(s => s.id === q.section) : null

  return (
    <Shell>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => (step === 1 && edit ? nav(-1) : setStep(s => s - 1))} aria-label={t('Back')} className="size-10 rounded-full grid place-items-center text-muted hover:bg-sand rtl:rotate-180">
          {edit && step === 1 ? <X className="size-6" /> : <ArrowLeft className="size-6" />}
        </button>
        <ProgressBar value={step / total} className="flex-1" />
      </div>

      <div key={step} className="flex-1 animate-rise">
        {step === 0 ? (
          <>
            <h1 className="text-[1.7rem] leading-tight font-black">{t('What should we call you?')}</h1>
            {getLocale() !== 'es' && <p className="text-muted italic mt-1">¿Cómo te llamas?</p>}
            <Input className="mt-6 text-xl" value={name} onChange={e => setName(e.target.value)} placeholder={t('Your name')} autoFocus
              onKeyDown={e => e.key === 'Enter' && canGo && next()} />
          </>
        ) : q && (
          <>
            {section && <div className="text-sm font-extrabold text-berry-500 uppercase tracking-wide mb-2">{section.emoji} {t(section.title)}</div>}
            <h1 className="text-[1.7rem] leading-tight font-black">{t(q.title)}</h1>
            {getLocale() !== 'es' && <p className="text-muted italic mt-1">{q.es}</p>}
            {q.hint && <p className="text-sage-600 font-bold mt-2 text-[15px]">{t(q.hint)}</p>}
            <div className="mt-6"><QuestionInput q={q} answers={answers} set={set} /></div>
          </>
        )}
      </div>

      <div className="pt-6 space-y-2">
        <Button size="lg" full pulse={canGo} disabled={!canGo} onClick={next}>
          {step === total ? t('Finish') : t('Continue')}
        </Button>
        {q?.optional && !answers[q.id] && (
          <button onClick={next} className="w-full py-2 font-extrabold text-muted">{t('Skip')}</button>
        )}
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-cream">
      <div className="max-w-lg mx-auto min-h-dvh flex flex-col px-5 pt-6 pb-8">{children}</div>
    </div>
  )
}

function OptionCard({ selected, onClick, emoji, label, multi }: { selected: boolean; onClick: () => void; emoji: string; label: string; multi?: boolean }) {
  return (
    <button type="button" onClick={onClick}
      className={cx('w-full flex items-center gap-4 rounded-3xl border-2 border-b-4 p-4 text-start transition active:translate-y-[2px]',
        selected ? 'bg-sage-50 border-sage-400 text-sage-700' : 'bg-white border-sand hover:border-sage-200')}>
      <span className="text-3xl w-10 text-center">{emoji}</span>
      <span className="flex-1 font-extrabold text-[18px]">{t(label)}</span>
      <span className={cx('size-7 grid place-items-center border-2 transition', multi ? 'rounded-lg' : 'rounded-full',
        selected ? 'bg-sage-500 border-sage-500 text-white' : 'border-sand-dark')}>
        {selected && <Check className="size-4" strokeWidth={3.5} />}
      </span>
    </button>
  )
}

export function QuestionInput({ q, answers, set }: { q: Question; answers: Answers; set: (id: string, v: Answers[string]) => void }) {
  const v = answers[q.id]
  const opts = q.options ?? []

  if (q.kind === 'multi') {
    const arr = (v as string[] | undefined) ?? []
    return (
      <div className={cx('grid gap-3', opts.length > 6 && 'sm:grid-cols-2')}>
        {opts.map(o => (
          <OptionCard key={o.value} multi emoji={o.emoji} label={o.label} selected={arr.includes(o.value)}
            onClick={() => set(q.id, arr.includes(o.value) ? arr.filter(x => x !== o.value) : [...arr, o.value])} />
        ))}
      </div>
    )
  }

  if (q.kind === 'text') {
    return <TextArea rows={4} className="text-lg" value={(v as string) ?? ''} placeholder={q.placeholder && t(q.placeholder)} onChange={e => set(q.id, e.target.value)} />
  }

  if (q.kind === 'scale') {
    return (
      <div className="grid grid-cols-4 gap-2">
        {opts.map(o => (
          <button key={o.value} type="button" onClick={() => set(q.id, o.value)}
            className={cx('rounded-3xl border-2 border-b-4 py-4 px-1 flex flex-col items-center gap-2 transition',
              v === o.value ? 'bg-sage-50 border-sage-400' : 'bg-white border-sand hover:border-sage-200')}>
            <span className="text-4xl">{o.emoji}</span>
            <span className="text-sm font-extrabold text-center leading-tight">{t(o.label)}</span>
          </button>
        ))}
      </div>
    )
  }

  const single = (
    <div className="grid gap-3">
      {opts.map(o => <OptionCard key={o.value} emoji={o.emoji} label={o.label} selected={v === o.value} onClick={() => set(q.id, o.value)} />)}
    </div>
  )

  if (q.kind === 'listen') {
    return (
      <>
        <button type="button" onClick={() => speak(q.sample!)}
          className="w-full mb-6 flex items-center gap-4 rounded-3xl bg-berry-500 border-b-[6px] border-berry-700 text-white p-5 active:translate-y-[2px] transition">
          <span className="size-16 rounded-full bg-white/20 grid place-items-center"><Volume2 className="size-8" /></span>
          <span className="text-start">
            <span className="block text-xl font-black">{t('Tap to listen')}</span>
            <span className="block text-white/85">{t('You can play it as many times as you like')}</span>
          </span>
        </button>
        {single}
      </>
    )
  }

  if (q.kind === 'read') {
    return (
      <>
        <div className="mb-6 rounded-3xl bg-white border-2 border-sand p-5 text-xl leading-relaxed font-bold text-ink" lang="es">
          “{q.sample}”
        </div>
        {single}
      </>
    )
  }

  if (q.kind === 'consent') {
    const on = v === 'yes'
    return (
      <button type="button" onClick={() => set(q.id, on ? 'no' : 'yes')}
        className={cx('w-full flex items-center gap-4 rounded-3xl border-2 border-b-4 p-5 text-start transition active:translate-y-[2px]',
          on ? 'bg-sage-50 border-sage-400 text-sage-700' : 'bg-white border-sand hover:border-sage-200')}>
        <span className={cx('size-10 shrink-0 rounded-xl grid place-items-center border-2 transition', on ? 'bg-sage-500 border-sage-500 text-white' : 'border-sand-dark')}>
          {on && <Check className="size-6" strokeWidth={3.5} />}
        </span>
        <span className="flex-1 font-extrabold text-[18px]">🎥 {t(q.placeholder ?? '')}</span>
      </button>
    )
  }

  if (q.kind === 'country') {
    return (
      <>
        <div className="grid grid-cols-2 gap-3">
          {opts.map(o => (
            <button key={o.value} type="button" onClick={() => set(q.id, o.value)}
              className={cx('rounded-3xl border-2 border-b-4 p-4 flex flex-col items-center gap-1 transition',
                v === o.value ? 'bg-sage-50 border-sage-400' : 'bg-white border-sand hover:border-sage-200')}>
              <span className="text-4xl">{o.emoji}</span>
              <span className="font-extrabold">{t(o.label)}</span>
            </button>
          ))}
        </div>
        {v && (
          <div className="mt-5 animate-rise">
            <TextArea rows={3} value={(answers.dreamWhy as string) ?? ''} placeholder={t(q.placeholder ?? '')} onChange={e => set('dreamWhy', e.target.value)} />
          </div>
        )}
      </>
    )
  }

  return single
}
