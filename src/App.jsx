import { useState } from 'react'
import { usePuzzle } from './hooks/usePuzzle.js'
import GameScreen from './GameScreen.jsx'
import IntroModal from './components/IntroModal.jsx'

const INTRO_SEEN_KEY = 'rankie-intro-seen'

export default function App() {
  const { puzzle, error } = usePuzzle()
  const [introOpen, setIntroOpen] = useState(() => !localStorage.getItem(INTRO_SEEN_KEY))

  function openIntro() {
    setIntroOpen(true)
  }

  function closeIntro() {
    localStorage.setItem(INTRO_SEEN_KEY, '1')
    setIntroOpen(false)
  }

  if (error) return (
    <div className="flex items-center justify-center h-dvh text-sm" style={{ color: 'var(--color-text-faint)' }}>
      {error}
    </div>
  )

  if (!puzzle) return (
    <div className="flex items-center justify-center h-dvh text-sm" style={{ color: 'var(--color-text-faint)' }}>
      Loading…
    </div>
  )

  return (
    <>
      <GameScreen puzzle={puzzle} onOpenIntro={openIntro} />
      {introOpen && <IntroModal onClose={closeIntro} />}
    </>
  )
}
