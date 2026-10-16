export function generateWhatsAppMessage(recipeTitle: string, servings: number, items: Array<{ checked: boolean; label: string }>) {
  const remaining = items.filter((item) => !item.checked);
  const lines = [
    '🛒 Boathouse Noodles',
    `Shopping List: ${recipeTitle}`,
    `Servings: ${servings}`,
    ...remaining.map((item) => `☐ ${item.label}`)
  ];

  return lines.join('\n');
}

export function buildWhatsAppLink(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function getRecipeUrl(basePath: string, slug: string) {
  return `${basePath}recipes/${slug}/`;
}
