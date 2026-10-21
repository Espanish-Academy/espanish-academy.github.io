import { useEffect, useState } from 'react'
import { disablePush, enablePush, pushState, type PushState } from '../lib/push'
import { preview } from '../lib/preview'
import { t } from '../lib/i18n'
import { MascotSay } from './Mascot'
import { Button, Card, SectionTitle, toast } from './ui'

const DISMISS = 'espanish-push-dismissed'

function usePushState() {
  const [state, setState] = useState<PushState>('unavailable')
  useEffect(() => { pushState().then(setState).catch(() => {}) }, [])
  return [state, setState] as const
}

async function turnOn(setState: (s: PushState) => void) {
  try {
    await enablePush()
    setState('on')
    toast(t('Notifications are on'))
  } catch {
    setState(await pushState())
    toast(t('Could not turn on notifications'), 'error')
  }
}

const SNOOZE_MS = 2 * 24 * 3600 * 1000
const snoozed = () => { try { return Date.now() - Number(localStorage.getItem(DISMISS) || 0) < SNOOZE_MS } catch { return false } }

/** Explains, for each situation, exactly what to do to get notifications on this phone. */
function HowTo({ state, setState }: { state: PushState; setState: (s: PushState) => void }) {
  if (state === 'off') return <Button full onClick={() => turnOn(setState)}>🔔 {t('Turn on notifications')}</Button>
  if (state === 'needs-install') {
    return (
      <ol className="px-2 space-y-1.5 text-[16px] font-bold list-decimal ps-7">
        <li>{t('Tap the Share button')} <b>⬆︎</b> {t('at the bottom of Safari')}</li>
        <li>{t('Choose “Add to Home Screen”, then “Add”')}</li>
        <li>{t('Open Espanish from its new icon and tap “Turn on notifications”')}</li>
      </ol>
    )
  }
  if (state === 'inapp') {
    return (
      <div className="px-2">
        <p className="font-bold mb-3">{t('You opened Espanish inside another app (WhatsApp, Instagram…). Open it in Safari or Chrome instead.')}</p>
        <Button full variant="white" onClick={() => { navigator.clipboard?.writeText(location.origin + import.meta.env.BASE_URL).then(() => toast(t('Link copied — paste it in Safari or Chrome'))) }}>📋 {t('Copy link')}</Button>
      </div>
    )
  }
  return null
}

/** A friendly nudge on the home screen. Comes back after 2 days if dismissed, until notifications are on. */
export function PushPrompt() {
  const [state, setState] = usePushState()
  const [hidden, setHidden] = useState(snoozed)
  if (preview || hidden || state === 'unavailable' || state === 'on' || state === 'blocked') return null
  return (
    <div className="mt-6 rounded-3xl bg-sun-100/60 border-2 border-sun-100 p-3 pb-4">
      <MascotSay mood="alert" size={84}>
        {state === 'off' ? t('Want notifications for messages, homework and classes?') : t('To get notifications, one small step first:')}
      </MascotSay>
      <HowTo state={state} setState={setState} />
      <div className="px-1 mt-3">
        <Button variant="soft" full onClick={() => { setHidden(true); try { localStorage.setItem(DISMISS, String(Date.now())) } catch { /* ignore */ } }}>{t('Not now')}</Button>
      </div>
    </div>
  )
}

/** The on/off switch in the profile page. */
export function PushSettings() {
  const [state, setState] = usePushState()
  const [busy, setBusy] = useState(false)
  if (preview || state === 'unavailable') return null
  return (
    <>
    <SectionTitle>{t('Notifications')}</SectionTitle>
    <Card>
      {state === 'on' && (
        <div className="flex items-center gap-3">
          <span className="flex-1 text-sage-700 font-bold">✓ {t('Notifications are on')}</span>
          <Button size="sm" variant="soft" busy={busy} onClick={async () => { setBusy(true); await disablePush(); setState(await pushState()); setBusy(false) }}>{t('Turn off')}</Button>
        </div>
      )}
      {state === 'off' && <Button full busy={busy} onClick={async () => { setBusy(true); await turnOn(setState); setBusy(false) }}>🔔 {t('Turn on notifications')}</Button>}
      {state === 'blocked' && <p className="text-muted">{t('Notifications are blocked. Allow them in your browser settings.')}</p>}
      {(state === 'needs-install' || state === 'inapp') && <HowTo state={state} setState={setState} />}
    </Card>
    </>
  )
}
