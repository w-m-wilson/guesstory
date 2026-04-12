import { useReducer, useCallback, useEffect, useRef } from 'react';
import { createBankMatcher, matchCategory } from '../utils/matcher.js';
import { generateFeedback, isWin } from '../utils/mastermind.js';
import { getBankMissCost, getCategoryMissCost, getCategoryBonus, getRankingAbsentCost, getHintCost } from '../utils/scoring.js';
import { GAME_CONFIG, DIFFICULTY_CONFIG } from '../config.js';

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

function storageKey(puzzleId) {
  return `guesstory-state-${puzzleId}`;
}

function loadSavedState(puzzleId) {
  try {
    const raw = localStorage.getItem(storageKey(puzzleId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

// Seeds are cumulative: easier tiers include all seeds from harder tiers.
// challengeSeed ⊆ seed (medium) ⊆ liteSeed
function seedsForDifficulty(puzzle, difficulty) {
  const challenge = puzzle.challengeSeed ?? []
  const medium = puzzle.seed ?? []
  const lite = puzzle.liteSeed ?? medium

  // Merge by rank so harder-tier items are never lost when going easier
  const merge = (...arrays) => {
    const byRank = new Map()
    for (const arr of arrays) for (const item of arr) byRank.set(item.rank, item)
    return [...byRank.values()]
  }

  if (difficulty === 'lite')      return merge(lite, medium, challenge)
  if (difficulty === 'challenge') return challenge
  return merge(medium, challenge) // medium
}

function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function initState(puzzle, difficulty = 'medium') {
  const discoveredItems = {};
  for (const item of seedsForDifficulty(puzzle, difficulty)) {
    discoveredItems[item.rank] = { ...item, seeded: true };
  }

  // Stable random display order for bank pills — shuffled once at init so
  // pill positions never reveal ranking information.
  const bankDisplayOrder = shuffleArray(puzzle.bank.map(b => b.rank));

  return {
    coins: GAME_CONFIG.startingCoins,
    difficulty,               // 'lite' | 'medium' | 'challenge'
    bankMisses: 0,
    categoryMisses: 0,
    discoveredItems,          // { [rank]: item }
    rankSlots: [null, null, null, null, null],  // index 0 = rank position 1
    lockedSlots: [],          // slot indices locked by hints or Lite auto-lock
    confirmedCorrect: [],     // [{ index, item }] — Lite mode: slots confirmed correct
    rankHistory: [],          // [{ slots: [...], feedback: [...] }]
    bankDisplayOrder,
    categoryGuessed: (puzzle.revealCategoryFor ?? []).includes(difficulty),
    gameStatus: 'playing',    // 'playing' | 'won' | 'abandoned'
    pendingMatch: null,       // { item, query } | null — awaiting player confirmation
    hailMaryTaken: false,     // one free ranking attempt after going abandoned
  };
}

// ---------------------------------------------------------------------------
// Reducer — pure state transitions only, no side effects
// ---------------------------------------------------------------------------

function reducer(state, action) {
  // Block all actions once the game is over, with two exceptions:
  // - END_GAME and RESET always pass through
  // - SUBMIT_RANKING passes through once when abandoned and hail mary not yet taken
  const hailMarySubmit = state.gameStatus === 'abandoned' && !state.hailMaryTaken && action.type === 'SUBMIT_RANKING';
  const postWinCategoryHit = state.gameStatus === 'won' && action.type === 'CATEGORY_HIT';
  if (state.gameStatus !== 'playing' && !hailMarySubmit && !postWinCategoryHit && action.type !== 'END_GAME' && action.type !== 'RESET') {
    return state;
  }

  switch (action.type) {
    case 'BANK_HIT': {
      const { item } = action;
      if (state.discoveredItems[item.rank]) return state; // already known, no-op
      return {
        ...state,
        discoveredItems: { ...state.discoveredItems, [item.rank]: item },
        pendingMatch: null,
      };
    }

    case 'BANK_MISS': {
      const cost = getBankMissCost(state.bankMisses, state.difficulty);
      return {
        ...state,
        bankMisses: state.bankMisses + 1,
        coins: Math.max(0, state.coins - cost),
        pendingMatch: null,
      };
    }

    case 'BANK_PENDING': {
      return {
        ...state,
        pendingMatch: { item: action.item, query: action.query },
      };
    }

    case 'CANCEL_PENDING': {
      return { ...state, pendingMatch: null };
    }

    case 'PLACE_ITEM': {
      // Find the next empty slot and fill it.
      // If all slots are full, do nothing.
      const nextEmpty = state.rankSlots.findIndex(s => s === null);
      if (nextEmpty === -1) return state;
      const newSlots = [...state.rankSlots];
      newSlots[nextEmpty] = action.item;
      return { ...state, rankSlots: newSlots };
    }

    case 'REMOVE_SLOT': {
      if (state.lockedSlots.includes(action.slotIndex)) return state;
      const newSlots = [...state.rankSlots];
      newSlots[action.slotIndex] = null;
      return { ...state, rankSlots: newSlots };
    }

    case 'MOVE_SLOT': {
      const { fromIndex, toIndex } = action;
      if (state.lockedSlots.includes(fromIndex) || state.lockedSlots.includes(toIndex)) return state;
      const newSlots = [...state.rankSlots];
      [newSlots[fromIndex], newSlots[toIndex]] = [newSlots[toIndex], newSlots[fromIndex]];
      return { ...state, rankSlots: newSlots };
    }

    case 'LOAD_RANKING_SLOTS': {
      const incomingSlots = Array.isArray(action.slots) ? action.slots : [];
      const newSlots = state.rankSlots.map((currentItem, index) => {
        // Never overwrite locked hint slots.
        if (state.lockedSlots.includes(index)) return currentItem;
        return incomingSlots[index] ?? null;
      });
      return { ...state, rankSlots: newSlots };
    }

    case 'SUBMIT_RANKING': {
      const { feedback } = action;

      // Hail Mary: free final attempt after going abandoned — no coin change
      if (state.gameStatus === 'abandoned' && !state.hailMaryTaken) {
        return {
          ...state,
          rankHistory: [...state.rankHistory, { slots: [...state.rankSlots], feedback }],
          hailMaryTaken: true,
        };
      }

      const won = isWin(feedback);
      const wrongCount = feedback.filter(f => f === 'absent' || f === 'empty').length;
      const absentCost = getRankingAbsentCost(state.difficulty);
      const cost = won ? 0 : Math.min(state.coins, wrongCount * absentCost);
      const newCoins = Math.max(0, state.coins - cost);
      const newStatus = won ? 'won' : (newCoins === 0 ? 'abandoned' : 'playing');

      // Lite mode: auto-lock newly confirmed-correct slots
      let newConfirmedCorrect = state.confirmedCorrect;
      let newLockedSlots = state.lockedSlots;
      if (state.difficulty === 'lite') {
        const additions = [];
        feedback.forEach((f, i) => {
          if (f === 'correct' && !state.lockedSlots.includes(i)) {
            additions.push({ index: i, item: state.rankSlots[i] });
            newLockedSlots = [...newLockedSlots, i];
          }
        });
        if (additions.length) newConfirmedCorrect = [...newConfirmedCorrect, ...additions];
      }

      return {
        ...state,
        coins: newCoins,
        rankHistory: [...state.rankHistory, { slots: [...state.rankSlots], feedback }],
        lockedSlots: newLockedSlots,
        confirmedCorrect: newConfirmedCorrect,
        gameStatus: newStatus,
        categoryGuessed: newStatus === 'abandoned' ? true : state.categoryGuessed,
      };
    }

    case 'CATEGORY_HIT': {
      return {
        ...state,
        categoryGuessed: true,
        // No coin bonus for post-win bonus guess (game already won)
        coins: state.gameStatus === 'won' ? state.coins : state.coins + getCategoryBonus(state.difficulty),
      };
    }

    case 'CATEGORY_MISS': {
      const cost = getCategoryMissCost(state.categoryMisses, state.difficulty);
      return {
        ...state,
        categoryMisses: state.categoryMisses + 1,
        coins: Math.max(0, state.coins - cost),
      };
    }

    case 'PURCHASE_HINT': {
      const cost = action.cost ?? getHintCost(action.hintType, state.difficulty);
      const newState = {
        ...state,
        coins: Math.max(0, state.coins - cost),
      };
      if (action.hintType === 'revealBankItem' && action.item) {
        newState.discoveredItems = {
          ...newState.discoveredItems,
          [action.item.rank]: action.item,
        };
      }
      if (action.hintType === 'revealCategory') {
        newState.categoryGuessed = true;
      }
      if ((action.hintType === 'revealRankPositionKnown' || action.hintType === 'revealRankPositionUnknown') && action.item != null && action.slotIndex != null) {
        const newSlots = [...newState.rankSlots];
        newSlots[action.slotIndex] = action.item;
        newState.rankSlots = newSlots;
        newState.lockedSlots = [...newState.lockedSlots, action.slotIndex];
        // Also surface the item in the discovered bank
        if (!newState.discoveredItems[action.item.rank]) {
          newState.discoveredItems = {
            ...newState.discoveredItems,
            [action.item.rank]: action.item,
          };
        }
      }
      return newState;
    }

    case 'SET_DIFFICULTY': {
      const newDifficulty = action.difficulty;
      // Remove Lite-specific locks when leaving Lite mode
      let newLockedSlots = state.lockedSlots;
      let newConfirmedCorrect = state.confirmedCorrect;
      if (state.difficulty === 'lite' && newDifficulty !== 'lite') {
        const liteIndices = new Set(state.confirmedCorrect.map(c => c.index));
        newLockedSlots = state.lockedSlots.filter(i => !liteIndices.has(i));
        newConfirmedCorrect = [];
      }
      return { ...state, difficulty: newDifficulty, lockedSlots: newLockedSlots, confirmedCorrect: newConfirmedCorrect };
    }

    case 'END_GAME': {
      return { ...state, gameStatus: 'abandoned' };
    }

    case 'RESET': {
      return action.initialState;
    }

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Core game state machine.
 *
 * Expects a non-null puzzle object (caller should gate on puzzle being loaded).
 *
 * Returns { state, discoveredList, ...actions } or null if puzzle is missing.
 *
 * Action creators return an outcome descriptor so the UI can show inline
 * feedback without needing to diff state between renders:
 *
 *   guessBankItem(query)  → { outcome: 'hit'|'miss'|'known'|'pending', item?, cost? }
 *   confirmPending()      → { outcome: 'hit'|'known', item }
 *   cancelPending()       → void
 *   placeItem(item)       → void
 *   removeSlot(index)     → void
 *   loadRankingSlots(...) → void
 *   submitRanking()       → { feedback, won }
 *   guessCategory(query)  → { outcome: 'hit'|'miss', cost? }
 *   purchaseHint(type)    → { item? }
 *   endGame()             → void
 */
export function useGameState(puzzle, initialDifficulty = 'medium') {
  // Keep a always-current ref to state for use inside callbacks.
  // This avoids stale closures without adding state to every useCallback dep array.
  const stateRef = useRef(null);
  const matcherRef = useRef(null);

  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => {
      const saved = loadSavedState(puzzle.id);
      const difficulty = saved?.difficulty ?? initialDifficulty;
      // Merge saved state over a fresh initState so any newly added fields are always present.
      return saved ? { ...initState(puzzle, difficulty), ...saved } : initState(puzzle, difficulty);
    }
  );

  stateRef.current = state;

  // Build the matcher once when the puzzle loads
  useEffect(() => {
    matcherRef.current = createBankMatcher(puzzle.bank);
  }, [puzzle]);

  // Persist state to localStorage on every change
  useEffect(() => {
    localStorage.setItem(storageKey(puzzle.id), JSON.stringify(state));
  }, [puzzle.id, state]);

  // --- Action creators ---

  const guessBankItem = useCallback((query) => {
    const s = stateRef.current;
    if (s.gameStatus !== 'playing') return null;
    const result = matcherRef.current?.match(query);

    if (!result) {
      const cost = getBankMissCost(s.bankMisses, s.difficulty);
      dispatch({ type: 'BANK_MISS' });
      return { outcome: 'miss', cost };
    }

    const { item } = result;

    if (result.needsConfirmation) {
      if (s.discoveredItems[item.rank]) {
        // Fuzzy match landed on an already-found item — treat as a miss
        // rather than claiming the player meant that item (e.g. "South Carolina" → "North Carolina")
        const cost = getBankMissCost(s.bankMisses, s.difficulty);
        dispatch({ type: 'BANK_MISS' });
        return { outcome: 'miss', cost };
      }
      dispatch({ type: 'BANK_PENDING', item, query });
      return { outcome: 'pending', item };
    }

    if (s.discoveredItems[item.rank]) {
      return { outcome: 'known', item };
    }

    dispatch({ type: 'BANK_HIT', item });
    return { outcome: 'hit', item };
  }, []);

  const confirmPending = useCallback(() => {
    const s = stateRef.current;
    if (!s.pendingMatch) return null;
    const { item } = s.pendingMatch;
    if (s.discoveredItems[item.rank]) {
      dispatch({ type: 'CANCEL_PENDING' });
      return { outcome: 'known', item };
    }
    dispatch({ type: 'BANK_HIT', item });
    return { outcome: 'hit', item };
  }, []);

  const cancelPending = useCallback(() => {
    dispatch({ type: 'CANCEL_PENDING' });
  }, []);

  const placeItem = useCallback((item) => {
    dispatch({ type: 'PLACE_ITEM', item });
  }, []);

  const removeSlot = useCallback((slotIndex) => {
    dispatch({ type: 'REMOVE_SLOT', slotIndex });
  }, []);

  const moveSlot = useCallback((fromIndex, toIndex) => {
    dispatch({ type: 'MOVE_SLOT', fromIndex, toIndex });
  }, []);

  const loadRankingSlots = useCallback((slots) => {
    dispatch({ type: 'LOAD_RANKING_SLOTS', slots });
  }, []);

  const submitRanking = useCallback(() => {
    const s = stateRef.current;
    const feedback = generateFeedback(s.rankSlots);
    const won = isWin(feedback);
    dispatch({ type: 'SUBMIT_RANKING', feedback });
    return { feedback, won };
  }, []);

  const guessCategory = useCallback(async (query) => {
    const s = stateRef.current;
    const postWin = s.gameStatus === 'won';
    if (s.gameStatus !== 'playing' && !postWin) return null;

    // Try LLM evaluation; fall back to local Fuse matcher if unavailable
    let matched = false, warm = false, cold = false, hint = null;
    try {
      const res = await fetch('/api/check-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, category: puzzle.category }),
      });
      if (res.ok) {
        const data = await res.json();
        ({ matched, warm, cold, hint } = data);
      } else {
        throw new Error('non-ok response');
      }
    } catch {
      // Fallback: local fuzzy matcher with closeness-based warm/cold
      const local = matchCategory(query, puzzle.category);
      matched = local.matched;
      warm    = !matched && local.closeness >= 0.45;
      cold    = !matched && !warm;
      hint    = warm ? (puzzle.hint ?? null) : 'Not quite';
    }

    if (matched) {
      dispatch({ type: 'CATEGORY_HIT' });
      return { outcome: 'hit' };
    }
    if (postWin) {
      // post-win bonus guess — no penalty
      return { outcome: 'miss', warm, cold, hint };
    }
    const cost = getCategoryMissCost(s.categoryMisses);
    dispatch({ type: 'CATEGORY_MISS' });
    return { outcome: 'miss', cost, warm, cold, hint };
  }, [puzzle.category, puzzle.hint]);

  const purchaseHint = useCallback((hintType) => {
    const s = stateRef.current;
    let item = null;
    let slotIndex = null;

    if (hintType === 'revealBankItem') {
      const undiscovered = puzzle.bank.filter(b => !s.discoveredItems[b.rank]);
      item = undiscovered.length ? undiscovered[Math.floor(Math.random() * undiscovered.length)] : null;
      if (!item) return { item: null };
    }

    if (hintType === 'revealRankPositionKnown') {
      const topFiveItems = puzzle.bank.filter(b => puzzle.topFive.includes(b.rank));
      const candidates = topFiveItems.filter(b => s.discoveredItems[b.rank] && !s.lockedSlots.includes(b.rank - 1));
      item = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null;
      if (!item) {
        const cost = getHintCost(hintType, s.difficulty);
        dispatch({ type: 'PURCHASE_HINT', hintType, item: null, slotIndex: null, cost });
        return { item: null, noneFound: true };
      }
      slotIndex = item.rank - 1;
    }

    if (hintType === 'revealRankPositionUnknown') {
      const topFiveItems = puzzle.bank.filter(b => puzzle.topFive.includes(b.rank));
      const unknownCandidates = topFiveItems.filter(b => !s.discoveredItems[b.rank] && !s.lockedSlots.includes(b.rank - 1));
      if (unknownCandidates.length > 0) {
        item = unknownCandidates[Math.floor(Math.random() * unknownCandidates.length)];
        slotIndex = item.rank - 1;
      } else {
        const knownCandidates = topFiveItems.filter(b => s.discoveredItems[b.rank] && !s.lockedSlots.includes(b.rank - 1));
        item = knownCandidates.length ? knownCandidates[Math.floor(Math.random() * knownCandidates.length)] : null;
        if (!item) return { item: null };
        slotIndex = item.rank - 1;
        const cost = getHintCost('revealRankPositionKnown', s.difficulty);
        dispatch({ type: 'PURCHASE_HINT', hintType: 'revealRankPositionKnown', item, slotIndex, cost });
        return { item, fellBackToKnown: true };
      }
    }

    const cost = getHintCost(hintType, s.difficulty);
    dispatch({ type: 'PURCHASE_HINT', hintType, item, slotIndex, cost });
    return { item };
  }, [puzzle.bank, puzzle.topFive]);

  const setDifficulty = useCallback((difficulty) => {
    const s = stateRef.current;
    const hasStarted = s.bankMisses > 0 || s.rankHistory.length > 0;
    localStorage.setItem('guesstory-difficulty', difficulty);
    if (!hasStarted) {
      // Before any action: full reset with new seeds
      dispatch({ type: 'RESET', initialState: initState(puzzle, difficulty) });
    } else {
      // Mid-game downgrade only
      dispatch({ type: 'SET_DIFFICULTY', difficulty });
    }
  }, [puzzle]);

  const endGame = useCallback(() => {
    dispatch({ type: 'END_GAME' });
  }, []);

  const resetGame = useCallback(() => {
    localStorage.removeItem(storageKey(puzzle.id));
    dispatch({ type: 'RESET', initialState: initState(puzzle) });
  }, [puzzle]);

  return {
    state,
    // Fixed-length array (item | null) in stable shuffled display order.
    // Positions never change as items are discovered, so ghost pills don't move
    // and the layout doesn't leak ranking information.
    discoveredList: state.bankDisplayOrder.map(rank => state.discoveredItems[rank] ?? null),
    // Actions
    resetGame,
    guessBankItem,
    confirmPending,
    cancelPending,
    placeItem,
    removeSlot,
    moveSlot,
    loadRankingSlots,
    submitRanking,
    guessCategory,
    purchaseHint,
    setDifficulty,
    endGame,
  };
}
