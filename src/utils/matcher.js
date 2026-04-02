import Fuse from 'fuse.js';
import { GAME_CONFIG } from '../config.js';

const { matcher: CFG } = GAME_CONFIG;

/**
 * Creates a reusable bank matcher for a puzzle's item list.
 *
 * Flattens all names + aliases into a single searchable index.
 * Returns a match() function.
 *
 * match(query) returns:
 *   null                                    → no match (treat as a miss)
 *   { item, score, needsConfirmation }      → match found
 *     needsConfirmation: true means the match was fuzzy enough to warrant
 *     asking the player "did you mean X?" before counting it as a guess.
 */
export function createBankMatcher(items) {
  const entries = items.flatMap(item =>
    [item.name, ...item.aliases].map(alias => ({ alias, item }))
  );

  const fuse = new Fuse(entries, {
    keys: ['alias'],
    threshold: CFG.bankThreshold,
    includeScore: true,
    isCaseSensitive: false,
    ignoreLocation: true,   // don't penalize match position within string
  });

  return {
    match(query) {
      const trimmed = query.trim();

      // Require at least 3 characters unless the query exactly matches a
      // short alias (< 3 chars) defined on some item in the bank.
      if (trimmed.length < 3) {
        const lower = trimmed.toLowerCase();
        const shortAliasEntry = entries.find(
          ({ alias }) => alias.length < 3 && alias.toLowerCase() === lower
        );
        if (!shortAliasEntry) return null;
        return { item: shortAliasEntry.item, score: 0, needsConfirmation: false };
      }

      const results = fuse.search(trimmed);
      if (results.length === 0) return null;

      const { item: entry, score } = results[0];
      return {
        item: entry.item,
        score,
        needsConfirmation: score > CFG.bankConfidentThreshold,
      };
    },
  };
}

/**
 * Returns { matched: boolean, closeness: number 0–1 } for a category guess.
 *
 * Two-pass strategy:
 *   1. Fuse.js — catches typos when word order is similar
 *   2. Word-set overlap — catches reordered phrases ("Instagram most followed"
 *      vs "most followed accounts on Instagram")
 *
 * closeness reflects what fraction of category words the query covered,
 * useful for showing a "getting warm" hint even on a miss.
 */
export function matchCategory(query, categoryString) {
  const q = query.trim();

  // Pass 1: Fuse (order-sensitive but typo-tolerant)
  const fuse = new Fuse([{ category: categoryString }], {
    keys: ['category'],
    threshold: CFG.categoryThreshold,
    isCaseSensitive: false,
    ignoreLocation: true,
  });
  if (fuse.search(q).length > 0) return { matched: true, closeness: 1 };

  // Pass 2: word-set overlap with per-word fuzzy matching (order-insensitive).
  // Handles morphological variants like "followers" ↔ "followed".
  const tokenize = s =>
    s.toLowerCase()
     .replace(/[^a-z0-9\s]/g, '')
     .split(/\s+/)
     .filter(w => w.length > 2);

  const catWords = tokenize(categoryString);
  const queryWords = tokenize(q);
  if (queryWords.length === 0) return { matched: false, closeness: 0 };

  const wordFuse = new Fuse(catWords.map(w => ({ w })), {
    keys: ['w'],
    threshold: 0.35,  // per-word fuzzy tolerance — catches stems/variants
    isCaseSensitive: false,
  });

  const matchedQueryWords = queryWords.filter(qw => wordFuse.search(qw).length > 0);

  // Reverse coverage: how many category words does the query touch?
  const queryFuse = new Fuse(queryWords.map(w => ({ w })), {
    keys: ['w'],
    threshold: 0.35,
    isCaseSensitive: false,
  });
  const catCovered = catWords.filter(cw => queryFuse.search(cw).length > 0);
  const closeness = catWords.length > 0 ? catCovered.length / catWords.length : 0;

  // Require ≥80% of query words to match AND ≥75% of category words covered
  const queryOk = matchedQueryWords.length >= Math.max(1, Math.ceil(queryWords.length * 0.8));
  const categoryOk = catCovered.length >= Math.ceil(catWords.length * 0.75);

  return { matched: queryOk && categoryOk, closeness };
}
