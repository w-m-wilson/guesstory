import Fuse from 'fuse.js';
import { GAME_CONFIG } from '../config.js';

const { matcher: CFG } = GAME_CONFIG;
const CATEGORY_STOP_WORDS = new Set([
  'a', 'an', 'and', 'at', 'by', 'for', 'from', 'in', 'into', 'of', 'on', 'or',
  'the', 'there', 'to', 'with', 'is', 'are', 'was', 'were',
  // Low-signal category modifiers we can safely ignore for forgiving matches.
  'adult', 'average', 'extant', 'female', 'land', 'male', 'native', 'retail',
  'total', 'undergrad', 'undergraduate', 'us', 'u', 's', 'worldwide',
]);

const CATEGORY_PHRASE_ALIASES = [
  [/\bbox office\b/g, 'gross'],
  [/\bworldwide gross\b/g, 'gross'],
  [/\btotal worldwide gross\b/g, 'gross'],
  [/\bcopies sold\b/g, 'sales'],
  [/\bcopy sold\b/g, 'sales'],
  [/\btotal sales\b/g, 'sales'],
  [/\bnumber of\b/g, 'count'],
  [/\bamount of\b/g, 'count'],
  [/\bpieces of\b/g, 'count'],
  [/\bpopulation size\b/g, 'population'],
  [/\bage at inauguration\b/g, 'inauguration age'],
  [/\bmost common\b/g, 'common'],
];

const CATEGORY_WORD_ALIASES = new Map([
  ['adoption', 'usage'],
  ['america', 'american'],
  ['americas', 'american'],
  ['boxoffice', 'gross'],
  ['centers', 'center'],
  ['centres', 'center'],
  ['copies', 'sales'],
  ['copy', 'sales'],
  ['cost', 'price'],
  ['counts', 'count'],
  ['debris', 'junk'],
  ['earnings', 'gross'],
  ['enrolment', 'population'],
  ['enrollment', 'population'],
  ['franchises', 'franchise'],
  ['grossing', 'gross'],
  ['locations', 'location'],
  ['most', 'common'],
  ['outlets', 'location'],
  ['platforms', 'platform'],
  ['popes', 'pope'],
  ['popularity', 'usage'],
  ['presidents', 'president'],
  ['prices', 'price'],
  ['profits', 'gross'],
  ['revenue', 'gross'],
  ['sales', 'sale'],
  ['sold', 'sale'],
  ['speakers', 'speaker'],
  ['states', 'state'],
  ['stores', 'location'],
  ['students', 'population'],
  ['universities', 'university'],
  ['usage', 'usage'],
  ['users', 'usage'],
]);

function applyCategoryPhraseAliases(value) {
  return CATEGORY_PHRASE_ALIASES.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    value.toLowerCase()
  );
}

function singularizeWord(word) {
  if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith('sses') && word.length > 5) return word.slice(0, -2);
  if (word.endsWith('s') && word.length > 3 && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

function normalizeCategoryWord(word) {
  const directAlias = CATEGORY_WORD_ALIASES.get(word);
  if (directAlias) return directAlias;

  const singular = singularizeWord(word);
  const singularAlias = CATEGORY_WORD_ALIASES.get(singular);
  if (singularAlias) return singularAlias;

  return singular;
}

function tokenizeCategory(value) {
  return applyCategoryPhraseAliases(value)
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map(normalizeCategoryWord)
    .filter(word => word.length > 1 && !CATEGORY_STOP_WORDS.has(word));
}

function normalizeCategoryString(value) {
  return tokenizeCategory(value).join(' ');
}

function createWordFuse(words) {
  return new Fuse(words.map(w => ({ w })), {
    keys: ['w'],
    threshold: 0.35,
    isCaseSensitive: false,
    ignoreLocation: true,
  });
}

function countCoveredWords(sourceWords, targetFuse) {
  if (sourceWords.length === 0) return 0;
  return sourceWords.filter(word => targetFuse.search(word).length > 0).length;
}

function splitCategoryParts(categoryString) {
  const [subjectRaw, ...metricRawParts] = categoryString.split(/\bby\b/i);
  return {
    subjectWords: tokenizeCategory(subjectRaw ?? categoryString),
    metricWords: tokenizeCategory(metricRawParts.join(' ')),
  };
}

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
  const normalizedQuery = normalizeCategoryString(q);
  const normalizedCategory = normalizeCategoryString(categoryString);
  const { subjectWords, metricWords } = splitCategoryParts(categoryString);
  const catWords = [...subjectWords, ...metricWords];
  const queryWords = tokenizeCategory(q);
  if (queryWords.length === 0) return { matched: false, closeness: 0 };

  const queryFuse = createWordFuse(queryWords);
  const categoryFuse = createWordFuse(catWords);
  const subjectCovered = countCoveredWords(subjectWords, queryFuse);
  const metricCovered = metricWords.length > 0 ? countCoveredWords(metricWords, queryFuse) : 0;

  // Pass 1: Fuse (order-sensitive but typo-tolerant)
  const fuse = new Fuse([{ category: normalizedCategory }], {
    keys: ['category'],
    threshold: Math.max(CFG.categoryThreshold, 0.22),
    isCaseSensitive: false,
    ignoreLocation: true,
  });
  const fullStringMatch = normalizedQuery && fuse.search(normalizedQuery).length > 0;
  if (
    fullStringMatch &&
    (subjectWords.length === 0 || subjectCovered >= 1) &&
    (metricWords.length === 0 || metricCovered >= 1)
  ) {
    return { matched: true, closeness: 1 };
  }

  // Pass 2: normalized word-set overlap with per-word fuzzy matching.
  // This is more forgiving about synonyms like "box office" ↔ "gross".
  // Reverse coverage: how many category words does the query touch?
  const catCovered = countCoveredWords(catWords, queryFuse);
  const closeness = catWords.length > 0 ? catCovered / catWords.length : 0;

  const matchedQueryWords = countCoveredWords(queryWords, categoryFuse);

  // Require the player to touch both the subject and the ranking angle,
  // but accept shorthand and close rephrasings of each.
  const queryOk = matchedQueryWords >= Math.max(1, Math.ceil(queryWords.length * 0.7));
  const categoryOk = catCovered >= Math.max(2, Math.ceil(catWords.length * 0.55));
  const subjectOk = subjectWords.length === 0
    ? true
    : subjectCovered >= Math.max(1, Math.ceil(subjectWords.length * 0.5));
  const metricOk = metricWords.length === 0
    ? true
    : metricCovered >= 1;

  return { matched: queryOk && categoryOk && subjectOk && metricOk, closeness };
}
