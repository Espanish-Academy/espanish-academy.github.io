import { Link2, Paperclip, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { store } from '../lib'
import { t } from '../lib/i18n'
import type { Attachment } from '../lib/types'
import { hostOf } from '../lib/util'
import { Button, Input, toast } from './ui'

/** Add PDFs, photos and links to a lesson or task. */
export function AttachmentEditor({ value, onChange }: { value: Attachment[]; onChange: (v: Attachment[]) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [link, setLink] = useState('')
  const [showLink, setShowLink] = useState(false)

  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    try {
      const added: Attachment[] = []
      for (const f of Array.from(files)) added.push(await store.upload(f))
      onChange([...value, ...added])
    } catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false); if (ref.current) ref.current.value = '' }
  }
  const addLink = () => {
    const url = link.trim().startsWith('http') ? link.trim() : `https://${link.trim()}`
    if (!link.trim()) return
    onChange([...value, { name: hostOf(url), url, kind: 'link' }])
    setLink(''); setShowLink(false)
  }

  return (
    <div>
      {value.length > 0 && (
        <div className="grid gap-2 mb-3">
          {value.map((a, i) => (
            <div key={i} className="flex items-center gap-3 bg-white rounded-2xl border-2 border-sand p-2 ps-3">
              <span className="text-xl">{a.kind === 'image' ? '🖼️' : a.kind === 'file' ? '📄' : '🔗'}</span>
              <input value={a.name} onChange={e => onChange(value.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                className="flex-1 min-w-0 bg-transparent outline-none font-bold" />
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="size-8 rounded-full grid place-items-center hover:bg-sand" aria-label={t('Remove')}><X className="size-4" /></button>
            </div>
          ))}
        </div>
      )}
      {showLink && (
        <div className="flex gap-2 mb-3">
          <Input autoFocus value={link} onChange={e => setLink(e.target.value)} placeholder="https://…" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLink() } }} />
          <Button type="button" onClick={addLink}>{t('Add')}</Button>
        </div>
      )}
      <input ref={ref} type="file" multiple hidden accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,audio/*" onChange={e => upload(e.target.files)} />
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="soft" busy={busy} icon={<Paperclip className="size-5" />} onClick={() => ref.current?.click()}>{t('PDF / photo')}</Button>
        <Button type="button" variant="soft" icon={<Link2 className="size-5" />} onClick={() => setShowLink(true)}>{t('Link')}</Button>
      </div>
    </div>
  )
}
