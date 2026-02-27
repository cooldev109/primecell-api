/**
 * Energy Balance Calculator
 * Determines calorie targets based on goals (deficit, maintenance, surplus)
 */

export interface EnergyBalanceInput {
  tdee: number;
  goal: 'weight_loss' | 'maintenance' | 'muscle_gain';
  weight: number; // kg (used for calculating safe deficit limits)
}

export interface EnergyBalanceResult {
  targetCalories: number;
  deficit: number; // negative for deficit, positive for surplus
  deficitPercentage: number;
  weeklyWeightChangeKg: number; // estimated weekly weight change
}

/**
 * Deficit/surplus percentages based on goal
 */
const ENERGY_ADJUSTMENTS: Record<string, { min: number; max: number }> = {
  weight_loss: { min: -0.25, max: -0.20 },    // 20-25% deficit
  maintenance: { min: 0, max: 0 },             // No change
  muscle_gain: { min: 0.08, max: 0.12 },       // 8-12% surplus
};

/**
 * Maximum safe deficits/surpluses (absolute values)
 */
const MAX_ADJUSTMENTS = {
  deficit: 500,  // Max 500 cal/day deficit
  surplus: 300,  // Max 300 cal/day surplus
};

/**
 * Calculate target calories based on goal
 */
export function calculateTargetCalories(input: EnergyBalanceInput): EnergyBalanceResult {
  const { tdee, goal, weight } = input;

  // Get adjustment range for goal
  const adjustment = ENERGY_ADJUSTMENTS[goal] || ENERGY_ADJUSTMENTS.maintenance;

  // Use more aggressive end of range for weight loss, conservative for muscle gain
  let deficitPercentage: number;
  if (goal === 'weight_loss') {
    deficitPercentage = adjustment.max; // Use -20% to -25% deficit
  } else if (goal === 'muscle_gain') {
    deficitPercentage = adjustment.min; // Use +8% to +10% surplus
  } else {
    deficitPercentage = 0; // Maintenance
  }

  // Calculate absolute deficit/surplus
  let deficit = Math.round(tdee * deficitPercentage);

  // Apply safety limits
  if (goal === 'weight_loss') {
    deficit = Math.max(deficit, -MAX_ADJUSTMENTS.deficit); // Don't exceed max deficit
  } else if (goal === 'muscle_gain') {
    deficit = Math.min(deficit, MAX_ADJUSTMENTS.surplus); // Don't exceed max surplus
  }

  // Calculate target calories
  const targetCalories = tdee + deficit; // deficit is negative for weight loss

  // Estimate weekly weight change
  // 1 kg fat = ~7700 calories
  // Weekly deficit = daily deficit × 7
  const weeklyDeficit = deficit * 7;
  const weeklyWeightChangeKg = parseFloat((weeklyDeficit / 7700).toFixed(2));

  return {
    targetCalories: Math.round(targetCalories),
    deficit,
    deficitPercentage,
    weeklyWeightChangeKg,
  };
}

/**
 * Adjust calories based on progress data
 * Used by the adjustment engine after check-ins
 */
export function adjustCalories(
  currentCalories: number,
  actualWeightChange: number,
  expectedWeightChange: number,
  goal: 'weight_loss' | 'maintenance' | 'muscle_gain',
): number {
  const difference = actualWeightChange - expectedWeightChange;

  // If weight change is as expected (within 0.2kg tolerance), no adjustment
  if (Math.abs(difference) < 0.2) {
    return currentCalories;
  }

  // Calculate adjustment needed
  // 1kg difference = ~1100 cal/day adjustment (7700 cal/week ÷ 7 days)
  const calorieAdjustment = Math.round(difference * 1100);

  // Limit adjustment to ±200 cal/week for safety
  const limitedAdjustment = Math.max(-200, Math.min(200, calorieAdjustment));

  return currentCalories + limitedAdjustment;
}
