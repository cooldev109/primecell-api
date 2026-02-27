/**
 * Safety Validator
 * Ensures all plans meet metabolic safety constraints
 */

export interface SafetyConstraints {
  minCalories: number;
  maxDeficit: number;
  maxSurplus: number;
  minProtein: number;
  maxWeeklyWeightLoss: number;
}

export interface ValidationResult {
  isValid: boolean;
  violations: string[];
  warnings: string[];
}

/**
 * Minimum calorie thresholds to prevent metabolic damage
 */
const MIN_CALORIES = {
  male: 1500,
  female: 1200,
};

/**
 * Maximum safe adjustments
 */
const MAX_ADJUSTMENTS = {
  deficit: 500,      // Max 500 cal/day deficit
  surplus: 300,      // Max 300 cal/day surplus
  weeklyWeightLoss: 0.01, // Max 1% body weight per week
};

/**
 * Validate nutrition plan meets safety constraints
 */
export function validateNutritionPlan(
  calories: number,
  protein: number,
  weight: number,
  gender: 'male' | 'female',
  tdee: number,
  goal: 'weight_loss' | 'maintenance' | 'muscle_gain',
): ValidationResult {
  const violations: string[] = [];
  const warnings: string[] = [];

  // 1. Check minimum calories
  const minCalories = MIN_CALORIES[gender];
  if (calories < minCalories) {
    violations.push(
      `Calories (${calories}) below minimum safe threshold (${minCalories})`,
    );
  }

  // 2. Check maximum deficit
  if (goal === 'weight_loss') {
    const deficit = tdee - calories;
    if (deficit > MAX_ADJUSTMENTS.deficit) {
      violations.push(
        `Deficit (${deficit} cal/day) exceeds maximum safe limit (${MAX_ADJUSTMENTS.deficit})`,
      );
    }
  }

  // 3. Check maximum surplus
  if (goal === 'muscle_gain') {
    const surplus = calories - tdee;
    if (surplus > MAX_ADJUSTMENTS.surplus) {
      violations.push(
        `Surplus (${surplus} cal/day) exceeds maximum safe limit (${MAX_ADJUSTMENTS.surplus})`,
      );
    }
  }

  // 4. Check minimum protein (1.6g/kg is absolute minimum)
  const minProtein = weight * 1.6;
  if (protein < minProtein) {
    violations.push(
      `Protein (${protein}g) below minimum threshold (${minProtein.toFixed(0)}g)`,
    );
  }

  // 5. Warning for very high protein (not a violation, just a warning)
  const maxProtein = weight * 3.0;
  if (protein > maxProtein) {
    warnings.push(
      `Protein (${protein}g) is unusually high. Consider reducing to ${maxProtein.toFixed(0)}g`,
    );
  }

  // 6. Check weekly weight loss rate
  if (goal === 'weight_loss') {
    const weeklyDeficit = (tdee - calories) * 7;
    const weeklyWeightLoss = weeklyDeficit / 7700; // 1kg = 7700 cal
    const maxWeeklyLoss = weight * MAX_ADJUSTMENTS.weeklyWeightLoss;

    if (weeklyWeightLoss > maxWeeklyLoss) {
      violations.push(
        `Estimated weekly weight loss (${weeklyWeightLoss.toFixed(2)}kg) exceeds safe rate (${maxWeeklyLoss.toFixed(2)}kg/week)`,
      );
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
    warnings,
  };
}

/**
 * Validate adjustment is safe (used when updating plans)
 */
export function validateAdjustment(
  currentCalories: number,
  newCalories: number,
  gender: 'male' | 'female',
): ValidationResult {
  const violations: string[] = [];
  const warnings: string[] = [];

  // 1. Check adjustment size (should not exceed ±200 cal at once)
  const adjustment = newCalories - currentCalories;
  if (Math.abs(adjustment) > 200) {
    violations.push(
      `Adjustment (${adjustment > 0 ? '+' : ''}${adjustment} cal) exceeds maximum safe change (±200 cal)`,
    );
  }

  // 2. Check minimum calories after adjustment
  const minCalories = MIN_CALORIES[gender];
  if (newCalories < minCalories) {
    violations.push(
      `New calories (${newCalories}) below minimum safe threshold (${minCalories})`,
    );
  }

  // 3. Warning for large adjustments (150-200 cal)
  if (Math.abs(adjustment) >= 150 && Math.abs(adjustment) <= 200) {
    warnings.push(
      `Large adjustment (${adjustment > 0 ? '+' : ''}${adjustment} cal). Monitor user closely.`,
    );
  }

  return {
    isValid: violations.length === 0,
    violations,
    warnings,
  };
}

/**
 * Get safe constraints for a user
 */
export function getSafetyConstraints(
  weight: number,
  gender: 'male' | 'female',
  tdee: number,
): SafetyConstraints {
  return {
    minCalories: MIN_CALORIES[gender],
    maxDeficit: MAX_ADJUSTMENTS.deficit,
    maxSurplus: MAX_ADJUSTMENTS.surplus,
    minProtein: weight * 1.6,
    maxWeeklyWeightLoss: weight * MAX_ADJUSTMENTS.weeklyWeightLoss,
  };
}
