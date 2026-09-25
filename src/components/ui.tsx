import { ArrowLeft, ChevronRight, Loader2, X } from 'lucide-react'
import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { t } from '../lib/i18n'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

type Variant = 'primary' | 'berry' | 'soft' | 'ghost' | 'white'

const variants: Record<Variant, string> = {
  primary: 'bg-sage-500 text-white border-sage-700 hover:bg-sage-600',
  berry: 'bg-berry-500 text-white border-berry-700 hover:bg-berry-600',
  soft: 'bg-white text-ink border-sand-dark hover:bg-sand/60',
  white: 'bg-white text-sage-700 border-sage-200 hover:bg-sage-50',
  ghost: 'bg-transparent text-sage-700 border-transparent hover:bg-sage-50 !border-b-0',
}

export function buttonClass(variant: Variant = 'primary', size: 'md' | 'lg' | 'sm' = 'md', extra = '') {
  return cx(
    'inline-flex items-center justify-center gap-2 font-extrabold rounded-2xl border-2 border-b-4 transition',
    'active:translate-y-[2px] active:border-b-2 disabled:opacity-50 disabled:pointer-events-none select-none',
    size === 'lg' && 'text-lg px-6 py-4',
    size === 'md' && 'px-5 py-3',
    size === 'sm' && 'text-sm px-3 py-2 rounded-xl',
    variants[variant],
    extra,
  )
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'md' | 'lg' | 'sm'
  full?: boolean
  pulse?: boolean
  busy?: boolean
  icon?: ReactNode
}

export function Button({ variant = 'primary', size = 'md', full, pulse, busy, icon, className, children, ...rest }: BtnProps) {
  return (
    <button {...rest} disabled={rest.disabled || busy} className={buttonClass(variant, size, cx(full && 'w-full', pulse && (variant === 'berry' ? 'animate-soft-pulse-berry' : 'animate-soft-pulse'), className))}>
      {busy ? <Loader2 className="size-5 animate-spin" /> : icon}
      {children}
    </button>
  )
}

export function LinkButton({ to, variant = 'primary', size = 'md', full, pulse, icon, children, className }: { to: string; variant?: Variant; size?: 'md' | 'lg' | 'sm'; full?: boolean; pulse?: boolean; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Link to={to} className={buttonClass(variant, size, cx(full && 'w-full', pulse && 'animate-soft-pulse', className))}>
      {icon}
      {children}
    </Link>
  )
}

export function Card({ children, className, onClick, to }: { children: ReactNode; className?: string; onClick?: () => void; to?: string }) {
  const cls = cx('block min-w-0 bg-white rounded-3xl border-2 border-sand p-5', (onClick || to) && 'hover:border-sage-200 active:scale-[0.99] transition text-start w-full', className)
  if (to) return <Link to={to} className={cls}>{children}</Link>
  if (onClick) return <button type="button" onClick={onClick} className={cls}>{children}</button>
  return <div className={cls}>{children}</div>
}

