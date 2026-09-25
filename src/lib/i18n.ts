/**
 * Tiny gettext-style i18n: English text is the key.
 * To add Hebrew later, fill `he` with translations and set the locale —
 * the layout already uses logical (start/end) spacing so RTL flips cleanly.
 */
type Dict = Record<string, string>

const he: Dict = {}

const dictionaries: Record<string, Dict> = { en: {}, he }
const rtl = new Set(['he'])

let locale = 'en'
try { locale = localStorage.getItem('espanish-locale') || 'en' } catch { /* ignore */ }

export function t(text: string, vars?: Record<string, string | number>): string {
  let out = dictionaries[locale]?.[text] ?? text
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v))
  return out
}

export function applyLocale() {
  document.documentElement.lang = locale
  document.documentElement.dir = rtl.has(locale) ? 'rtl' : 'ltr'
}
