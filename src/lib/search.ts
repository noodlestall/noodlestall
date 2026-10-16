export function normalizeSearch(text: string) {
  return text.toLowerCase().trim();
}

export function matchesQuery(recipe: { title: string; tags: string[]; ingredients: Array<{ name: string }> }, query: string) {
  const q = normalizeSearch(query);
  if (!q) return true;

  const searchableText = [
    recipe.title,
    recipe.tags.join(' '),
    recipe.ingredients.map((ingredient) => ingredient.name).join(' ')
  ]
    .join(' ')
    .toLowerCase();

  return searchableText.includes(q);
}

export function sortByTitle(a: { title: string }, b: { title: string }, direction: 'asc' | 'desc' = 'asc') {
  return direction === 'asc'
    ? a.title.localeCompare(b.title)
    : b.title.localeCompare(a.title);
}
