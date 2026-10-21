/**
 * Tiny gettext-style i18n: the English text is the key.
 * The teacher always sees Spanish; each student picks English or Spanish.
 * Lesson content (what the teacher writes) and chat messages are never translated automatically.
 */
import type { Lang } from './types'
import { es } from './es'

const dictionaries: Record<Lang, Record<string, string>> = { en: {}, es }
const subs = new Set<() => void>()

function initial(): Lang {
  if (import.meta.env.DEV) { const q = new URLSearchParams(location.search).get('lang'); if (q === 'es' || q === 'en') return q }
  try {
    const saved = localStorage.getItem('espanish-locale')
    if (saved === 'es' || saved === 'en') return saved
  } catch { /* ignore */ }
  return navigator.language?.startsWith('es') ? 'es' : 'en'
}

let locale: Lang = initial()

export const getLocale = () => locale
export const dateLocale = () => (locale === 'es' ? 'es-ES' : 'en-US')

export function setLocale(l: Lang, persist = true) {
  if (l === locale) return
  locale = l
  if (persist) try { localStorage.setItem('espanish-locale', l) } catch { /* ignore */ }
  applyLocale()
  subs.forEach(cb => cb())
}

export function onLocale(cb: () => void) {
  subs.add(cb)
  return () => { subs.delete(cb) }
}

export function t(text: string, vars?: Record<string, string | number>): string {
  let out = dictionaries[locale][text] ?? text
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v))
  return out
}

export function applyLocale() {
  document.documentElement.lang = locale
  document.documentElement.dir = 'ltr'
}
