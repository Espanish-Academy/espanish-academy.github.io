import { useState } from 'react'
import { store } from '../lib'
import { getLocale, setLocale, t } from '../lib/i18n'
import { Mascot } from '../components/Mascot'
import { Button, Field, Input, Segmented, toast } from '../components/ui'

/** Supabase auth errors in plain words (and in the person's language). */
function friendly(msg: string) {
  if (/invalid login credentials/i.test(msg)) return t('Wrong email or password. Forgot it? Tap “Forgot your password?”')
  if (/rate limit|only request this after|too many/i.test(msg)) return t('Too many tries — wait a minute and try again.')
  if (/expired|invalid.*(otp|token)|token.*(invalid|expired)/i.test(msg)) return t('That code or link is no longer valid. Ask for a new one and use the newest email.')
  if (/should be different/i.test(msg)) return t('Choose a password different from the old one.')
  return t(msg)
}

export default function Welcome() {
  const [mode, setMode] = useState<'in' | 'up'>(import.meta.env.DEV && new URLSearchParams(location.search).get('tab') === 'up' ? 'up' : 'in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [forgot, setForgot] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key)
    try { await fn() } catch (e) { toast(friendly((e as Error).message), 'error') } finally { setBusy(null) }
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
        ) : forgot ? (
          <div className="w-full mt-10 animate-rise">
            {sentTo ? (
              <div className="text-center">
                <div className="text-5xl mb-3">✉️</div>
                <h2 className="text-2xl font-black text-ink">{t('Check your email')}</h2>
                <p className="text-muted mt-2">{t('We sent a link to {email}. Open it on this device to choose a new password.', { email: sentTo })}</p>
                <p className="text-muted text-sm mt-3">{t('Not there after a few minutes? Look in spam or promotions.')}</p>
                <p className="text-sm mt-3 font-bold text-berry-600">{t('It only arrives if this is the exact email you signed up with. Nothing came? Try your other email address.')}</p>
              </div>
            ) : (
              <form onSubmit={e => {
                e.preventDefault()
                run('reset', async () => { await store.requestPasswordReset!(email.trim()); setSentTo(email.trim()) })
              }}>
                <h2 className="text-2xl font-black text-ink text-center">{t('Forgot your password?')}</h2>
                <p className="text-muted text-center mt-1 mb-6">{t('Write your email and we’ll send you a link to choose a new one.')}</p>
                <Field label={t('Email')}><Input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" autoFocus /></Field>
                <Button type="submit" size="lg" full pulse busy={busy === 'reset'} className="mt-2">{t('Send me the link')}</Button>
              </form>
            )}
            <button type="button" className="block mx-auto mt-6 text-sm font-bold text-sage-700 underline" onClick={() => { setForgot(false); setSentTo(null) }}>
              {t('Back to sign in')}
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
            {mode === 'in' && store.requestPasswordReset && (
              <button type="button" className="block mx-auto mt-5 text-sm font-bold text-berry-600 underline" onClick={() => setForgot(true)}>
                {t('Forgot your password?')}
              </button>
            )}
          </form>
        )}
      </div>
      <p className="text-center text-muted text-sm pb-6">¡Hola! 🌿</p>
    </div>
  )
}

/** Shown after opening the reset link from the email: the person is signed in and picks a new password. */
/** Change password from inside the app (profile page). */
export function ChangePassword() {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <form onSubmit={async e => {
      e.preventDefault()
      setBusy(true)
      try { await store.setNewPassword!(password); setPassword(''); toast(t('Password changed ✓')) }
      catch (err) { toast(friendly((err as Error).message), 'error') }
      finally { setBusy(false) }
    }}>
      <Field label={t('New password')} hint={t('At least 6 characters.')}>
        <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
      </Field>
      <Button type="submit" full variant="soft" busy={busy} disabled={password.length < 6}>{t('Change my password')}</Button>
    </form>
  )
}

export function NewPassword() {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <div className="min-h-dvh bg-cream flex flex-col items-center justify-center px-6 pb-12 max-w-md w-full mx-auto">
      <Mascot mood="hello" size={180} />
      <h1 className="text-3xl font-black text-ink mt-3 text-center">{t('Choose a new password')}</h1>
      <p className="text-muted mt-1 mb-8 text-center">{t('At least 6 characters. You’ll use it to sign in from now on.')}</p>
      <form className="w-full animate-rise" onSubmit={async e => {
        e.preventDefault()
        setBusy(true)
        try { await store.setNewPassword!(password); toast(t('Password changed ✓')) }
        catch (err) { toast(friendly((err as Error).message), 'error') }
        finally { setBusy(false) }
      }}>
        <Field label={t('New password')}>
          <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" autoFocus />
        </Field>
        <Button type="submit" size="lg" full pulse busy={busy} className="mt-2">{t('Save my new password')}</Button>
      </form>
    </div>
  )
}
