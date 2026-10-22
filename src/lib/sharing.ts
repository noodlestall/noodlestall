export interface ShoppingItem {
  label: string;
  checked: boolean;
}

export interface ShoppingGroup {
  title: string;
  items: ShoppingItem[];
}

export interface ShoppingListInput {
  recipeTitle: string;
  servings: number;
  groups: ShoppingGroup[];
}

const BRAND_LINE = '🛒 NOODLESTALL AU LAC';

/**
 * Plain-text shopping list of the remaining (unchecked) ingredients.
 *
 * 🛒 NOODLESTALL AU LAC
 *
 * Shopping List: Creamy Tomato Pasta
 * Servings: 2
 *
 * PASTA
 * ☐ 200 g Spaghetti
 */
export function buildShoppingListMessage(input: ShoppingListInput): string {
  const lines: string[] = [BRAND_LINE, '', `Shopping List: ${input.recipeTitle}`, `Servings: ${formatServings(input.servings)}`];

  const remainingGroups = input.groups
    .map((group) => ({ title: group.title, items: group.items.filter((item) => !item.checked) }))
    .filter((group) => group.items.length > 0);

  if (remainingGroups.length === 0) {
    lines.push('', 'Everything is already ticked off.');
    return lines.join('\n');
  }

  for (const group of remainingGroups) {
    lines.push('', group.title.toUpperCase());
    for (const item of group.items) {
      lines.push(`☐ ${item.label}`);
    }
  }

  return lines.join('\n');
}

export function formatServings(servings: number): string {
  return (Math.round(servings * 100) / 100).toString();
}

/** wa.me link with the text percent-encoded. Opening it never sends anything by itself. */
export function buildWhatsAppUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function buildRecipeShareMessage(title: string, url: string): string {
  return `${title} – Noodlestall au Lac\n${url}`;
}
