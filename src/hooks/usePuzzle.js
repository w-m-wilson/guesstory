import { useState, useEffect } from 'react';

function getTodayKey() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Loads today's puzzle from /src/data/puzzles/YYYY-MM-DD.json.
 * Returns { puzzle, dateKey, error }.
 */
export function usePuzzle() {
  const [puzzle, setPuzzle] = useState(null);
  const [error, setError] = useState(null);
  const dateKey = getTodayKey();

  useEffect(() => {
    import(`../data/puzzles/${dateKey}.json`)
      .then(mod => setPuzzle(mod.default))
      .catch(() => setError(`No puzzle found for ${dateKey}`));
  }, [dateKey]);

  return { puzzle, dateKey, error };
}
