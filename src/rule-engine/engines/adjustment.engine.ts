/**
 * Adjustment Engine
 * Analyzes progress from check-ins and adjusts plans accordingly
 */

import {
  analyzeProgress,
  detectStall,
  AdjustmentRecommendation,
  ProgressData,
} from '../validators/adjustment.validator';
import { validateAdjustment } from '../validators/safety.validator';

export interface CheckInData {
  weight: number;
  createdAt: Date;
  energyLevel?: number;
  hungerLevel?: number;
  stressLevel?: number;
}

export interface AdjustmentAnalysis {
  // Progress metrics
  currentWeight: number;
  previousWeight: number;
  weightChange: number;
  weeklyWeightChange: number;

  // Pattern detection
  pattern: 'too_fast' | 'too_slow' | 'stalled' | 'on_track' | 'reversed';
  isStalled: boolean;

  // Recommendations
  shouldAdjustNutrition: boolean;
  shouldAdjustTraining: boolean;
  nutritionAdjustment: number; // Calorie adjustment
  trainingAdjustment: 'increase' | 'decrease' | 'maintain';

  // Reasoning
  reason: string;
  warnings: string[];

  // AI feedback data
  subjective: {
    energyLevel?: number;
    hungerLevel?: number;
    stressLevel?: number;
  };
}

/**
 * Analyze check-in data and generate adjustment recommendations
 */
export function analyzeCheckInProgress(
  recentCheckIns: CheckInData[],
  expectedWeeklyChange: number,
  goal: 'weight_loss' | 'maintenance' | 'muscle_gain',
  currentCalories: number,
  gender: 'male' | 'female',
): AdjustmentAnalysis {
  if (recentCheckIns.length < 2) {
    throw new Error('Need at least 2 check-ins to analyze progress');
  }

  // Sort by date (most recent first)
  const sorted = recentCheckIns.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  const current = sorted[0];
  const previous = sorted[1];

  // Calculate time difference in weeks
  const timeDiff = current.createdAt.getTime() - previous.createdAt.getTime();
  const weeksSinceLastCheckin = timeDiff / (1000 * 60 * 60 * 24 * 7);

  // Calculate weight change
  const weightChange = current.weight - previous.weight;
  const weeklyWeightChange = weightChange / weeksSinceLastCheckin;

  // Prepare progress data for analysis
  const progressData: ProgressData = {
    currentWeight: current.weight,
    previousWeight: previous.weight,
    weeksSinceLastCheckin,
    goal,
  };

  // Analyze progress pattern
  const recommendation = analyzeProgress(progressData, expectedWeeklyChange);

  // Detect stall (check last 3-4 weights if available)
  const recentWeights = sorted.slice(0, 4).map((c) => c.weight);
  const isStalled = detectStall(recentWeights);

  // Validate adjustment is safe
  let finalAdjustment = recommendation.recommendedCalorieChange;
  if (recommendation.shouldAdjust) {
    const validation = validateAdjustment(
      currentCalories,
      currentCalories + finalAdjustment,
      gender,
    );

    if (!validation.isValid) {
      // Adjustment is not safe, reduce it
      finalAdjustment = Math.sign(finalAdjustment) * 100; // Cap at ±100
    }
  }

  // Determine training adjustment
  let trainingAdjustment: 'increase' | 'decrease' | 'maintain' = 'maintain';
  if (isStalled && goal === 'muscle_gain') {
    trainingAdjustment = 'increase'; // Increase volume if stalled during muscle gain
  } else if (recommendation.pattern === 'too_fast' && goal === 'weight_loss') {
    trainingAdjustment = 'decrease'; // Reduce volume if losing too fast (preserve muscle)
  }

  // Collect warnings
  const warnings: string[] = [];
  if (isStalled) {
    warnings.push('Progress has stalled for 3+ weeks. Consider diet break or refeed.');
  }
  if (current.energyLevel && current.energyLevel <= 2) {
    warnings.push('Low energy levels reported. Consider increasing calories or carbs.');
  }
  if (current.hungerLevel && current.hungerLevel >= 4) {
    warnings.push('High hunger levels reported. Consider increasing protein or fiber.');
  }
  if (current.stressLevel && current.stressLevel >= 4) {
    warnings.push('High stress levels. Recovery may be compromised.');
  }

  return {
    // Progress metrics
    currentWeight: current.weight,
    previousWeight: previous.weight,
    weightChange,
    weeklyWeightChange,

    // Pattern detection
    pattern: recommendation.pattern,
    isStalled,

    // Recommendations
    shouldAdjustNutrition: recommendation.shouldAdjust || isStalled,
    shouldAdjustTraining: trainingAdjustment !== 'maintain',
    nutritionAdjustment: finalAdjustment,
    trainingAdjustment,

    // Reasoning
    reason: recommendation.reason,
    warnings,

    // Subjective data for AI feedback
    subjective: {
      energyLevel: current.energyLevel,
      hungerLevel: current.hungerLevel,
      stressLevel: current.stressLevel,
    },
  };
}

/**
 * Generate adjustment summary for database storage
 */
export function generateAdjustmentSummary(analysis: AdjustmentAnalysis): string {
  const parts: string[] = [];

  // Weight change summary
  const changeDirection = analysis.weightChange > 0 ? 'gained' : 'lost';
  parts.push(
    `Weight ${changeDirection} ${Math.abs(analysis.weightChange).toFixed(1)}kg (${Math.abs(analysis.weeklyWeightChange).toFixed(2)}kg/week)`,
  );

  // Pattern
  parts.push(`Pattern: ${analysis.pattern.replace('_', ' ')}`);

  // Adjustments
  if (analysis.shouldAdjustNutrition) {
    const direction = analysis.nutritionAdjustment > 0 ? 'increased' : 'decreased';
    parts.push(
      `Calories ${direction} by ${Math.abs(analysis.nutritionAdjustment)} cal/day`,
    );
  } else {
    parts.push('No calorie adjustment needed');
  }

  if (analysis.shouldAdjustTraining) {
    parts.push(`Training volume ${analysis.trainingAdjustment}d`);
  }

  return parts.join('. ');
}

/**
 * Calculate new plan version number
 */
export function calculateNewVersion(currentVersion: number): number {
  return currentVersion + 1;
}
