import { Lock, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AttachmentEditor } from '../../components/AttachmentEditor'
import { Button, Card, ChipsInput, Field, Input, Page, Segmented, SectionTitle, Spinner, TextArea, cx, toast } from '../../components/ui'
import { store } from '../../lib'
import { useMe } from '../../lib/hooks'
import { t } from '../../lib/i18n'
import type { Lesson, LessonNote, Profile } from '../../lib/types'
import { firstName, friendlyWhen, uid } from '../../lib/util'

const pad = (n: number) => String(n).padStart(2, '0')
const toLocalInput = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function LessonEditor() {
  const { id: studentId = '', lessonId = 'new' } = useParams()
  const [params] = useSearchParams()
  const nav = useNavigate()
  const me = useMe()
  const [student, setStudent] = useState<Profile | null>(null)
  const [l, setL] = useState<Lesson | null>(null)
  const [n, setN] = useState<LessonNote | null>(null)
  const [wasStatus, setWasStatus] = useState<Lesson['status'] | null>(null)
  const [notify, setNotify] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    (async () => {
      setStudent(await store.getProfile(studentId))
      const lessons = await store.listLessons(studentId)
      let lesson = lessons.find(x => x.id === lessonId)
      if (!lesson) {
        const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(18, 0, 0, 0)
        const last = lessons.at(-1)
        if (last) { const ld = new Date(last.startsAt); d.setHours(ld.getHours(), ld.getMinutes()) }
        lesson = { id: uid(), studentId, startsAt: d.toISOString(), durationMin: last?.durationMin ?? 60, status: 'planned', title: params.get('title') ?? '', topics: [], vocab: [], summary: '', materials: [], recordingUrl: '' }
      } else setWasStatus(lesson.status)
      setL(lesson)
      const notes = await store.listLessonNotes(studentId)
      setN(notes.find(x => x.lessonId === lesson!.id) ?? { lessonId: lesson.id, studentId, mood: null, struggles: [], skip: [], workOn: [], privateText: '' })
    })()
  }, [studentId, lessonId, params])

  if (!l || !n) return <Spinner />
  const set = (p: Partial<Lesson>) => setL({ ...l, ...p })
  const setNote = (p: Partial<LessonNote>) => setN({ ...n, ...p })
  const isNew = !wasStatus
  const done = l.status === 'done'
  const name = firstName(student?.name ?? '')

  const save = async () => {
    setBusy(true)
    try {
      const clean = { ...l, vocab: l.vocab.filter(v => v.es.trim()) }
      await store.saveLesson(clean)
      const hasNote = n.mood || n.struggles.length || n.skip.length || n.workOn.length || n.privateText.trim()
      if (hasNote) await store.saveLessonNote(n)
      if (notify) {
        if (isNew && l.status === 'planned') await store.sendMessage({ studentId, senderId: me.id, text: `📅 ${t('New class')}: ${friendlyWhen(l.startsAt)}${l.title ? ` — ${l.title}` : ''}` })
        else if (done && wasStatus !== 'done') await store.sendMessage({ studentId, senderId: me.id, text: `📘 ${t('The summary of our class is ready in “My journey”. ¡Muy bien hoy!')}` })
      }
      toast(t('Saved'))
      nav(`/students/${studentId}?tab=classes`)
    } catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false) }
  }

  const remove = async () => {
    if (!confirm(t('Delete this class?'))) return
    await store.deleteLesson(l.id)
    nav(`/students/${studentId}?tab=classes`)
  }

  return (
    <Page back={`/students/${studentId}?tab=classes`} title={isNew ? t('Plan a class') : t('Class with {name}', { name })}
      action={!isNew && <button onClick={remove} aria-label={t('Delete')} className="size-11 rounded-2xl grid place-items-center text-berry-500 hover:bg-berry-50"><Trash2 className="size-5" /></button>}>

      <Segmented value={l.status} onChange={status => set({ status })} options={[
        { value: 'planned', label: `📅 ${t('Planned')}` }, { value: 'done', label: `✅ ${t('Done')}` }, { value: 'cancelled', label: `🚫 ${t('Cancelled')}` },
      ]} />

      <div className="grid grid-cols-[1fr_auto] gap-3 mt-5">
        <Field label={t('When')}><Input type="datetime-local" value={toLocalInput(l.startsAt)} onChange={e => e.target.value && set({ startsAt: new Date(e.target.value).toISOString() })} /></Field>
        <Field label={t('Minutes')}><Input type="number" min={15} step={15} className="w-24" value={l.durationMin} onChange={e => set({ durationMin: Number(e.target.value) || 60 })} /></Field>
      </div>
      <Field label={t('Title')}><Input value={l.title} onChange={e => set({ title: e.target.value })} placeholder={t('e.g. En el mercado — at the market')} /></Field>
      <Field label={t('Topics')} hint={t('Press Enter after each one')}><ChipsInput value={l.topics} onChange={topics => set({ topics })} placeholder={t('e.g. Colours, ¿cuánto cuesta?')} /></Field>

      <SectionTitle>{t('New words')}</SectionTitle>
      <div className="grid gap-2">
        {l.vocab.map((v, i) => (
          <div key={i} className="flex gap-2">
            <Input value={v.es} placeholder="español" lang="es" onChange={e => set({ vocab: l.vocab.map((x, j) => (j === i ? { ...x, es: e.target.value } : x)) })} />
            <Input value={v.en} placeholder="English" onChange={e => set({ vocab: l.vocab.map((x, j) => (j === i ? { ...x, en: e.target.value } : x)) })} />
            <button onClick={() => set({ vocab: l.vocab.filter((_, j) => j !== i) })} className="shrink-0 size-12 rounded-2xl grid place-items-center hover:bg-sand" aria-label={t('Remove')}><X className="size-5" /></button>
          </div>
        ))}
        <Button variant="soft" icon={<Plus className="size-5" />} onClick={() => set({ vocab: [...l.vocab, { es: '', en: '' }] })}>{t('Add a word')}</Button>
      </div>

      <SectionTitle>{done ? t('Summary for {name}', { name }) : t('Note for {name} (optional)', { name })}</SectionTitle>
      <TextArea rows={4} value={l.summary} onChange={e => set({ summary: e.target.value })}
        placeholder={done ? t('What we learned today — {name} will see this in “My journey”', { name }) : t('What to prepare or bring')} />

      <SectionTitle>{t('Materials')}</SectionTitle>
      <AttachmentEditor value={l.materials} onChange={materials => set({ materials })} />
      <div className="mt-3"><Field label={t('Recording link (optional)')}><Input value={l.recordingUrl ?? ''} onChange={e => set({ recordingUrl: e.target.value })} placeholder="https://…" /></Field></div>

      {(done || !isNew) && (
        <>
          <SectionTitle><span className="flex items-center gap-2"><Lock className="size-4 text-berry-500" />{t('Private notes — only you')}</span></SectionTitle>
          <Card className="!bg-berry-50/60 !border-berry-100">
            <div className="font-extrabold mb-2">{t('How did it go?')}</div>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[{ v: 1, e: '😕', l: 'Hard' }, { v: 2, e: '🙂', l: 'OK' }, { v: 3, e: '🤩', l: 'Great' }].map(m => (
                <button key={m.v} onClick={() => setNote({ mood: m.v })}
                  className={cx('rounded-2xl border-2 py-3 flex flex-col items-center font-extrabold', n.mood === m.v ? 'bg-white border-berry-300' : 'bg-white/50 border-transparent')}>
                  <span className="text-3xl">{m.e}</span>{t(m.l)}
                </button>
              ))}
            </div>
            <Field label={t('Struggled with')}><ChipsInput tone="berry" value={n.struggles} onChange={struggles => setNote({ struggles })} placeholder={t('e.g. rolling the r')} /></Field>
            <Field label={t('Work on more next time')}><ChipsInput value={n.workOn} onChange={workOn => setNote({ workOn })} placeholder={t('e.g. tener')} /></Field>
            <Field label={t('Doesn’t need for now')}><ChipsInput tone="sun" value={n.skip} onChange={skip => setNote({ skip })} placeholder={t('e.g. usted')} /></Field>
            <Field label={t('Notes')}><TextArea value={n.privateText} onChange={e => setNote({ privateText: e.target.value })} /></Field>
          </Card>
        </>
      )}

      {(isNew || (done && wasStatus !== 'done')) && (
        <label className="flex items-center gap-3 mt-6 font-bold">
          <input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} className="size-5 accent-sage-500" />
          {t('Let {name} know in the chat', { name })}
        </label>
      )}
      <Button size="lg" full pulse busy={busy} className="mt-6" onClick={save}>{t('Save')}</Button>
    </Page>
  )
}
