import { ExternalLink, FileText, Link2, Volume2 } from 'lucide-react'
import { t } from '../lib/i18n'
import type { Attachment, TaskKind, VocabItem } from '../lib/types'
import { hostOf, speak, youtubeId } from '../lib/util'

export const KIND: Record<TaskKind, { emoji: string; label: string }> = {
  homework: { emoji: '📝', label: 'Homework' },
  exercise: { emoji: '🎯', label: 'Exercise' },
  exam: { emoji: '🏆', label: 'Test' },
}

export function Attachments({ items }: { items: Attachment[] }) {
  if (!items.length) return null
  return (
    <div className="grid gap-2">
      {items.map((a, i) => {
        if (a.kind === 'image') {
          return <a key={i} href={a.url} target="_blank" rel="noreferrer"><img src={a.url} alt={a.name} className="rounded-3xl border-2 border-sand max-h-80 w-full object-cover" /></a>
        }
        const yt = a.kind === 'link' ? youtubeId(a.url) : undefined
        return (
          <a key={i} href={a.url} target="_blank" rel="noreferrer" download={a.kind === 'file' && a.url.startsWith('data:') ? a.name : undefined}
            className="flex items-center gap-3 bg-white rounded-3xl border-2 border-sand p-3 pe-4 hover:border-sage-200 overflow-hidden">
            {yt
              ? <img src={`https://img.youtube.com/vi/${yt}/mqdefault.jpg`} alt="" className="w-20 aspect-video rounded-xl object-cover" />
              : <span className="size-12 rounded-2xl bg-berry-50 text-berry-500 grid place-items-center shrink-0">{a.kind === 'file' ? <FileText /> : <Link2 />}</span>}
            <span className="flex-1 min-w-0">
              <span className="block font-extrabold truncate">{a.name}</span>
              <span className="block text-sm text-muted">{a.kind === 'file' ? t('Tap to open') : hostOf(a.url)}</span>
            </span>
            <ExternalLink className="size-5 text-muted" />
          </a>
        )
      })}
    </div>
  )
}

export function VocabList({ items }: { items: VocabItem[] }) {
  if (!items.length) return null
  return (
    <div className="bg-white rounded-3xl border-2 border-sand divide-y-2 divide-sand overflow-hidden">
      {items.map((v, i) => (
        <button key={i} onClick={() => speak(v.es)} className="w-full flex items-center gap-3 px-4 py-3 text-start hover:bg-sage-50">
          <Volume2 className="size-5 text-sage-500 shrink-0" />
          <span className="flex-1 font-extrabold" lang="es">{v.es}</span>
          <span className="text-muted">{v.en}</span>
        </button>
      ))}
    </div>
  )
}
