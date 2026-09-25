import type { Store } from './store'
import { LocalStore } from './localStore'
import { SupabaseStore } from './supabaseStore'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const store: Store = url && key ? new SupabaseStore(url, key) : new LocalStore()
