import { describe, expect, it } from 'vitest';
import {
  EMPTY_FILTERS,
  applyFilters,
  availableLetters,
  buildSearchText,
  deriveDiet,
  firstLetter,
  hasActiveFilters,
  matchesQuery,
  normalizeText,
  parseFilters,
  serializeFilters,
  sortEntries,
  uniqueCuisines,
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

const pasta = entry({ title: 'Creamy Tomato Pasta', category: 'dinner', cuisine: 'italian', tags: ['pasta', 'vegetarian'], ingredients: ['Spaghetti', 'Cherry tomatoes'], totalMinutes: 30 });
const salad = entry({ title: 'Roasted Chickpea Kale Salad', category: 'salads', cuisine: 'mediterranean', tags: ['vegan'], ingredients: ['Kale', 'Chickpeas'], totalMinutes: 40 });
const soup = entry({ title: 'Chicken Noodle Soup', category: 'soups', cuisine: 'american', difficulty: 'medium', tags: ['chicken'], ingredients: ['Chicken thighs', 'Egg noodles'], totalMinutes: 80 });
const cake = entry({ title: 'Chocolate Olive Oil Cake', category: 'desserts', cuisine: 'italian', difficulty: 'medium', tags: ['vegetarian'], ingredients: ['Dark chocolate', 'Crème fraîche'], totalMinutes: 60 });
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

  it('filters by diet', () => {
    expect(applyFilters(all, { ...EMPTY_FILTERS, diet: 'vegetarian' }).map((e) => e.title)).toEqual([
      'Chocolate Olive Oil Cake',
      'Creamy Tomato Pasta',
      'Roasted Chickpea Kale Salad'
    ]);
    expect(applyFilters(all, { ...EMPTY_FILTERS, diet: 'vegan' }).map((e) => e.title)).toEqual(['Roasted Chickpea Kale Salad']);
  });

  it('filters by time, difficulty and cuisine', () => {
    expect(applyFilters(all, { ...EMPTY_FILTERS, time: '30' }).map((e) => e.title)).toEqual(['Creamy Tomato Pasta']);
    expect(applyFilters(all, { ...EMPTY_FILTERS, time: '60' })).toHaveLength(3);
    expect(applyFilters(all, { ...EMPTY_FILTERS, difficulty: 'medium' })).toHaveLength(2);
    expect(applyFilters(all, { ...EMPTY_FILTERS, cuisine: 'italian' })).toHaveLength(2);
  });

  it('combines filters and the query', () => {
    const state: FilterState = { ...EMPTY_FILTERS, cuisine: 'italian', diet: 'vegetarian', q: 'chocolate' };
    expect(applyFilters(all, state).map((e) => e.title)).toEqual(['Chocolate Olive Oil Cake']);
  });

  it('filters by first letter', () => {
    expect(applyFilters(all, { ...EMPTY_FILTERS, letter: 'C' })).toHaveLength(3);
    expect(applyFilters(all, { ...EMPTY_FILTERS, letter: 'R' })).toHaveLength(1);
    expect(applyFilters(all, { ...EMPTY_FILTERS, letter: 'Z' })).toHaveLength(0);
  });

  it('sorts A–Z and Z–A', () => {
    expect(applyFilters(all, EMPTY_FILTERS).map((e) => e.title)).toEqual([
      'Chicken Noodle Soup',
      'Chocolate Olive Oil Cake',
      'Creamy Tomato Pasta',
      'Roasted Chickpea Kale Salad'
    ]);
    expect(applyFilters(all, { ...EMPTY_FILTERS, sort: 'desc' }).map((e) => e.title)).toEqual([
      'Roasted Chickpea Kale Salad',
      'Creamy Tomato Pasta',
      'Chocolate Olive Oil Cake',
      'Chicken Noodle Soup'
    ]);
  });

  it('does not mutate the input array', () => {
    const copy = [...all];
    sortEntries(all, 'desc');
    expect(all).toEqual(copy);
  });

  it('stays fast with a few hundred recipes', () => {
    const many = Array.from({ length: 300 }, (_, i) =>
      entry({ title: `Recipe ${i}`, tags: i % 2 ? ['vegan'] : ['chicken'], ingredients: [`Ingredient ${i}`, 'salt'] })
    );
    const start = performance.now();
    for (let i = 0; i < 50; i += 1) applyFilters(many, { ...EMPTY_FILTERS, q: 'salt recipe 1', diet: 'vegan' });
    expect(performance.now() - start).toBeLessThan(500);
  });
});

describe('letters and cuisines', () => {
  it('derives the first letter and ignores leading articles', () => {
    expect(firstLetter('Shakshuka')).toBe('S');
    expect(firstLetter('the Best Soup')).toBe('B');
    expect(firstLetter('Éclair')).toBe('E');
    expect(firstLetter('5-minute oats')).toBe('#');
  });

  it('lists available letters and cuisines', () => {
    expect([...availableLetters(all)].sort()).toEqual(['C', 'R']);
    expect(uniqueCuisines(all)).toEqual(['american', 'italian', 'mediterranean']);
  });
});

describe('URL parameters', () => {
  it('round-trips valid state', () => {
    const state: FilterState = { q: 'tomato', category: 'dinner', diet: 'vegan', time: '60', difficulty: 'easy', cuisine: 'italian', letter: 'C', sort: 'desc' };
    const query = serializeFilters(state);
    expect(parseFilters(new URLSearchParams(query))).toEqual(state);
  });

  it('drops invalid values and defaults', () => {
    const parsed = parseFilters(new URLSearchParams('category=nope&diet=keto&time=5&sort=sideways&letter=zz'));
    expect(parsed).toEqual(EMPTY_FILTERS);
    expect(serializeFilters(EMPTY_FILTERS)).toBe('');
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, q: 'x' })).toBe(true);
  });
});
