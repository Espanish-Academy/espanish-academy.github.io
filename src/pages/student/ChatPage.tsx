import { ChatThread } from '../../components/Chat'
import { Avatar, Spinner } from '../../components/ui'
import { store } from '../../lib'
import { useData, useMe } from '../../lib/hooks'
import { t } from '../../lib/i18n'

export default function StudentChat() {
  const me = useMe()
  const { data: teacher, loading } = useData(() => store.getTeacher(), [])
  if (loading) return <Spinner />
  return (
    <div className="animate-rise">
      <header className="flex items-center gap-3 mb-4">
        {teacher && <Avatar name={teacher.name} size={52} />}
        <div>
          <h1 className="text-2xl font-black">{teacher?.name ?? t('Your teacher')}</h1>
          <p className="text-muted text-[15px]">{t('Only about Spanish — photos, links, questions')}</p>
        </div>
      </header>
      <ChatThread studentId={me.id} me={me} other={teacher ?? null} />
    </div>
  )
}
