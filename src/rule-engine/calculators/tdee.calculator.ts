/**
 * TDEE (Total Daily Energy Expenditure) Calculator
 * Uses Mifflin-St Jeor equation for BMR calculation
 */

export interface TDEEInput {
  weight: number; // kg
  height: number; // cm
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

export interface TDEEResult {
  bmr: number;
  tdee: number;
  activityMultiplier: number;
}

/**
 * Activity level multipliers based on scientific literature
 */
const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,      // Little or no exercise
  light: 1.375,        // Light exercise 1-3 days/week
  moderate: 1.55,      // Moderate exercise 3-5 days/week
  active: 1.725,       // Hard exercise 6-7 days/week
  very_active: 1.9,    // Very hard exercise, physical job, or training twice per day
};

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor equation
 * BMR (male) = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
 * BMR (female) = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161
 */
export function calculateBMR(input: TDEEInput): number {
  const { weight, height, age, gender } = input;

  // Mifflin-St Jeor formula
  const bmr =
    10 * weight +
    6.25 * height -
    5 * age +
    (gender === 'male' ? 5 : -161);

  return Math.round(bmr);
}

/**
 * Calculate Total Daily Energy Expenditure (TDEE)
 * TDEE = BMR × Activity Multiplier
 */
export function calculateTDEE(input: TDEEInput): TDEEResult {
  const bmr = calculateBMR(input);
  const activityMultiplier = ACTIVITY_MULTIPLIERS[input.activityLevel] || 1.2;
  const tdee = Math.round(bmr * activityMultiplier);

  return {
    bmr,
    tdee,
    activityMultiplier,
  };
}
