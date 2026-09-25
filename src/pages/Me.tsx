import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { Avatar, Button, Card, Field, Input, LinkButton, Page, SectionTitle, toast } from '../components/ui'
import { store } from '../lib'
import { useMe } from '../lib/hooks'
import { t } from '../lib/i18n'

export default function Me() {
  const me = useMe()
  const [name, setName] = useState(me.name)
  const isIOS = /iphone|ipad/i.test(navigator.userAgent)

  return (
    <Page back={true} title={t('My profile')}>
      <div className="flex flex-col items-center mb-6">
        <Avatar name={me.name} size={96} />
        <div className="text-2xl font-black mt-3">{me.name}</div>
        <div className="text-muted">{me.role === 'teacher' ? t('Teacher') : t('Student')}</div>
      </div>
      <Card>
        <Field label={t('Name')}><Input value={name} onChange={e => setName(e.target.value)} /></Field>
        <Button full disabled={!name.trim() || name === me.name} onClick={async () => { await store.updateProfile(me.id, { name: name.trim() }); toast(t('Saved')) }}>{t('Save')}</Button>
      </Card>

      {me.role === 'student' && (
        <>
          <SectionTitle>{t('My answers')}</SectionTitle>
          <LinkButton to="/questions" full variant="soft">✏️ {t('Update my questionnaire')}</LinkButton>
        </>
      )}

      <SectionTitle>{t('Put Espanish on your phone')}</SectionTitle>
      <Card className="text-[16px] leading-relaxed">
        {isIOS
          ? <p>{t('In Safari, tap the Share button')} <b>⬆︎</b> {t('and then')} <b>“{t('Add to Home Screen')}”</b>.</p>
          : <p>{t('Open the browser menu')} <b>⋮</b> {t('and choose')} <b>“{t('Install app')}”</b> {t('or')} <b>“{t('Add to Home screen')}”</b>.</p>}
      </Card>

      <SectionTitle>{t('Language')}</SectionTitle>
      <Card className="flex items-center justify-between"><span className="font-extrabold">English</span><span className="text-muted text-sm">{t('עברית coming soon')}</span></Card>

      <Button full variant="soft" className="mt-10" icon={<LogOut className="size-5" />} onClick={() => store.signOut()}>{t('Sign out')}</Button>
    </Page>
  )
}
