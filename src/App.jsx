import { useState } from 'react'
import { usePuzzle } from './hooks/usePuzzle.js'
import { useAppearance } from './hooks/useAppearance.js'
import GameScreen from './GameScreen.jsx'
import IntroModal from './components/IntroModal.jsx'
import SettingsModal from './components/SettingsModal.jsx'

const INTRO_SEEN_KEY = 'rankie-intro-seen'

export default function App() {
  const { puzzle, error } = usePuzzle()
  const { scheme, mode, setScheme, setMode } = useAppearance()
  const [introOpen, setIntroOpen] = useState(() => !localStorage.getItem(INTRO_SEEN_KEY))
  const [settingsOpen, setSettingsOpen] = useState(false)

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
      <GameScreen puzzle={puzzle} onOpenIntro={openIntro} onOpenSettings={() => setSettingsOpen(true)} />
      {introOpen && <IntroModal onClose={closeIntro} />}
      {settingsOpen && (
        <SettingsModal
          scheme={scheme}
          mode={mode}
          onScheme={setScheme}
          onMode={setMode}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </>
  )
}
