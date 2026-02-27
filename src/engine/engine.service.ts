import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SignalInterpreterService } from './services/signal-interpreter.service';
import { ActionSelectorService } from './services/action-selector.service';
import { PlanBuilderService } from './services/plan-builder.service';
import { SupplementsService } from '../supplements/supplements.service';
import { RuleEngineService } from '../rule-engine/rule-engine.service';
import { AIService } from '../ai/ai.service';

@Injectable()
export class EngineService {
  constructor(
    private prisma: PrismaService,
    private signalInterpreter: SignalInterpreterService,
    private actionSelector: ActionSelectorService,
    private planBuilder: PlanBuilderService,
    private supplementsService: SupplementsService,
    private ruleEngine: RuleEngineService,
    private aiService: AIService,
  ) {}

  /**
   * Process onboarding and generate initial plan
   * NOW USING RULE ENGINE for deterministic plan generation
   */
  async processOnboarding(userId: string, onboardingData: any) {
    const { age, sex, height, weight, primaryGoal } = onboardingData;

    // Parse onboarding data to extract structured info
    const lifestyle = JSON.parse(onboardingData.lifestyle || '{}');
    const training = JSON.parse(onboardingData.training || '{}');
    const foodPreferences = JSON.parse(onboardingData.foodPreferences || '{}');

    // Map primaryGoal to rule engine format
    let ruleEngineGoal: 'weight_loss' | 'maintenance' | 'muscle_gain' = 'maintenance';
    if (primaryGoal.includes('lose') || primaryGoal === 'lose_fat' || primaryGoal === 'lose_weight') {
      ruleEngineGoal = 'weight_loss';
    } else if (primaryGoal === 'gain_muscle' || primaryGoal === 'muscle_gain') {
      ruleEngineGoal = 'muscle_gain';
    }

    // Map activity level from lifestyle
    const activityLevel = lifestyle.activityLevel || 'moderate';

    // ⭐ STEP 1: Use Rule Engine to generate nutrition plan
    const nutritionPlanResult = this.ruleEngine.generateInitialNutritionPlan({
      weight,
      height,
      age,
      gender: sex === 'M' ? 'male' : 'female',
      activityLevel,
      goal: ruleEngineGoal,
      dietaryPreferences: foodPreferences.dietaryRestrictions || [],
      mealsPerDay: parseInt(foodPreferences.mealsPerDay) || 3,
    });

    // Check if plan is valid
    if (!nutritionPlanResult.validation.isValid) {
      throw new Error(
        `Nutrition plan validation failed: ${nutritionPlanResult.validation.violations.join(', ')}`
      );
    }

    // ⭐ STEP 2: Use Rule Engine to generate training plan
    const experienceLevel = training.experienceLevel || 'beginner';
    const daysPerWeek = training.daysPerWeek || 3;
    const equipment = training.equipment || 'gym';

    const trainingPlanResult = this.ruleEngine.generateInitialTrainingPlan({
      experienceLevel,
      daysPerWeek,
      equipment,
      goal: ruleEngineGoal === 'weight_loss' ? 'general_fitness' : 'hypertrophy',
      age,
      injuries: [],
    });

    // Step 3: Determine nutrition mode based on goal
    let nutritionMode = 'maintenance';
    if (ruleEngineGoal === 'weight_loss') {
      nutritionMode = 'deficit';
    } else if (ruleEngineGoal === 'muscle_gain') {
      nutritionMode = 'surplus';
    }

    // Step 4: Build nutrition plan structure for legacy compatibility
    const nutritionPlan = this.planBuilder.buildNutritionPlan({
      calories: nutritionPlanResult.targetCalories,
      protein: nutritionPlanResult.protein,
      fat: nutritionPlanResult.fat,
      carbs: nutritionPlanResult.carbs,
      goal: primaryGoal,
      weight,
    });

    // Step 5: Build training program structure for legacy compatibility
    const trainingProgram = this.planBuilder.buildTrainingProgram({
      experienceLevel,
      weekNumber: 1,
    });

    // Step 6: Save nutrition plan to database (using Rule Engine values)
    const nutritionPlanRecord = await this.prisma.nutritionPlan.create({
      data: {
        userId,
        version: 1,
        mode: nutritionMode,
        caloriesMin: Math.floor(nutritionPlanResult.targetCalories * 0.9), // 10% buffer
        caloriesMax: Math.ceil(nutritionPlanResult.targetCalories * 1.1),
        caloriesTarget: nutritionPlanResult.targetCalories,
        proteinGrams: nutritionPlanResult.protein,
        carbsGrams: nutritionPlanResult.carbs,
        fatGrams: nutritionPlanResult.fat,
        mealsPerDay: nutritionPlanResult.mealsPerDay,
        mealTemplates: JSON.stringify(nutritionPlan.mealStructure?.options || []),
        guidelines: JSON.stringify({
          ...nutritionPlan.dailyGuidelines,
          tdee: nutritionPlanResult.tdee,
          bmr: nutritionPlanResult.bmr,
          deficit: nutritionPlanResult.deficit,
          estimatedWeeklyChange: nutritionPlanResult.estimatedWeeklyWeightChange,
        }),
        explanation: JSON.stringify({
          progressSummary: 'Initial plan created based on your onboarding',
          whyThisDecision: `Starting with ${nutritionPlanResult.targetCalories} calories (TDEE: ${nutritionPlanResult.tdee}, ${Math.abs(nutritionPlanResult.deficitPercentage * 100).toFixed(0)}% ${ruleEngineGoal === 'weight_loss' ? 'deficit' : ruleEngineGoal === 'muscle_gain' ? 'surplus' : 'maintenance'})`,
          whatToDoNext: ['Follow the meal guidelines', 'Complete your first check-in next week'],
          safetyWarnings: nutritionPlanResult.validation.warnings,
        }),
      },
    });

    const trainingProgramRecord = await this.prisma.trainingProgram.create({
      data: {
        userId,
        version: 1,
        mode: 'build', // Default to build mode
        programId: trainingPlanResult.programId,
        weekNumber: 1,
        volumeAdjustment: 0,
        intensityLevel: trainingPlanResult.initialIntensity,
        isDeloadWeek: false,
        adjustments: JSON.stringify({
          volumeMultiplier: trainingPlanResult.volumeMultiplier,
          intensityMultiplier: trainingPlanResult.intensityMultiplier,
          deloadFrequency: trainingPlanResult.deloadFrequency,
          warnings: trainingPlanResult.warnings,
        }),
      },
    });

    // Step 7.5: Create supplement recommendations based on user goal
    const supplementRecommendations = await this.supplementsService.createRecommendationsForGoal(
      userId,
      primaryGoal,
      1, // nutritionPlanVersion
      1, // trainingPlanVersion
    );

    // Step 8: Create active plan pointer (using version numbers)
    await this.prisma.activePlanPointer.upsert({
      where: { userId },
      update: {
        nutritionPlanVersion: 1,
        trainingPlanVersion: 1,
        currentWeek: 1,
        lastCheckinDate: new Date(),
      },
      create: {
        userId,
        nutritionPlanVersion: 1,
        trainingPlanVersion: 1,
        currentWeek: 1,
        lastCheckinDate: new Date(),
      },
    });

    // Step 9: Create decision record (with triggerType and Rule Engine data)
    await this.prisma.decisionRecord.create({
      data: {
        userId,
        triggerType: 'onboarding',
        triggerDataId: null,
        inputSnapshot: JSON.stringify({ onboardingData }),
        derivedSignals: JSON.stringify({
          tdee: nutritionPlanResult.tdee,
          bmr: nutritionPlanResult.bmr,
          targetCalories: nutritionPlanResult.targetCalories,
          macros: {
            protein: nutritionPlanResult.protein,
            fat: nutritionPlanResult.fat,
            carbs: nutritionPlanResult.carbs,
          },
          estimatedWeeklyChange: nutritionPlanResult.estimatedWeeklyWeightChange,
        }),
        currentState: JSON.stringify({ nutritionMode, trainingMode: 'build', weekInCycle: 1 }),
        actionsTaken: JSON.stringify({ nutritionChanges: 'initial_plan', trainingChanges: 'initial_program' }),
        rulesFired: JSON.stringify([
          { ruleId: 'rule_engine_nutrition', ruleName: 'Rule Engine Nutrition Plan Generation', outcome: 'success' },
          { ruleId: 'rule_engine_training', ruleName: 'Rule Engine Training Plan Generation', outcome: 'success' },
        ]),
        guardrails: JSON.stringify(nutritionPlanResult.validation.warnings.map(w => ({ guardrailName: 'safety_warning', message: w }))),
        nutritionPlanId: nutritionPlanRecord.id,
        trainingPlanId: trainingProgramRecord.id,
        supplementsRecommended: JSON.stringify(supplementRecommendations.map(r => r.supplement?.id || '')),
        engineVersion: '2.0.0', // Updated to reflect Rule Engine usage
        rulePackVersion: 'v2-rule-engine',
        aiExplanation: null, // AI explanations will be added later via AI service
      },
    });

    return {
      nutritionPlan: {
        ...nutritionPlan,
        id: nutritionPlanRecord.id,
        version: 1,
        mode: nutritionMode,
        calories: nutritionPlanResult.targetCalories,
        macros: {
          protein: nutritionPlanResult.protein,
          fat: nutritionPlanResult.fat,
          carbs: nutritionPlanResult.carbs,
        },
        ruleEngineData: {
          tdee: nutritionPlanResult.tdee,
          bmr: nutritionPlanResult.bmr,
          deficit: nutritionPlanResult.deficit,
          estimatedWeeklyChange: nutritionPlanResult.estimatedWeeklyWeightChange,
        },
      },
      trainingProgram: {
        ...trainingProgram,
        id: trainingProgramRecord.id,
        version: 1,
        programId: trainingPlanResult.programId,
        programName: trainingPlanResult.programName,
        volume: trainingPlanResult.initialVolume,
      },
      supplementRecommendations,
      reasoning: {
        tdee: nutritionPlanResult.tdee,
        initialCalories: nutritionPlanResult.targetCalories,
        macros: {
          protein: nutritionPlanResult.protein,
          fat: nutritionPlanResult.fat,
          carbs: nutritionPlanResult.carbs,
        },
        goal: primaryGoal,
        safetyValidation: nutritionPlanResult.validation,
      },
    };
  }

