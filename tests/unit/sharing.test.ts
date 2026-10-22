import { describe, expect, it } from 'vitest';
import { buildRecipeShareMessage, buildShoppingListMessage, buildWhatsAppUrl } from '../../src/lib/sharing';
import { buildShoppingGroups, shoppingLabel, type ClientRecipe } from '../../src/lib/shopping';

const recipe: ClientRecipe = {
  id: 'creamy-tomato-pasta',
  title: 'Creamy Tomato Pasta',
  servings: 2,
  url: 'https://noodlestall.github.io/noodlestall/recipes/creamy-tomato-pasta/',
  groups: [
    {
      title: 'Pasta',
      ingredients: [
        { name: 'Spaghetti', quantity: 200, unit: 'g', note: null, optional: false },
        { name: 'Salt', quantity: 5, unit: 'g', note: 'for the water', optional: false }
      ]
    },
    {
      title: 'Sauce',
      ingredients: [
        { name: 'Cherry tomatoes', quantity: 300, unit: 'g', note: null, optional: false },
        { name: 'Heavy cream', quantity: 100, unit: 'ml', note: null, optional: false },
        { name: 'Olive oil', quantity: 20, unit: 'ml', note: null, optional: false },
        { name: 'Garlic cloves', quantity: 2, unit: 'piece', note: null, optional: false },
        { name: 'Black pepper', quantity: null, unit: null, note: 'to taste', optional: false },
        { name: 'Fresh basil', quantity: null, unit: null, note: 'a handful', optional: true }
      ]
    }
  ]
};

describe('buildShoppingListMessage', () => {
  it('matches the documented WhatsApp format', () => {
    const groups = buildShoppingGroups(recipe, 2, new Set());
    const message = buildShoppingListMessage({ recipeTitle: recipe.title, servings: 2, groups });
    expect(message).toBe(
      [
        '🛒 NOODLESTALL AU LAC',
        '',
        'Shopping List: Creamy Tomato Pasta',
        'Servings: 2',
        '',
        'PASTA',
        '☐ 200 g Spaghetti',
        '☐ 5 g Salt',
        '',
        'SAUCE',
        '☐ 300 g Cherry tomatoes',
        '☐ 100 ml Heavy cream',
        '☐ 20 ml Olive oil',
        '☐ 2 pieces Garlic cloves',
        '☐ Black pepper (to taste)',
        '☐ Fresh basil (a handful, optional)'
      ].join('\n')
    );
  });

  it('uses scaled quantities and omits checked items and empty groups', () => {
    const checked = new Set(['0-0', '0-1']);
    const groups = buildShoppingGroups(recipe, 4, checked);
    const message = buildShoppingListMessage({ recipeTitle: recipe.title, servings: 4, groups });
    expect(message).toContain('Servings: 4');
    expect(message).not.toContain('PASTA');
    expect(message).not.toContain('Spaghetti');
    expect(message).toContain('☐ 600 g Cherry tomatoes');
    expect(message).toContain('☐ 4 pieces Garlic cloves');
  });

  it('says so when everything is ticked off', () => {
    const everything = new Set(recipe.groups.flatMap((g, gi) => g.ingredients.map((_, i) => `${gi}-${i}`)));
    const message = buildShoppingListMessage({ recipeTitle: recipe.title, servings: 2, groups: buildShoppingGroups(recipe, 2, everything) });
    expect(message).toContain('Everything is already ticked off.');
  });
});

describe('shoppingLabel', () => {
  it('scales and pluralises pieces, keeps notes only for qualitative items', () => {
    expect(shoppingLabel(recipe.groups[1]!.ingredients[3]!, 1, 2)).toBe('1 piece Garlic cloves');
    expect(shoppingLabel(recipe.groups[0]!.ingredients[1]!, 2, 2)).toBe('5 g Salt');
    expect(shoppingLabel(recipe.groups[1]!.ingredients[4]!, 2, 2)).toBe('Black pepper (to taste)');
  });
});

describe('WhatsApp links', () => {
  it('percent-encodes the message, including emoji and newlines', () => {
    const url = buildWhatsAppUrl('🛒 NOODLESTALL AU LAC\n\nShopping List: Crème & Co');
    expect(url.startsWith('https://wa.me/?text=')).toBe(true);
    expect(url).toContain('%F0%9F%9B%92');
    expect(url).toContain('%0A%0A');
    expect(url).toContain('%26');
    expect(url).not.toContain(' ');
    expect(decodeURIComponent(url.slice('https://wa.me/?text='.length))).toBe('🛒 NOODLESTALL AU LAC\n\nShopping List: Crème & Co');
  });

  it('builds the recipe share message with the absolute URL', () => {
    expect(buildRecipeShareMessage('Shakshuka', 'https://noodlestall.github.io/noodlestall/recipes/shakshuka/')).toBe(
      'Shakshuka – Noodlestall au Lac\nhttps://noodlestall.github.io/noodlestall/recipes/shakshuka/'
    );
  });
});
