import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async getCurrentNutritionPlan(userId: string) {
    // Check for active plan pointer
    const activePointer = await this.prisma.activePlanPointer.findUnique({
      where: { userId },
    });

    if (!activePointer) {
      throw new NotFoundException('No nutrition plan found. Please complete onboarding first.');
    }

    // Get the nutrition plan by userId and version
    const plan = await this.prisma.nutritionPlan.findFirst({
      where: {
        userId,
        version: activePointer.nutritionPlanVersion,
      },
    });

    if (!plan) {
      throw new NotFoundException('Nutrition plan not found');
    }

    const mealTemplateCategories = JSON.parse(plan.mealTemplates);
    const guidelines = JSON.parse(plan.guidelines);

    // Fetch actual meal templates from database (3-5 examples per category)
    const mealExamples = await Promise.all(
      mealTemplateCategories.map(async (category: string) => {
        const templates = await this.prisma.mealTemplate.findMany({
          where: {
            category,
            isActive: true,
          },
          take: 3, // Get 3 examples per meal type
        });

        return templates.map((t) => ({
          id: t.id,
          name: t.name,
          category: t.category,
          description: t.description,
          ingredients: JSON.parse(t.ingredients),
          approxCalories: t.approxCalories,
          approxProtein: t.approxProtein,
          approxCarbs: t.approxCarbs,
          approxFat: t.approxFat,
          prepTime: t.prepTime,
          difficulty: t.difficulty,
          tags: JSON.parse(t.tags),
        }));
      })
    );

    return {
      ...plan,
      mealsPerDay: plan.mealsPerDay,
      mealTemplates: mealTemplateCategories,
      mealExamples: mealExamples.flat(), // Flatten array of arrays
      guidelines: {
        ...guidelines,
        calories: plan.caloriesTarget,
        protein: plan.proteinGrams,
        fat: plan.fatGrams,
        carbs: plan.carbsGrams,
      },
      explanation: plan.explanation ? JSON.parse(plan.explanation) : null,
    };
  }

  async getCurrentTrainingProgram(userId: string) {
    const activePointer = await this.prisma.activePlanPointer.findUnique({
      where: { userId },
    });

    if (!activePointer) {
      throw new NotFoundException('No training program found. Please complete onboarding first.');
    }

    const program = await this.prisma.trainingProgram.findFirst({
      where: {
        userId,
        version: activePointer.trainingPlanVersion,
      },
    });

    if (!program) {
      throw new NotFoundException('Training program not found');
    }

    // Fetch the full training program template with workout details
    const template = await this.prisma.trainingProgramTemplate.findUnique({
      where: { programId: program.programId },
    });

    if (!template) {
      // Return basic program if template not found
      return {
        ...program,
        adjustments: JSON.parse(program.adjustments),
        programDetails: null,
      };
    }

    // Calculate adjusted volume/intensity
    const adjustments = JSON.parse(program.adjustments);
    const volumeMultiplier = adjustments.volumeMultiplier || 1.0;
    const intensityMultiplier = adjustments.intensityMultiplier || 1.0;

    return {
      ...program,
      adjustments,
      programDetails: {
        name: template.name,
        level: template.level,
        description: template.description,
        daysPerWeek: template.daysPerWeek,
        programLength: template.programLength,
        workouts: JSON.parse(template.workouts),
        deloadSchedule: JSON.parse(template.deloadSchedule),
        progressionRules: JSON.parse(template.progressionRules),
        equipment: JSON.parse(template.equipment),
      },
      currentAdjustments: {
        volume: `${Math.round(program.volumeAdjustment + 100)}%`,
        intensity: program.intensityLevel,
        isDeloadWeek: program.isDeloadWeek,
      },
    };
  }

  async getPlanHistory(userId: string) {
    const nutritionPlans = await this.prisma.nutritionPlan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const trainingPrograms = await this.prisma.trainingProgram.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      nutritionPlans: nutritionPlans.map((p) => ({
        ...p,
        mealTemplates: JSON.parse(p.mealTemplates),
        guidelines: JSON.parse(p.guidelines),
        explanation: p.explanation ? JSON.parse(p.explanation) : null,
      })),
      trainingPrograms: trainingPrograms.map((p) => ({
        ...p,
        adjustments: JSON.parse(p.adjustments),
      })),
    };
  }
}
