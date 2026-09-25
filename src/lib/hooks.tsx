import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { store } from '.'
import type { Profile } from './types'

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
    const load = () => store.currentUser().then(user => setS({ user, ready: true })).catch(() => setS({ user: null, ready: true }))
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
