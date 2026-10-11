import { Copy, MessageCircle } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card, Chip, Empty, Page, Row, SectionTitle, Select, Spinner, toast } from '../../components/ui'
import { store } from '../../lib'
import { useData } from '../../lib/hooks'
import { t } from '../../lib/i18n'
import { LEVEL_INFO, QUESTIONS } from '../../lib/placement'
import { fmtDate } from '../../lib/util'

export const placementUrl = () => `${location.origin}${import.meta.env.BASE_URL}nivel`

/** Level checks sent by people who are not students yet: the link to share, and every result. */
export function PlacementList() {
  const { data, loading } = useData(async () => ({ list: await store.listPlacements(), students: await store.listStudents() }), [])
  const url = placementUrl()
  const text = `Hi! Here is a short Spanish level check (about 5 minutes): ${url}`
  if (loading) return <Spinner />
  return (
    <Page title={t('Level checks')} subtitle={t('Send the link to someone new; their result appears here.')}>
      <Card>
        <div className="text-sm font-extrabold text-muted mb-1">{t('Link to the level check')}</div>
        <div className="font-bold break-all mb-4">{url}</div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="soft" icon={<Copy className="size-5" />} onClick={() => { navigator.clipboard.writeText(url).then(() => toast(t('Link copied'))) }}>{t('Copy link')}</Button>
          <a className="inline-flex items-center justify-center gap-2 font-extrabold rounded-2xl border-2 border-b-4 px-5 py-3 bg-sage-500 text-white border-sage-700 hover:bg-sage-600 active:translate-y-[2px] active:border-b-2"
            href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer"><MessageCircle className="size-5" />WhatsApp</a>
        </div>
      </Card>

      <SectionTitle>{t('Results')}</SectionTitle>
      {!data?.list.length && <Empty emoji="📊" mascot="idle" title={t('No results yet')} />}
      <div className="grid gap-3">
        {data?.list.map(p => (
          <Row key={p.id} to={`/placements/${p.id}`} icon={LEVEL_INFO[p.level].emoji} title={p.name}
            subtitle={`${p.level} · ${LEVEL_INFO[p.level].es} · ${fmtDate(p.createdAt, { day: 'numeric', month: 'short' })}`}
            right={!p.seenAt ? <Chip tone="berry">{t('New')}</Chip> : p.studentId ? <Chip>→ {data.students.find(x => x.id === p.studentId)?.name.split(' ')[0]}</Chip> : undefined} />
        ))}
      </div>
    </Page>
  )
}

export function PlacementDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { data, loading } = useData(async () => ({ list: await store.listPlacements(), students: await store.listStudents() }), [])
  const p = data?.list.find(x => x.id === id)
  useEffect(() => { if (p && !p.seenAt) store.markPlacementSeen(p.id).catch(() => {}) }, [p])
  if (loading) return <Spinner />
  if (!p) return <Page back="/placements"><Empty emoji="🔍" title={t('No results yet')} /></Page>
  const info = LEVEL_INFO[p.level]
  const total = (stage: number) => QUESTIONS.filter(q => q.stage === stage).length

  return (
    <Page back="/placements" title={p.name} subtitle={fmtDate(p.createdAt, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}>
      <div className="rounded-3xl bg-sage-50 border-2 border-sage-200 p-5 text-center">
        <div className="text-5xl">{info.emoji}</div>
        <div className="text-sm font-extrabold text-muted uppercase tracking-wide mt-2">{t('Level')}</div>
        <div className="text-3xl font-black text-sage-700">{p.level} · {info.es}</div>
        <div className="flex justify-center gap-2 mt-3 flex-wrap">
          {p.scores.map((s, i) => <Chip key={i} tone={s >= total(i + 1) * 0.6 ? 'sage' : 'sand'}>{t('Part {n}', { n: i + 1 })}: {t('{score} of {total}', { score: s, total: total(i + 1) })}</Chip>)}
        </div>
      </div>

      {(p.contact || p.goal) && (
        <div className="grid gap-3 mt-4">
          {p.contact && <Card className="!p-4"><div className="text-sm font-extrabold text-muted">{t('Contact')}</div><div className="font-bold break-all">{p.contact}</div></Card>}
          {p.goal && <Card className="!p-4"><div className="text-sm font-extrabold text-muted">{t('Why Spanish')}</div><div>{p.goal}</div></Card>}
        </div>
      )}

      <SectionTitle>{t('Student account')}</SectionTitle>
      <Card className="!p-4">
        <p className="text-muted text-[15px] mb-2">{t('When this person creates an account, link the result here so it appears in their profile.')}</p>
        <Select value={p.studentId ?? ''} onChange={async e => { await store.linkPlacement(p.id, e.target.value || null); toast(t('Saved')) }}>
          <option value="">— {t('Not linked yet')}</option>
          {data?.students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        {p.studentId && <Button size="sm" variant="white" className="mt-3" onClick={() => nav(`/students/${p.studentId}`)}>{t('Open profile')}</Button>}
      </Card>

      <SectionTitle>{t('Their answers')}</SectionTitle>
      <div className="grid gap-2">
        {p.answers.map(a => {
          const q = QUESTIONS.find(x => x.id === a.id)
          if (!q) return null
          const unknown = a.picked === "I don't know"
          return (
            <div key={a.id} className="bg-white rounded-2xl border-2 border-sand p-3">
              <div className="text-sm text-muted">{q.prompt.replaceAll('*', '')}</div>
              <div className="font-extrabold flex items-center gap-2">
                <span>{a.correct ? '✅' : unknown ? '🤷' : '❌'}</span>
                <span lang="es">{unknown ? t("Didn't know") : a.picked}</span>
              </div>
              {!a.correct && <div className="text-sm text-sage-700">{t('Answer')}: <span lang="es">{q.answer}</span></div>}
            </div>
          )
        })}
      </div>
    </Page>
  )
}
