import { getCollection, type CollectionEntry } from 'astro:content';
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from './recipe-schema';
import { buildSearchText, compareTitles, deriveDiet, type RecipeIndexEntry } from './search';
import { formatMinutes, titleCase } from './site';

export type Recipe = CollectionEntry<'recipes'>;

export interface NumberedRecipe {
  entry: Recipe;
  number: number;
}

/** All recipes sorted A–Z with a stable archive number derived from that order. */
export async function getNumberedRecipes(): Promise<NumberedRecipe[]> {
  const entries = await getCollection('recipes');
  return entries
    .sort((a, b) => compareTitles({ title: a.data.title }, { title: b.data.title }))
    .map((entry, index) => ({ entry, number: index + 1 }));
}

export function totalMinutes(data: Recipe['data']): number {
  return data.prepTimeMinutes + data.cookTimeMinutes;
}

export function categoryLabel(data: Recipe['data']): string {
  return CATEGORY_LABELS[data.category];
}

export function difficultyLabel(data: Recipe['data']): string {
  return DIFFICULTY_LABELS[data.difficulty];
}

export function cuisineLabel(data: Recipe['data']): string | null {
  return data.cuisine ? titleCase(data.cuisine) : null;
}

/** Short "Dinner · 30 min · Easy" line used in the index and on related cards. */
export function metaLine(data: Recipe['data']): string {
  return [categoryLabel(data), formatMinutes(totalMinutes(data)), difficultyLabel(data)].join(' · ');
}

export function toIndexEntry({ entry, number }: NumberedRecipe): RecipeIndexEntry {
  const { data } = entry;
  const ingredients = data.ingredientGroups.flatMap((group) => group.ingredients.map((i) => i.name));
  const diet = deriveDiet(data.tags);
  return {
    id: entry.id,
    number,
    title: data.title,
    category: data.category,
    cuisine: data.cuisine ?? null,
    difficulty: data.difficulty,
    totalMinutes: totalMinutes(data),
    tags: data.tags,
    ingredients,
    vegetarian: diet.vegetarian,
    vegan: diet.vegan,
    draft: data.draft,
    searchText: buildSearchText({ title: data.title, tags: data.tags, ingredients })
  };
}
