import { describe, expect, it } from 'vitest';
import { plainRecipeSchema } from '../../src/lib/recipe-schema';

const valid = {
  title: 'Creamy Tomato Pasta',
  description: 'A comforting tomato pasta.',
  category: 'Dinner',
  cuisine: 'Italian',
  difficulty: 'Easy',
  servings: 2,
  prepTimeMinutes: 10,
  cookTimeMinutes: 20,
  coverImage: './cover.webp',
  tags: ['Pasta', 'vegetarian'],
  ingredientGroups: [
    {
      title: 'Pasta',
      ingredients: [
        { name: 'Spaghetti', quantity: 200, unit: 'g' },
        { name: 'Salt', note: 'to taste' }
      ]
    }
  ],
  instructions: [{ title: 'Cook', text: 'Cook the pasta.' }],
  source: { name: 'Original recipe', url: null }
};

describe('recipe schema', () => {
  it('accepts a valid recipe and normalises casing', () => {
    const result = plainRecipeSchema.parse(valid);
    expect(result.category).toBe('dinner');
    expect(result.cuisine).toBe('italian');
    expect(result.difficulty).toBe('easy');
    expect(result.tags).toEqual(['pasta', 'vegetarian']);
    expect(result.draft).toBe(false);
    expect(result.ingredientGroups[0]!.ingredients[0]!.optional).toBe(false);
  });

  it('rejects unknown categories and units', () => {
    expect(plainRecipeSchema.safeParse({ ...valid, category: 'brunch' }).success).toBe(false);
    const badUnit = { ...valid, ingredientGroups: [{ title: 'A', ingredients: [{ name: 'Flour', quantity: 1, unit: 'cup' }] }] };
    expect(plainRecipeSchema.safeParse(badUnit).success).toBe(false);
  });

  it('rejects quantities without units, units without quantities and non-positive numbers', () => {
    const noUnit = { ...valid, ingredientGroups: [{ title: 'A', ingredients: [{ name: 'Flour', quantity: 100 }] }] };
    const noQuantity = { ...valid, ingredientGroups: [{ title: 'A', ingredients: [{ name: 'Flour', unit: 'g' }] }] };
    const negative = { ...valid, ingredientGroups: [{ title: 'A', ingredients: [{ name: 'Flour', quantity: -5, unit: 'g' }] }] };
    const stringQuantity = { ...valid, ingredientGroups: [{ title: 'A', ingredients: [{ name: 'Flour', quantity: '100', unit: 'g' }] }] };
    for (const candidate of [noUnit, noQuantity, negative, stringQuantity]) {
      expect(plainRecipeSchema.safeParse(candidate).success).toBe(false);
    }
  });

  it('requires a note when there is no quantity', () => {
    const bare = { ...valid, ingredientGroups: [{ title: 'A', ingredients: [{ name: 'Pepper' }] }] };
    expect(plainRecipeSchema.safeParse(bare).success).toBe(false);
  });

  it('requires servings, instructions and at least one ingredient group', () => {
    expect(plainRecipeSchema.safeParse({ ...valid, servings: 0 }).success).toBe(false);
    expect(plainRecipeSchema.safeParse({ ...valid, instructions: [] }).success).toBe(false);
    expect(plainRecipeSchema.safeParse({ ...valid, ingredientGroups: [] }).success).toBe(false);
  });

  it('requires a cover image unless the recipe is a draft', () => {
    const { coverImage: _cover, ...noCover } = valid;
    expect(plainRecipeSchema.safeParse(noCover).success).toBe(false);
    const draft = plainRecipeSchema.safeParse({ ...noCover, draft: true });
    expect(draft.success).toBe(true);
    if (draft.success) expect(draft.data.coverImage).toBeUndefined();
  });

  it('validates source URLs', () => {
    expect(plainRecipeSchema.safeParse({ ...valid, source: { name: 'Blog', url: 'not a url' } }).success).toBe(false);
    expect(plainRecipeSchema.safeParse({ ...valid, source: { name: 'Blog', url: 'https://example.com/recipe' } }).success).toBe(true);
  });
});
