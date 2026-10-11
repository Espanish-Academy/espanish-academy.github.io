export type TLang = 'es' | 'en' | 'he'
export const TLANGS: { code: TLang; label: string }[] = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'he', label: 'עברית' },
]

const cache = new Map<string, string>()

/** Splits on sentence ends so each request stays under the free API's 500-character limit. */
function chunks(text: string, max = 450) {
  const parts = text.match(/[^.!?\n]+[.!?]*\s*|\n+/g) ?? [text]
  const out: string[] = []
  let cur = ''
  for (const p of parts) {
    if ((cur + p).length > max && cur) { out.push(cur); cur = '' }
    cur += p
  }
  if (cur) out.push(cur)
  return out
}

/** Free machine translation (MyMemory). Only called when someone taps "Translate". */
export async function translate(text: string, to: TLang): Promise<string> {
  const k = `${to}|${text}`
  const hit = cache.get(k)
  if (hit) return hit
  const from = /[֐-׿]/.test(text) ? 'he' : 'autodetect'
  const out: string[] = []
  for (const c of chunks(text)) {
    if (!c.trim()) { out.push(c); continue }
    const q = c.replace(/[¿¡]/g, '')
    const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${from}|${to}`)
    const j = await r.json()
    if (j.responseStatus !== 200 && j.responseStatus !== '200') throw new Error(String(j.responseDetails || 'translation failed'))
    out.push(String(j.responseData.translatedText).replace(/&#39;/g, "'").replace(/&quot;/g, '"') + (c.match(/\s+$/)?.[0] ?? ''))
  }
  const result = out.join('').trim()
  cache.set(k, result)
  return result
}
