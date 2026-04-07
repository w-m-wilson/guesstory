import { useState, useMemo, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
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
  const [bankPanelHeight, setBankPanelHeight] = useState(0)
  const [narration, setNarration] = useState(null)
  const bankPanelRef = useRef(null)
  const narrationTimerRef = useRef(null)

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

  useLayoutEffect(() => {
    const node = bankPanelRef.current
    if (!node) return

    const update = () => setBankPanelHeight(node.offsetHeight)
    update()

    const ro = new ResizeObserver(update)
    ro.observe(node)
    return () => ro.disconnect()
  }, [])

  if (!game) return null

  const { state, guessBankItem, confirmPending, cancelPending,
          placeItem, removeSlot, moveSlot, loadRankingSlots, submitRanking, purchaseHint, resetGame, guessCategory } = game

  function handleSubmitRanking() {
    const result = submitRanking()
    if (!result) return
    const { feedback } = result
    const slotNames = state.rankSlots.map(s => s?.name ?? null)
    const attemptNumber = state.rankHistory.length + 1
    clearTimeout(narrationTimerRef.current)
    setNarration(null)
    fetch('/api/narrate-attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slots: slotNames, feedback, attemptNumber, coinsRemaining: state.coins }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.narration) {
          setNarration(data.narration)
          narrationTimerRef.current = setTimeout(() => setNarration(null), 4000)
        }
      })
      .catch(() => {})
  }

  const gameOver = gameStatus === 'won' || gameStatus === 'abandoned'

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-bg)' }}>
      <Header
        categoryText={state.categoryGuessed ? puzzle.category : null}
        categoryAutoReveal={
          (isTutorial && tutorialMode === 'learn')
            ? (!state.categoryGuessed ? puzzle.category : null)
            : (['2026-04-04', '2026-04-06'].includes(puzzle.id) && !state.categoryGuessed ? puzzle.category : null)
        }
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

      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <GuessHistory
          rankHistory={state.rankHistory}
          rankSlots={state.rankSlots}
          onPickHistoryRow={loadRankingSlots}
          topInset={bankPanelHeight}
        />
        <div ref={bankPanelRef} style={{ position: 'relative', zIndex: 10 }}>
          <BankPanel
            discoveredList={discoveredList}
            bankTotal={puzzle.bank.length}
            rankSlots={state.rankSlots}
            bankMisses={state.bankMisses}
            pendingMatch={state.pendingMatch}
            gameOver={gameOver}
            category={puzzle.category}
            onGuess={guessBankItem}
            onConfirm={confirmPending}
            onCancel={cancelPending}
            onPlaceItem={placeItem}
            onRemoveSlot={removeSlot}
          />
        </div>
      </div>

      {narration && (
        <div key={narration} className="narration-toast shrink-0 px-5 py-2 text-center">
          <p className="text-xs italic" style={{ color: 'var(--color-text-faint)' }}>{narration}</p>
        </div>
      )}

      <RankBoard
        rankSlots={state.rankSlots}
        lockedSlots={state.lockedSlots}
        onRemoveSlot={removeSlot}
        onMoveSlot={moveSlot}
        onSubmit={handleSubmitRanking}
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
          category={puzzle.category}
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
          category={puzzle.category}
          categoryGuessed={state.categoryGuessed}
          categoryText={gameStatus === 'abandoned' || !state.categoryGuessed ? puzzle.category : null}
          categorySource={puzzle.source ?? null}
          hailMaryTaken={hailMaryTaken}
          isTutorial={isTutorial}
          keyMap={keyMap}
          onClose={
            isTutorial && tutorialMode === 'learn' && gameStatus === 'won'
              ? () => { setEndScreenDismissed(true); onComplete?.() }
              : () => setEndScreenDismissed(true)
          }
          onComplete={onComplete}
          completeCTA={isTutorial && tutorialMode === 'learn' ? 'Play tutorial game 2 →' : undefined}
        />
      )}
    </div>
  )
}
