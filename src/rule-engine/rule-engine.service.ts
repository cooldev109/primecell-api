/**
 * Rule Engine Service
 * Main service that orchestrates all rule-based calculations
 */

import { Injectable } from '@nestjs/common';
import {
  generateNutritionPlan,
  adjustNutritionPlan,
  NutritionPlanInput,
  NutritionPlan,
} from './engines/nutrition-plan-generator.engine';
import {
  generateTrainingPlan,
  adjustTrainingVolume,
  shouldDeload,
  TrainingPlanInput,
  TrainingPlanResult,
} from './engines/training-plan-generator.engine';
import {
  analyzeCheckInProgress,
  generateAdjustmentSummary,
  CheckInData,
  AdjustmentAnalysis,
} from './engines/adjustment.engine';

@Injectable()
export class RuleEngineService {
  /**
   * Generate initial nutrition plan during onboarding
   */
  generateInitialNutritionPlan(input: NutritionPlanInput): NutritionPlan {
    return generateNutritionPlan(input);
  }

  /**
   * Generate initial training plan during onboarding
   */
  generateInitialTrainingPlan(input: TrainingPlanInput): TrainingPlanResult {
    return generateTrainingPlan(input);
  }

  /**
   * Analyze check-in progress and generate adjustment recommendations
   */
  analyzeProgress(
    recentCheckIns: CheckInData[],
    expectedWeeklyChange: number,
    goal: 'weight_loss' | 'maintenance' | 'muscle_gain',
    currentCalories: number,
    gender: 'male' | 'female',
  ): AdjustmentAnalysis {
    return analyzeCheckInProgress(
      recentCheckIns,
      expectedWeeklyChange,
      goal,
      currentCalories,
      gender,
    );
  }

  /**
   * Adjust nutrition plan based on progress
   */
  adjustNutrition(
    currentPlan: NutritionPlan,
    calorieAdjustment: number,
    weight: number,
    gender: 'male' | 'female',
    goal: 'weight_loss' | 'maintenance' | 'muscle_gain',
  ): NutritionPlan {
    return adjustNutritionPlan(currentPlan, calorieAdjustment, weight, gender, goal);
  }

  /**
   * Adjust training volume based on progress
   */
  adjustTraining(
    currentVolume: number,
    progressIndicator: 'stalling' | 'progressing' | 'regressing',
  ): number {
    return adjustTrainingVolume(currentVolume, progressIndicator);
  }

  /**
   * Check if deload week is needed
   */
  checkDeloadNeeded(weeksSinceDeload: number, deloadFrequency: number): boolean {
    return shouldDeload(weeksSinceDeload, deloadFrequency);
  }

  /**
   * Generate adjustment summary for storage
   */
  getAdjustmentSummary(analysis: AdjustmentAnalysis): string {
    return generateAdjustmentSummary(analysis);
  }
}
