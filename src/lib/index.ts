import type { Store } from './store'
import { LocalStore } from './localStore'
import { SupabaseStore } from './supabaseStore'
import { preview } from './preview'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

const base: Store = url && key ? new SupabaseStore(url, key) : new LocalStore()

/** In preview mode every write is refused, so the teacher can click around safely. */
function readOnly(s: Store): Store {
  const writes = /^(save|send|delete|upload|update|ping|signOut|signIn|signUp|demoLogin|resetDemo)/
  return new Proxy(s, {
    get(target, prop) {
      const v = Reflect.get(target, prop, target)
      if (typeof v !== 'function') return v
      if (prop === 'markRead' || prop === 'pingPresence') return async () => {}
      if (typeof prop === 'string' && writes.test(prop)) return async () => { throw new Error('Preview mode — nothing is saved') }
      return v.bind(target)
    },
  })
}

export const store: Store = preview ? readOnly(base) : base
