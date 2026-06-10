import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react'

const PRIMERS = {
  step2: {
    icon: '👆',
    title: 'Now rank them',
    body: 'Tap any discovered item to place it in a slot. Fill all 5, then submit your ranking.',
  },
  step3: {
    icon: '🎯',
    title: 'Ready to submit',
    body: 'All 5 slots filled. Hit Submit to see how close you are.',
  },
}

function TutorialPrimerModal({ primerKey, onClose }) {
  const { icon, title, body } = PRIMERS[primerKey]
  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center px-6"
      style={{ background: modalScrimBackground({ variant: 'dialog' }) }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-2xl p-6 dialog-enter"
        style={{ background: 'var(--color-bg)' }}
        onClick={e => e.stopPropagation()}
      >
        {icon && <div className="text-2xl mb-3 text-center" aria-hidden="true">{icon}</div>}
        <p className="text-base font-bold mb-3" style={{ color: 'var(--color-text-strong)', textAlign: icon ? 'center' : 'left' }}>{title}</p>
        <div className="mb-5" style={{ color: 'var(--color-text)' }}>{body}</div>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--color-action)', color: 'var(--color-action-text)' }}
        >
          Got it
        </button>
      </div>
    </div>
  )
}
import { modalScrimBackground } from './utils/modalScrim.js'
import { DIFFICULTY_CONFIG } from './config.js'
import { useGameState } from './hooks/useGameState.js'
import Header from './components/Header.jsx'
import BankPanel from './components/BankPanel.jsx'
import GuessHistory from './components/GuessHistory.jsx'
import RankBoard from './components/RankBoard.jsx'
import ScoreBar from './components/ScoreBar.jsx'
import HintModal from './components/HintModal.jsx'
import EndScreen from './components/EndScreen.jsx'
import TutorialBanner from './components/TutorialBanner.jsx'
import ConfirmModal from './components/ConfirmModal.jsx'

const DIFFICULTY_META = {
  lite:      { label: 'Lite',      blurb: 'Most answers given — focus on the ranking order' },
  medium:    { label: 'Medium',    blurb: 'A couple of hints to get you started' },
  challenge: { label: 'Challenge', blurb: 'Start from scratch — no hints given' },
}

