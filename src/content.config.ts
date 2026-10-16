import { defineCollection, z } from 'astro:content';

const ingredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive().optional(),
  unit: z.enum(['g', 'kg', 'ml', 'l', 'piece']).optional(),
  group: z.string().optional(),
  optional: z.boolean().optional(),
  note: z.string().optional()
});

const instructionSchema = z.object({
  step: z.number().positive(),
  text: z.string().min(1),
  image: z.string().optional()
});

const recipeSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(['Breakfast', 'Lunch', 'Dinner', 'Desserts', 'Baking', 'Snacks', 'Soups', 'Salads']),
  tags: z.array(z.string()).default([]),
  servings: z.number().positive(),
  prepTime: z.string().optional(),
  cookTime: z.string().optional(),
  totalTime: z.string().optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  cuisine: z.string().optional(),
  dietary: z.array(z.string()).default([]),
  equipment: z.array(z.string()).default([]),
  notes: z.array(z.string()).default([]),
  tips: z.array(z.string()).default([]),
  sourceUrl: z.string().url().optional(),
  sourceName: z.string().optional(),
  related: z.array(z.string()).default([]),
  featured: z.boolean().optional(),
  cover: z.string().optional(),
  images: z.array(z.string()).default([]),
  ingredients: z.array(ingredientSchema),
  instructions: z.array(instructionSchema)
});

export const collections = {
  recipes: defineCollection({
    schema: recipeSchema
  })
};
