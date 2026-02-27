import { z } from 'zod';

/**
 * Onboarding Input Schema
 * Phase 1 - Initial Assessment
 */

// Step 1: About You
export const PersonalDataSchema = z.object({
  age: z.number().int().min(18).max(100),
  sex: z.enum(['male', 'female']),
  height: z.number().positive(), // in cm
  weight: z.number().positive(), // in kg
  photoUrl: z.string().url().optional(),
});

// Step 2: Goal Selection
export const PrimaryGoalSchema = z.enum([
  'lose_fat',        // Lose body fat (waist reduction)
  'lose_weight',     // Lose weight on the scale
  'gain_muscle',     // Gain muscle mass
  'health_energy',   // Health & energy
  'performance',     // Physical performance
  'longevity',       // Longevity & prevention
]);

export const GoalSpecificQuestionsSchema = z.discriminatedUnion('goal', [
  // Lose body fat
  z.object({
    goal: z.literal('lose_fat'),
    waistTarget: z.enum(['2-4cm', '5-8cm', '9+cm', 'ai_recommend']),
  }),
  // Lose weight
  z.object({
    goal: z.literal('lose_weight'),
    weightLossTarget: z.enum(['2-4kg', '5-8kg', '9-12kg', '12+kg', 'ai_recommend']),
    idealWeight: z.number().positive().optional(),
  }),
  // Gain muscle
  z.object({
    goal: z.literal('gain_muscle'),
    muscleGainTarget: z.enum(['1-2kg', '3-4kg', '5+kg', 'ai_recommend']),
  }),
  // Health & energy
  z.object({
    goal: z.literal('health_energy'),
    improvementAreas: z.array(
      z.enum(['digestion', 'sleep', 'daily_energy', 'fluid_retention', 'blood_sugar', 'overall_wellbeing'])
    ).min(1),
  }),
  // Performance
  z.object({
    goal: z.literal('performance'),
    performanceFocus: z.array(z.enum(['strength', 'endurance', 'speed', 'recovery'])).min(1),
  }),
  // Longevity
  z.object({
    goal: z.literal('longevity'),
    longevityFocus: z.enum(['weight_control', 'cardiovascular', 'metabolic', 'body_composition']),
  }),
]);

// Step 3: Lifestyle & Routine
export const LifestyleSchema = z.object({
  workType: z.enum(['sedentary', 'mixed', 'active']),
  sleepHours: z.enum(['<6h', '6-7h', '7-8h', '8h+']),
  stressLevel: z.enum(['low', 'moderate', 'high', 'very_high']),
  trainingSchedule: z.enum(['morning', 'afternoon', 'evening', 'do_not_train']),
});

// Step 4: Training & Energy Expenditure
export const TrainingSchema = z.object({
  frequency: z.enum(['do_not_train', '1-2x', '3-4x', '5+x']),
  types: z.array(
    z.enum(['weight_training', 'home_workouts', 'hiit', 'cardio_running', 'walking'])
  ).min(0),
  intensity: z.enum(['light', 'moderate', 'intense']).optional(),
});

// Step 5: Food Preferences
export const FoodPreferencesSchema = z.object({
  mealsPerDay: z.enum(['3', '4', '5', 'varies']),
  preferredCarbSources: z.array(
    z.enum(['rice', 'pasta', 'potatoes', 'bread', 'legumes', 'fruit'])
  ).min(1),
  excludedFoods: z.array(
    z.enum(['dairy', 'gluten', 'fish', 'red_meat', 'sweets', 'other'])
  ).optional(),
  excludedFoodsOther: z.string().optional(),
  digestiveDiscomfortFoods: z.string().optional(),
});

// Step 6: Health & Metabolic Safety
export const HealthSchema = z.object({
  diagnosedConditions: z.array(
    z.enum(['hypertension', 'high_cholesterol', 'insulin_resistance', 'hypothyroidism', 'none'])
  ).min(1),
  digestion: z.enum(['normal', 'constipation', 'gas_bloating', 'reflux']),
  regularMedications: z.boolean(),
  medicationDetails: z.string().optional(),
  otherHealthNotes: z.string().optional(),
});

// Step 7: Social Life & Adherence
export const SocialAdherenceSchema = z.object({
  mealsOutsidePerWeek: z.enum(['0', '1-2', '3-4', '5+']),
  planStructurePreference: z.enum(['disciplined', 'balanced_80_20', 'flexible']),
  previousDietExperience: z.enum(['worked_for_some_time', 'could_not_maintain', 'first_time']),
});

// Combined Onboarding Input Schema
export const OnboardingInputSchema = z.object({
  personalData: PersonalDataSchema,
  goalSelection: GoalSpecificQuestionsSchema,
  lifestyle: LifestyleSchema,
  training: TrainingSchema,
  foodPreferences: FoodPreferencesSchema,
  health: HealthSchema,
  socialAdherence: SocialAdherenceSchema,
});

// Onboarding Result Schema (output from onboarding)
export const OnboardingResultSchema = z.object({
  quantifiedGoal: z.string(), // e.g., "Lose 5-8 cm around waist over 12-16 weeks"
  recommendedPace: z.string(), // e.g., "Moderate (0.5-0.7 kg/week)"
  flexibilityLevel: z.enum(['high', 'moderate', 'low']),
  metabolicContext: z.string(), // Brief explanation of user's metabolic state
  realisticExpectations: z.string(), // Setting expectations
  initialPlan: z.object({
    nutritionPlanId: z.string(),
    trainingProgramId: z.string(),
  }),
});

// TypeScript types exported from schemas
export type PersonalData = z.infer<typeof PersonalDataSchema>;
export type PrimaryGoal = z.infer<typeof PrimaryGoalSchema>;
export type GoalSpecificQuestions = z.infer<typeof GoalSpecificQuestionsSchema>;
export type Lifestyle = z.infer<typeof LifestyleSchema>;
export type Training = z.infer<typeof TrainingSchema>;
export type FoodPreferences = z.infer<typeof FoodPreferencesSchema>;
export type Health = z.infer<typeof HealthSchema>;
export type SocialAdherence = z.infer<typeof SocialAdherenceSchema>;
export type OnboardingInput = z.infer<typeof OnboardingInputSchema>;
export type OnboardingResult = z.infer<typeof OnboardingResultSchema>;