function DifficultySelector({ current, onSelect }) {
  const [closing, setClosing] = useState(false)
  function handleSelect(d) {
    setClosing(true)
    setTimeout(() => onSelect(d), 220)
  }
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{
        background: modalScrimBackground({ variant: 'sheet' }),
        ...(closing ? { opacity: 0, transition: 'opacity 0.22s cubic-bezier(0.4, 0, 1, 1)' } : { animation: 'scrimIn 0.22s ease' }),
      }}
    >
      <div
        className={`w-full max-w-[430px] h-full flex flex-col justify-end p-5 pb-8 gap-3 ${closing ? 'sheet-exit' : 'sheet-enter'}`}
        style={{ background: 'var(--color-bg)' }}
        onClick={e => e.stopPropagation()}
      >
        <div>
          <p className="font-semibold text-base mb-0.5" style={{ color: 'var(--color-text-strong)' }}>Choose difficulty</p>
          <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>You can always make it easier mid-game if needed.</p>
        </div>
        {Object.entries(DIFFICULTY_META).map(([key, { label, blurb }]) => (
          <button
            key={key}
            onClick={() => handleSelect(key)}
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

export default function GameScreen({ puzzle, onOpenIntro, onOpenSettings, onOpenAbout, onOpenArchive, onJumpToToday, isArchive, onComplete, isTutorial, tutorialMode = 'learn' }) {
  const [hintsOpen, setHintsOpen] = useState(false)
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)
  const pickerTriggerRef = useRef(null)
  const [endScreenDismissed, setEndScreenDismissed] = useState(false)
  const [bonusGuessDone, setBonusGuessDone] = useState(false)
  const [bankPanelHeight, setBankPanelHeight] = useState(0)
  const [selectorDismissed, setSelectorDismissed] = useState(() => {
    if (isTutorial) return true
    if (localStorage.getItem(`guesstory-difficulty-${puzzle.id}`)) return true
    try {
      const saved = localStorage.getItem(`guesstory-state-${puzzle.id}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.difficulty) return true
      }
    } catch {}
    return false
  })
  const bankPanelRef = useRef(null)

  const initialDifficulty = isTutorial
    ? 'medium'
    : (localStorage.getItem('guesstory-difficulty') ?? 'medium')

  const game = useGameState(puzzle, initialDifficulty, { isTutorial: !!isTutorial })

  // Derive primitives needed before null guard
  const discoveredList = game?.discoveredList ?? []
  const ghostLetters = useMemo(() => {
    if (!puzzle?.showFirstLetters || !game?.state?.bankDisplayOrder) return null
    return game.state.bankDisplayOrder.map(rank => {
      const item = puzzle.bank.find(b => b.rank === rank)
      return item?.name[0] ?? '?'
    })
  }, [puzzle, game?.state?.bankDisplayOrder])
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
    } else if (tutorialMode === 'learn' && discoveredList.filter(Boolean).length >= 5) {
      tutorialStep = 2
    } else {
      tutorialStep = 1
    }
  }

  // Tutorial primers: fire once per key
  const [activePrimer, setActivePrimer] = useState(null)
  const shownPrimers = useRef(new Set())
  function showPrimer(key) {
    if (shownPrimers.current.has(key)) return
    shownPrimers.current.add(key)
    setActivePrimer(key)
  }

  useEffect(() => {
    if (!isTutorial || !tutorialStarted) return
    if (tutorialStep === 2) showPrimer('step2')
    if (tutorialStep === 3) showPrimer('step3')
  }, [isTutorial, tutorialStarted, tutorialStep])

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
  const freeMisses = DIFFICULTY_CONFIG[difficulty]?.bank?.freeMisses ?? 3
  const canSwitch = !isTutorial && difficulty !== 'lite'
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
        isArchive={isArchive}
        onGuessCategory={guessCategory}
        onOpenIntro={onOpenIntro}
        onOpenSettings={onOpenSettings}
        onOpenAbout={onOpenAbout}
        onOpenArchive={onOpenArchive}
        onJumpToToday={onJumpToToday}
        onOpenDifficultyPicker={canSwitch ? () => pickerTriggerRef.current?.() : undefined}
        onReset={isTutorial ? undefined : () => setConfirmResetOpen(true)}
      />


      {isTutorial && tutorialStep !== null && (
        <TutorialBanner
          step={tutorialStep}
          discoveredCount={discoveredList.filter(Boolean).length}
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
          isTutorial={!!isTutorial}
        />
        <div ref={bankPanelRef} style={{ position: 'relative', zIndex: 10 }}>
          <BankPanel
            discoveredList={discoveredList}
            ghostLetters={ghostLetters}
            bankTotal={puzzle.bank.length}
            rankSlots={state.rankSlots}
            bankMisses={state.bankMisses}
            freeMisses={freeMisses}
            pendingMatch={state.pendingMatch}
            gameOver={gameOver}
            category={puzzle.category}
            tutorialStep={isTutorial && tutorialStarted ? tutorialStep : null}
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
        tutorialStep={isTutorial && tutorialStarted ? tutorialStep : null}
      />

      {activePrimer && (
        <TutorialPrimerModal primerKey={activePrimer} onClose={() => setActivePrimer(null)} />
      )}

      <ScoreBar
        coins={state.coins}
        gameOver={gameOver}
        difficulty={difficulty}
        hideDifficulty={!!isTutorial}
        onSetDifficulty={setDifficulty}
        onRegisterPickerTrigger={fn => { pickerTriggerRef.current = fn }}
        onHintsOpen={() => setHintsOpen(true)}
        onShowResults={gameOver ? () => setEndScreenDismissed(false) : null}
      />

      {hintsOpen && (
        <HintModal
          coins={state.coins}
          allBankFound={discoveredList.filter(Boolean).length >= puzzle.bank.length}
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
          onSelect={(d) => { setDifficulty(d); setSelectorDismissed(true); localStorage.setItem(`guesstory-difficulty-${puzzle.id}`, '1') }}
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

      {confirmResetOpen && (
        <ConfirmModal
          title="Reset puzzle?"
          message="This will clear all your progress for this puzzle. You'll start back at 100 coins."
          confirmLabel="Reset"
          onConfirm={() => {
            resetGame()
            setSelectorDismissed(false)
          }}
          onClose={() => setConfirmResetOpen(false)}
        />
      )}
    </div>
  )
}
