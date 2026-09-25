import { Link, useParams } from 'react-router-dom'
import { Attachments, KIND, VocabList } from '../../components/Bits'
import { Button, Chip, Empty, LinkButton, Page, Row, SectionTitle, Spinner, cx } from '../../components/ui'
import { store } from '../../lib'
import { useData, useMe } from '../../lib/hooks'
import { t } from '../../lib/i18n'
import { fmtDate, fmtTime, friendlyDay, friendlyWhen, icsFor } from '../../lib/util'

/** From the first class to today: every lesson, what was learned, and what comes next. */
export default function Journey() {
  const me = useMe()
  const { data } = useData(async () => {
    const [lessons, tasks, subs] = await Promise.all([store.listLessons(me.id), store.listTasks(me.id), store.listSubmissions(me.id)])
    return { lessons, tasks, subs }
  }, [me.id])
  if (!data) return <Spinner />

  const done = data.lessons.filter(l => l.status === 'done')
  const next = data.lessons.find(l => l.status === 'planned' && new Date(l.startsAt).getTime() > Date.now() - 3600_000)
  const words = done.reduce((n, l) => n + l.vocab.length, 0)

  return (
    <Page title={t('My journey')} subtitle={t('Everything you have learned, class by class')}>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Mini n={done.length} label={t('classes')} />
        <Mini n={words} label={t('words')} />
        <Mini n={data.subs.length} label={t('tasks done')} />
      </div>
      {words > 0 && <LinkButton to="/practice" full variant="white" icon={<span>🔁</span>}>{t('Practise my words')}</LinkButton>}

      {done.length === 0 && !next ? (
        <div className="mt-6"><Empty emoji="🌱" title={t('Your journey starts soon')} text={t('After your first class, it will appear here.')} /></div>
      ) : (
        <ol className="relative mt-8 ms-5 border-s-4 border-dashed border-sage-200 space-y-5">
          {next && (
            <li className="ps-8 relative">
              <span className="absolute -start-[18px] top-4 size-8 rounded-full bg-berry-500 text-white grid place-items-center text-sm font-black ring-4 ring-cream">★</span>
              <Link to={`/journey/${next.id}`} className="block rounded-3xl bg-berry-50 border-2 border-berry-200 p-4 hover:border-berry-300 animate-soft-pulse">
                <div className="text-sm font-extrabold text-berry-600 uppercase">{t('Next class')} · {friendlyWhen(next.startsAt)}</div>
                <div className="font-black text-lg">{next.title || t('Class')}</div>
              </Link>
            </li>
          )}
          {[...done].reverse().map((l, idx) => {
            const n = done.length - idx
            return (
              <li key={l.id} className="ps-8 relative">
                <span className="absolute -start-[18px] top-4 size-8 rounded-full bg-sage-500 text-white grid place-items-center text-sm font-black ring-4 ring-cream">{n}</span>
                <Link to={`/journey/${l.id}`} className="block rounded-3xl bg-white border-2 border-sand p-4 hover:border-sage-200">
                  <div className="text-sm font-bold text-muted">{t('Class {n}', { n })} · {fmtDate(l.startsAt, { day: 'numeric', month: 'short' })}</div>
                  <div className="font-black text-lg leading-snug">{l.title || t('Class')}</div>
                  {l.topics.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">{l.topics.slice(0, 3).map(tp => <Chip key={tp}>{tp}</Chip>)}</div>}
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </Page>
  )
}

function Mini({ n, label }: { n: number; label: string }) {
  return (
    <div className="bg-white rounded-3xl border-2 border-sand p-3 text-center">
      <div className="text-2xl font-black text-sage-700">{n}</div>
      <div className="text-sm font-bold text-muted">{label}</div>
    </div>
  )
}

export function LessonView() {
  const { id } = useParams()
  const me = useMe()
  const { data } = useData(async () => {
    const [lessons, tasks] = await Promise.all([store.listLessons(me.id), store.listTasks(me.id)])
    return { lessons, tasks }
  }, [me.id])
  if (!data) return <Spinner />
  const l = data.lessons.find(x => x.id === id)
  if (!l) return <Page back="/journey"><Empty emoji="🔍" title={t('Class not found')} /></Page>
  const n = data.lessons.filter(x => x.status === 'done' && x.startsAt <= l.startsAt).length
  const tasks = data.tasks.filter(x => x.lessonId === l.id)
  const planned = l.status === 'planned'

  return (
    <Page back={true} title={l.title || t('Class')}
      subtitle={planned ? `${friendlyDay(l.startsAt)} · ${fmtTime(l.startsAt)} · ${l.durationMin} min` : `${t('Class {n}', { n })} · ${fmtDate(l.startsAt)}`}>
      {planned && (
        <div className="rounded-3xl bg-berry-50 border-2 border-berry-100 p-5 mb-2">
          <div className="text-3xl">📅</div>
          <div className="font-black text-lg mt-1">{fmtDate(l.startsAt)} · {fmtTime(l.startsAt)}</div>
          <p className="text-muted">{t('Take a look at the topics below so you arrive ready.')}</p>
          <Button variant="white" size="sm" className="mt-3" onClick={() => icsFor(`Spanish class · ${l.title}`, l.startsAt, l.durationMin)}>
            ＋ {t('Add to my phone calendar')}
          </Button>
        </div>
      )}
      {l.status === 'cancelled' && <Chip tone="berry">{t('Cancelled')}</Chip>}

      {l.topics.length > 0 && (
        <>
          <SectionTitle>{planned ? t('What we will learn') : t('What we learned')}</SectionTitle>
          <div className="flex flex-wrap gap-2">{l.topics.map(tp => <Chip key={tp} className="!text-base !px-4 !py-1.5">{tp}</Chip>)}</div>
        </>
      )}
      {l.summary && (
        <>
          <SectionTitle>{t('Summary')}</SectionTitle>
          <p className="bg-white rounded-3xl border-2 border-sand p-5 text-lg leading-relaxed whitespace-pre-wrap">{l.summary}</p>
        </>
      )}
      {l.vocab.length > 0 && (
        <>
          <SectionTitle action={<span className="text-sm text-muted font-bold">{t('Tap to hear')} 🔊</span>}>{t('New words')}</SectionTitle>
          <VocabList items={l.vocab} />
        </>
      )}
      {(l.materials.length > 0 || l.recordingUrl) && (
        <>
          <SectionTitle>{t('Materials')}</SectionTitle>
          <Attachments items={[...(l.recordingUrl ? [{ name: t('Class recording'), url: l.recordingUrl, kind: 'link' as const }] : []), ...l.materials]} />
        </>
      )}
      {tasks.length > 0 && (
        <>
          <SectionTitle>{t('Tasks from this class')}</SectionTitle>
          <div className="grid gap-3">{tasks.map(x => <Row key={x.id} to={`/tasks/${x.id}`} icon={KIND[x.kind].emoji} title={x.title} />)}</div>
        </>
      )}
      {planned && !l.topics.length && (
        <p className={cx('text-muted text-center mt-8')}>{t('Your teacher will add the topics soon.')}</p>
      )}
    </Page>
  )
}