  /**
   * Process weekly check-in and adjust plan
   * NOW USING RULE ENGINE for progress analysis and adjustments
   */
  async processCheckin(userId: string, checkinData: any) {
    // Step 1: Get recent check-ins (including this one)
    const recentCheckins = await this.prisma.weeklyCheckin.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 4, // 4-week window for better stall detection
    });

    // If this is the first check-in, just record it and return with motivational message
    if (recentCheckins.length < 2) {
      const firstCheckin = recentCheckins[0];
      const onboardingData = await this.prisma.onboardingData.findUnique({
        where: { userId },
      });

      // Get current active plan to return current calories
      const activePointer = await this.prisma.activePlanPointer.findUnique({
        where: { userId },
      });

      const currentNutritionPlan = await this.prisma.nutritionPlan.findFirst({
        where: {
          userId,
          version: activePointer.nutritionPlanVersion,
        },
      });

      const currentCalories = currentNutritionPlan?.caloriesTarget || 2000; // Fallback to 2000

      // Generate AI motivational message for first check-in
      const firstCheckinFeedback = await this.aiService.generateProgressFeedback({
        pattern: 'first_checkin',
        weightChange: 0,
        weeklyWeightChange: 0,
        expectedChange: 0,
        currentWeight: firstCheckin.weight || onboardingData.weight,
        goal: onboardingData.primaryGoal,
        adjustment: 0,
        reason: 'First check-in baseline recorded',
        warnings: [],
        subjective: {
          energyLevel: firstCheckin.energy,
          hungerLevel: firstCheckin.hunger,
          stressLevel: firstCheckin.stress,
        },
      });

      return {
        title: firstCheckinFeedback.title,
        reasoning: firstCheckinFeedback.message,
        newCalories: currentCalories,
        adjustment: 0,
      };
    }

    // Step 2: Get user onboarding data
    const onboardingData = await this.prisma.onboardingData.findUnique({
      where: { userId },
    });

    if (!onboardingData) {
      throw new Error('Onboarding data not found');
    }

    // Step 3: Get current active plan (using versions)
    const activePointer = await this.prisma.activePlanPointer.findUnique({
      where: { userId },
    });

    if (!activePointer) {
      throw new Error('Active plan not found');
    }

    const currentNutritionPlan = await this.prisma.nutritionPlan.findFirst({
      where: {
        userId,
        version: activePointer.nutritionPlanVersion,
      },
    });

    if (!currentNutritionPlan) {
      throw new Error('Current nutrition plan not found');
    }

    const currentCalories = currentNutritionPlan.caloriesTarget;

    // Step 4: Parse guidelines to get expected weekly change
    const guidelines = JSON.parse(currentNutritionPlan.guidelines || '{}');
    const expectedWeeklyChange = guidelines.estimatedWeeklyChange || 0;

    // Map primaryGoal to rule engine format
    let ruleEngineGoal: 'weight_loss' | 'maintenance' | 'muscle_gain' = 'maintenance';
    if (onboardingData.primaryGoal.includes('lose') || onboardingData.primaryGoal === 'lose_fat' || onboardingData.primaryGoal === 'lose_weight') {
      ruleEngineGoal = 'weight_loss';
    } else if (onboardingData.primaryGoal === 'gain_muscle' || onboardingData.primaryGoal === 'muscle_gain') {
      ruleEngineGoal = 'muscle_gain';
    }

    // ⭐ STEP 5: Use Rule Engine to analyze progress
    const analysis = this.ruleEngine.analyzeProgress(
      recentCheckins.map((c) => ({
        weight: c.weight || 0,
        createdAt: c.createdAt,
        energyLevel: c.energy,
        hungerLevel: c.hunger,
        stressLevel: c.stress,
      })),
      expectedWeeklyChange,
      ruleEngineGoal,
      currentCalories,
      onboardingData.sex === 'M' ? 'male' : 'female',
    );

    // ⭐ STEP 6: If adjustment needed, use Rule Engine to generate new plan
    let newNutritionPlanVersion = activePointer.nutritionPlanVersion;
    let newNutritionPlanId = null;
    let adjustedPlan = null;

    if (analysis.shouldAdjustNutrition && analysis.nutritionAdjustment !== 0) {
      // Build current nutrition plan object for adjustment
      const currentPlanForAdjustment = {
        bmr: guidelines.bmr || 0,
        tdee: guidelines.tdee || 0,
        targetCalories: currentCalories,
        protein: currentNutritionPlan.proteinGrams,
        fat: currentNutritionPlan.fatGrams,
        carbs: currentNutritionPlan.carbsGrams,
        activityMultiplier: 1.55,
        deficit: guidelines.deficit || 0,
        deficitPercentage: 0,
        estimatedWeeklyWeightChange: expectedWeeklyChange,
        mealsPerDay: currentNutritionPlan.mealsPerDay,
        caloriesPerMeal: 0,
        validation: { isValid: true, violations: [], warnings: [] },
        safetyConstraints: {
          minCalories: onboardingData.sex === 'M' ? 1500 : 1200,
          maxDeficit: 500,
          maxSurplus: 300,
          minProtein: analysis.currentWeight * 1.6,
          maxWeeklyWeightLoss: analysis.currentWeight * 0.01,
        },
      };

      // Use Rule Engine to adjust nutrition plan
      adjustedPlan = this.ruleEngine.adjustNutrition(
        currentPlanForAdjustment,
        analysis.nutritionAdjustment,
        analysis.currentWeight,
        onboardingData.sex === 'M' ? 'male' : 'female',
        ruleEngineGoal,
      );

      // Check if adjustment is valid
      if (!adjustedPlan.validation.isValid) {
        console.warn(
          `Adjustment validation failed: ${adjustedPlan.validation.violations.join(', ')}`
        );
        // Don't apply adjustment if it violates safety constraints
        adjustedPlan = null;
      } else {
        // Build nutrition plan structure for legacy compatibility
        const newNutritionPlan = this.planBuilder.buildNutritionPlan({
          calories: adjustedPlan.targetCalories,
          protein: adjustedPlan.protein,
          fat: adjustedPlan.fat,
          carbs: adjustedPlan.carbs,
          goal: onboardingData.primaryGoal,
          weight: analysis.currentWeight,
        });

        const newNutritionPlanRecord = await this.prisma.nutritionPlan.create({
          data: {
            userId,
            version: currentNutritionPlan.version + 1,
            mode: currentNutritionPlan.mode,
            caloriesMin: Math.floor(adjustedPlan.targetCalories * 0.9),
            caloriesMax: Math.ceil(adjustedPlan.targetCalories * 1.1),
            caloriesTarget: adjustedPlan.targetCalories,
            proteinGrams: adjustedPlan.protein,
            carbsGrams: adjustedPlan.carbs,
            fatGrams: adjustedPlan.fat,
            mealsPerDay: currentNutritionPlan.mealsPerDay,
            mealTemplates: currentNutritionPlan.mealTemplates,
            guidelines: JSON.stringify({
              ...newNutritionPlan.dailyGuidelines,
              tdee: adjustedPlan.tdee,
              bmr: adjustedPlan.bmr,
              deficit: adjustedPlan.deficit,
              estimatedWeeklyChange: adjustedPlan.estimatedWeeklyWeightChange,
            }),
            explanation: JSON.stringify({
              progressSummary: `Week ${activePointer.currentWeek} check-in processed`,
              whyThisDecision: analysis.reason,
              whatToDoNext: ['Continue following your updated plan', 'Check in again next week'],
              safetyWarnings: adjustedPlan.validation.warnings,
              pattern: analysis.pattern,
              adjustment: `${analysis.nutritionAdjustment > 0 ? '+' : ''}${analysis.nutritionAdjustment} calories`,
            }),
          },
        });

        newNutritionPlanVersion = newNutritionPlanRecord.version;
        newNutritionPlanId = newNutritionPlanRecord.id;

        // Update active plan pointer with new version
        await this.prisma.activePlanPointer.update({
          where: { userId },
          data: {
            nutritionPlanVersion: newNutritionPlanVersion,
            currentWeek: activePointer.currentWeek + 1,
            lastCheckinDate: new Date(),
          },
        });
      }
    } else {
      // No adjustment, just increment week
      await this.prisma.activePlanPointer.update({
        where: { userId },
        data: {
          currentWeek: activePointer.currentWeek + 1,
          lastCheckinDate: new Date(),
        },
      });
    }

    // Step 7: Create decision record with Rule Engine data
    await this.prisma.decisionRecord.create({
      data: {
        userId,
        triggerType: 'checkin',
        triggerDataId: checkinData.id,
        inputSnapshot: JSON.stringify(checkinData),
        derivedSignals: JSON.stringify({
          weightChange: analysis.weightChange,
          weeklyWeightChange: analysis.weeklyWeightChange,
          pattern: analysis.pattern,
          isStalled: analysis.isStalled,
          subjective: analysis.subjective,
        }),
        currentState: JSON.stringify({
          nutritionMode: currentNutritionPlan.mode,
          weekNumber: activePointer.currentWeek,
          currentWeight: analysis.currentWeight,
          previousWeight: analysis.previousWeight,
        }),
        actionsTaken: JSON.stringify({
          nutritionChanges: analysis.shouldAdjustNutrition ? 'adjusted' : 'maintained',
          calorieAdjustment: analysis.nutritionAdjustment,
          trainingChanges: analysis.shouldAdjustTraining ? analysis.trainingAdjustment : 'maintained',
        }),
        rulesFired: JSON.stringify([
          {
            ruleId: 'rule_engine_progress_analysis',
            ruleName: 'Rule Engine Progress Analysis',
            outcome: analysis.reason,
            pattern: analysis.pattern,
          },
        ]),
        guardrails: JSON.stringify(
          analysis.warnings.map((w) => ({ guardrailName: 'safety_warning', message: w }))
        ),
        nutritionPlanId: newNutritionPlanId || currentNutritionPlan.id,
        trainingPlanId: null, // Training plan adjustments will be added later
        supplementsRecommended: JSON.stringify([]),
        engineVersion: '2.0.0', // Updated to reflect Rule Engine usage
        rulePackVersion: 'v2-rule-engine',
        aiExplanation: null, // AI feedback will be added later via AI service
      },
    });

    // ⭐ STEP 8: Generate AI motivational feedback
    const aiFeedback = await this.aiService.generateProgressFeedback({
      pattern: analysis.pattern,
      weightChange: analysis.weightChange,
      weeklyWeightChange: analysis.weeklyWeightChange,
      expectedChange: expectedWeeklyChange,
      currentWeight: analysis.currentWeight,
      goal: ruleEngineGoal,
      adjustment: analysis.nutritionAdjustment,
      reason: analysis.reason,
      warnings: analysis.warnings,
      subjective: analysis.subjective,
    });

    return {
      adjustment: analysis.nutritionAdjustment,
      newCalories: adjustedPlan ? adjustedPlan.targetCalories : currentCalories,
      title: aiFeedback.title, // AI-generated title
      reasoning: aiFeedback.message, // AI-generated motivational message
      pattern: analysis.pattern,
      isStalled: analysis.isStalled,
      signals: {
        weightChange: analysis.weightChange,
        weeklyWeightChange: analysis.weeklyWeightChange,
        pattern: analysis.pattern,
        warnings: analysis.warnings,
        subjective: analysis.subjective,
      },
      adjustedPlan: adjustedPlan ? {
        calories: adjustedPlan.targetCalories,
        protein: adjustedPlan.protein,
        fat: adjustedPlan.fat,
        carbs: adjustedPlan.carbs,
        estimatedWeeklyChange: adjustedPlan.estimatedWeeklyWeightChange,
      } : null,
    };
  }
}
