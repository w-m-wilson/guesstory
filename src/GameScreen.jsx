import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useGameState } from './hooks/useGameState.js'
import Header from './components/Header.jsx'
import BankPanel from './components/BankPanel.jsx'
import GuessHistory from './components/GuessHistory.jsx'
import RankBoard from './components/RankBoard.jsx'
import ScoreBar from './components/ScoreBar.jsx'
import HintModal from './components/HintModal.jsx'
import EndScreen from './components/EndScreen.jsx'
import TutorialBanner from './components/TutorialBanner.jsx'

const DIFFICULTY_META = {
  lite:      { label: 'Lite',      blurb: 'Most answers given — focus on the ranking order' },
  medium:    { label: 'Medium',    blurb: 'A couple of hints to get you started' },
  challenge: { label: 'Challenge', blurb: 'Start from scratch — no hints given' },
}

function DifficultySelector({ current, onSelect }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'var(--color-bg)' }}
    >
      <div
        className="w-full max-w-[430px] h-full flex flex-col justify-end p-5 pb-8 gap-3"
        onClick={e => e.stopPropagation()}
      >
        <div>
          <p className="font-semibold text-base mb-0.5" style={{ color: 'var(--color-text-strong)' }}>Choose difficulty</p>
          <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>You can always make it easier mid-game if needed.</p>
        </div>
        {Object.entries(DIFFICULTY_META).map(([key, { label, blurb }]) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className="flex items-center justify-between w-full rounded-xl px-4 py-3 text-left"
            style={{
              background: current === key ? 'var(--color-action)' : 'var(--color-bg-elevated)',
              border: `1px solid ${current === key ? 'var(--color-action)' : 'var(--color-border)'}`,
              color: current === key ? 'var(--color-action-text)' : 'var(--color-text)',
            }}
          >
            <div>
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-xs mt-0.5" style={{ color: current === key ? 'var(--color-action-text)' : 'var(--color-text-faint)', opacity: current === key ? 0.75 : 1 }}>{blurb}</p>
            </div>
            {current === key && <span className="text-sm ml-3 shrink-0" style={{ color: 'var(--color-action-text)', opacity: 0.7 }}>✓</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function GameScreen({ puzzle, onOpenIntro, onOpenSettings, onComplete, isTutorial, tutorialMode = 'learn' }) {
  const [hintsOpen, setHintsOpen] = useState(false)
  const [endScreenDismissed, setEndScreenDismissed] = useState(false)
  const [bonusGuessDone, setBonusGuessDone] = useState(false)
  const [bankPanelHeight, setBankPanelHeight] = useState(0)
  const [selectorDismissed, setSelectorDismissed] = useState(() => !!localStorage.getItem('guesstory-difficulty'))
  const bankPanelRef = useRef(null)

  const initialDifficulty = useState(() => localStorage.getItem('guesstory-difficulty') ?? 'medium')[0]

  const game = useGameState(puzzle, initialDifficulty)

  // Derive primitives needed before null guard
  const discoveredList = game?.discoveredList ?? []
  const tutorialRankSlots = game?.state?.rankSlots ?? [null, null, null, null, null]
  const tutorialRankHistory = game?.state?.rankHistory ?? []
  const tutorialGameStatus = game?.state?.gameStatus ?? 'playing'

  // Tutorial step: null for non-tutorial; 0 = welcome overlay. Derived from game state.
  const [tutorialStarted, setTutorialStarted] = useState(false)
  function handleTutorialBegin() { setTutorialStarted(true) }

  let tutorialStep = null
  if (isTutorial) {
    if (!tutorialStarted) {
      tutorialStep = 0
    } else if (tutorialMode === 'learn' && tutorialGameStatus === 'won') {
      tutorialStep = 4
    } else if (tutorialMode === 'learn' && tutorialRankSlots.every(Boolean)) {
      tutorialStep = 3
    } else if (tutorialMode === 'learn' && discoveredList.length >= 5) {
      tutorialStep = 2
    } else {
      tutorialStep = 1
    }
  }

  // Show end screen when game first ends, and again after hail mary is submitted
  const gameStatus = game?.state.gameStatus
  const hailMaryTaken = game?.state.hailMaryTaken ?? false

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (gameStatus === 'won' || gameStatus === 'abandoned') setEndScreenDismissed(false)
  }, [gameStatus])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
          placeItem, removeSlot, moveSlot, loadRankingSlots, submitRanking, purchaseHint, setDifficulty, resetGame, guessCategory } = game

  const difficulty = state.difficulty ?? 'medium'
  const showDifficultySelector = !isTutorial && !selectorDismissed && state.bankMisses === 0 && state.rankHistory.length === 0

  function handleSubmitRanking() {
    submitRanking()
  }

  const gameOver = gameStatus === 'won' || gameStatus === 'abandoned'

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-bg)' }}>
      <Header
        categoryText={state.categoryGuessed ? puzzle.category : null}
        categoryAutoReveal={
          (isTutorial && tutorialMode === 'learn' && !state.categoryGuessed) ? puzzle.category : null
        }
        categoryHint={puzzle.hint ?? null}
        categoryMisses={state.categoryMisses}
        difficulty={difficulty}
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
          difficulty={difficulty}
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
        difficulty={difficulty}
        onSetDifficulty={setDifficulty}
        onHintsOpen={() => setHintsOpen(true)}
        onShowResults={gameOver ? () => setEndScreenDismissed(false) : null}
        onReset={() => { resetGame(); setSelectorDismissed(false) }}
      />

      {hintsOpen && (
        <HintModal
          coins={state.coins}
          allBankFound={discoveredList.length >= puzzle.bank.length}
          categoryGuessed={state.categoryGuessed}
          category={puzzle.category}
          difficulty={difficulty}
          onPurchase={purchaseHint}
          onClose={() => setHintsOpen(false)}
        />
      )}

      {showDifficultySelector && (
        <DifficultySelector
          current={difficulty}
          onSelect={(d) => { setDifficulty(d); setSelectorDismissed(true) }}
        />
      )}

      {gameOver && !endScreenDismissed && (
        <EndScreen
          puzzleId={puzzle.id}
          coins={state.coins}
          rankHistory={state.rankHistory}
          gameStatus={state.gameStatus}
          difficulty={difficulty}
          category={puzzle.category}
          categoryGuessed={state.categoryGuessed}
          categoryText={gameStatus === 'abandoned' || !state.categoryGuessed ? puzzle.category : null}
          categorySource={puzzle.source ?? null}
          hailMaryTaken={hailMaryTaken}
          isTutorial={isTutorial}
          bonusGuessDone={bonusGuessDone}
          onBonusGuessDone={() => setBonusGuessDone(true)}
          onGuessCategory={guessCategory}
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
