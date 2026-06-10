
/**
 * Dynamically detects all puzzle JSON files in the puzzles directory.
 * Vite's import.meta.glob is used here to find files at build time.
 */
const modules = import.meta.glob('./*.json');

export const AVAILABLE_DATES = Object.keys(modules)
  .map((path) => {
    // Extract YYYY-MM-DD from paths like "./2026-04-01.json"
    const match = path.match(/(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : null;
  })
  .filter(Boolean)
  .sort(); // Ensure chronological order
