import { useState } from 'react'
import { usePuzzle } from './hooks/usePuzzle.js'
import { useAppearance } from './hooks/useAppearance.js'
import { TUTORIAL_PUZZLE_1, TUTORIAL_PUZZLE_2 } from './data/tutorialPuzzle.js'
import GameScreen from './GameScreen.jsx'
import IntroModal from './components/IntroModal.jsx'
import SettingsModal, { AboutModal } from './components/SettingsModal.jsx'
import ArchiveModal from './components/ArchiveModal.jsx'
import ConfirmModal from './components/ConfirmModal.jsx'
import { AVAILABLE_DATES } from './data/puzzles/available.js'

const INTRO_SEEN_KEY = 'guesstory-intro-seen'
const TUTORIAL_SEEN_KEY = 'guesstory-tutorial-v2'

export default function App() {
  const { puzzle, dateKey, setDateKey, error, isArchive } = usePuzzle()
  const { scheme, mode, setScheme, setMode } = useAppearance()
  const [tutorialDone, setTutorialDone] = useState(() => !!localStorage.getItem(TUTORIAL_SEEN_KEY))
  const [tutorialPhase, setTutorialPhase] = useState(1)
  const [showHandoff, setShowHandoff] = useState(false)
  const [introOpen, setIntroOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [messageModal, setMessageModal] = useState(null) // { title, message }

  function completeTutorialPhase() {
    if (tutorialPhase === 1) {
      localStorage.removeItem('guesstory-state-tutorial-1')
      setTutorialPhase(2)
    } else {
      // Clean up tutorial states and show handoff screen before daily puzzle
      localStorage.removeItem('guesstory-state-tutorial-1')
      localStorage.removeItem('guesstory-state-tutorial-2')
      setShowHandoff(true)
    }
  }

  function confirmHandoff() {
    // Reset daily puzzle state if not yet won (so player starts fresh)
    if (puzzle) {
      const dailyKey = `guesstory-state-${puzzle.id}`
      try {
        const saved = JSON.parse(localStorage.getItem(dailyKey))
        if (saved && saved.gameStatus !== 'won') localStorage.removeItem(dailyKey)
      } catch { /* ignore */ }
    }
    localStorage.setItem(TUTORIAL_SEEN_KEY, '1')
    localStorage.setItem(INTRO_SEEN_KEY, '1')
    setShowHandoff(false)
    setTutorialDone(true)
  }

  function replayTutorial() {
    localStorage.removeItem(TUTORIAL_SEEN_KEY)
    localStorage.removeItem('guesstory-state-tutorial-1')
    localStorage.removeItem('guesstory-state-tutorial-2')
    setTutorialPhase(1)
    setTutorialDone(false)
  }

  function openIntro() {
    setIntroOpen(true)
  }

  function closeIntro() {
    localStorage.setItem(INTRO_SEEN_KEY, '1')
    setIntroOpen(false)
  }

  if (!tutorialDone) {
    if (showHandoff) {
      return (
        <div
          className="fixed inset-0 flex flex-col items-center justify-center px-8 text-center fade-in"
          style={{ backgroundColor: 'var(--color-bg)' }}
        >
          <div
            className="mb-5 w-12 h-12 rounded-full flex items-center justify-center text-xl"
            style={{ background: 'var(--color-action)', color: 'var(--color-action-text)' }}
          >
            ✓
          </div>
          <h1 className="text-2xl font-black mb-3" style={{ color: 'var(--color-text-strong)' }}>
            You've got it.
          </h1>
          <p className="text-sm max-w-xs mb-2" style={{ color: 'var(--color-text)' }}>
            A new puzzle drops every day. Today's is waiting.
          </p>
          <p className="text-xs max-w-xs mb-10" style={{ color: 'var(--color-text-faint)' }}>
            You can always revisit the tutorial or open the guide (?) while playing.
          </p>
          <button
            onClick={confirmHandoff}
            className="w-full max-w-xs py-3.5 rounded-xl text-base font-bold"
            style={{ background: 'var(--color-action)', color: 'var(--color-action-text)' }}
          >
            Play today's puzzle →
          </button>
        </div>
      )
    }

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
            Guesstory is designed for portrait mode
          </p>
        </div>

        <GameScreen
          key={`tutorial-${tutorialPhase}`}
          puzzle={tutorialPhase === 1 ? TUTORIAL_PUZZLE_1 : TUTORIAL_PUZZLE_2}
          tutorialMode={tutorialPhase === 1 ? 'learn' : 'explore'}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenAbout={() => setAboutOpen(true)}
          onComplete={completeTutorialPhase}
          isTutorial
        />
        <div
          className="fixed bottom-4 left-0 right-0 flex justify-center z-40 pointer-events-none"
        >
          <button
            className="pointer-events-auto text-xs px-3 py-1 rounded-full"
            style={{ color: 'var(--color-text-faint)', background: 'var(--color-bg-elevated)' }}
            onClick={() => {
              localStorage.removeItem('guesstory-state-tutorial-1')
              localStorage.removeItem('guesstory-state-tutorial-2')
              localStorage.setItem(TUTORIAL_SEEN_KEY, '1')
              localStorage.setItem(INTRO_SEEN_KEY, '1')
              setTutorialDone(true)
            }}
          >
            Skip tutorial
          </button>
        </div>
        {introOpen && <IntroModal onClose={closeIntro} onReplayTutorial={replayTutorial} />}
        {settingsOpen && <SettingsModal scheme={scheme} mode={mode} onScheme={setScheme} onMode={setMode} onClose={() => setSettingsOpen(false)} />}
        {aboutOpen && <AboutModal mode={mode} onClose={() => setAboutOpen(false)} />}
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
          Guesstory is designed for portrait mode
        </p>
      </div>

      <GameScreen 
        key={puzzle.id} 
        puzzle={puzzle} 
        isArchive={isArchive}
        onOpenIntro={openIntro} 
        onOpenSettings={() => setSettingsOpen(true)} 
        onOpenAbout={() => setAboutOpen(true)} 
        onOpenArchive={() => setArchiveOpen(true)}
        onJumpToToday={() => {
          const today = new Date().toISOString().split('T')[0]
          if (AVAILABLE_DATES.includes(today)) {
            setDateKey(today)
          } else {
            setMessageModal({
              title: "Coming soon",
              message: "Today's daily puzzle hasn't dropped yet. Check back later or explore the archives!",
              archiveAction: true,
            })
          }
        }}
      />

      {introOpen && <IntroModal onClose={closeIntro} onReplayTutorial={replayTutorial} />}
      {settingsOpen && <SettingsModal scheme={scheme} mode={mode} onScheme={setScheme} onMode={setMode} onClose={() => setSettingsOpen(false)} />}
      {aboutOpen && <AboutModal mode={mode} onClose={() => setAboutOpen(false)} />}
      {archiveOpen && <ArchiveModal activeDate={dateKey} onSelect={setDateKey} onClose={() => setArchiveOpen(false)} />}
      {messageModal && (
        <ConfirmModal
          title={messageModal.title}
          message={messageModal.message}
          confirmLabel="Got it"
          onConfirm={() => setMessageModal(null)}
          onClose={() => setMessageModal(null)}
          secondaryLabel={messageModal.archiveAction ? 'Archives' : undefined}
          onSecondary={messageModal.archiveAction ? () => { setMessageModal(null); setArchiveOpen(true) } : undefined}
        />
      )}
    </>
  )
}
