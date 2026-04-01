import { useState } from 'react'
import { useGameState } from './hooks/useGameState.js'
import Header from './components/Header.jsx'
import BankPanel from './components/BankPanel.jsx'
import RankBoard from './components/RankBoard.jsx'
import ScoreBar from './components/ScoreBar.jsx'
import HintModal from './components/HintModal.jsx'
import EndScreen from './components/EndScreen.jsx'

export default function GameScreen({ puzzle }) {
  const [hintsOpen, setHintsOpen] = useState(false)

  const game = useGameState(puzzle)

  if (!game) return null

  const { state, discoveredList, guessBankItem, confirmPending, cancelPending,
          placeItem, removeSlot, submitRanking, purchaseHint } = game

  const gameOver = state.gameStatus === 'won' || state.gameStatus === 'abandoned'

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-bg)' }}>
      <Header />

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

      <RankBoard
        rankSlots={state.rankSlots}
        rankHistory={state.rankHistory}
        onRemoveSlot={removeSlot}
        onSubmit={submitRanking}
      />

      <ScoreBar
        coins={state.coins}
        onHintsOpen={() => setHintsOpen(true)}
      />

      {hintsOpen && (
        <HintModal
          coins={state.coins}
          onPurchase={purchaseHint}
          onClose={() => setHintsOpen(false)}
        />
      )}

      {gameOver && (
        <EndScreen
          puzzleId={puzzle.id}
          coins={state.coins}
          rankHistory={state.rankHistory}
          gameStatus={state.gameStatus}
        />
      )}
    </div>
  )
}
