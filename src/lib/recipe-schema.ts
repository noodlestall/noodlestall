import { z } from 'astro/zod';

/**
 * Shared recipe schema.
 *
 * Astro's content collection passes its `image()` helper so cover and step
 * images are optimised at build time. The standalone validation script passes
 * a plain string schema instead and checks that the files exist on disk.
 */

export const CATEGORIES = [
  'breakfast',
  'lunch',
  'dinner',
  'desserts',
  'baking',
  'snacks',
  'soups',
  'salads'
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  desserts: 'Desserts',
  baking: 'Baking',
  snacks: 'Snacks',
  soups: 'Soups',
  salads: 'Salads'
};

export const UNITS = ['g', 'kg', 'ml', 'l', 'piece'] as const;
export type Unit = (typeof UNITS)[number];

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard'
};

const lower = (value: string) => value.trim().toLowerCase();

export const ingredientSchema = z
  .object({
    name: z.string().trim().min(1, 'Ingredient name is required'),
    quantity: z.number().positive('Quantity must be a positive number').optional(),
    unit: z.enum(UNITS).optional(),
    note: z.string().trim().min(1).optional(),
    optional: z.boolean().default(false)
  })
  .superRefine((ingredient, ctx) => {
    const hasQuantity = ingredient.quantity !== undefined;
    const hasUnit = ingredient.unit !== undefined;
    if (hasQuantity !== hasUnit) {
      ctx.addIssue({
        code: 'custom',
        message: `"${ingredient.name}": quantity and unit must be given together`
      });
    }
    if (!hasQuantity && !ingredient.note) {
      ctx.addIssue({
        code: 'custom',
        message: `"${ingredient.name}": give a numeric quantity with a unit, or a note such as "to taste"`
      });
    }
  });

export const ingredientGroupSchema = z.object({
  title: z.string().trim().min(1),
  ingredients: z.array(ingredientSchema).min(1, 'Each ingredient group needs at least one ingredient')
});

export const sourceSchema = z.object({
  name: z.string().trim().min(1).optional(),
  url: z.url().nullable().optional()
});

export function buildRecipeSchema<TImage extends z.ZodType>(image: TImage) {
  const instructionSchema = z.object({
    title: z.string().trim().min(1).optional(),
    text: z.string().trim().min(1),
    image: image.optional(),
    imageAlt: z.string().trim().optional()
  });

  return z
    .object({
      title: z.string().trim().min(1).max(120),
      description: z.string().trim().min(1).max(400),
      category: z.string().transform(lower).pipe(z.enum(CATEGORIES)),
      cuisine: z.string().transform(lower).optional(),
      difficulty: z.string().transform(lower).pipe(z.enum(DIFFICULTIES)),
      servings: z.number().positive(),
      prepTimeMinutes: z.number().int().nonnegative(),
      cookTimeMinutes: z.number().int().nonnegative(),
      coverImage: image.optional(),
      coverAlt: z.string().trim().min(1).optional(),
      draft: z.boolean().default(false),
      tags: z.array(z.string().transform(lower)).default([]),
      ingredientGroups: z.array(ingredientGroupSchema).min(1),
      instructions: z.array(instructionSchema).min(1),
      source: sourceSchema.optional()
    })
    .superRefine((recipe, ctx) => {
      if (!recipe.draft && !recipe.coverImage) {
        ctx.addIssue({
          code: 'custom',
          message: 'coverImage is required. Add a photograph, or mark the recipe with "draft: true" to show a placeholder.'
        });
      }
    });
}

export const plainRecipeSchema = buildRecipeSchema(z.string().trim().min(1));
export type PlainRecipe = z.infer<typeof plainRecipeSchema>;
export type Ingredient = z.infer<typeof ingredientSchema>;
export type IngredientGroup = z.infer<typeof ingredientGroupSchema>;
