// Sends web-push notifications. Called by database triggers (see migration 20261011000100_push.sql),
// never by the browser: it is protected by a shared secret.
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT') ?? 'https://orelpartuk1-crypto.github.io/espanish/', Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!)

type Lang = 'es' | 'en'
interface Job { userId: string; title: Record<Lang, string>; body: string; url: string; tag: string }
const both = (es: string, en: string) => ({ es, en })
const clip = (s: string, n = 90) => (s.length > n ? s.slice(0, n - 1) + '…' : s)

async function profiles(ids: string[]) {
  const { data } = await sb.from('profiles').select('id, name, role, lang').in('id', ids)
  return new Map((data ?? []).map(p => [p.id as string, p]))
}
async function teachers() {
  const { data } = await sb.from('profiles').select('id').eq('role', 'teacher')
  return (data ?? []).map(p => p.id as string)
}

async function jobsFor(kind: string, id: string, when?: string): Promise<Job[]> {
  if (kind === 'message') {
    const { data: m } = await sb.from('messages').select('*').eq('id', id).single()
    if (!m) return []
    const who = (await profiles([m.sender_id])).get(m.sender_id)
    const text = m.text ? clip(m.text) : '📷'
    if (who?.role === 'teacher') {
      return [{ userId: m.student_id, title: both(who.name, who.name), body: text, url: 'chat', tag: `msg-${m.student_id}` }]
    }
    return (await teachers()).map(t => ({ userId: t, title: both(who?.name ?? 'Alumno', who?.name ?? 'Student'), body: text, url: `students/${m.student_id}?tab=chat`, tag: `msg-${m.student_id}` }))
  }
  if (kind === 'task' || kind === 'due') {
    const { data: t } = await sb.from('tasks').select('*').eq('id', id).single()
    if (!t) return []
    const title = kind === 'task' ? both('📝 Deberes nuevos', '📝 New homework') : both('⏰ Deberes para mañana', '⏰ Homework due tomorrow')
    return [{ userId: t.student_id, title, body: t.title, url: `tasks/${t.id}`, tag: `task-${t.id}` }]
  }
  if (kind === 'submission' || kind === 'feedback') {
    const { data: s } = await sb.from('submissions').select('*').eq('id', id).single()
    if (!s) return []
    if (kind === 'feedback') {
      return [{ userId: s.student_id, title: both('🌟 Comentario de tu profesora', '🌟 Your teacher left feedback'), body: clip(s.feedback ?? ''), url: `tasks/${s.task_id}`, tag: `fb-${s.task_id}` }]
    }
    const [{ data: t }, p] = await Promise.all([sb.from('tasks').select('title').eq('id', s.task_id).single(), profiles([s.student_id])])
    const name = p.get(s.student_id)?.name ?? 'Alumno'
    return (await teachers()).map(tid => ({ userId: tid, title: both(`📬 ${name} ha entregado deberes`, `📬 ${name} handed in homework`), body: t?.title ?? '', url: `students/${s.student_id}/task/${s.task_id}`, tag: `sub-${s.task_id}` }))
  }
  if (kind === 'placement') {
    const { data: r } = await sb.from('placement_results').select('id, name, level').eq('id', id).single()
    if (!r) return []
    return (await teachers()).map(tid => ({ userId: tid, title: both(`📊 ${r.name} ha hecho la prueba de nivel`, `📊 ${r.name} took the level check`), body: `Nivel: ${r.level}`, url: `placements/${r.id}`, tag: `placement-${r.id}` }))
  }
  if (kind === 'class_reminder') {
    const { data: l } = await sb.from('lessons').select('*').eq('id', id).single()
    if (!l || l.status !== 'planned') return []
    const title = when === 'hour' ? both('📅 Tu clase empieza en 1 hora', '📅 Your class starts in 1 hour') : both('📅 Mañana tienes clase', '📅 You have a class tomorrow')
    return [{ userId: l.student_id, title, body: l.title || '', url: `journey/${l.id}`, tag: `lesson-${l.id}` }]
  }
  return []
}

Deno.serve(async req => {
  if (req.headers.get('x-notify-secret') !== Deno.env.get('NOTIFY_SECRET')) return new Response('forbidden', { status: 403 })
  const { kind, id, when } = await req.json()
  const jobs = await jobsFor(kind, id, when)
  if (!jobs.length) return Response.json({ sent: 0 })

  const langs = await profiles(jobs.map(j => j.userId))
  let sent = 0
  const failed: (number | string)[] = []
  for (const job of jobs) {
    const who = langs.get(job.userId)
    const lang: Lang = who?.role === 'teacher' ? 'es' : who?.lang === 'es' ? 'es' : 'en'
    const { data: subs } = await sb.from('push_subscriptions').select('*').eq('user_id', job.userId)
    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({ title: job.title[lang], body: job.body, url: job.url, tag: job.tag }),
          { TTL: 60 * 60 * 24 },
        )
        sent++
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) await sb.from('push_subscriptions').delete().eq('id', s.id)
        else { console.error('push failed', status, String(e)); failed.push(status ?? 'error') }
        if (status === 404 || status === 410) failed.push(status)
      }
    }
  }
  return Response.json({ sent, failed })
})
