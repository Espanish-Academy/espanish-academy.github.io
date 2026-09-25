import { Avatar, CountBadge, Empty, Page, Row, Spinner } from '../../components/ui'
import { useMe } from '../../lib/hooks'
import { t } from '../../lib/i18n'
import { friendlyDay } from '../../lib/util'
import { useTeacherData } from './data'

export default function Inbox() {
  const me = useMe()
  const { data } = useTeacherData()
  if (!data) return <Spinner />
  const threads = data.students.map(s => {
    const msgs = data.messages.filter(m => m.studentId === s.id)
    return { s, last: msgs.at(-1), unread: msgs.filter(m => m.senderId !== me.id && !m.readAt).length }
  }).sort((a, b) => (b.last?.createdAt ?? '').localeCompare(a.last?.createdAt ?? ''))

  return (
    <Page title={t('Messages')} subtitle={t('One calm place per student — only about Spanish')}>
      {!threads.length && <Empty emoji="💬" title={t('No students yet')} />}
      <div className="grid gap-3">
        {threads.map(({ s, last, unread }) => (
          <Row key={s.id} to={`/students/${s.id}?tab=chat`} icon={<Avatar name={s.name} size={48} />}
            title={<span className="flex items-center gap-2">{s.name}<CountBadge n={unread} /></span>}
            subtitle={last ? `${friendlyDay(last.createdAt)} · ${last.senderId === me.id ? t('You') + ': ' : ''}${last.imageUrl && !last.text ? '📷' : last.text}` : t('Say hola!')} />
        ))}
      </div>
    </Page>
  )
}
