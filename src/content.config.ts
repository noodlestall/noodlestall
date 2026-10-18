import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { buildRecipeSchema } from './lib/recipe-schema';

/**
 * One folder per recipe: src/content/recipes/<slug>/recipe.md
 * The folder name is the stable slug used in URLs.
 */
const recipes = defineCollection({
  loader: glob({
    pattern: '*/recipe.md',
    base: './src/content/recipes',
    generateId: ({ entry }) => entry.split('/')[0] ?? entry
  }),
  schema: ({ image }) => buildRecipeSchema(image())
});

export const collections = { recipes };
