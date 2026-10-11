import { ImagePlus, Loader2, SendHorizontal } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { store } from '../lib'
import { useData } from '../lib/hooks'
import { t } from '../lib/i18n'
import { TLANGS, translate, type TLang } from '../lib/translate'
import type { Message, Profile } from '../lib/types'
import { firstLink, fmtTime, friendlyDay, hostOf, sameDay, splitLinks, youtubeId } from '../lib/util'
import { Mascot } from './Mascot'
import { Avatar, cx, toast } from './ui'

/** One conversation per student, shared by the student and the teacher. */
export function ChatThread({ studentId, me, other, className }: { studentId: string; me: Profile; other: Profile | null; className?: string }) {
  const { data: messages = [] } = useData(() => store.listMessages(studentId), [studentId])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
    if (messages.some(m => m.senderId !== me.id && !m.readAt)) store.markRead(studentId, me.id)
  }, [messages, studentId, me.id])

  const send = async (payload: { text: string; imageUrl?: string }) => {
    setSending(true)
    try {
      await store.sendMessage({ studentId, senderId: me.id, ...payload })
      setText('')
    } catch (e) {
      toast((e as Error).message, 'error')
    } finally {
      setSending(false)
    }
  }

  const onImage = async (f: File | undefined) => {
    if (!f) return
    setSending(true)
    try {
      const a = await store.upload(f)
      await store.sendMessage({ studentId, senderId: me.id, text: '', imageUrl: a.url })
    } catch (e) {
      toast((e as Error).message, 'error')
    } finally {
      setSending(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className={cx('flex flex-col', className)}>
      <div className="flex-1 space-y-2 pb-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="mb-2"><Mascot mood="hello" size={150} /></div>
            <p className="font-extrabold">{t('Say ¡hola! to start the conversation')}</p>
            <p className="text-muted">{t('Share photos, links and questions — just about Spanish.')}</p>
          </div>
        )}
        {messages.map((m, i) => {
          const prev = messages[i - 1]
          const newDay = !prev || !sameDay(new Date(prev.createdAt), new Date(m.createdAt))
          return (
            <div key={m.id}>
              {newDay && <div className="text-center my-4"><span className="text-xs font-extrabold text-muted bg-sand rounded-full px-3 py-1">{friendlyDay(m.createdAt)}</span></div>}
              <Bubble m={m} mine={m.senderId === me.id} other={other} />
            </div>
          )
        })}
        <div ref={endRef} className="scroll-mb-40" />
      </div>

      <form className="sticky bottom-[calc(76px+env(safe-area-inset-bottom))] md:bottom-4 flex items-end gap-2 bg-white rounded-[26px] border-2 border-sand p-2 shadow-[0_8px_30px_-12px_rgb(52_48_45/0.25)]"
        onSubmit={e => { e.preventDefault(); if (text.trim()) send({ text: text.trim() }) }}>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => onImage(e.target.files?.[0])} />
        <button type="button" onClick={() => fileRef.current?.click()} aria-label={t('Send a photo')} className="size-11 shrink-0 rounded-full grid place-items-center text-sage-600 hover:bg-sage-50">
          <ImagePlus className="size-6" />
        </button>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={1} placeholder={t('Write a message…')}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(pointer: fine)').matches) { e.preventDefault(); if (text.trim()) send({ text: text.trim() }) } }}
          className="flex-1 resize-none bg-transparent outline-none py-2.5 max-h-40 text-[17px]" />
        <button type="submit" disabled={sending || !text.trim()} aria-label={t('Send')}
          className={cx('size-11 shrink-0 rounded-full grid place-items-center transition', text.trim() ? 'bg-sage-500 text-white animate-soft-pulse' : 'bg-sand text-muted')}>
          {sending ? <Loader2 className="size-5 animate-spin" /> : <SendHorizontal className="size-5 rtl:rotate-180" />}
        </button>
      </form>
    </div>
  )
}

function Bubble({ m, mine, other }: { m: Message; mine: boolean; other: Profile | null }) {
  const link = firstLink(m.text)
  const yt = link && youtubeId(link)
  const [menu, setMenu] = useState(false)
  const [busy, setBusy] = useState(false)
  const [tr, setTr] = useState<string | null>(null)

  const go = async (lang: TLang) => {
    setMenu(false)
    setBusy(true)
    try { setTr(await translate(m.text, lang)) } catch { toast(t('Could not translate right now'), 'error') } finally { setBusy(false) }
  }

  return (
    <div className={cx('flex items-end gap-2', mine ? 'justify-end' : 'justify-start')}>
      {!mine && other && <Avatar name={other.name} size={32} />}
      <div className={cx('max-w-[80%] flex flex-col', mine ? 'items-end' : 'items-start')}>
        <div className={cx('rounded-3xl overflow-hidden', mine ? 'bg-sage-500 text-white rounded-ee-md' : 'bg-white border-2 border-sand rounded-es-md')}>
          {m.imageUrl && (
            <a href={m.imageUrl} target="_blank" rel="noreferrer"><img src={m.imageUrl} alt="" className="max-h-72 w-full object-cover" /></a>
          )}
          {link && (
            <a href={link} target="_blank" rel="noreferrer" className={cx('block', mine ? 'bg-sage-600' : 'bg-cream')}>
              {yt && <img src={`https://img.youtube.com/vi/${yt}/hqdefault.jpg`} alt="" className="w-full aspect-video object-cover" />}
              <div className="px-4 py-2 text-sm font-extrabold flex items-center gap-2">🔗 {hostOf(link)}</div>
            </a>
          )}
          {m.text && (
            <p className="px-4 py-2.5 whitespace-pre-wrap break-words leading-snug">
              {splitLinks(m.text).map((p, i) => p.url
                ? <a key={i} href={p.url} target="_blank" rel="noreferrer" className="underline break-all">{p.url.length > 40 ? p.url.slice(0, 40) + '…' : p.url}</a>
                : <span key={i}>{p.text}</span>)}
            </p>
          )}
          {tr && (
            <p dir="auto" className={cx('px-4 py-2.5 whitespace-pre-wrap break-words leading-snug border-t-2 border-dashed', mine ? 'border-white/30 bg-sage-600' : 'border-sand bg-sage-50')}>🌐 {tr}</p>
          )}
          <div className={cx('px-4 pb-1.5 -mt-1 text-[11px] font-bold text-end', mine ? 'text-white/70' : 'text-muted')}>{fmtTime(m.createdAt)}</div>
        </div>
        {m.text && (
          <div className="mt-1 px-2 flex flex-wrap items-center gap-1.5 text-xs font-extrabold text-muted">
            {tr ? <button onClick={() => setTr(null)} className="hover:text-ink">{t('Hide translation')}</button>
              : menu ? (<>
                <span>🌐</span>
                {TLANGS.map(l => <button key={l.code} onClick={() => go(l.code)} className="rounded-full bg-sand px-2.5 py-1 text-ink hover:bg-sand-dark">{l.label}</button>)}
              </>)
              : <button onClick={() => setMenu(true)} className="hover:text-ink">🌐 {busy ? '…' : t('Translate')}</button>}
          </div>
        )}
      </div>
    </div>
  )
}

export function unreadFor(messages: Message[], meId: string, studentId?: string) {
  return messages.filter(m => m.senderId !== meId && !m.readAt && (!studentId || m.studentId === studentId)).length
}
