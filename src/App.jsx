import { useState } from 'react'
import { usePuzzle } from './hooks/usePuzzle.js'
import { useAppearance } from './hooks/useAppearance.js'
import { TUTORIAL_PUZZLE } from './data/tutorialPuzzle.js'
import GameScreen from './GameScreen.jsx'
import IntroModal from './components/IntroModal.jsx'
import SettingsModal from './components/SettingsModal.jsx'

const INTRO_SEEN_KEY = 'rankie-intro-seen'
const TUTORIAL_SEEN_KEY = 'rankie-tutorial-seen-v1'

export default function App() {
  const { puzzle, error } = usePuzzle()
  const { scheme, mode, setScheme, setMode } = useAppearance()
  const [tutorialDone, setTutorialDone] = useState(() => !!localStorage.getItem(TUTORIAL_SEEN_KEY))
  const [introOpen, setIntroOpen] = useState(() => !localStorage.getItem(INTRO_SEEN_KEY))
  const [settingsOpen, setSettingsOpen] = useState(false)

  function completeTutorial() {
    // Clean up tutorial game state
    localStorage.removeItem('ranked-state-tutorial')
    // Reset daily puzzle state if not yet won (so player starts fresh)
    if (puzzle) {
      const dailyKey = `ranked-state-${puzzle.id}`
      try {
        const saved = JSON.parse(localStorage.getItem(dailyKey))
        if (saved && saved.gameStatus !== 'won') localStorage.removeItem(dailyKey)
      } catch { /* ignore */ }
    }
    localStorage.setItem(TUTORIAL_SEEN_KEY, '1')
    localStorage.setItem(INTRO_SEEN_KEY, '1')
    setTutorialDone(true)
  }

  function openIntro() {
    setIntroOpen(true)
  }

  function closeIntro() {
    localStorage.setItem(INTRO_SEEN_KEY, '1')
    setIntroOpen(false)
  }

  if (!tutorialDone) {
    return (
      <>
        <div
          className="portrait-only-warning fixed inset-0 z-[100] flex-col items-center justify-center gap-3 text-center px-8"
          style={{ background: 'var(--color-bg)' }}
        >
          <span style={{ fontSize: '2rem' }}>↩</span>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-strong)' }}>
            Please rotate to portrait
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
            Reckon is designed for portrait mode
          </p>
        </div>

        <GameScreen
          key="tutorial"
          puzzle={TUTORIAL_PUZZLE}
          onOpenSettings={() => setSettingsOpen(true)}
          onComplete={completeTutorial}
          isTutorial
        />
        <div
          className="fixed bottom-4 left-0 right-0 flex justify-center z-40 pointer-events-none"
        >
          <button
            className="pointer-events-auto text-xs px-3 py-1 rounded-full"
            style={{ color: 'var(--color-text-faint)', background: 'var(--color-bg-elevated)' }}
            onClick={completeTutorial}
          >
            Skip tutorial
          </button>
        </div>
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
      <div
        className="portrait-only-warning fixed inset-0 z-[100] flex-col items-center justify-center gap-3 text-center px-8"
        style={{ background: 'var(--color-bg)' }}
      >
        <span style={{ fontSize: '2rem' }}>↩</span>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-strong)' }}>
          Please rotate to portrait
        </p>
        <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
          Reckon is designed for portrait mode
        </p>
      </div>

      <GameScreen key={puzzle.id} puzzle={puzzle} onOpenIntro={openIntro} onOpenSettings={() => setSettingsOpen(true)} />
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
