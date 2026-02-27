/**
 * Macro Calculator
 * Calculates protein, fat, and carbohydrate targets based on scientific ratios
 */

export interface MacroInput {
  weight: number; // kg
  targetCalories: number;
  goal: 'weight_loss' | 'maintenance' | 'muscle_gain';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

export interface MacroResult {
  protein: number; // grams
  fat: number; // grams
  carbs: number; // grams
  proteinCalories: number;
  fatCalories: number;
  carbsCalories: number;
}

/**
 * Protein targets (grams per kg body weight)
 * Based on research for optimal muscle retention/growth
 */
const PROTEIN_RATIOS: Record<string, { min: number; max: number }> = {
  weight_loss: { min: 2.0, max: 2.4 },      // Higher protein during deficit to preserve muscle
  maintenance: { min: 1.8, max: 2.2 },      // Moderate protein for maintenance
  muscle_gain: { min: 1.6, max: 2.2 },      // Protein for muscle building
};

/**
 * Fat targets (grams per kg body weight)
 * Essential for hormone production and health
 */
const FAT_RATIOS: Record<string, { min: number; max: number }> = {
  weight_loss: { min: 0.8, max: 1.0 },      // Moderate fat during deficit
  maintenance: { min: 0.8, max: 1.2 },      // Balanced fat intake
  muscle_gain: { min: 0.8, max: 1.0 },      // Moderate fat, more room for carbs
};

/**
 * Calculate protein target based on goal and weight
 */
function calculateProtein(weight: number, goal: string): number {
  const ratio = PROTEIN_RATIOS[goal] || PROTEIN_RATIOS.maintenance;
  // Use higher end for weight loss, middle for others
  const targetRatio = goal === 'weight_loss' ? ratio.max : (ratio.min + ratio.max) / 2;
  return Math.round(weight * targetRatio);
}

/**
 * Calculate fat target based on goal and weight
 */
function calculateFat(weight: number, goal: string): number {
  const ratio = FAT_RATIOS[goal] || FAT_RATIOS.maintenance;
  // Use middle of range
  const targetRatio = (ratio.min + ratio.max) / 2;
  return Math.round(weight * targetRatio);
}

/**
 * Calculate carbs from remaining calories
 * Carbs = (Total Calories - Protein Calories - Fat Calories) / 4
 */
function calculateCarbs(
  targetCalories: number,
  proteinGrams: number,
  fatGrams: number,
): number {
  const proteinCalories = proteinGrams * 4;
  const fatCalories = fatGrams * 9;
  const remainingCalories = targetCalories - proteinCalories - fatCalories;

  // Ensure carbs are not negative
  const carbsGrams = Math.max(0, Math.round(remainingCalories / 4));
  return carbsGrams;
}

/**
 * Calculate all macronutrient targets
 */
export function calculateMacros(input: MacroInput): MacroResult {
  const { weight, targetCalories, goal } = input;

  // Calculate protein and fat based on body weight
  const protein = calculateProtein(weight, goal);
  const fat = calculateFat(weight, goal);

  // Calculate carbs from remaining calories
  const carbs = calculateCarbs(targetCalories, protein, fat);

  // Calculate calories from each macro
  const proteinCalories = protein * 4;
  const fatCalories = fat * 9;
  const carbsCalories = carbs * 4;

  return {
    protein,
    fat,
    carbs,
    proteinCalories,
    fatCalories,
    carbsCalories,
  };
}

/**
 * Validate that macros add up to target calories (within 5% tolerance)
 */
export function validateMacros(result: MacroResult, targetCalories: number): boolean {
  const totalCalories = result.proteinCalories + result.fatCalories + result.carbsCalories;
  const difference = Math.abs(totalCalories - targetCalories);
  const tolerance = targetCalories * 0.05; // 5% tolerance

  return difference <= tolerance;
}
