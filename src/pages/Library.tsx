import { ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Card, Empty, Page, Spinner } from '../components/ui'
import { store } from '../lib'
import { useData, useMe } from '../lib/hooks'
import { LIBRARY, LIBRARY_ROOT, driveEmbedUrl, driveFolderUrl } from '../lib/library'
import { CATEGORIES, kindEmoji } from '../lib/materials'
import { t } from '../lib/i18n'

/** Teacher's materials from Google Drive: theory, videos, exercises and songs. Same for teacher and students. */
export function LibraryHome() {
  return (
    <Page title={t('Materials')} subtitle={t('Library for everyone: theory, videos, exercises and songs')}>
      <div className="grid grid-cols-2 gap-3">
        {LIBRARY.map(f => (
          <Card key={f.slug} to={`/library/${f.slug}`} className="!p-5 text-center">
            <div className="text-5xl mb-2">{f.emoji}</div>
            <div className="font-black text-lg">{t(f.title)}</div>
          </Card>
        ))}
      </div>
      <a href={driveFolderUrl(LIBRARY_ROOT)} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-2 font-extrabold text-sage-700 py-3">
        <ExternalLink className="size-4" />{t('Open everything in Google Drive')}
      </a>
    </Page>
  )
}

export function LibraryFolder() {
  const { slug } = useParams()
  const f = LIBRARY.find(x => x.slug === slug)
  const [loaded, setLoaded] = useState(false)
  if (!f) return <Page back="/library"><Empty emoji="🔍" title={t('Not found')} /></Page>
  return (
    <Page back="/library" title={`${f.emoji} ${t(f.title)}`}>
      <div className="relative rounded-3xl border-2 border-sand bg-white overflow-hidden">
        {!loaded && <div className="absolute inset-0 grid place-items-center"><Spinner /></div>}
        <iframe src={driveEmbedUrl(f.id)} title={t(f.title)} onLoad={() => setLoaded(true)} className="w-full h-[68dvh] border-0 bg-white" />
      </div>
      <p className="text-center text-muted mt-4 text-[15px]">{t('Tap a file to open it. If nothing shows, open the folder in Google Drive.')}</p>
      <a href={driveFolderUrl(f.id)} target="_blank" rel="noreferrer" className="block mt-2"><Button full variant="soft" icon={<ExternalLink className="size-5" />}>{t('Open in Google Drive')}</Button></a>
    </Page>
  )
}

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
              <span className="flex-1 min-w-0 font-extrabold">{i.name}</span>
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
