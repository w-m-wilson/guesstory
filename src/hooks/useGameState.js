import { useReducer, useCallback, useEffect, useRef } from 'react';
import { createBankMatcher, matchCategory } from '../utils/matcher.js';
import { generateFeedback, isWin } from '../utils/mastermind.js';
import { getBankMissCost, getCategoryMissCost, getRankingMissCost, getHintCost } from '../utils/scoring.js';
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
  if (state.gameStatus !== 'playing' && action.type !== 'END_GAME') {
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
      const newSlots = [...state.rankSlots];
      newSlots[action.slotIndex] = null;
      return { ...state, rankSlots: newSlots };
    }

    case 'SUBMIT_RANKING': {
      const { feedback } = action;
      const won = isWin(feedback);
      const cost = won ? 0 : getRankingMissCost();
      return {
        ...state,
        coins: Math.max(0, state.coins - cost),
        rankHistory: [...state.rankHistory, { slots: [...state.rankSlots], feedback }],
        // Clear the board on a wrong submission so the player can try again
        rankSlots: won ? state.rankSlots : [null, null, null, null, null],
        gameStatus: won ? 'won' : 'playing',
      };
    }

    case 'CATEGORY_HIT': {
      return { ...state, categoryGuessed: true };
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
      return newState;
    }

    case 'END_GAME': {
      return { ...state, gameStatus: 'abandoned' };
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
    () => loadSavedState(puzzle.id) ?? initState(puzzle)
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

  const guessCategory = useCallback((query) => {
    const s = stateRef.current;
    const matched = matchCategory(query, puzzle.category);
    if (matched) {
      dispatch({ type: 'CATEGORY_HIT' });
      return { outcome: 'hit' };
    }
    const cost = getCategoryMissCost(s.categoryMisses);
    dispatch({ type: 'CATEGORY_MISS' });
    return { outcome: 'miss', cost };
  }, [puzzle.category]);

  const purchaseHint = useCallback((hintType) => {
    const s = stateRef.current;
    let item = null;
    if (hintType === 'revealBankItem') {
      item = puzzle.bank.find(b => !s.discoveredItems[b.rank]) ?? null;
      if (!item) return { item: null }; // nothing left to reveal
    }
    dispatch({ type: 'PURCHASE_HINT', hintType, item });
    return { item };
  }, [puzzle.bank]);

  const endGame = useCallback(() => {
    dispatch({ type: 'END_GAME' });
  }, []);

  return {
    state,
    // Sorted array of discovered bank items for easy rendering
    discoveredList: Object.values(state.discoveredItems).sort((a, b) => a.rank - b.rank),
    // Actions
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
