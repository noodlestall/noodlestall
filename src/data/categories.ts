export const categories = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Desserts',
  'Baking',
  'Snacks',
  'Soups',
  'Salads'
] as const;

export type RecipeCategory = (typeof categories)[number];
