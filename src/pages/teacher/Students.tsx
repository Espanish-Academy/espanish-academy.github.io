import { useState } from 'react'
import { Avatar, Button, Card, Chip, Empty, Page, Sheet, Spinner } from '../../components/ui'
import { store } from '../../lib'
import { t } from '../../lib/i18n'
import { estimateLevel } from '../../lib/insights'
import { checkLevel } from '../../lib/placement'
import { labels } from '../../lib/questionnaire'
import { friendlyDay } from '../../lib/util'
import { useTeacherData } from './data'

export default function Students() {
  const { data } = useTeacherData()
  const [invite, setInvite] = useState(false)
  if (!data) return <Spinner />

  return (
    <Page title={t('My students')} subtitle={t('Everyone at a glance — level, loves and how they learn')}
      action={<Button size="sm" variant="white" onClick={() => setInvite(true)}>＋ {t('Invite')}</Button>}>
      {!data.students.length && <Empty emoji="🌱" title={t('No students yet')} text={t('Invite your first student to join.')} />}
      <div className="grid gap-4">
        {data.students.map(s => {
          const q = data.questionnaires.find(x => x.studentId === s.id)
          const check = data.placements.find(p => p.studentId === s.id)
          const lvl = check ? checkLevel(check.level) : q?.completedAt ? estimateLevel(q.answers) : null
          const next = data.lessons.find(l => l.studentId === s.id && l.status === 'planned' && new Date(l.startsAt) > new Date())
          const classes = data.lessons.filter(l => l.studentId === s.id && l.status === 'done').length
          return (
            <Card key={s.id} to={`/students/${s.id}`}>
              <div className="flex items-center gap-4">
                <Avatar name={s.name} size={60} />
                <div className="flex-1 min-w-0">
                  <div className="text-xl font-black">{s.name}</div>
                  <div className="text-muted">{lvl ? `${lvl.emoji} ${t(lvl.label)} · ${lvl.code}` : t('Questionnaire pending')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-sage-700">{classes}</div>
                  <div className="text-xs font-bold text-muted">{t('classes')}</div>
                </div>
              </div>
              {q && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {labels('interests', q.answers).slice(0, 4).map(l => <Chip key={l.label} tone="berry">{l.emoji} {t(l.label)}</Chip>)}
                  {labels('pace', q.answers).map(l => <Chip key={l.label} tone="sand">{l.emoji} {t(l.label)}</Chip>)}
                </div>
              )}
              {next && <div className="mt-3 text-[15px] font-bold text-sage-700">📅 {t('Next class')}: {friendlyDay(next.startsAt)}</div>}
            </Card>
          )
        })}
      </div>

      <Sheet open={invite} onClose={() => setInvite(false)} title={t('Invite a student')}>
        {store.mode === 'demo' ? (
          <p className="text-muted">{t('In demo mode, pick “A new student” on the welcome screen to try the questionnaire.')}</p>
        ) : (
          <>
            <p className="mb-4">{t('Send this link to your student. They create an account, answer the questionnaire, and appear here.')}</p>
            <div className="bg-white rounded-2xl border-2 border-sand p-4 font-bold break-all">{location.origin}</div>
            <Button full className="mt-4" onClick={() => { navigator.clipboard.writeText(location.origin); setInvite(false) }}>{t('Copy link')}</Button>
          </>
        )}
      </Sheet>
    </Page>
  )
}
