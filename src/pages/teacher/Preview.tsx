import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Page, Segmented, Spinner } from '../../components/ui'
import { store } from '../../lib'
import { useData } from '../../lib/hooks'
import { t } from '../../lib/i18n'
import { previewName } from '../../lib/preview'
import type { Lang } from '../../lib/types'

/** The teacher sees the app exactly as the student does — inside a phone — and nothing she does is saved. */
export default function Preview() {
  const { id = '' } = useParams()
  const { data: student } = useData(() => store.getProfile(id), [id])
  const [picked, setPicked] = useState<Lang | null>(null)
  if (!student) return <Spinner />
  const lang: Lang = picked ?? student.lang ?? 'en'
  const first = student.name.split(' ')[0]

  return (
    <Page back={`/students/${id}`} title={t('{name}’s view', { name: first })} subtitle={t('This is exactly what {name} sees. You can click around — nothing is saved.', { name: first })}>
      <div className="max-w-xs mx-auto mb-5">
        <Segmented value={lang} onChange={setPicked} options={[{ value: 'es', label: 'Español' }, { value: 'en', label: 'English' }]} />
      </div>
      <div className="relative mx-auto w-[min(100%,390px)] h-[740px] rounded-[46px] bg-ink p-[10px] shadow-[0_24px_60px_-20px_rgb(52_48_45/0.55)]">
        <div className="absolute top-[14px] left-1/2 -translate-x-1/2 w-24 h-5 rounded-full bg-ink z-10" />
        <iframe key={lang} name={previewName(id, lang)} src={import.meta.env.BASE_URL} title={t('{name}’s view', { name: first })} className="w-full h-full rounded-[36px] bg-cream border-0" />
      </div>
    </Page>
  )
}
