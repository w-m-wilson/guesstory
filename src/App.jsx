import { usePuzzle } from './hooks/usePuzzle.js'
import GameScreen from './GameScreen.jsx'

export default function App() {
  const { puzzle, error } = usePuzzle()

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

  return <GameScreen puzzle={puzzle} />
}
