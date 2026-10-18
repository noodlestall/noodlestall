import { CATEGORIES, type Category, type Difficulty } from './recipe-schema';

/** Lightweight record embedded in the archive page for client-side search. */
export interface RecipeIndexEntry {
  id: string;
  number: number;
  title: string;
  category: Category;
  cuisine: string | null;
  difficulty: Difficulty;
  totalMinutes: number;
  tags: string[];
  ingredients: string[];
  vegetarian: boolean;
  vegan: boolean;
  draft: boolean;
  /** Pre-normalised text for matching: title, tags and ingredient names. */
  searchText: string;
}

export interface FilterState {
  q: string;
  category: Category | '';
}

export const EMPTY_FILTERS: FilterState = {
  q: '',
  category: ''
};

/** Lowercase, trimmed, diacritics removed so "crème" matches "creme". */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function buildSearchText(parts: { title: string; tags: string[]; ingredients: string[] }): string {
  return normalizeText([parts.title, ...parts.tags, ...parts.ingredients].join(' | '));
}

/** Vegan recipes are vegetarian too. Derived from tags so authors only maintain one list. */
export function deriveDiet(tags: string[]): { vegetarian: boolean; vegan: boolean } {
  const set = new Set(tags.map(normalizeText));
  const vegan = set.has('vegan');
  return { vegetarian: vegan || set.has('vegetarian'), vegan };
}

/** Every search word must appear somewhere in the recipe's search text. */
export function matchesQuery(entry: Pick<RecipeIndexEntry, 'searchText'>, query: string): boolean {
  const words = normalizeText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  return words.every((word) => entry.searchText.includes(word));
}

export function matchesFilters(entry: RecipeIndexEntry, state: FilterState): boolean {
  if (!matchesQuery(entry, state.q)) return false;
  if (state.category && entry.category !== state.category) return false;
  return true;
}

/** Archive order: titles A–Z, case- and accent-insensitive, numbers in natural order. */
export function compareTitles(a: { title: string }, b: { title: string }): number {
  return a.title.localeCompare(b.title, 'en', { sensitivity: 'base', numeric: true });
}

export function sortEntries<T extends { title: string }>(entries: T[]): T[] {
  return [...entries].sort(compareTitles);
}

/** Filters and sorts in one pass. Fast enough for several hundred recipes on every keystroke. */
export function applyFilters(entries: RecipeIndexEntry[], state: FilterState): RecipeIndexEntry[] {
  return sortEntries(entries.filter((entry) => matchesFilters(entry, state)));
}

function pick<T extends string>(value: string | null, allowed: readonly T[]): T | '' {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : '';
}

/** Reads filter state from URL search params, ignoring anything invalid. */
export function parseFilters(params: URLSearchParams): FilterState {
  return {
    q: (params.get('q') ?? '').trim(),
    category: pick(params.get('category'), CATEGORIES)
  };
}

/** Writes only the non-default parts of the state, so clean URLs stay clean. */
export function serializeFilters(state: FilterState): string {
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  if (state.category) params.set('category', state.category);
  return params.toString();
}

export function hasActiveFilters(state: FilterState): boolean {
  return serializeFilters(state) !== '';
}
