import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { dateLocale, t } from '../lib/i18n'
import { sameDay } from '../lib/util'
import { cx } from './ui'

export interface CalEvent {
  date: string
  tone: 'sage' | 'berry' | 'sun'
}

export function MonthCalendar({ events, selected, onSelect }: { events: CalEvent[]; selected: Date; onSelect: (d: Date) => void }) {
  const [cursor, setCursor] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1))
  const today = new Date()
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7 // weeks start on Monday
  const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
  const cells = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1))]
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(dateLocale(), { weekday: 'narrow' }))
  const move = (n: number) => setCursor(c => new Date(c.getFullYear(), c.getMonth() + n, 1))

  return (
    <div className="bg-white rounded-3xl border-2 border-sand p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => move(-1)} aria-label={t('Previous month')} className="size-10 rounded-full grid place-items-center hover:bg-sand rtl:rotate-180"><ChevronLeft /></button>
        <div className="font-black text-lg capitalize">{cursor.toLocaleDateString(dateLocale(), { month: 'long', year: 'numeric' })}</div>
        <button onClick={() => move(1)} aria-label={t('Next month')} className="size-10 rounded-full grid place-items-center hover:bg-sand rtl:rotate-180"><ChevronRight /></button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs font-extrabold text-muted mb-1">
        {weekdays.map((w, i) => <div key={i}>{w}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const evs = events.filter(e => sameDay(new Date(e.date), d))
          const isSel = sameDay(d, selected)
          const isToday = sameDay(d, today)
          return (
            <button key={i} onClick={() => onSelect(d)}
              className={cx('aspect-square rounded-2xl flex flex-col items-center justify-center gap-0.5 font-extrabold transition',
                isSel ? 'bg-sage-500 text-white' : isToday ? 'bg-sage-100 text-sage-700' : 'hover:bg-sand/60')}>
              <span>{d.getDate()}</span>
              <span className="flex gap-0.5 h-1.5">
                {evs.slice(0, 3).map((e, j) => (
                  <span key={j} className={cx('size-1.5 rounded-full', isSel ? 'bg-white' : { sage: 'bg-sage-500', berry: 'bg-berry-500', sun: 'bg-sun-400' }[e.tone])} />
                ))}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
