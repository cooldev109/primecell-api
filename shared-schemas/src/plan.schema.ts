import { z } from 'zod';

/**
 * Plan Schemas (Nutrition, Training, Supplements)
 */

// Nutrition Plan Schema
export const MacroBreakdownSchema = z.object({
  protein: z.object({
    grams: z.number().positive(),
    percentage: z.number().min(0).max(100),
  }),
  carbs: z.object({
    grams: z.number().positive(),
    percentage: z.number().min(0).max(100),
  }),
  fat: z.object({
    grams: z.number().positive(),
    percentage: z.number().min(0).max(100),
  }),
  calories: z.number().positive(),
});

export const MealOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  ingredients: z.array(z.string()),
  approximateQuantity: z.string(), // e.g., "100-150g protein, 1 cup rice, vegetables"
  prepTime: z.string().optional(), // e.g., "10 minutes"
});

export const MealSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  mealTime: z.string(), // e.g., "7:00-9:00 AM" or "Morning"
  options: z.array(MealOptionSchema).length(3), // Always 3 options
  notes: z.string().optional(),
});

export const NutritionPlanSchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  calories: z.number().positive(),
  macros: MacroBreakdownSchema,
  mealStructure: z.object({
    mealsPerDay: z.number().int().min(3).max(5),
    eatingWindow: z.string().optional(), // e.g., "8 AM - 8 PM"
  }),
  meals: z.array(MealSchema),
  guidelines: z.array(z.string()), // Real-food philosophy text blocks
  flexibilityRules: z.array(z.string()), // e.g., "1-2 free meals per week"
  validFrom: z.string().datetime(),
  validTo: z.string().datetime().optional(),
});

// Training Plan Schema
export const ExerciseSchema = z.object({
  name: z.string(),
  sets: z.number().int().positive(),
  reps: z.string(), // e.g., "8-10" or "12-15"
  restSeconds: z.number().int().positive(),
  progressionType: z.enum(['weight', 'reps', 'sets', 'tempo']),
  notes: z.string().optional(),
});

export const TrainingSessionSchema = z.object({
  day: z.number().int().min(1).max(7),
  name: z.string(), // e.g., "Upper A" or "Lower B"
  exercises: z.array(ExerciseSchema),
  estimatedDuration: z.string(), // e.g., "60 minutes"
});

export const TrainingPlanSchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  programId: z.string(),
  programName: z.string(),
  week: z.number().int().positive(), // Current week in the program
  frequency: z.number().int().min(1).max(7), // Sessions per week
  sessions: z.array(TrainingSessionSchema),
  volumeAdjustment: z.number(), // e.g., 1.0 = 100%, 1.05 = +5%, 0.95 = -5%
  intensityAdjustment: z.number(),
  isDeload: z.boolean(),
  progressionNotes: z.string().optional(),
  validFrom: z.string().datetime(),
  validTo: z.string().datetime().optional(),
});

// Supplement Protocol Schema
export const SupplementRecommendationSchema = z.object({
  name: z.string(), // e.g., "KyoSlim", "CreaPrime Creatine", "Shape Protein"
  reason: z.string(), // Why it's recommended for this user
  dosage: z.string(), // e.g., "5g daily", "1-2 servings daily"
  timing: z.string().optional(), // e.g., "Pre-workout", "With meals"
  optional: z.boolean().default(false),
});

export const SupplementProtocolSchema = z.object({
  products: z.array(SupplementRecommendationSchema),
});

// Combined Plan Version Schema
export const PlanVersionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  version: z.number().int().positive(),
  nutritionPlan: NutritionPlanSchema,
  trainingPlan: TrainingPlanSchema,
  supplementProtocol: SupplementProtocolSchema,
  createdAt: z.string().datetime(),
  validFrom: z.string().datetime(),
  validTo: z.string().datetime().optional(),
});

// TypeScript types
export type MacroBreakdown = z.infer<typeof MacroBreakdownSchema>;
export type MealOption = z.infer<typeof MealOptionSchema>;
export type Meal = z.infer<typeof MealSchema>;
export type NutritionPlan = z.infer<typeof NutritionPlanSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type TrainingSession = z.infer<typeof TrainingSessionSchema>;
export type TrainingPlan = z.infer<typeof TrainingPlanSchema>;
export type SupplementRecommendation = z.infer<typeof SupplementRecommendationSchema>;
export type SupplementProtocol = z.infer<typeof SupplementProtocolSchema>;
export type PlanVersion = z.infer<typeof PlanVersionSchema>;
