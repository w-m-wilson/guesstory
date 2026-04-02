import { useReducer, useCallback, useEffect, useRef } from 'react';
import { createBankMatcher, matchCategory } from '../utils/matcher.js';
import { generateFeedback, isWin } from '../utils/mastermind.js';
import { getBankMissCost, getCategoryMissCost, getHintCost } from '../utils/scoring.js';
import { GAME_CONFIG } from '../config.js';

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

function storageKey(puzzleId) {
  return `ranked-state-${puzzleId}`;
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

function initState(puzzle) {
  const discoveredItems = {};
  for (const item of puzzle.seed) {
    discoveredItems[item.rank] = { ...item, seeded: true };
  }

  return {
    coins: GAME_CONFIG.startingCoins,
    bankMisses: 0,
    categoryMisses: 0,
    discoveredItems,          // { [rank]: item }
    rankSlots: [null, null, null, null, null],  // index 0 = rank position 1
    lockedSlots: [],          // slot indices locked by revealRankPosition hint
    rankHistory: [],          // [{ slots: [...], feedback: [...] }]
    categoryGuessed: false,
    gameStatus: 'playing',    // 'playing' | 'won' | 'abandoned'
    pendingMatch: null,       // { item, query } | null — awaiting player confirmation
  };
}

// ---------------------------------------------------------------------------
// Reducer — pure state transitions only, no side effects
// ---------------------------------------------------------------------------

function reducer(state, action) {
  // Block all actions (except END_GAME) once the game is over
  if (state.gameStatus !== 'playing' && action.type !== 'END_GAME' && action.type !== 'RESET') {
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
      const cost = getBankMissCost(state.bankMisses);
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

    case 'SUBMIT_RANKING': {
      const { feedback } = action;
      const won = isWin(feedback);
      // Cost = 1 coin per item placed that isn't in the top 5 ('absent')
      const absentCount = feedback.filter(f => f === 'absent').length;
      const cost = won ? 0 : Math.min(state.coins, absentCount * GAME_CONFIG.ranking.absentCost);
      const newCoins = Math.max(0, state.coins - cost);
      const newStatus = won ? 'won' : (newCoins === 0 ? 'abandoned' : 'playing');
      // On wrong submission, preserve locked slots and clear the rest
      const clearedSlots = state.rankSlots.map((slot, i) =>
        state.lockedSlots.includes(i) ? slot : null
      );
      return {
        ...state,
        coins: newCoins,
        rankHistory: [...state.rankHistory, { slots: [...state.rankSlots], feedback }],
        rankSlots: won ? state.rankSlots : clearedSlots,
        gameStatus: newStatus,
      };
    }

    case 'CATEGORY_HIT': {
      return {
        ...state,
        categoryGuessed: true,
        coins: state.coins + GAME_CONFIG.category.correctGuessBonus,
      };
    }

    case 'CATEGORY_MISS': {
      const cost = getCategoryMissCost(state.categoryMisses);
      return {
        ...state,
        categoryMisses: state.categoryMisses + 1,
        coins: Math.max(0, state.coins - cost),
      };
    }

    case 'PURCHASE_HINT': {
      const cost = getHintCost(action.hintType);
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
      if (action.hintType === 'revealRankPosition' && action.item != null && action.slotIndex != null) {
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
 *   submitRanking()       → { feedback, won }
 *   guessCategory(query)  → { outcome: 'hit'|'miss', cost? }
 *   purchaseHint(type)    → { item? }
 *   endGame()             → void
 */
export function useGameState(puzzle) {
  // Keep a always-current ref to state for use inside callbacks.
  // This avoids stale closures without adding state to every useCallback dep array.
  const stateRef = useRef(null);
  const matcherRef = useRef(null);

  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => {
      const saved = loadSavedState(puzzle.id);
      // Merge saved state over a fresh initState so any newly added fields
      // (e.g. lockedSlots) are always present even for old saves.
      return saved ? { ...initState(puzzle), ...saved } : initState(puzzle);
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
    const result = matcherRef.current?.match(query);

    if (!result) {
      const cost = getBankMissCost(s.bankMisses);
      dispatch({ type: 'BANK_MISS' });
      return { outcome: 'miss', cost };
    }

    const { item } = result;

    if (s.discoveredItems[item.rank]) {
      return { outcome: 'known', item };
    }

    if (result.needsConfirmation) {
      dispatch({ type: 'BANK_PENDING', item, query });
      return { outcome: 'pending', item };
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

  const submitRanking = useCallback(() => {
    const s = stateRef.current;
    const feedback = generateFeedback(s.rankSlots);
    const won = isWin(feedback);
    dispatch({ type: 'SUBMIT_RANKING', feedback });
    return { feedback, won };
  }, []);

  const guessCategory = useCallback(async (query) => {
    const s = stateRef.current;

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
        console.log('[category]', data);
        ({ matched, warm, cold, hint } = data);
      } else {
        console.warn('[category] non-ok response:', res.status);
        throw new Error('non-ok response');
      }
    } catch (err) {
      console.warn('[category] falling back to local matcher:', err?.message);
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
    const cost = getCategoryMissCost(s.categoryMisses);
    dispatch({ type: 'CATEGORY_MISS' });
    return { outcome: 'miss', cost, warm, cold, hint };
  }, [puzzle.category]);

  const purchaseHint = useCallback((hintType) => {
    const s = stateRef.current;
    let item = null;
    let slotIndex = null;

    if (hintType === 'revealBankItem') {
      item = puzzle.bank.find(b => !s.discoveredItems[b.rank]) ?? null;
      if (!item) return { item: null };
    }

    if (hintType === 'revealRankPosition') {
      const topFiveItems = puzzle.bank.filter(b => puzzle.topFive.includes(b.rank));
      item = topFiveItems.find(b => !s.lockedSlots.includes(b.rank - 1)) ?? null;
      if (!item) return { item: null };
      slotIndex = item.rank - 1;
    }

    dispatch({ type: 'PURCHASE_HINT', hintType, item, slotIndex });
    return { item };
  }, [puzzle.bank, puzzle.topFive]);

  const endGame = useCallback(() => {
    dispatch({ type: 'END_GAME' });
  }, []);

  const resetGame = useCallback(() => {
    localStorage.removeItem(storageKey(puzzle.id));
    dispatch({ type: 'RESET', initialState: initState(puzzle) });
  }, [puzzle]);

  return {
    state,
    // Sorted array of discovered bank items for easy rendering
    discoveredList: Object.values(state.discoveredItems).sort((a, b) => a.rank - b.rank),
    // Actions
    resetGame,
    guessBankItem,
    confirmPending,
    cancelPending,
    placeItem,
    removeSlot,
    submitRanking,
    guessCategory,
    purchaseHint,
    endGame,
  };
}
