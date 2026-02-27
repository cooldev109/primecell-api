/**
 * Adjustment Validator
 * Validates plan adjustments based on progress data
 */

export interface ProgressData {
  currentWeight: number;
  previousWeight: number;
  weeksSinceLastCheckin: number;
  goal: 'weight_loss' | 'maintenance' | 'muscle_gain';
}

export interface AdjustmentRecommendation {
  shouldAdjust: boolean;
  reason: string;
  recommendedCalorieChange: number;
  pattern: 'too_fast' | 'too_slow' | 'stalled' | 'on_track' | 'reversed';
}

/**
 * Analyze progress and recommend adjustments
 */
export function analyzeProgress(
  progressData: ProgressData,
  expectedWeeklyChange: number,
): AdjustmentRecommendation {
  const { currentWeight, previousWeight, weeksSinceLastCheckin, goal } = progressData;

  // Calculate actual weekly change
  const totalWeightChange = currentWeight - previousWeight;
  const weeklyChange = totalWeightChange / weeksSinceLastCheckin;

  // Determine if progress is on track
  const tolerance = 0.2; // ±0.2kg tolerance
  const difference = Math.abs(weeklyChange - expectedWeeklyChange);

  // On track - no adjustment needed
  if (difference <= tolerance) {
    return {
      shouldAdjust: false,
      reason: 'Progress is on track. No adjustment needed.',
      recommendedCalorieChange: 0,
      pattern: 'on_track',
    };
  }

  // Analyze based on goal
  if (goal === 'weight_loss') {
    return analyzeWeightLossProgress(weeklyChange, expectedWeeklyChange);
  } else if (goal === 'muscle_gain') {
    return analyzeMuscleGainProgress(weeklyChange, expectedWeeklyChange);
  } else {
    return analyzeMaintenanceProgress(weeklyChange);
  }
}

/**
 * Analyze weight loss progress
 */
function analyzeWeightLossProgress(
  actualChange: number,
  expectedChange: number,
): AdjustmentRecommendation {
  // Weight loss expected change is negative
  // actualChange = -1.0kg, expectedChange = -0.6kg → losing too fast
  // actualChange = -0.2kg, expectedChange = -0.6kg → losing too slow

  if (actualChange < expectedChange - 0.3) {
    // Losing weight too fast
    const calorieIncrease = Math.min(200, Math.abs((actualChange - expectedChange) * 1100));
    return {
      shouldAdjust: true,
      reason: `Weight loss is too rapid (${Math.abs(actualChange).toFixed(1)}kg/week). Increasing calories to prevent muscle loss.`,
      recommendedCalorieChange: Math.round(calorieIncrease),
      pattern: 'too_fast',
    };
  } else if (actualChange > expectedChange + 0.3) {
    // Losing weight too slow or not losing
    const calorieDecrease = Math.min(200, Math.abs((actualChange - expectedChange) * 1100));
    return {
      shouldAdjust: true,
      reason: `Weight loss is slower than expected (${Math.abs(actualChange).toFixed(1)}kg/week). Decreasing calories slightly.`,
      recommendedCalorieChange: -Math.round(calorieDecrease),
      pattern: 'too_slow',
    };
  } else if (actualChange >= 0) {
    // Weight increased during weight loss
    return {
      shouldAdjust: true,
      reason: 'Weight increased during weight loss phase. Reducing calories.',
      recommendedCalorieChange: -150,
      pattern: 'reversed',
    };
  }

  return {
    shouldAdjust: false,
    reason: 'Progress is acceptable.',
    recommendedCalorieChange: 0,
    pattern: 'on_track',
  };
}

/**
 * Analyze muscle gain progress
 */
function analyzeMuscleGainProgress(
  actualChange: number,
  expectedChange: number,
): AdjustmentRecommendation {
  // Muscle gain expected change is positive
  // actualChange = 0.8kg, expectedChange = 0.3kg → gaining too fast (too much fat)
  // actualChange = 0.1kg, expectedChange = 0.3kg → gaining too slow

  if (actualChange > expectedChange + 0.3) {
    // Gaining too fast (likely too much fat)
    return {
      shouldAdjust: true,
      reason: `Weight gain is too rapid (${actualChange.toFixed(1)}kg/week). Reducing calories to minimize fat gain.`,
      recommendedCalorieChange: -100,
      pattern: 'too_fast',
    };
  } else if (actualChange < expectedChange - 0.2) {
    // Gaining too slow or losing weight
    return {
      shouldAdjust: true,
      reason: `Weight gain is slower than expected (${actualChange.toFixed(1)}kg/week). Increasing calories.`,
      recommendedCalorieChange: 150,
      pattern: 'too_slow',
    };
  } else if (actualChange <= -0.2) {
    // Weight decreased during muscle gain
    return {
      shouldAdjust: true,
      reason: 'Weight decreased during muscle gain phase. Increasing calories significantly.',
      recommendedCalorieChange: 200,
      pattern: 'reversed',
    };
  }

  return {
    shouldAdjust: false,
    reason: 'Progress is acceptable.',
    recommendedCalorieChange: 0,
    pattern: 'on_track',
  };
}

/**
 * Analyze maintenance progress
 */
function analyzeMaintenanceProgress(actualChange: number): AdjustmentRecommendation {
  const tolerance = 0.3; // ±0.3kg is acceptable for maintenance

  if (Math.abs(actualChange) <= tolerance) {
    return {
      shouldAdjust: false,
      reason: 'Weight is stable. Maintaining current calories.',
      recommendedCalorieChange: 0,
      pattern: 'on_track',
    };
  } else if (actualChange < -tolerance) {
    // Losing weight unintentionally
    return {
      shouldAdjust: true,
      reason: `Unintentional weight loss (${Math.abs(actualChange).toFixed(1)}kg/week). Increasing calories.`,
      recommendedCalorieChange: 100,
      pattern: 'too_fast',
    };
  } else {
    // Gaining weight unintentionally
    return {
      shouldAdjust: true,
      reason: `Unintentional weight gain (${actualChange.toFixed(1)}kg/week). Decreasing calories.`,
      recommendedCalorieChange: -100,
      pattern: 'too_slow',
    };
  }
}

/**
 * Detect stalled progress (no change for 3+ weeks)
 */
export function detectStall(recentWeights: number[], threshold = 3): boolean {
  if (recentWeights.length < threshold) {
    return false;
  }

  // Check if weight hasn't changed more than 0.3kg across recent check-ins
  const maxWeight = Math.max(...recentWeights);
  const minWeight = Math.min(...recentWeights);
  const range = maxWeight - minWeight;

  return range < 0.3;
}
