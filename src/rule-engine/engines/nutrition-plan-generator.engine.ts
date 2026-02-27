/**
 * Nutrition Plan Generator Engine
 * Generates complete nutrition plans using rule-based calculations
 */

import { calculateTDEE, TDEEInput } from '../calculators/tdee.calculator';
import { calculateTargetCalories, EnergyBalanceInput } from '../calculators/energy-balance.calculator';
import { calculateMacros, MacroInput } from '../calculators/macro.calculator';
import { validateNutritionPlan, getSafetyConstraints } from '../validators/safety.validator';

export interface NutritionPlanInput {
  // User profile
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'weight_loss' | 'maintenance' | 'muscle_gain';

  // Preferences
  dietaryPreferences?: string[];
  mealsPerDay?: number;
}

export interface NutritionPlan {
  // Calculated values
  bmr: number;
  tdee: number;
  targetCalories: number;
  protein: number;
  fat: number;
  carbs: number;

  // Metadata
  activityMultiplier: number;
  deficit: number;
  deficitPercentage: number;
  estimatedWeeklyWeightChange: number;

  // Meal planning
  mealsPerDay: number;
  caloriesPerMeal: number;

  // Safety validation
  validation: {
    isValid: boolean;
    violations: string[];
    warnings: string[];
  };

  // Safety constraints for reference
  safetyConstraints: {
    minCalories: number;
    maxDeficit: number;
    maxSurplus: number;
    minProtein: number;
    maxWeeklyWeightLoss: number;
  };
}

/**
 * Generate a complete nutrition plan
 */
export function generateNutritionPlan(input: NutritionPlanInput): NutritionPlan {
  const { weight, height, age, gender, activityLevel, goal, mealsPerDay = 3 } = input;

  // Step 1: Calculate TDEE
  const tdeeInput: TDEEInput = {
    weight,
    height,
    age,
    gender,
    activityLevel,
  };
  const tdeeResult = calculateTDEE(tdeeInput);

  // Step 2: Calculate target calories based on goal
  const energyInput: EnergyBalanceInput = {
    tdee: tdeeResult.tdee,
    goal,
    weight,
  };
  const energyResult = calculateTargetCalories(energyInput);

  // Step 3: Calculate macros
  const macroInput: MacroInput = {
    weight,
    targetCalories: energyResult.targetCalories,
    goal,
    activityLevel,
  };
  const macroResult = calculateMacros(macroInput);

  // Step 4: Validate safety
  const validation = validateNutritionPlan(
    energyResult.targetCalories,
    macroResult.protein,
    weight,
    gender,
    tdeeResult.tdee,
    goal,
  );

  // Step 5: Get safety constraints
  const safetyConstraints = getSafetyConstraints(weight, gender, tdeeResult.tdee);

  // Step 6: Calculate per-meal breakdown
  const caloriesPerMeal = Math.round(energyResult.targetCalories / mealsPerDay);

  return {
    // Calculated values
    bmr: tdeeResult.bmr,
    tdee: tdeeResult.tdee,
    targetCalories: energyResult.targetCalories,
    protein: macroResult.protein,
    fat: macroResult.fat,
    carbs: macroResult.carbs,

    // Metadata
    activityMultiplier: tdeeResult.activityMultiplier,
    deficit: energyResult.deficit,
    deficitPercentage: energyResult.deficitPercentage,
    estimatedWeeklyWeightChange: energyResult.weeklyWeightChangeKg,

    // Meal planning
    mealsPerDay,
    caloriesPerMeal,

    // Validation
    validation,
    safetyConstraints,
  };
}

/**
 * Adjust existing nutrition plan based on progress
 */
export function adjustNutritionPlan(
  currentPlan: NutritionPlan,
  calorieAdjustment: number,
  weight: number,
  gender: 'male' | 'female',
  goal: 'weight_loss' | 'maintenance' | 'muscle_gain',
): NutritionPlan {
  // Calculate new target calories
  const newTargetCalories = currentPlan.targetCalories + calorieAdjustment;

  // Recalculate macros with new calorie target
  const macroInput: MacroInput = {
    weight,
    targetCalories: newTargetCalories,
    goal,
    activityLevel: 'moderate', // Use existing activity level from user profile
  };
  const macroResult = calculateMacros(macroInput);

  // Validate new plan
  const validation = validateNutritionPlan(
    newTargetCalories,
    macroResult.protein,
    weight,
    gender,
    currentPlan.tdee,
    goal,
  );

  // Calculate new deficit
  const newDeficit = currentPlan.tdee - newTargetCalories;
  const newDeficitPercentage = newDeficit / currentPlan.tdee;

  // Estimate new weekly weight change
  const weeklyDeficit = newDeficit * 7;
  const estimatedWeeklyWeightChange = parseFloat((weeklyDeficit / 7700).toFixed(2));

  // Calculate per-meal breakdown
  const caloriesPerMeal = Math.round(newTargetCalories / currentPlan.mealsPerDay);

  return {
    ...currentPlan,
    targetCalories: newTargetCalories,
    protein: macroResult.protein,
    fat: macroResult.fat,
    carbs: macroResult.carbs,
    deficit: newDeficit,
    deficitPercentage: newDeficitPercentage,
    estimatedWeeklyWeightChange,
    caloriesPerMeal,
    validation,
  };
}