export function Page({ title, subtitle, back, action, children }: { title?: ReactNode; subtitle?: ReactNode; back?: string | true; action?: ReactNode; children: ReactNode }) {
  const nav = useNavigate()
  return (
    <div className="animate-rise">
      {(title || back) && (
        <header className="flex items-start gap-3 mb-6">
          {back && (
            <button onClick={() => (back === true ? nav(-1) : nav(back))} aria-label={t('Back')}
              className="shrink-0 size-11 rounded-2xl bg-white border-2 border-sand grid place-items-center text-ink hover:bg-sand/50 rtl:rotate-180">
              <ArrowLeft className="size-5" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            {title && <h1 className="text-[1.75rem] leading-tight font-black text-ink">{title}</h1>}
            {subtitle && <p className="text-muted mt-1">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </div>
  )
}

const tones = ['bg-sage-200 text-sage-700', 'bg-berry-100 text-berry-700', 'bg-sun-100 text-sun-600', 'bg-sage-100 text-sage-600']
export function Avatar({ name, size = 44, className }: { name: string; size?: number; className?: string }) {
  const tone = tones[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % tones.length]
  return (
    <div className={cx('rounded-full grid place-items-center font-black shrink-0', tone, className)} style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {name.trim()[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

export function Chip({ children, tone = 'sage', onRemove, className }: { children: ReactNode; tone?: 'sage' | 'berry' | 'sun' | 'sand'; onRemove?: () => void; className?: string }) {
  const t = { sage: 'bg-sage-100 text-sage-700', berry: 'bg-berry-100 text-berry-700', sun: 'bg-sun-100 text-sun-600', sand: 'bg-sand text-ink' }[tone]
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold', t, className)}>
      {children}
      {onRemove && <button type="button" onClick={onRemove} aria-label="Remove" className="-me-1 opacity-60 hover:opacity-100"><X className="size-4" /></button>}
    </span>
  )
}

export function Dot({ className }: { className?: string }) {
  return <span className={cx('inline-block size-2.5 rounded-full bg-berry-500', className)} />
}

export function CountBadge({ n }: { n: number }) {
  if (!n) return null
  return <span className="min-w-5 h-5 px-1.5 rounded-full bg-berry-500 text-white text-xs font-black grid place-items-center">{n}</span>
}

/** The one big "what to do next" card. Always obvious, always tappable. */
export function NextStep({ emoji, label, title, subtitle, to, onClick, tone = 'sage', cta }: { emoji: string; label?: string; title: ReactNode; subtitle?: ReactNode; to?: string; onClick?: () => void; tone?: 'sage' | 'berry'; cta?: string }) {
  const bg = tone === 'sage' ? 'bg-sage-500 border-sage-700' : 'bg-berry-500 border-berry-700'
  const inner = (
    <>
      <div className="flex items-center gap-4">
        <div className="size-16 rounded-2xl bg-white/20 grid place-items-center text-4xl shrink-0">{emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="text-white/80 text-sm font-extrabold uppercase tracking-wide">{label ?? t('Next step')}</div>
          <div className="text-white text-xl font-black leading-snug">{title}</div>
          {subtitle && <div className="text-white/85 mt-0.5">{subtitle}</div>}
        </div>
      </div>
      <div className="mt-4 bg-white rounded-2xl py-3 px-4 flex items-center justify-between font-extrabold text-ink">
        <span>{cta ?? t("Let's go")}</span>
        <ChevronRight className="size-5 rtl:rotate-180" />
      </div>
    </>
  )
  const cls = cx('block w-full text-start rounded-[28px] border-b-[6px] p-5 active:translate-y-[2px] transition', tone === 'sage' ? 'animate-soft-pulse' : 'animate-soft-pulse-berry', bg)
  if (to) return <Link to={to} className={cls}>{inner}</Link>
  return <button type="button" onClick={onClick} className={cls}>{inner}</button>
}

export function Row({ icon, title, subtitle, right, to, onClick, className }: { icon?: ReactNode; title: ReactNode; subtitle?: ReactNode; right?: ReactNode; to?: string; onClick?: () => void; className?: string }) {
  const inner = (
    <>
      {icon && <div className="size-12 rounded-2xl bg-cream grid place-items-center text-2xl shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <div className="font-extrabold text-ink leading-snug">{title}</div>
        {subtitle && <div className="text-muted text-[15px] truncate">{subtitle}</div>}
      </div>
      {right ?? ((to || onClick) && <ChevronRight className="size-5 text-muted rtl:rotate-180" />)}
    </>
  )
  const cls = cx('flex items-center gap-3 bg-white rounded-3xl border-2 border-sand p-3 pe-4 w-full min-w-0 text-start', (to || onClick) && 'hover:border-sage-200 active:scale-[0.99] transition', className)
  if (to) return <Link to={to} className={cls}>{inner}</Link>
  if (onClick) return <button type="button" onClick={onClick} className={cls}>{inner}</button>
  return <div className={cls}>{inner}</div>
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mt-8 mb-3">
      <h2 className="text-lg font-black text-ink">{children}</h2>
      {action}
    </div>
  )
}

export function Empty({ emoji, title, text, action }: { emoji: string; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="text-center py-10 px-6 bg-white/60 rounded-3xl border-2 border-dashed border-sand-dark">
      <div className="text-5xl mb-3">{emoji}</div>
      <div className="font-black text-lg">{title}</div>
      {text && <p className="text-muted mt-1">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cx('h-4 rounded-full bg-sand overflow-hidden', className)}>
      <div className="h-full rounded-full bg-sage-500 transition-all duration-500 relative" style={{ width: `${Math.max(4, Math.min(100, value * 100))}%` }}>
        <div className="absolute inset-x-2 top-1 h-1 rounded-full bg-white/30" />
      </div>
    </div>
  )
}

const inputCls = 'w-full rounded-2xl border-2 border-sand bg-white px-4 py-3 text-ink placeholder:text-muted/70 focus:outline-none focus:border-sage-400 transition'

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block mb-4">
      <span className="block font-extrabold mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-sm text-muted mt-1">{hint}</span>}
    </label>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputCls, props.className)} />
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={cx(inputCls, 'resize-y', props.className)} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(inputCls, 'appearance-none', props.className)} />
}

/** Type a word and press Enter to add it as a chip. */
export function ChipsInput({ value, onChange, placeholder, tone = 'sage' }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string; tone?: 'sage' | 'berry' | 'sun' }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const v = draft.trim()
    if (v && !value.includes(v)) onChange([...value, v])
    setDraft('')
  }
  return (
    <div className={cx(inputCls, 'flex flex-wrap gap-2 items-center py-2.5')}>
      {value.map(v => <Chip key={v} tone={tone} onRemove={() => onChange(value.filter(x => x !== v))}>{v}</Chip>)}
      <input value={draft} onChange={e => setDraft(e.target.value)} placeholder={value.length ? '' : placeholder}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } }}
        onBlur={add} className="flex-1 min-w-32 bg-transparent outline-none py-1" />
    </div>
  )
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[] }) {
  return (
    <div className="flex bg-sand rounded-2xl p-1 gap-1">
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={cx('flex-1 rounded-xl py-2.5 px-2 font-extrabold text-[15px] transition', value === o.value ? 'bg-white text-sage-700 shadow-sm' : 'text-muted hover:text-ink')}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[] }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 mb-5">
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={cx('shrink-0 rounded-full px-4 py-2 font-extrabold border-2 transition', value === o.value ? 'bg-sage-500 text-white border-sage-500' : 'bg-white text-ink border-sand hover:border-sage-200')}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-cream w-full sm:max-w-lg max-h-[90dvh] overflow-y-auto rounded-t-[32px] sm:rounded-[32px] p-6 pb-safe animate-pop">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black">{title}</h2>
          <button onClick={onClose} aria-label={t('Close')} className="size-10 rounded-full bg-white grid place-items-center"><X className="size-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Spinner() {
  return <div className="grid place-items-center py-20"><Loader2 className="size-8 animate-spin text-sage-500" /></div>
}

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="18" fill="#5C9468" />
      <path d="M14 22c0-4.4 3.6-8 8-8h20c4.4 0 8 3.6 8 8v14c0 4.4-3.6 8-8 8H29l-8 7v-7c-3.9-.5-7-3.8-7-8z" fill="#FBF6EF" />
      <text x="32" y="38" textAnchor="middle" fontFamily="Nunito, ui-rounded, sans-serif" fontWeight="900" fontSize="24" fill="#3A6244">ñ</text>
    </svg>
  )
}

// ── Toasts ──
type ToastFn = (msg: string, tone?: 'ok' | 'error') => void
let pushToast: ToastFn = () => {}
export const toast: ToastFn = (m, tone) => pushToast(m, tone)

export function Toaster() {
  const [items, setItems] = useState<{ id: number; msg: string; tone: 'ok' | 'error' }[]>([])
  useEffect(() => {
    pushToast = (msg, tone = 'ok') => {
      const id = Date.now() + Math.random()
      setItems(x => [...x, { id, msg, tone }])
      setTimeout(() => setItems(x => x.filter(i => i.id !== id)), 3200)
    }
  }, [])
  return (
    <div className="fixed top-4 inset-x-0 z-[60] flex flex-col items-center gap-2 pointer-events-none px-4">
      {items.map(i => (
        <div key={i.id} className={cx('animate-pop rounded-2xl px-5 py-3 font-extrabold shadow-lg', i.tone === 'ok' ? 'bg-sage-600 text-white' : 'bg-berry-600 text-white')}>{i.msg}</div>
      ))}
    </div>
  )
}
