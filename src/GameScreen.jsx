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

export default function GameScreen({ puzzle, onOpenIntro, onOpenSettings, onComplete, isTutorial }) {
  const [hintsOpen, setHintsOpen] = useState(false)
  const [endScreenDismissed, setEndScreenDismissed] = useState(false)

  // Build key map once per puzzle (rank → 2-letter key)
  const keyMap = useMemo(() => buildItemKeys(puzzle.bank), [puzzle])

  const game = useGameState(puzzle)

  const gameStatus = game?.state.gameStatus
  const hailMaryTaken = game?.state.hailMaryTaken ?? false
  const gameOver = gameStatus === 'won' || gameStatus === 'abandoned'

  // Show end screen when game first ends, and again after hail mary is submitted
  useEffect(() => {
    if (gameStatus === 'won' || gameStatus === 'abandoned') setEndScreenDismissed(false)
  }, [gameStatus])

  useEffect(() => {
    if (hailMaryTaken) setEndScreenDismissed(false)
  }, [hailMaryTaken])

  if (!game) return null

  const { state, discoveredList, guessBankItem, confirmPending, cancelPending,
          placeItem, removeSlot, moveSlot, submitRanking, purchaseHint, resetGame, guessCategory } = game

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-bg)' }}>
      <Header
        categoryText={state.categoryGuessed ? puzzle.category : null}
        categoryHint={puzzle.hint ?? null}
        categoryMisses={state.categoryMisses}
        onGuessCategory={guessCategory}
        onOpenIntro={onOpenIntro}
        onOpenSettings={onOpenSettings}
      />

      {isTutorial && (
        <div
          className="shrink-0 px-4 py-2.5 text-center text-xs"
          style={{
            background: 'var(--color-bg-elevated)',
            borderBottom: '1px solid var(--color-border)',
            color: 'var(--color-text-faint)',
          }}
        >
          <span style={{ color: 'var(--color-text-strong)', fontWeight: 600 }}>Tutorial</span>
          {' '}— type guesses into the bank, then drag items into your ranking
        </div>
      )}

      <BankPanel
        discoveredList={discoveredList}
        bankTotal={puzzle.bank.length}
        rankSlots={state.rankSlots}
        bankMisses={state.bankMisses}
        pendingMatch={state.pendingMatch}
        gameOver={gameOver}
        onGuess={guessBankItem}
        onConfirm={confirmPending}
        onCancel={cancelPending}
        onPlaceItem={placeItem}
        onRemoveSlot={removeSlot}
      />

      <GuessHistory
        rankHistory={state.rankHistory}
        rankSlots={state.rankSlots}
      />

      <RankBoard
        rankSlots={state.rankSlots}
        lockedSlots={state.lockedSlots}
        onRemoveSlot={removeSlot}
        onMoveSlot={moveSlot}
        onSubmit={submitRanking}
      />

      <ScoreBar
        coins={state.coins}
        gameOver={gameOver}
        onHintsOpen={() => setHintsOpen(true)}
        onShowResults={gameOver ? () => setEndScreenDismissed(false) : null}
        onReset={resetGame}
      />

      {hintsOpen && (
        <HintModal
          coins={state.coins}
          allBankFound={discoveredList.length >= puzzle.bank.length}
          categoryGuessed={state.categoryGuessed}
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
          categoryText={gameStatus === 'abandoned' || !state.categoryGuessed ? puzzle.category : null}
          categorySource={puzzle.source ?? null}
          hailMaryTaken={hailMaryTaken}
          keyMap={keyMap}
          onClose={() => setEndScreenDismissed(true)}
          onComplete={onComplete}
        />
      )}
    </div>
  )
}
