import { formatQuantityWithUnit, scaleQuantity } from './scaling';
import type { ShoppingGroup } from './sharing';

/** Ingredient data embedded in the recipe page for the client script. */
export interface ClientIngredient {
  name: string;
  quantity: number | null;
  unit: string | null;
  note: string | null;
  optional: boolean;
}

export interface ClientIngredientGroup {
  title: string;
  ingredients: ClientIngredient[];
}

export interface ClientRecipe {
  id: string;
  title: string;
  servings: number;
  url: string;
  groups: ClientIngredientGroup[];
}

/** "200 g" scaled from the original quantity, or null for qualitative ingredients. */
export function scaledQuantityLabel(ingredient: ClientIngredient, servings: number, originalServings: number): string | null {
  if (ingredient.quantity === null || ingredient.unit === null) return null;
  return formatQuantityWithUnit(scaleQuantity(ingredient.quantity, servings, originalServings), ingredient.unit);
}

/** "200 g Spaghetti", "Black pepper (to taste)", "Fresh basil (a small handful, optional)". */
export function shoppingLabel(ingredient: ClientIngredient, servings: number, originalServings: number): string {
  const quantity = scaledQuantityLabel(ingredient, servings, originalServings);
  const extras: string[] = [];
  if (quantity === null && ingredient.note) extras.push(ingredient.note);
  if (ingredient.optional) extras.push('optional');
  const suffix = extras.length > 0 ? ` (${extras.join(', ')})` : '';
  return quantity ? `${quantity} ${ingredient.name}${suffix}` : `${ingredient.name}${suffix}`;
}

/** Stable key for storing checkbox state: "<group index>-<ingredient index>". */
export function itemKey(groupIndex: number, ingredientIndex: number): string {
  return `${groupIndex}-${ingredientIndex}`;
}

export function buildShoppingGroups(recipe: ClientRecipe, servings: number, checked: Set<string>): ShoppingGroup[] {
  return recipe.groups.map((group, g) => ({
    title: group.title,
    items: group.ingredients.map((ingredient, i) => ({
      label: shoppingLabel(ingredient, servings, recipe.servings),
      checked: checked.has(itemKey(g, i))
    }))
  }));
}
