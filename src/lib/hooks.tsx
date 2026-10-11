import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { store } from '.'
import { getLocale, onLocale, setLocale } from './i18n'
import { preview } from './preview'
import type { Profile } from './types'

/** Re-renders the caller when the UI language changes. */
export const useLocale = () => useSyncExternalStore(onLocale, getLocale)

/** Loads data from the store and reloads it whenever the store says something changed. */
export function useData<T>(load: () => Promise<T>, deps: unknown[] = []): { data: T | undefined; loading: boolean; reload: () => void } {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState(true)
  const loadRef = useRef(load)
  loadRef.current = load
  const run = useCallback(() => {
    let alive = true
    loadRef.current().then(d => { if (alive) { setData(d); setLoading(false) } }).catch(err => { console.error(err); if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => run(), deps)
  useEffect(() => store.subscribe(() => { run() }), [run])
  return { data, loading, reload: run }
}

interface Session {
  user: Profile | null
  ready: boolean
}

const SessionCtx = createContext<Session>({ user: null, ready: false })

export function SessionProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<Session>({ user: null, ready: false })
  useEffect(() => {
    const load = async () => {
      try {
        let user = await store.currentUser()
        if (preview) {
          // "View as student": only a signed-in teacher may do this; act as that student, in the chosen language.
          const stu = user?.role === 'teacher' ? await store.getProfile(preview.studentId) : null
          user = stu ? { ...stu, lang: preview.lang } : null
        }
        // The public level check is always English, even if a teacher happens to be signed in on this device.
        const publicPage = location.pathname.replace(/\/$/, '').endsWith('/nivel')
        if (user && !publicPage) setLocale(user.role === 'teacher' ? 'es' : (user.lang ?? 'en'), !preview)
        setS({ user, ready: true })
      } catch {
        setS({ user: null, ready: true })
      }
    }
    load()
    return store.subscribe(load)
  }, [])
  return <SessionCtx.Provider value={s}>{children}</SessionCtx.Provider>
}

export const useSession = () => useContext(SessionCtx)

export function useMe(): Profile {
  const { user } = useSession()
  if (!user) throw new Error('Not signed in')
  return user
}
