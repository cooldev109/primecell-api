import { Injectable } from '@nestjs/common';
import * as rulePack from '../../../../../packages/shared-schemas/src/rule-pack-v1.json';

interface UserContext {
  currentCalories: number;
  tdee: number;
  weight: number;
  sex: string;
  goal: string;
}

@Injectable()
export class ActionSelectorService {
  /**
   * Select calorie adjustment based on trend and recovery risk
   */
  selectCalorieAdjustment(params: {
    trend: 'decreasing' | 'stable' | 'increasing';
    riskLevel: 'low' | 'moderate' | 'high' | 'critical';
    confidence: number;
    currentMode: string;
    userContext: UserContext;
  }): {
    adjustment: number;
    newCalories: number;
    reasoning: string;
  } {
    const { trend, riskLevel, confidence, currentMode, userContext } = params;

    // If confidence too low, make no change
    const minConfidence = rulePack.trendAnalysis.minimumConfidenceForAction;
    if (confidence < minConfidence) {
      return {
        adjustment: 0,
        newCalories: userContext.currentCalories,
        reasoning: `Confidence too low (${confidence.toFixed(2)} < ${minConfidence})`,
      };
    }

    // Critical recovery risk - always increase calories
    if (riskLevel === 'critical') {
      const adjustment = 200; // Max increase
      const newCalories = this.applyGuardrails(
        userContext.currentCalories + adjustment,
        userContext,
      );
      return {
        adjustment,
        newCalories,
        reasoning: 'Critical recovery risk detected',
      };
    }

    // High recovery risk - hold or slight increase
    if (riskLevel === 'high') {
      const adjustment = trend === 'decreasing' ? 100 : 0;
      const newCalories = this.applyGuardrails(
        userContext.currentCalories + adjustment,
        userContext,
      );
      return {
        adjustment,
        newCalories,
        reasoning: 'High recovery risk, holding or increasing slightly',
      };
    }

    // Goal-based logic
    if (currentMode.startsWith('CUT')) {
      return this.selectCutAdjustment(trend, userContext);
    } else if (currentMode.startsWith('GAIN')) {
      return this.selectGainAdjustment(trend, userContext);
    } else {
      // MAINTAIN
      return {
        adjustment: 0,
        newCalories: userContext.currentCalories,
        reasoning: 'Maintenance mode',
      };
    }
  }

  private selectCutAdjustment(
    trend: 'decreasing' | 'stable' | 'increasing',
    userContext: UserContext,
  ): {
    adjustment: number;
    newCalories: number;
    reasoning: string;
  } {
    let adjustment = 0;
    let reasoning = '';

    if (trend === 'decreasing') {
      // Making progress, continue
      adjustment = 0;
      reasoning = 'Making progress in deficit';
    } else if (trend === 'stable') {
      // Plateau, reduce calories
      adjustment = -100;
      reasoning = 'Plateau detected, reducing calories';
    } else {
      // Gaining weight in deficit - increase deficit
      adjustment = -150;
      reasoning = 'Weight increasing despite deficit';
    }

    const newCalories = this.applyGuardrails(
      userContext.currentCalories + adjustment,
      userContext,
    );

    return { adjustment, newCalories, reasoning };
  }

  private selectGainAdjustment(
    trend: 'decreasing' | 'stable' | 'increasing',
    userContext: UserContext,
  ): {
    adjustment: number;
    newCalories: number;
    reasoning: string;
  } {
    let adjustment = 0;
    let reasoning = '';

    if (trend === 'increasing') {
      // Making progress
      adjustment = 0;
      reasoning = 'Making progress in surplus';
    } else if (trend === 'stable') {
      // Not gaining, increase calories
      adjustment = 100;
      reasoning = 'Stable weight, increasing surplus';
    } else {
      // Losing weight in surplus
      adjustment = 150;
      reasoning = 'Weight decreasing despite surplus';
    }

    const newCalories = this.applyGuardrails(
      userContext.currentCalories + adjustment,
      userContext,
    );

    return { adjustment, newCalories, reasoning };
  }

  /**
   * Apply safety guardrails (calorie floors/ceilings, max changes)
   */
  private applyGuardrails(targetCalories: number, userContext: UserContext): number {
    const { sex, tdee, weight } = userContext;

    // Apply calorie floor
    const calorieFloor = rulePack.safetyConstraints.calorieFloor[sex === 'male' ? 'male' : 'female'];
    if (targetCalories < calorieFloor) {
      return calorieFloor;
    }

    // Apply max deficit (% of TDEE)
    const maxDeficitPercent = rulePack.safetyConstraints.maxDeficitPercent / 100;
    const minCaloriesFromDeficit = tdee * (1 - maxDeficitPercent);
    if (targetCalories < minCaloriesFromDeficit) {
      return Math.round(minCaloriesFromDeficit);
    }

    // Apply max surplus (% of TDEE)
    const maxSurplusPercent = rulePack.safetyConstraints.maxSurplusPercent / 100;
    const maxCaloriesFromSurplus = tdee * (1 + maxSurplusPercent);
    if (targetCalories > maxCaloriesFromSurplus) {
      return Math.round(maxCaloriesFromSurplus);
    }

    return Math.round(targetCalories);
  }

  /**
   * Calculate initial calories from TDEE and goal
   */
  calculateInitialCalories(tdee: number, goal: string): number {
    const goalDefaults = (rulePack.goalSpecificDefaults as any)[goal];

    if (!goalDefaults) {
      return tdee; // Default to maintenance
    }

    if (goalDefaults.initialDeficit) {
      const deficit = goalDefaults.initialDeficit / 100;
      return Math.round(tdee * (1 - deficit));
    } else if (goalDefaults.initialSurplus) {
      const surplus = goalDefaults.initialSurplus / 100;
      return Math.round(tdee * (1 + surplus));
    } else {
      return tdee;
    }
  }
}
