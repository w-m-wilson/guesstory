import { useState, useEffect } from 'react'
import { usePuzzle } from './hooks/usePuzzle.js'
import { useAppearance } from './hooks/useAppearance.js'
import GameScreen from './GameScreen.jsx'
import IntroModal from './components/IntroModal.jsx'
import SettingsModal from './components/SettingsModal.jsx'

const INTRO_SEEN_KEY = 'rankie-intro-seen'

export default function App() {
  useEffect(() => {
    const vv = window.visualViewport
    const root = document.getElementById('root')
    if (!vv || !root) return
    function update() {
      root.style.top = `${vv.offsetTop}px`
      root.style.height = `${vv.height}px`
      root.style.bottom = 'auto'
    }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

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
      <div
        className="portrait-only-warning fixed inset-0 z-[100] flex-col items-center justify-center gap-3 text-center px-8"
        style={{ background: 'var(--color-bg)' }}
      >
        <span style={{ fontSize: '2rem' }}>↩</span>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-strong)' }}>
          Please rotate to portrait
        </p>
        <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
          Rankie is designed for portrait mode
        </p>
      </div>

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
