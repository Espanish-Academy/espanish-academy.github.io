import { dateLocale, t } from './i18n'
export const uid = () => crypto.randomUUID()
export const nowIso = () => new Date().toISOString()

const DAY = 86_400_000

export function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function dayDiff(iso: string, from = new Date()) {
  return Math.round((startOfDay(new Date(iso)).getTime() - startOfDay(from).getTime()) / DAY)
}

export function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(dateLocale(), { hour: '2-digit', minute: '2-digit' })
}

export function fmtDate(iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }) {
  return new Date(iso).toLocaleDateString(dateLocale(), opts)
}

/** "Today", "Tomorrow", "Yesterday", "Thursday", or "12 March". */
export function friendlyDay(iso: string) {
  const d = dayDiff(iso)
  if (d === 0) return t('Today')
  if (d === 1) return t('Tomorrow')
  if (d === -1) return t('Yesterday')
  if (d > 1 && d < 7) return fmtDate(iso, { weekday: 'long' })
  return fmtDate(iso, { day: 'numeric', month: 'long' })
}

export function friendlyWhen(iso: string) {
  return `${friendlyDay(iso)} · ${fmtTime(iso)}`
}

export function greeting() {
  const h = new Date().getHours()
  if (h < 12) return '¡Buenos días'
  if (h < 20) return '¡Buenas tardes'
  return '¡Buenas noches'
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name
}

export function speak(text: string, lang = 'es-ES') {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang
  u.rate = 0.85
  const voice = window.speechSynthesis.getVoices().find(v => v.lang.startsWith('es'))
  if (voice) u.voice = voice
  window.speechSynthesis.speak(u)
}

const URL_RE = /(https?:\/\/[^\s]+)/g
export function splitLinks(text: string): { text: string; url?: string }[] {
  return text.split(URL_RE).filter(Boolean).map(part => (/^https?:\/\//.test(part) ? { text: part, url: part } : { text: part }))
}
export function firstLink(text: string) {
  return text.match(/https?:\/\/[^\s]+/)?.[0]
}
export function youtubeId(url: string) {
  return url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})/)?.[1]
}
export function hostOf(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

/** Downloadable calendar event so the student can add a class to their phone calendar. */
export function icsFor(title: string, startIso: string, durationMin: number) {
  const s = new Date(startIso)
  const e = new Date(s.getTime() + durationMin * 60_000)
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const body = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Espanish//EN', 'BEGIN:VEVENT',
    `UID:${s.getTime()}@espanish`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(s)}`, `DTEND:${f(e)}`,
    `SUMMARY:${title}`, 'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', `DESCRIPTION:${title}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }))
  a.download = 'espanish-class.ics'
  a.click()
}

/** Shrinks photos so chat images stay light. */
export async function compressImage(file: File, max = 1400): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * scale)
  c.height = Math.round(bmp.height * scale)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  return new Promise(res => c.toBlob(b => res(b!), 'image/jpeg', 0.82))
}
