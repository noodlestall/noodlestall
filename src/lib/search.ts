import { CATEGORIES, DIFFICULTIES, type Category, type Difficulty } from './recipe-schema';

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

export type DietFilter = '' | 'vegetarian' | 'vegan';
export type TimeFilter = '' | '30' | '60' | '120';
export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  q: string;
  category: Category | '';
  diet: DietFilter;
  time: TimeFilter;
  difficulty: Difficulty | '';
  cuisine: string;
  letter: string;
  sort: SortDirection;
}

export const EMPTY_FILTERS: FilterState = {
  q: '',
  category: '',
  diet: '',
  time: '',
  difficulty: '',
  cuisine: '',
  letter: '',
  sort: 'asc'
};

export const TIME_OPTIONS: Array<{ value: Exclude<TimeFilter, ''>; label: string }> = [
  { value: '30', label: 'Up to 30 min' },
  { value: '60', label: 'Up to 1 hour' },
  { value: '120', label: 'Up to 2 hours' }
];

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

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

/** First letter of the title for the A–Z index. Non-letters are grouped under "#". */
export function firstLetter(title: string): string {
  const first = normalizeText(title).replace(/^(the|a|an)\s+/, '').charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : '#';
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
  if (state.diet === 'vegetarian' && !entry.vegetarian) return false;
  if (state.diet === 'vegan' && !entry.vegan) return false;
  if (state.time && entry.totalMinutes > Number(state.time)) return false;
  if (state.difficulty && entry.difficulty !== state.difficulty) return false;
  if (state.cuisine && entry.cuisine !== state.cuisine) return false;
  if (state.letter && firstLetter(entry.title) !== state.letter.toUpperCase()) return false;
  return true;
}

export function compareTitles(a: { title: string }, b: { title: string }, direction: SortDirection = 'asc'): number {
  const result = a.title.localeCompare(b.title, 'en', { sensitivity: 'base', numeric: true });
  return direction === 'asc' ? result : -result;
}

export function sortEntries<T extends { title: string }>(entries: T[], direction: SortDirection): T[] {
  return [...entries].sort((a, b) => compareTitles(a, b, direction));
}

/** Filters and sorts in one pass. Fast enough for several hundred recipes on every keystroke. */
export function applyFilters(entries: RecipeIndexEntry[], state: FilterState): RecipeIndexEntry[] {
  return sortEntries(
    entries.filter((entry) => matchesFilters(entry, state)),
    state.sort
  );
}

/** Letters that have at least one recipe, so the A–Z index can disable empty ones. */
export function availableLetters(entries: Array<{ title: string }>): Set<string> {
  return new Set(entries.map((entry) => firstLetter(entry.title)));
}

export function uniqueCuisines(entries: Array<{ cuisine: string | null }>): string[] {
  return [...new Set(entries.map((entry) => entry.cuisine).filter((c): c is string => Boolean(c)))].sort();
}

function pick<T extends string>(value: string | null, allowed: readonly T[]): T | '' {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : '';
}

/** Reads filter state from URL search params, ignoring anything invalid. */
export function parseFilters(params: URLSearchParams): FilterState {
  const letter = (params.get('letter') ?? '').toUpperCase();
  return {
    q: (params.get('q') ?? '').trim(),
    category: pick(params.get('category'), CATEGORIES),
    diet: pick(params.get('diet'), ['vegetarian', 'vegan'] as const),
    time: pick(params.get('time'), ['30', '60', '120'] as const),
    difficulty: pick(params.get('difficulty'), DIFFICULTIES),
    cuisine: normalizeText(params.get('cuisine') ?? ''),
    letter: letter === '#' || LETTERS.includes(letter) ? letter : '',
    sort: params.get('sort') === 'desc' ? 'desc' : 'asc'
  };
}

/** Writes only the non-default parts of the state, so clean URLs stay clean. */
export function serializeFilters(state: FilterState): string {
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  if (state.category) params.set('category', state.category);
  if (state.diet) params.set('diet', state.diet);
  if (state.time) params.set('time', state.time);
  if (state.difficulty) params.set('difficulty', state.difficulty);
  if (state.cuisine) params.set('cuisine', state.cuisine);
  if (state.letter) params.set('letter', state.letter);
  if (state.sort !== 'asc') params.set('sort', state.sort);
  return params.toString();
}

export function hasActiveFilters(state: FilterState): boolean {
  return serializeFilters(state) !== '';
}
