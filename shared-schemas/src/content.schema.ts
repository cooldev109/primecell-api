import { z } from 'zod';

/**
 * Content Schemas (Training Programs, Meal Templates)
 */

// Training Program Schema
export const TrainingProgramExerciseSchema = z.object({
  name: z.string(),
  sets: z.number().int().positive(),
  reps: z.string(), // e.g., "8-10", "12-15", "AMRAP"
  restSeconds: z.number().int().positive(),
  progressionType: z.enum(['weight', 'reps', 'sets', 'tempo', 'rest']),
  notes: z.string().optional(),
  equipment: z.array(z.string()).optional(), // e.g., ["barbell", "bench"]
});

export const TrainingProgramSessionSchema = z.object({
  day: z.number().int().min(1).max(7),
  name: z.string(), // e.g., "Upper A", "Lower B", "Full Body"
  focus: z.string().optional(), // e.g., "Push", "Pull", "Legs"
  exercises: z.array(TrainingProgramExerciseSchema),
  estimatedDuration: z.string(), // e.g., "60 minutes"
});

export const TrainingProgramWeekSchema = z.object({
  week: z.number().int().positive(),
  sessions: z.array(TrainingProgramSessionSchema),
  notes: z.string().optional(),
});

export const TrainingProgramSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  frequency: z.number().int().min(1).max(7), // Sessions per week
  durationWeeks: z.number().int().positive(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  equipment: z.array(z.string()), // e.g., ["barbell", "dumbbells", "machines", "bodyweight"]
  goals: z.array(
    z.enum(['muscle_gain', 'strength', 'fat_loss', 'endurance', 'general_fitness'])
  ),
  split: z.string(), // e.g., "Upper/Lower", "Push/Pull/Legs", "Full Body"
  weeks: z.array(TrainingProgramWeekSchema),
  createdAt: z.string().datetime(),
});

// Meal Template Schema
export const MealTemplateIngredientSchema = z.object({
  item: z.string(),
  amount: z.string(), // e.g., "100g", "1 cup", "2 tbsp"
  category: z.enum([
    'protein_source',
    'carb_source',
    'fat_source',
    'vegetable',
    'fruit',
    'condiment',
    'other',
  ]),
  optional: z.boolean().default(false),
});

export const MealTemplateMacrosSchema = z.object({
  protein: z.number().positive(), // grams
  carbs: z.number().positive(),   // grams
  fat: z.number().positive(),     // grams
  calories: z.number().positive(),
});

export const MealTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  mealTime: z.enum(['morning', 'midday', 'evening', 'anytime']),
  difficulty: z.enum(['easy', 'moderate', 'complex']),
  prepTime: z.number().int().positive(), // minutes
  cookTime: z.number().int().positive().optional(), // minutes
  totalTime: z.number().int().positive(), // minutes
  servings: z.number().int().positive().default(1),

  // Dietary classification
  dietaryTags: z.array(
    z.enum([
      'omnivore',
      'vegetarian',
      'vegan',
      'pescatarian',
      'low_carb',
      'high_protein',
      'dairy_free',
      'gluten_free',
    ])
  ),
  excludedAllergens: z.array(
    z.enum(['dairy', 'gluten', 'nuts', 'eggs', 'soy', 'fish', 'shellfish'])
  ).default([]),

  // Nutrition
  macros: MealTemplateMacrosSchema,

  // Recipe
  ingredients: z.array(MealTemplateIngredientSchema),
  instructions: z.string(),
  substitutions: z.record(z.string(), z.array(z.string())).optional(), // e.g., { "rice": ["quinoa", "pasta"] }

  // Metadata
  imageUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(), // e.g., ["high-protein", "quick", "meal-prep-friendly"]
  createdAt: z.string().datetime(),
});

// Filters for querying content
export const TrainingProgramFiltersSchema = z.object({
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  frequency: z.number().int().min(1).max(7).optional(),
  goals: z.array(
    z.enum(['muscle_gain', 'strength', 'fat_loss', 'endurance', 'general_fitness'])
  ).optional(),
  equipment: z.array(z.string()).optional(),
});

export const MealTemplateFiltersSchema = z.object({
  category: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
  dietaryTags: z.array(
    z.enum([
      'omnivore',
      'vegetarian',
      'vegan',
      'pescatarian',
      'low_carb',
      'high_protein',
      'dairy_free',
      'gluten_free',
    ])
  ).optional(),
  excludeAllergens: z.array(
    z.enum(['dairy', 'gluten', 'nuts', 'eggs', 'soy', 'fish', 'shellfish'])
  ).optional(),
  maxPrepTime: z.number().int().positive().optional(), // minutes
});

// TypeScript types
export type TrainingProgramExercise = z.infer<typeof TrainingProgramExerciseSchema>;
export type TrainingProgramSession = z.infer<typeof TrainingProgramSessionSchema>;
export type TrainingProgramWeek = z.infer<typeof TrainingProgramWeekSchema>;
export type TrainingProgram = z.infer<typeof TrainingProgramSchema>;
export type MealTemplateIngredient = z.infer<typeof MealTemplateIngredientSchema>;
export type MealTemplateMacros = z.infer<typeof MealTemplateMacrosSchema>;
export type MealTemplate = z.infer<typeof MealTemplateSchema>;
export type TrainingProgramFilters = z.infer<typeof TrainingProgramFiltersSchema>;
export type MealTemplateFilters = z.infer<typeof MealTemplateFiltersSchema>;
