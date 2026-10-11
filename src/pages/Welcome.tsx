import { useState } from 'react'
import { store } from '../lib'
import { getLocale, setLocale, t } from '../lib/i18n'
import { Mascot } from '../components/Mascot'
import { Button, Field, Input, Segmented, toast } from '../components/ui'

export default function Welcome() {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key)
    try { await fn() } catch (e) { toast((e as Error).message, 'error') } finally { setBusy(null) }
  }

  return (
    <div className="min-h-dvh bg-cream flex flex-col">
      <div className="flex justify-end p-4">
        <div className="w-44"><Segmented value={getLocale()} onChange={setLocale} options={[{ value: 'es', label: 'Español' }, { value: 'en', label: 'English' }]} /></div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12 max-w-md w-full mx-auto">
        <Mascot mood="hello" size={230} />
        <h1 className="text-4xl font-black text-sage-700 mt-3">Espanish</h1>
        <p className="text-muted text-lg mt-1 text-center">{t('Your Spanish, your way.')}</p>

        {store.mode === 'demo' ? (
          <div className="w-full mt-10 space-y-3 animate-rise">
            <p className="text-center font-extrabold text-ink mb-2">{t('Try the app as…')}</p>
            <Button size="lg" full pulse busy={busy === 'student'} onClick={() => run('student', () => store.demoLogin!('student'))}>
              👩‍🦳 {t('Miriam, a student')}
            </Button>
            <Button size="lg" full variant="berry" busy={busy === 'teacher'} onClick={() => run('teacher', () => store.demoLogin!('teacher'))}>
              👩‍🏫 {t('The teacher')}
            </Button>
            <Button size="lg" full variant="soft" busy={busy === 'new'} onClick={() => run('new', () => store.demoLogin!('new'))}>
              ✨ {t('A new student (start the questionnaire)')}
            </Button>
            <p className="text-center text-sm text-muted pt-4">{t('Demo mode — everything is saved only in this browser.')}</p>
            <button className="block mx-auto text-sm font-bold text-berry-600 underline" onClick={() => run('reset', () => store.resetDemo!())}>
              {t('Reset demo data')}
            </button>
          </div>
        ) : (
          <form className="w-full mt-10 animate-rise" onSubmit={e => {
            e.preventDefault()
            run('auth', () => (mode === 'in' ? store.signIn(email, password) : store.signUp(name, email, password, getLocale())))
          }}>
            <div className="mb-5">
              <Segmented value={mode} onChange={setMode} options={[{ value: 'in', label: t('Sign in') }, { value: 'up', label: t('New here') }]} />
            </div>
            {mode === 'up' && (
              <Field label={t('Your name')}><Input value={name} onChange={e => setName(e.target.value)} required autoComplete="name" /></Field>
            )}
            <Field label={t('Email')}><Input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" /></Field>
            <Field label={t('Password')}>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} />
            </Field>
            <Button type="submit" size="lg" full pulse busy={busy === 'auth'} className="mt-2">
              {mode === 'in' ? t('Sign in') : t('Create my account')}
            </Button>
          </form>
        )}
      </div>
      <p className="text-center text-muted text-sm pb-6">¡Hola! 🌿</p>
    </div>
  )
}
