import { useState, useEffect } from 'react';
import { AVAILABLE_DATES } from '../data/puzzles/available.js';

function getTodayKey() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function getLatestAvailableDate() {
  return AVAILABLE_DATES[AVAILABLE_DATES.length - 1];
}

const LAST_DATE_KEY = 'guesstory-last-date';

function getOrPickFallbackDate() {
  const stored = localStorage.getItem(LAST_DATE_KEY);
  if (stored && AVAILABLE_DATES.includes(stored)) return stored;
  return getLatestAvailableDate();
}

/**
 * Loads a puzzle by dateKey from /src/data/puzzles/YYYY-MM-DD.json.
 * Defaults to today's puzzle, falls back to a stable session-scoped archive puzzle.
 * Returns { puzzle, dateKey, setDateKey, error, isArchive }.
 */
export function usePuzzle() {
  const [puzzle, setPuzzle] = useState(null);
  const [error, setError] = useState(null);
  const [dateKey, setDateKey] = useState(() => {
    const today = getTodayKey();
    if (AVAILABLE_DATES.includes(today)) {
      const stored = localStorage.getItem(LAST_DATE_KEY);
      if (stored && AVAILABLE_DATES.includes(stored)) return stored;
      return today;
    }
    return getOrPickFallbackDate();
  });

  function setDateKeyPersisted(date) {
    localStorage.setItem(LAST_DATE_KEY, date);
    setDateKey(date);
  }

  const today = getTodayKey();
  const isArchive = dateKey !== today;

  useEffect(() => {
    setPuzzle(null);
    setError(null);
    import(`../data/puzzles/${dateKey}.json`)
      .then(mod => setPuzzle(mod.default))
      .catch(() => {
        setError(`No puzzle found for ${dateKey}`);
      });
  }, [dateKey]);

  return { puzzle, dateKey, setDateKey: setDateKeyPersisted, error, isArchive };
}
