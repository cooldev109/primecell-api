import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SupplementResponseDto,
  SupplementRecommendationResponseDto,
  UserSupplementProtocolDto,
} from './dto';

/**
 * Supplements Service
 *
 * CRITICAL: Supplements are STRUCTURAL COMPONENTS of the PrimeCell Protocol.
 * Every user gets supplement recommendations based on their goals.
 *
 * Supplement-to-Goal Mapping:
 * - Weight loss, fat loss → KyoSlim (primary) + Shape Protein (support)
 * - Muscle gain, performance → CreaPrime Creatine (primary) + Shape Protein (support)
 * - All users → Shape Protein (support for daily protein intake)
 */
@Injectable()
export class SupplementsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all available supplements in the catalog
   */
  async getAllSupplements(): Promise<SupplementResponseDto[]> {
    const supplements = await this.prisma.supplement.findMany({
      where: { isActive: true },
      orderBy: [{ priority: 'asc' }, { productName: 'asc' }],
    });

    return supplements.map((s) => this.mapToSupplementDto(s));
  }

  /**
   * Get a specific supplement by ID
   */
  async getSupplementById(id: string): Promise<SupplementResponseDto> {
    const supplement = await this.prisma.supplement.findUnique({
      where: { id },
    });

    if (!supplement) {
      throw new NotFoundException(`Supplement with ID ${id} not found`);
    }

    return this.mapToSupplementDto(supplement);
  }

  /**
   * Get a supplement by product name
   */
  async getSupplementByName(
    productName: string,
  ): Promise<SupplementResponseDto> {
    const supplement = await this.prisma.supplement.findUnique({
      where: { productName },
    });

    if (!supplement) {
      throw new NotFoundException(
        `Supplement "${productName}" not found`,
      );
    }

    return this.mapToSupplementDto(supplement);
  }

  /**
   * Get current supplement recommendations for a user
   * This returns the active supplement protocol based on their current plan
   */
  async getUserRecommendations(
    userId: string,
  ): Promise<SupplementRecommendationResponseDto[]> {
    const recommendations =
      await this.prisma.supplementRecommendation.findMany({
        where: {
          userId,
          isActive: true,
        },
        include: {
          supplement: true,
        },
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      });

    return recommendations.map((r) =>
      this.mapToRecommendationDto(r),
    );
  }

  /**
   * Get complete supplement protocol for a user (organized by priority)
   * CORE FEATURE: This shows the user their personalized supplement stack
   */
  async getUserProtocol(userId: string): Promise<UserSupplementProtocolDto> {
    // Get active plan pointer to know which plan versions to show
    const activePlanPointer =
      await this.prisma.activePlanPointer.findUnique({
        where: { userId },
      });

    if (!activePlanPointer) {
      throw new NotFoundException(
        `No active plan found for user ${userId}`,
      );
    }

    // Get all active recommendations
    const recommendations = await this.getUserRecommendations(userId);

    // Organize by priority
    const primary = recommendations.filter((r) => r.priority === 'primary');
    const support = recommendations.filter((r) => r.priority === 'support');
    const optional = recommendations.filter((r) => r.priority === 'optional');

    // Generate summary
    const summary = this.generateProtocolSummary(primary, support);

    return {
      userId,
      nutritionPlanVersion: activePlanPointer.nutritionPlanVersion,
      trainingPlanVersion: activePlanPointer.trainingPlanVersion,
      primary,
      support,
      optional: optional.length > 0 ? optional : undefined,
      summary,
    };
  }

  /**
   * Create supplement recommendations for a user based on their goal
   * This is called by the Engine when generating plans
   *
   * @param userId - User ID
   * @param primaryGoal - User's primary goal
   * @param nutritionPlanVersion - Nutrition plan version
   * @param trainingPlanVersion - Training plan version
   */
  async createRecommendationsForGoal(
    userId: string,
    primaryGoal: string,
    nutritionPlanVersion: number,
    trainingPlanVersion: number,
  ): Promise<SupplementRecommendationResponseDto[]> {
    // Deactivate old recommendations
    await this.prisma.supplementRecommendation.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    const recommendations: any[] = [];

    // ALL users get Shape Protein as support
    const shapeProtein = await this.prisma.supplement.findUnique({
      where: { productName: 'Shape Protein' },
    });

    if (shapeProtein) {
      recommendations.push({
        userId,
        supplementId: shapeProtein.id,
        nutritionPlanVersion,
        trainingPlanVersion,
        priority: 'support',
        reason:
          'Shape Protein helps you meet your daily protein targets, supports muscle maintenance, and promotes satiety.',
        dosageInstructions:
          'Use 1-2 servings per day (25-50g protein) as needed to meet your protein goals',
        timingInstructions:
          'Ideal post-workout, as a meal addition, or as a snack between meals',
        isActive: true,
      });
    }

    // Goal-specific primary supplements
    if (
      primaryGoal === 'lose_fat' ||
      primaryGoal === 'lose_weight' ||
      primaryGoal === 'longevity'
    ) {
      // KyoSlim for fat loss goals
      const kyoSlim = await this.prisma.supplement.findUnique({
        where: { productName: 'KyoSlim' },
      });

      if (kyoSlim) {
        recommendations.push({
          userId,
          supplementId: kyoSlim.id,
          nutritionPlanVersion,
          trainingPlanVersion,
          priority: 'primary',
          reason:
            'KyoSlim is recommended to support your fat loss goal. It helps with metabolism, appetite control, and energy during your calorie deficit.',
          dosageInstructions: 'Take 2 capsules per day',
          timingInstructions:
            'Take 1 capsule in the morning with breakfast and 1 capsule in the afternoon for sustained support',
          isActive: true,
        });
      }
    }

    if (
      primaryGoal === 'gain_muscle' ||
      primaryGoal === 'performance'
    ) {
      // CreaPrime Creatine for muscle gain/performance goals
      const creaPrime = await this.prisma.supplement.findUnique({
        where: { productName: 'CreaPrime Creatine' },
      });

      if (creaPrime) {
        recommendations.push({
          userId,
          supplementId: creaPrime.id,
          nutritionPlanVersion,
          trainingPlanVersion,
          priority: 'primary',
          reason:
            'CreaPrime Creatine is recommended to support your muscle gain and performance goals. It enhances strength, power, and muscle growth.',
          dosageInstructions: 'Take 5g per day',
          timingInstructions:
            'Take 5g (1 scoop) post-workout or any time of day with water or your protein shake',
          isActive: true,
        });
      }
    }

    // Create all recommendations
    const created = await Promise.all(
      recommendations.map((rec) =>
        this.prisma.supplementRecommendation.create({
          data: rec,
          include: { supplement: true },
        }),
      ),
    );

    return created.map((r) => this.mapToRecommendationDto(r));
  }

  /**
   * Map Prisma Supplement to DTO
   */
  private mapToSupplementDto(supplement: any): SupplementResponseDto {
    return {
      id: supplement.id,
      productName: supplement.productName,
      category: supplement.category,
      description: supplement.description,
      recommendedDosage: supplement.recommendedDosage,
      timingGuidelines: supplement.timingGuidelines,
      primaryGoals: JSON.parse(supplement.primaryGoals),
      supportGoals: JSON.parse(supplement.supportGoals),
      benefits: JSON.parse(supplement.benefits),
      priority: supplement.priority,
      productUrl: supplement.productUrl,
      isActive: supplement.isActive,
    };
  }

  /**
   * Map Prisma SupplementRecommendation to DTO
   */
  private mapToRecommendationDto(
    recommendation: any,
  ): SupplementRecommendationResponseDto {
    return {
      id: recommendation.id,
      userId: recommendation.userId,
      supplement: this.mapToSupplementDto(recommendation.supplement),
      nutritionPlanVersion: recommendation.nutritionPlanVersion,
      trainingPlanVersion: recommendation.trainingPlanVersion,
      priority: recommendation.priority,
      reason: recommendation.reason,
      dosageInstructions: recommendation.dosageInstructions,
      timingInstructions: recommendation.timingInstructions,
      isActive: recommendation.isActive,
      createdAt: recommendation.createdAt,
    };
  }

  /**
   * Generate human-readable protocol summary
   */
  private generateProtocolSummary(
    primary: SupplementRecommendationResponseDto[],
    support: SupplementRecommendationResponseDto[],
  ): string {
    const parts: string[] = [];

    if (primary.length > 0) {
      const primaryNames = primary
        .map((p) => p.supplement.productName)
        .join(' and ');
      parts.push(
        `Your supplement protocol includes ${primaryNames} for goal-specific support`,
      );
    }

    if (support.length > 0) {
      const supportNames = support
        .map((s) => s.supplement.productName)
        .join(' and ');
      parts.push(
        `${supportNames} for daily nutrition support`,
      );
    }

    return parts.join(', and ') + '.';
  }
}
