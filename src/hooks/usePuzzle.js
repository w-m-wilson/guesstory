import { useState, useEffect } from 'react';

function getTodayKey() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

const AVAILABLE_DATES = [
  '2026-04-01','2026-04-02','2026-04-03','2026-04-04','2026-04-05',
  '2026-04-06','2026-04-07','2026-04-08','2026-04-09','2026-04-10',
  '2026-04-11','2026-04-12','2026-04-13','2026-04-14','2026-04-15',
  '2026-04-16','2026-04-17','2026-04-18','2026-04-19','2026-04-20',
  '2026-04-21','2026-04-22','2026-04-23',
];

function pickRandomDate() {
  return AVAILABLE_DATES[Math.floor(Math.random() * AVAILABLE_DATES.length)];
}

/**
 * Loads today's puzzle from /src/data/puzzles/YYYY-MM-DD.json.
 * Falls back to a random existing puzzle while a backend is in development.
 * Returns { puzzle, dateKey, error }.
 */
export function usePuzzle() {
  const [puzzle, setPuzzle] = useState(null);
  const [error, setError] = useState(null);
  const [dateKey, setDateKey] = useState(getTodayKey());
  const [isArchive, setIsArchive] = useState(false);

  useEffect(() => {
    const today = getTodayKey();
    import(`../data/puzzles/${today}.json`)
      .then(mod => setPuzzle(mod.default))
      .catch(() => {
        const fallback = pickRandomDate();
        setDateKey(fallback);
        setIsArchive(true);
        import(`../data/puzzles/${fallback}.json`)
          .then(mod => setPuzzle(mod.default))
          .catch(() => setError(`No puzzle found for ${today}`));
      });
  }, []);

  return { puzzle, dateKey, error, isArchive };
}
