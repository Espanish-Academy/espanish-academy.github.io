import { ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Card, Empty, Page, Spinner } from '../components/ui'
import { LIBRARY, LIBRARY_ROOT, driveEmbedUrl, driveFolderUrl } from '../lib/library'
import { t } from '../lib/i18n'

/** Teacher's materials from Google Drive: theory, videos, exercises and songs. Same for teacher and students. */
export function LibraryHome() {
  return (
    <Page title={t('Materials')} subtitle={t('Theory, videos, exercises and songs')}>
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
