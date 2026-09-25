import { BookOpen, CalendarDays, Home, MessageCircle, NotebookPen, Users, Map as MapIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { CountBadge, Logo, cx } from './ui'

export interface NavItem {
  to: string
  label: string
  icon: ReactNode
  badge?: number
  end?: boolean
}

/** Phone-first layout: content column + bottom tab bar. On wide screens the tabs move to a side rail. */
export function AppLayout({ items }: { items: NavItem[] }) {
  return (
    <div className="min-h-dvh bg-cream md:flex">
      <aside className="hidden md:flex flex-col gap-1 w-64 shrink-0 p-5 sticky top-0 h-dvh border-e-2 border-sand bg-cream">
        <div className="flex items-center gap-2 mb-8 px-2">
          <Logo size={40} />
          <span className="text-2xl font-black text-sage-700">Espanish</span>
        </div>
        {items.map(i => (
          <NavLink key={i.to} to={i.to} end={i.end}
            className={({ isActive }) => cx('flex items-center gap-3 rounded-2xl px-4 py-3 font-extrabold text-[17px] transition border-2',
              isActive ? 'bg-sage-100 text-sage-700 border-sage-200' : 'text-muted border-transparent hover:bg-sand/60')}>
            <span className="[&>svg]:size-6">{i.icon}</span>
            <span className="flex-1">{i.label}</span>
            <CountBadge n={i.badge ?? 0} />
          </NavLink>
        ))}
      </aside>
      <main className="flex-1 min-w-0">
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-32 md:pb-12 md:pt-10">
          <Outlet />
        </div>
      </main>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t-2 border-sand pb-safe">
        <div className="flex max-w-2xl mx-auto">
          {items.map(i => (
            <NavLink key={i.to} to={i.to} end={i.end} className="flex-1 pt-2 pb-1 flex flex-col items-center gap-0.5">
              {({ isActive }) => (
                <>
                  <span className={cx('relative rounded-2xl px-4 py-1.5 transition [&>svg]:size-6', isActive ? 'bg-sage-100 text-sage-700' : 'text-muted')}>
                    {i.icon}
                    {!!i.badge && <span className="absolute -top-1 -end-0.5"><CountBadge n={i.badge} /></span>}
                  </span>
                  <span className={cx('text-[12px] font-extrabold', isActive ? 'text-sage-700' : 'text-muted')}>{i.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

export const icons = { Home: <Home />, Chat: <MessageCircle />, Tasks: <NotebookPen />, Journey: <MapIcon />, Calendar: <CalendarDays />, Students: <Users />, Book: <BookOpen /> }
