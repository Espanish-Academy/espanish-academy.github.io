import { useEffect } from 'react'
import { Card, Chip, cx } from '../../components/ui'
import { store } from '../../lib'
import { useData } from '../../lib/hooks'
import { t } from '../../lib/i18n'
import type { PresenceInfo } from '../../lib/types'
import { dayDiff, fmtDate, fmtTime, friendlyDay } from '../../lib/util'

/** Presence of every student, refreshed every 30 seconds while the teacher has the app open. */
export function usePresence() {
  const { data, reload } = useData(() => store.presenceOverview().catch(() => [] as PresenceInfo[]), [])
  useEffect(() => {
    const iv = setInterval(() => { reload() }, 30_000)
    return () => clearInterval(iv)
  }, [reload])
  return data ?? []
}

export function minutesText(min: number) {
  if (min < 1) return t('less than 1 min')
  if (min < 60) return t('{n} min', { n: min })
  return t('{h} h {m} min', { h: Math.floor(min / 60), m: String(min % 60).padStart(2, '0') })
}

export function lastSeenText(info?: PresenceInfo) {
  if (!info?.lastSeenAt) return t('Has not opened the app yet')
  if (info.online) return t('Online now')
  const d = dayDiff(info.lastSeenAt)
  if (d === 0) return t('Last seen today at {time}', { time: fmtTime(info.lastSeenAt) })
  if (d === -1) return t('Last seen yesterday at {time}', { time: fmtTime(info.lastSeenAt) })
  return t('Last seen {date}', { date: fmtDate(info.lastSeenAt, { day: 'numeric', month: 'short' }) })
}

export function PresenceBadge({ info, className }: { info?: PresenceInfo; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 text-sm font-extrabold', info?.online ? 'text-sage-700' : 'text-muted', className)}>
      <span className={cx('size-2.5 rounded-full', info?.online ? 'bg-sage-500 animate-soft-pulse' : 'bg-sand-dark')} />
      {lastSeenText(info)}
    </span>
  )
}

/** When a student opened the app and for how long. Only times: never what they looked at. */
export function ActivityCard({ studentId, info }: { studentId: string; info?: PresenceInfo }) {
  const { data, reload } = useData(() => store.presenceSessions(studentId, 10).catch(() => []), [studentId])
  useEffect(() => {
    const iv = setInterval(() => { reload() }, 30_000)
    return () => clearInterval(iv)
  }, [reload])
  const sessions = data ?? []
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <PresenceBadge info={info} className="!text-base" />
        <span className="flex-1" />
        <Chip tone="sand">{t('Today')}: {minutesText(info?.minutesToday ?? 0)}</Chip>
        <Chip tone="sand">{t('Last 7 days')}: {minutesText(info?.minutesWeek ?? 0)}</Chip>
      </div>
      {sessions.length === 0 ? <p className="text-muted">{t('No visits yet.')}</p> : (
        <div className="divide-y-2 divide-sand">
          {sessions.map(s => (
            <div key={s.startedAt} className="flex items-center gap-3 py-2.5">
              <span className={cx('size-2.5 rounded-full shrink-0', s.ended ? 'bg-sand-dark' : 'bg-sage-500 animate-soft-pulse')} />
              <div className="flex-1 min-w-0">
                <div className="font-extrabold">{friendlyDay(s.startedAt)} · {fmtTime(s.startedAt)}{s.ended ? ` → ${fmtTime(s.lastSeenAt)}` : ''}</div>
              </div>
              <span className="text-muted font-bold">{s.ended ? minutesText(s.minutes) : t('Online now')}</span>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-muted mt-3">🔒 {t('Only the times are recorded, never what the student looks at. The student is told about it in “My profile”.')}</p>
    </Card>
  )
}
