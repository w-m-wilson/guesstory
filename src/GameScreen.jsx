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
import TutorialBanner from './components/TutorialBanner.jsx'

export default function GameScreen({ puzzle, onOpenIntro, onOpenSettings, onComplete, isTutorial, tutorialMode = 'learn' }) {
  const [hintsOpen, setHintsOpen] = useState(false)
  const [endScreenDismissed, setEndScreenDismissed] = useState(false)

  // Build key map once per puzzle (rank → 2-letter key)
  const keyMap = useMemo(() => buildItemKeys(puzzle.bank), [puzzle])

  const game = useGameState(puzzle)

  // Derive primitives before the null guard so tutorial effects can reference them safely
  const discoveredList = game?.discoveredList ?? []
  const tutorialRankSlots = game?.state?.rankSlots ?? [null, null, null, null, null]
  const tutorialRankHistory = game?.state?.rankHistory ?? []
  const tutorialGameStatus = game?.state?.gameStatus ?? 'playing'

  // Tutorial step: null for non-tutorial screens; 0 = welcome overlay
  const [tutorialStep, setTutorialStep] = useState(() => isTutorial ? 0 : null)

  function handleTutorialBegin() { setTutorialStep(1) }

  // Phase 1 → 2: player has found at least 5 items (learn mode only)
  useEffect(() => {
    if (tutorialMode === 'learn' && tutorialStep === 1 && discoveredList.length >= 5) setTutorialStep(2)
  }, [tutorialMode, tutorialStep, discoveredList.length])

  // Phase 2 → 3: all 5 rank slots are filled (learn mode only)
  useEffect(() => {
    if (tutorialMode === 'learn' && tutorialStep === 2 && tutorialRankSlots.every(Boolean)) setTutorialStep(3)
  }, [tutorialMode, tutorialStep, tutorialRankSlots])

  // Phase 3 → done: player wins (learn mode only — banner stays after first submit to explain dots)
  useEffect(() => {
    if (tutorialMode === 'learn' && tutorialStep === 3 && tutorialGameStatus === 'won') {
      setTutorialStep(4)
    }
  }, [tutorialMode, tutorialStep, tutorialGameStatus])

  // Show end screen when game first ends, and again after hail mary is submitted
  const gameStatus = game?.state.gameStatus
  const hailMaryTaken = game?.state.hailMaryTaken ?? false

  useEffect(() => {
    if (gameStatus === 'won' || gameStatus === 'abandoned') setEndScreenDismissed(false)
  }, [gameStatus])

  useEffect(() => {
    if (hailMaryTaken) setEndScreenDismissed(false)
  }, [hailMaryTaken])

  if (!game) return null

  const { state, guessBankItem, confirmPending, cancelPending,
          placeItem, removeSlot, moveSlot, submitRanking, purchaseHint, resetGame, guessCategory } = game

  const gameOver = gameStatus === 'won' || gameStatus === 'abandoned'

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-bg)' }}>
      <Header
        categoryText={state.categoryGuessed ? puzzle.category : null}
        categoryAutoReveal={['2026-04-04', '2026-04-06'].includes(puzzle.id) && !state.categoryGuessed ? puzzle.category : null}
        categoryHint={puzzle.hint ?? null}
        categoryMisses={state.categoryMisses}
        onGuessCategory={guessCategory}
        onOpenIntro={onOpenIntro}
        onOpenSettings={onOpenSettings}
      />

      {isTutorial && tutorialStep !== null && (
        <TutorialBanner
          step={tutorialStep}
          discoveredCount={discoveredList.length}
          rankHistoryLength={tutorialRankHistory.length}
          onBegin={handleTutorialBegin}
          mode={tutorialMode}
        />
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
          completeCTA={isTutorial && tutorialMode === 'learn' ? 'Play tutorial game 2 →' : undefined}
        />
      )}
    </div>
  )
}
