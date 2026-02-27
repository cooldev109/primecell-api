import { Injectable } from '@nestjs/common';
import * as rulePack from '../../../../../packages/shared-schemas/src/rule-pack-v1.json';

interface NutritionPlanParams {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  goal: string;
  weight: number;
}

@Injectable()
export class PlanBuilderService {
  /**
   * Build nutrition plan from calories and goal
   */
  buildNutritionPlan(params: NutritionPlanParams) {
    const { calories, protein, fat, carbs, goal } = params;

    // Get supplements based on goal
    const goalDefaults = (rulePack.goalSpecificDefaults as any)[goal];
    const supplements = goalDefaults?.supplements || ['Shape Protein'];

    return {
      mealStructure: {
        mealsPerDay: 3,
        options: ['breakfast', 'lunch', 'dinner'],
        snacksOptional: true,
      },
      dailyGuidelines: {
        calories: Math.round(calories),
        protein: Math.round(protein),
        fat: Math.round(fat),
        carbs: Math.round(carbs),
        supplements,
        philosophy: 'Real food, no calorie counting, 80/20 flexibility',
      },
    };
  }

  /**
   * Build training program based on experience level
   */
  buildTrainingProgram(params: {
    experienceLevel: string;
    weekNumber: number;
  }) {
    const { experienceLevel, weekNumber } = params;

    // Map experience to program ID
    const programMap: Record<string, string> = {
      beginner: 'beginner_upper_lower',
      intermediate: 'intermediate_ppl',
      advanced: 'advanced_upper_lower',
    };

    const programId = programMap[experienceLevel] || 'beginner_upper_lower';

    return {
      programId,
      weekNumber,
      adjustments: {
        volumeMultiplier: 1.0,
        intensityMultiplier: 1.0,
      },
      description: this.getProgramDescription(programId),
    };
  }

  private getProgramDescription(programId: string): string {
    const descriptions: Record<string, string> = {
      beginner_upper_lower: '4-day Upper/Lower split for beginners',
      intermediate_ppl: '6-day Push/Pull/Legs split',
      advanced_upper_lower: '5-day Upper/Lower with specialization',
    };

    return descriptions[programId] || 'Training program';
  }

  /**
   * Calculate macros from calories and goal
   */
  calculateMacros(params: {
    calories: number;
    weight: number;
    goal: string;
  }): {
    protein: number;
    fat: number;
    carbs: number;
  } {
    const { calories, weight, goal } = params;

    // Get protein target from goal
    const goalDefaults = (rulePack.goalSpecificDefaults as any)[goal];
    const proteinPerKg = goalDefaults?.proteinTarget || 1.8;
    const proteinGrams = weight * proteinPerKg;
    const proteinCalories = proteinGrams * 4; // 4 cal/g

    // Fat: 1.0 g/kg bodyweight (middle of range)
    const fatGrams = weight * 1.0;
    const fatCalories = fatGrams * 9; // 9 cal/g

    // Carbs: remaining calories
    const remainingCalories = calories - proteinCalories - fatCalories;
    const carbGrams = Math.max(0, remainingCalories / 4); // 4 cal/g

    return {
      protein: proteinGrams,
      fat: fatGrams,
      carbs: carbGrams,
    };
  }

  /**
   * Estimate TDEE using Mifflin-St Jeor equation
   */
  calculateTDEE(params: {
    weight: number;
    height: number;
    age: number;
    sex: string;
    activityLevel: string;
  }): number {
    const { weight, height, age, sex } = params;

    // Mifflin-St Jeor equation
    let bmr: number;
    if (sex === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Activity multiplier (moderate activity for simplicity)
    const activityMultiplier = 1.55;

    return Math.round(bmr * activityMultiplier);
  }
}
