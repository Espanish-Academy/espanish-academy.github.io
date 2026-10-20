import { ExternalLink } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { Card, Empty, Page, Spinner } from '../components/ui'
import { store } from '../lib'
import { useData, useMe } from '../lib/hooks'
import { driveFolderUrl } from '../lib/library'
import { CATEGORIES, kindEmoji } from '../lib/materials'
import { t } from '../lib/i18n'

/** The student's own folder: what the teacher filed for them. Same look as "Materials": a card per section. */
export function MyFolder() {
  const me = useMe()
  const { cat } = useParams()
  const { data, loading } = useData(async () => ({
    items: await store.listStudentMaterials(me.id).catch(() => []),
    folder: await store.getStudentFolder(me.id).catch(() => null),
  }), [me.id])
  if (loading || !data) return <Spinner />
  const { items, folder } = data
  const empty = !items.length && !folder

  if (cat) {
    const c = CATEGORIES.find(x => x.id === cat)
    const list = items.filter(i => i.category === cat)
    if (!c) return <Page back="/my-folder"><Empty emoji="🔍" title={t('Not found')} /></Page>
    return (
      <Page back="/my-folder" title={`${c.emoji} ${t(c.title)}`}>
        {!list.length && <Empty emoji={c.emoji} mascot="idle" title={t('Nothing here yet')} />}
        <div className="grid gap-2">
          {list.map(i => (
            <a key={i.id} href={i.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white rounded-3xl border-2 border-sand p-3 pe-4 hover:border-sage-200 min-w-0">
              <span className="size-12 rounded-2xl bg-cream grid place-items-center text-2xl shrink-0">{kindEmoji(i.mimeType)}</span>
              <span className="flex-1 min-w-0"><span className="block font-extrabold">{i.name}</span>{i.editable && <span className="block text-sm font-extrabold text-sage-700">✏️ {t('For you to complete')}</span>}</span>
              <ExternalLink className="size-5 text-muted shrink-0" />
            </a>
          ))}
        </div>
      </Page>
    )
  }

  const shown = CATEGORIES.filter(c => items.some(i => i.category === c.id))
  return (
    <Page back="/" title={`📁 ${t('My folder')}`} subtitle={t('Made for you by your teacher')}>
      {empty && <Empty emoji="📁" mascot="idle" title={t('Your folder is not ready yet')} text={t('Your teacher will add your exercises and presentations here.')} />}
      <div className="grid grid-cols-2 gap-3">
        {shown.map(c => (
          <Card key={c.id} to={`/my-folder/${c.id}`} className="!p-5 text-center">
            <div className="text-5xl mb-2">{c.emoji}</div>
            <div className="font-black text-lg">{t(c.title)}</div>
            <div className="text-muted text-sm font-bold">{items.filter(i => i.category === c.id).length}</div>
          </Card>
        ))}
      </div>
      {folder && (
        <a href={driveFolderUrl(folder)} target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-center gap-2 font-extrabold text-sage-700 py-3">
          <ExternalLink className="size-4" />{t('Open my folder in Google Drive')}
        </a>
      )}
    </Page>
  )
}
