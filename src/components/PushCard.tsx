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

/** A friendly nudge on the home screen. Disappears once notifications are on (or dismissed). */
export function PushPrompt() {
  const [state, setState] = usePushState()
  const [hidden, setHidden] = useState(() => { try { return !!localStorage.getItem(DISMISS) } catch { return false } })
  if (preview || hidden || (state !== 'off' && state !== 'needs-install')) return null
  return (
    <div className="mt-6 rounded-3xl bg-sun-100/60 border-2 border-sun-100 p-3 pb-4">
      <MascotSay mood="alert" size={84}>
        {state === 'off' ? t('Want notifications for messages, homework and classes?') : t('To get notifications on iPhone, add Espanish to your Home Screen first.')}
      </MascotSay>
      <div className="flex gap-2 px-1">
        {state === 'off' && <Button className="flex-1" onClick={() => turnOn(setState)}>🔔 {t('Turn on notifications')}</Button>}
        <Button variant="soft" className={state === 'off' ? '' : 'flex-1'} onClick={() => { setHidden(true); try { localStorage.setItem(DISMISS, '1') } catch { /* ignore */ } }}>{t('Not now')}</Button>
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
      {state === 'needs-install' && <p className="text-muted">{t('To get notifications on iPhone, add Espanish to your Home Screen first.')}</p>}
    </Card>
    </>
  )
}
