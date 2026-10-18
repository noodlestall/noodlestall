import { describe, expect, it } from 'vitest';
import {
  EMPTY_FILTERS,
  applyFilters,
  buildSearchText,
  deriveDiet,
  hasActiveFilters,
  matchesQuery,
  normalizeText,
  parseFilters,
  serializeFilters,
  sortEntries,
  type FilterState,
  type RecipeIndexEntry
} from '../../src/lib/search';

function entry(overrides: Partial<RecipeIndexEntry> & { title: string }): RecipeIndexEntry {
  const tags = overrides.tags ?? [];
  const ingredients = overrides.ingredients ?? [];
  const diet = deriveDiet(tags);
  return {
    id: overrides.title.toLowerCase().replace(/\s+/g, '-'),
    number: 1,
    category: 'dinner',
    cuisine: null,
    difficulty: 'easy',
    totalMinutes: 30,
    vegetarian: diet.vegetarian,
    vegan: diet.vegan,
    draft: false,
    searchText: buildSearchText({ title: overrides.title, tags, ingredients }),
    ...overrides,
    tags,
    ingredients
  };
}

const pasta = entry({ title: 'Creamy Tomato Pasta', category: 'dinner', tags: ['pasta', 'vegetarian'], ingredients: ['Spaghetti', 'Cherry tomatoes'] });
const salad = entry({ title: 'Roasted Chickpea Kale Salad', category: 'salads', tags: ['vegan'], ingredients: ['Kale', 'Chickpeas'] });
const soup = entry({ title: 'Chicken Noodle Soup', category: 'soups', tags: ['chicken'], ingredients: ['Chicken thighs', 'Egg noodles'] });
const cake = entry({ title: 'Chocolate Olive Oil Cake', category: 'desserts', tags: ['vegetarian'], ingredients: ['Dark chocolate', 'Crème fraîche'] });
const all = [soup, cake, pasta, salad];

describe('normalizeText and matching', () => {
  it('ignores case and diacritics', () => {
    expect(normalizeText('  Crème Fraîche ')).toBe('creme fraiche');
    expect(matchesQuery(cake, 'creme')).toBe(true);
    expect(matchesQuery(cake, 'CHOCOLATE')).toBe(true);
  });

  it('matches titles, ingredients and tags', () => {
    expect(matchesQuery(pasta, 'spaghetti')).toBe(true);
    expect(matchesQuery(pasta, 'vegetarian')).toBe(true);
    expect(matchesQuery(pasta, 'chicken')).toBe(false);
  });

  it('requires every word to match', () => {
    expect(matchesQuery(pasta, 'tomato pasta')).toBe(true);
    expect(matchesQuery(pasta, 'tomato chicken')).toBe(false);
    expect(matchesQuery(pasta, '   ')).toBe(true);
  });
});

describe('deriveDiet', () => {
  it('treats vegan as vegetarian too', () => {
    expect(deriveDiet(['vegan'])).toEqual({ vegetarian: true, vegan: true });
    expect(deriveDiet(['Vegetarian'])).toEqual({ vegetarian: true, vegan: false });
    expect(deriveDiet(['chicken'])).toEqual({ vegetarian: false, vegan: false });
  });
});

describe('applyFilters', () => {
  it('filters by category', () => {
    expect(applyFilters(all, { ...EMPTY_FILTERS, category: 'soups' }).map((e) => e.title)).toEqual(['Chicken Noodle Soup']);
  });

  it('combines the category and the query', () => {
    const state: FilterState = { ...EMPTY_FILTERS, category: 'desserts', q: 'chocolate' };
    expect(applyFilters(all, state).map((e) => e.title)).toEqual(['Chocolate Olive Oil Cake']);
    expect(applyFilters(all, { ...EMPTY_FILTERS, category: 'soups', q: 'chocolate' })).toEqual([]);
  });

  it('always returns titles A–Z', () => {
    expect(applyFilters(all, EMPTY_FILTERS).map((e) => e.title)).toEqual([
      'Chicken Noodle Soup',
      'Chocolate Olive Oil Cake',
      'Creamy Tomato Pasta',
      'Roasted Chickpea Kale Salad'
    ]);
  });

  it('does not mutate the input array', () => {
    const copy = [...all];
    sortEntries(all);
    expect(all).toEqual(copy);
  });

  it('stays fast with a few hundred recipes', () => {
    const many = Array.from({ length: 300 }, (_, i) =>
      entry({ title: `Recipe ${i}`, tags: i % 2 ? ['vegan'] : ['chicken'], ingredients: [`Ingredient ${i}`, 'salt'] })
    );
    const start = performance.now();
    for (let i = 0; i < 50; i += 1) applyFilters(many, { ...EMPTY_FILTERS, q: 'salt recipe 1' });
    expect(performance.now() - start).toBeLessThan(500);
  });
});

describe('URL parameters', () => {
  it('round-trips valid state', () => {
    const state: FilterState = { q: 'tomato', category: 'dinner' };
    const query = serializeFilters(state);
    expect(parseFilters(new URLSearchParams(query))).toEqual(state);
  });

  it('drops invalid values and legacy parameters', () => {
    const parsed = parseFilters(new URLSearchParams('category=nope&diet=vegan&time=30&sort=desc&letter=C'));
    expect(parsed).toEqual(EMPTY_FILTERS);
    expect(serializeFilters(EMPTY_FILTERS)).toBe('');
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, q: 'x' })).toBe(true);
  });
});
