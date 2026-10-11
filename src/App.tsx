import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout, icons, type NavItem } from './components/Layout'
import { unreadFor } from './components/Chat'
import { Logo, Spinner, Toaster } from './components/ui'
import { store } from './lib'
import { SessionProvider, useData, useLocale, useSession } from './lib/hooks'
import { preview } from './lib/preview'
import { t } from './lib/i18n'
import type { Profile } from './lib/types'
import Me from './pages/Me'
import Onboarding from './pages/Onboarding'
import Welcome from './pages/Welcome'
import StudentCalendar from './pages/student/CalendarPage'
import StudentChat from './pages/student/ChatPage'
import StudentHome from './pages/student/Home'
import Journey, { LessonView } from './pages/student/Journey'
import Practice from './pages/student/Practice'
import StudentTasks from './pages/student/Tasks'
import TaskView from './pages/student/TaskView'
import Inbox from './pages/teacher/Inbox'
import LessonEditor from './pages/teacher/LessonEditor'
import Preview from './pages/teacher/Preview'
import StudentDetail from './pages/teacher/StudentDetail'
import Students from './pages/teacher/Students'
import TaskEditor from './pages/teacher/TaskEditor'
import TeacherCalendar from './pages/teacher/TeacherCalendar'
import TeacherToday from './pages/teacher/Today'

function StudentApp({ me }: { me: Profile }) {
  const { data } = useData(async () => {
    const [q, messages, tasks, subs] = await Promise.all([store.getQuestionnaire(me.id), store.listMessages(me.id), store.listTasks(me.id), store.listSubmissions(me.id)])
    return { done: !!q?.completedAt, unread: unreadFor(messages, me.id), todo: tasks.filter(x => !subs.some(s => s.taskId === x.id)).length }
  }, [me.id])
  if (!data) return <Spinner />
  if (!data.done) return <Routes><Route path="*" element={<Onboarding />} /></Routes>

  const nav: NavItem[] = [
    { to: '/', label: t('Home'), icon: icons.Home, end: true },
    { to: '/chat', label: t('Chat'), icon: icons.Chat, badge: data.unread },
    { to: '/tasks', label: t('Tasks'), icon: icons.Tasks, badge: data.todo },
    { to: '/journey', label: t('Journey'), icon: icons.Journey },
    { to: '/calendar', label: t('Calendar'), icon: icons.Calendar },
  ]
  return (
    <Routes>
      <Route path="/questions" element={<Onboarding edit />} />
      <Route element={<AppLayout items={nav} />}>
        <Route index element={<StudentHome />} />
        <Route path="chat" element={<StudentChat />} />
        <Route path="tasks" element={<StudentTasks />} />
        <Route path="tasks/:id" element={<TaskView />} />
        <Route path="journey" element={<Journey />} />
        <Route path="journey/:id" element={<LessonView />} />
        <Route path="practice" element={<Practice />} />
        <Route path="calendar" element={<StudentCalendar />} />
        <Route path="me" element={<Me />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

function TeacherApp({ me }: { me: Profile }) {
  const { data } = useData(async () => unreadFor(await store.listMessages(), me.id), [me.id])
  const nav: NavItem[] = [
    { to: '/', label: t('Today'), icon: icons.Home, end: true },
    { to: '/students', label: t('Students'), icon: icons.Students },
    { to: '/inbox', label: t('Messages'), icon: icons.Chat, badge: data ?? 0 },
    { to: '/calendar', label: t('Calendar'), icon: icons.Calendar },
  ]
  return (
    <Routes>
      <Route element={<AppLayout items={nav} />}>
        <Route index element={<TeacherToday />} />
        <Route path="students" element={<Students />} />
        <Route path="students/:id" element={<StudentDetail />} />
        <Route path="students/:id/preview" element={<Preview />} />
        <Route path="students/:id/lesson/:lessonId" element={<LessonEditor />} />
        <Route path="students/:id/task/:taskId" element={<TaskEditor />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="calendar" element={<TeacherCalendar />} />
        <Route path="me" element={<Me />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

function Root() {
  const { user, ready } = useSession()
  const locale = useLocale()
  if (!ready) return <div className="min-h-dvh grid place-items-center"><div className="animate-pop"><Logo size={80} /></div></div>
  if (!user) return preview ? <div className="min-h-dvh grid place-items-center text-muted p-8 text-center">{t('Sign in as the teacher to use the preview.')}</div> : <Welcome key={locale} />
  // key: remount everything when switching accounts or language
  return user.role === 'teacher' ? <TeacherApp key={user.id + locale} me={user} /> : <StudentApp key={user.id + locale} me={user} />
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <SessionProvider>
        <Root />
        <Toaster />
      </SessionProvider>
    </BrowserRouter>
  )
}
