import { Cloud, Link2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, Chip, Field, Input, Sheet, Spinner, toast } from '../../components/ui'
import { store } from '../../lib'
import { copyForStudent, driveConfigured, pickFromDrive, shareByLink } from '../../lib/gdrive'
import { useData } from '../../lib/hooks'
import { t } from '../../lib/i18n'
import { parseDriveLink } from '../../lib/library'
import { CATEGORIES, canGiveToComplete, driveOpenUrl, kindEmoji } from '../../lib/materials'
import type { MaterialCategory, StudentMaterial } from '../../lib/types'

/** The files the teacher has filed for one student, by section. She adds them straight from her Google Drive. */
export default function StudentFiles({ studentId, name }: { studentId: string; name: string }) {
  const { data: items, loading } = useData(() => store.listStudentMaterials(studentId), [studentId])
  const { data: student } = useData(() => store.getProfile(studentId), [studentId])
  const [copying, setCopying] = useState<string | null>(null)
  const [busy, setBusy] = useState<MaterialCategory | null>(null)
  const [linkFor, setLinkFor] = useState<MaterialCategory | null>(null)
  const [linkName, setLinkName] = useState('')
  const [link, setLink] = useState('')
  if (loading) return <Spinner />
  const first = name.split(' ')[0]

  const fromDrive = async (cat: MaterialCategory) => {
    setBusy(cat)
    try {
      const picks = await pickFromDrive()
      if (!picks.length) return
      for (const p of picks) await shareByLink(p.id)
      await store.addStudentMaterials(picks.map(p => ({ studentId, category: cat, driveId: p.id, name: p.name, mimeType: p.mimeType, url: p.url })))
      toast(t('Added for {name}', { name: first }))
    } catch (e) {
      toast(t('Could not add from Google Drive') + ((e as Error).message ? ` (${(e as Error).message})` : ''), 'error')
    } finally { setBusy(null) }
  }

  /** A personal copy for the student to fill in; the teacher follows and corrects it in the same document. */
  const giveToComplete = async (m: StudentMaterial) => {
    if (!student?.email) { toast(t('This student has no email'), 'error'); return }
    setCopying(m.id)
    try {
      const copy = await copyForStudent(m.driveId, `${m.name} — ${first}`, student.email)
      await store.addStudentMaterials([{ studentId, category: 'homework', driveId: copy.id, name: copy.name, mimeType: copy.mimeType, url: copy.url, editable: true }])
      toast(t('A copy for {name} is ready in “Homework”', { name: first }))
    } catch (e) {
      const code = (e as Error).message
      toast(code === 'not_picked' ? t('Choose this file again with “Upload from my Drive” so the app can copy it')
        : code.startsWith('share_') ? t('{name}’s email is not a Google account, so it cannot be shared for editing', { name: first })
        : t('Could not create the copy') + ` (${code})`, 'error')
    } finally { setCopying(null) }
  }

  const byLink = async () => {
    const parsed = parseDriveLink(link)
    if (!parsed || !linkFor) { toast(t('That does not look like a Google Drive link'), 'error'); return }
    await store.addStudentMaterials([{ studentId, category: linkFor, driveId: parsed.id, name: linkName.trim() || (parsed.folder ? t('Folder') : t('File')), mimeType: parsed.folder ? 'application/vnd.google-apps.folder' : null, url: driveOpenUrl(parsed.id, parsed.folder ? 'application/vnd.google-apps.folder' : null) }])
    setLinkFor(null); setLink(''); setLinkName(''); toast(t('Added for {name}', { name: first }))
  }

  return (
    <div>
      <p className="text-muted mb-4">{t('Choose files or folders from your Google Drive and file them under a section. {name} sees them in “My folder”.', { name: first })}</p>
      {!driveConfigured && (
        <Card className="!bg-sun-100/50 !border-sun-100 mb-4 text-[15px]">
          <b>🔌 {t('Google Drive is not connected yet.')}</b> {t('Until it is, add files with their link (the file must be shared as “Anyone with the link: Viewer”).')}
        </Card>
      )}
      <div className="grid gap-4">
        {CATEGORIES.map(c => {
          const list = (items ?? []).filter(i => i.category === c.id)
          return (
            <Card key={c.id}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-black text-lg flex-1">{c.emoji} {t(c.title)}</h3>
                {list.length > 0 && <Chip>{list.length}</Chip>}
              </div>
              {list.length > 0 && (
                <div className="grid gap-2 mb-3">
                  {list.map(i => (
                    <div key={i.id} className="bg-cream rounded-2xl ps-3 pe-1 py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{kindEmoji(i.mimeType)}</span>
                        <a href={i.url} target="_blank" rel="noreferrer" className="flex-1 min-w-0 font-bold truncate hover:underline py-2">{i.name}</a>
                        <button onClick={async () => { await store.deleteStudentMaterial(i.id) }} aria-label={t('Remove')} className="size-10 rounded-full grid place-items-center text-muted hover:bg-sand"><Trash2 className="size-4" /></button>
                      </div>
                      {i.editable && <div className="pb-2 text-sm font-extrabold text-sage-700">✏️ {t('Editable copy — open it to correct')}</div>}
                      {!i.editable && driveConfigured && canGiveToComplete(i.mimeType) && (
                        <div className="pb-2 pe-2"><Button size="sm" variant="white" busy={copying === i.id} onClick={() => giveToComplete(i)}>✏️ {t('Give to complete')}</Button></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                {driveConfigured && <Button size="sm" busy={busy === c.id} icon={<Cloud className="size-4" />} onClick={() => fromDrive(c.id)}>{t('Upload from my Drive')}</Button>}
                <Button size="sm" variant="soft" className={driveConfigured ? '' : 'col-span-2'} icon={<Link2 className="size-4" />} onClick={() => setLinkFor(c.id)}>{t('Add by link')}</Button>
              </div>
            </Card>
          )
        })}
      </div>

      <Sheet open={!!linkFor} onClose={() => setLinkFor(null)} title={t('Add by link')}>
        <Field label={t('Name')}><Input value={linkName} onChange={e => setLinkName(e.target.value)} placeholder={t('e.g. Present tense — worksheet')} /></Field>
        <Field label={t('Google Drive link')}><Input value={link} onChange={e => setLink(e.target.value)} placeholder="https://drive.google.com/…" /></Field>
        <Button full disabled={!link.trim()} onClick={byLink}>{t('Add')}</Button>
      </Sheet>
    </div>
  )
}
