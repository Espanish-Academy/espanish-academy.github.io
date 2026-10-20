import { useEffect } from 'react'
import { store } from '.'
import { preview } from './preview'

/**
 * Tells the server "this student has the app open" every 30 seconds while it is visible.
 * A pause longer than 2 minutes starts a new visit. Only times are sent, never what is on screen.
 */
export function useHeartbeat() {
  useEffect(() => {
    if (preview || store.mode !== 'supabase') return
    let sid = crypto.randomUUID()
    let last = 0
    const ping = () => {
      const now = Date.now()
      if (now - last > 120_000) sid = crypto.randomUUID()
      last = now
      store.pingPresence(sid)
    }
    ping()
    const tick = setInterval(() => { if (document.visibilityState === 'visible') ping() }, 30_000)
    const onVisible = () => { if (document.visibilityState === 'visible') ping() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(tick); document.removeEventListener('visibilitychange', onVisible) }
  }, [])
}
