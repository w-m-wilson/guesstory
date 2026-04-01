import { useState, useMemo, useEffect } from 'react'
import { useGameState } from './hooks/useGameState.js'
import { buildItemKeys } from './utils/itemKeys.js'
import Header from './components/Header.jsx'
import BankPanel from './components/BankPanel.jsx'
import GuessHistory from './components/GuessHistory.jsx'
import RankBoard from './components/RankBoard.jsx'
import ScoreBar from './components/ScoreBar.jsx'
import HintModal from './components/HintModal.jsx'
import EndScreen from './components/EndScreen.jsx'

export default function GameScreen({ puzzle, onOpenIntro }) {
  const [hintsOpen, setHintsOpen] = useState(false)
  const [endScreenDismissed, setEndScreenDismissed] = useState(false)

  // Build key map once per puzzle (rank → 2-letter key)
  const keyMap = useMemo(() => buildItemKeys(puzzle.bank), [puzzle])

  const game = useGameState(puzzle)

  // Hoist gameOver so it's available to useEffect (safe when game is null)
  const gameStatus = game?.state.gameStatus
  const gameOver = gameStatus === 'won' || gameStatus === 'abandoned'

  // Re-show end screen whenever a new game ends
  useEffect(() => {
    if (gameOver) setEndScreenDismissed(false)
  }, [gameOver])

  if (!game) return null

  const { state, discoveredList, guessBankItem, confirmPending, cancelPending,
          placeItem, removeSlot, submitRanking, purchaseHint, resetGame, guessCategory } = game

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-bg)' }}>
      <Header
        categoryText={state.categoryGuessed ? puzzle.category : null}
        onGuessCategory={guessCategory}
        onOpenIntro={onOpenIntro}
      />

      <BankPanel
        discoveredList={discoveredList}
        rankSlots={state.rankSlots}
        bankMisses={state.bankMisses}
        pendingMatch={state.pendingMatch}
        onGuess={guessBankItem}
        onConfirm={confirmPending}
        onCancel={cancelPending}
        onPlaceItem={placeItem}
      />

      <GuessHistory
        rankHistory={state.rankHistory}
        keyMap={keyMap}
      />

      <RankBoard
        rankSlots={state.rankSlots}
        lockedSlots={state.lockedSlots}
        rankHistory={state.rankHistory}
        onRemoveSlot={removeSlot}
        onSubmit={submitRanking}
      />

      <ScoreBar
        coins={state.coins}
        onHintsOpen={() => setHintsOpen(true)}
        onReset={resetGame}
      />

      {hintsOpen && (
        <HintModal
          coins={state.coins}
          onPurchase={purchaseHint}
          onClose={() => setHintsOpen(false)}
        />
      )}

      {gameOver && !endScreenDismissed && (
        <EndScreen
          puzzleId={puzzle.id}
          coins={state.coins}
          rankHistory={state.rankHistory}
          gameStatus={state.gameStatus}
          keyMap={keyMap}
          onClose={() => setEndScreenDismissed(true)}
        />
      )}
    </div>
  )
}
