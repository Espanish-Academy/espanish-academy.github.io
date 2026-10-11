import type { ReactNode } from 'react'
import abanico from '../assets/abanico.webp'
import { cx } from './ui'

/** Abanico, the app's mascot. One drawing, many moods — each mood is a different animation. */
export type Mood = 'hello' | 'cheer' | 'idle' | 'nap' | 'think' | 'alert'

const animation: Record<Mood, string> = {
  hello: 'animate-mascot-hello',
  cheer: 'animate-mascot-cheer',
  idle: 'animate-mascot-float',
  nap: 'animate-mascot-nap',
  think: 'animate-mascot-think',
  alert: 'animate-mascot-alert',
}

export function Mascot({ mood = 'idle', size = 120, className }: { mood?: Mood; size?: number; className?: string }) {
  return (
    <div className={cx('relative inline-block shrink-0 pointer-events-none', className)} style={{ width: size }} aria-hidden>
      <img src={abanico} alt="" draggable={false} className={cx('block w-full h-auto origin-bottom select-none', animation[mood])} />
      {mood === 'nap' && ['z', 'Z', 'z'].map((z, i) => (
        <span key={i} className="absolute font-black text-sage-500 animate-zzz" style={{ top: '4%', insetInlineEnd: `${6 + i * 9}%`, fontSize: size * (0.13 + i * 0.03), animationDelay: `${i * 0.9}s` }}>{z}</span>
      ))}
      {mood === 'cheer' && ['✨', '🎉', '✨', '⭐'].map((e, i) => (
        <span key={i} className="absolute animate-sparkle opacity-0" style={{ top: `${[2, -4, 20, 8][i]}%`, insetInlineStart: `${[2, 38, 86, 66][i]}%`, fontSize: size * 0.18, animationDelay: `${i * 0.12}s` }}>{e}</span>
      ))}
    </div>
  )
}

/** The mascot with a speech bubble. */
export function MascotSay({ mood = 'idle', size = 96, children, className }: { mood?: Mood; size?: number; children: ReactNode; className?: string }) {
  return (
    <div className={cx('flex items-end gap-1', className)}>
      <Mascot mood={mood} size={size} />
      <div className="flex-1 min-w-0 bg-white border-2 border-sand rounded-3xl rounded-es-md px-4 py-3 mb-5 font-extrabold leading-snug text-ink animate-pop">{children}</div>
    </div>
  )
}
