import { useState, useEffect } from 'react';
import { AVAILABLE_DATES } from '../data/puzzles/available.js';

function getTodayKey() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function pickRandomDate() {
  return AVAILABLE_DATES[Math.floor(Math.random() * AVAILABLE_DATES.length)];
}

const SESSION_ARCHIVE_KEY = 'guesstory-session-archive';

function getOrPickFallbackDate() {
  const stored = sessionStorage.getItem(SESSION_ARCHIVE_KEY);
  if (stored && AVAILABLE_DATES.includes(stored)) return stored;
  const picked = pickRandomDate();
  sessionStorage.setItem(SESSION_ARCHIVE_KEY, picked);
  return picked;
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
    if (AVAILABLE_DATES.includes(today)) return today;
    return getOrPickFallbackDate();
  });

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

  return { puzzle, dateKey, setDateKey, error, isArchive };
}
