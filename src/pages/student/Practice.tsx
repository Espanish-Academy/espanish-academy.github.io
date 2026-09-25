import confetti from 'canvas-confetti'
import { Volume2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Empty, Page, ProgressBar, Spinner, cx } from '../../components/ui'
import { store } from '../../lib'
import { useData, useMe } from '../../lib/hooks'
import { t } from '../../lib/i18n'
import type { VocabItem } from '../../lib/types'
import { speak } from '../../lib/util'

/** Flashcards with every word from past classes. */
export default function Practice() {
  const me = useMe()
  const { data: lessons } = useData(() => store.listLessons(me.id), [me.id])
  if (!lessons) return <Spinner />
  const words = lessons.filter(l => l.status === 'done').flatMap(l => l.vocab)
  if (!words.length) return <Page back="/" title={t('Practise')}><Empty emoji="🌱" title={t('No words yet')} text={t('New words from your classes will appear here.')} /></Page>
  return <Cards words={words} />
}

function Cards({ words }: { words: VocabItem[] }) {
  const nav = useNavigate()
  const deck = useMemo(() => [...words].sort(() => Math.random() - 0.5).slice(0, 10), [words])
  const [queue, setQueue] = useState(deck)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState(0)
  const card = queue[0]

  const answer = (knew: boolean) => {
    setFlipped(false)
    if (knew) setKnown(k => k + 1)
    const rest = queue.slice(1)
    const nextQueue = knew ? rest : [...rest, card]
    if (!nextQueue.length) confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 }, colors: ['#5C9468', '#B05C70', '#F0C067'] })
    setQueue(nextQueue)
  }

  if (!card) {
    return (
      <div className="min-h-[70dvh] flex flex-col items-center justify-center text-center animate-pop">
        <div className="text-7xl">🏅</div>
        <h1 className="text-3xl font-black mt-4">{t('¡Perfecto!')}</h1>
        <p className="text-lg text-muted mt-2">{t('You practised {n} words.', { n: deck.length })}</p>
        <Button size="lg" pulse className="mt-8 min-w-60" onClick={() => nav('/')}>{t('Done')}</Button>
      </div>
    )
  }

  return (
    <div className="min-h-[75dvh] flex flex-col">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => nav(-1)} aria-label={t('Close')} className="size-10 rounded-full grid place-items-center text-muted hover:bg-sand"><X className="size-6" /></button>
        <ProgressBar value={known / deck.length} className="flex-1" />
      </div>
      <p className="text-center text-muted font-bold mb-4">{flipped ? t('Did you know it?') : t('Tap the card to see the meaning')}</p>
      <button key={card.es + queue.length} onClick={() => { setFlipped(f => !f); if (!flipped) speak(card.es) }}
        className={cx('flex-1 min-h-72 rounded-[36px] border-2 border-b-[6px] p-8 flex flex-col items-center justify-center gap-4 transition animate-pop',
          flipped ? 'bg-sage-50 border-sage-300' : 'bg-white border-sand')}>
        <span className="text-4xl font-black text-center" lang="es">{card.es}</span>
        {flipped && <span className="text-2xl text-sage-700 font-bold animate-rise">{card.en}</span>}
        <span onClick={e => { e.stopPropagation(); speak(card.es) }} className="mt-2 size-14 rounded-full bg-berry-500 text-white grid place-items-center"><Volume2 className="size-7" /></span>
      </button>
      <div className="grid grid-cols-2 gap-3 mt-6">
        {flipped ? (
          <>
            <Button size="lg" variant="soft" onClick={() => answer(false)}>🔁 {t('Again')}</Button>
            <Button size="lg" pulse onClick={() => answer(true)}>✓ {t('I knew it')}</Button>
          </>
        ) : (
          <Button size="lg" pulse className="col-span-2" onClick={() => { setFlipped(true); speak(card.es) }}>{t('Show')}</Button>
        )}
      </div>
    </div>
  )
}
