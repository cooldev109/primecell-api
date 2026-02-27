import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitOnboardingDto } from './dto/submit-onboarding.dto';
import { EngineService } from '../engine/engine.service';

@Injectable()
export class OnboardingService {
  constructor(
    private prisma: PrismaService,
    private engineService: EngineService,
  ) {}

  async submitOnboarding(userId: string, dto: SubmitOnboardingDto) {
    // Use upsert to allow updating onboarding data
    const onboardingData = await this.prisma.onboardingData.upsert({
      where: { userId },
      create: {
        userId,
        age: dto.age,
        sex: dto.sex,
        height: dto.height,
        weight: dto.weight,
        photoUrl: dto.photoUrl,
        primaryGoal: dto.primaryGoal,
        goalSpecific: JSON.stringify(dto.goalSpecific || {}),
        lifestyle: JSON.stringify(dto.lifestyle || {}),
        training: JSON.stringify(dto.training || {}),
        foodPreferences: JSON.stringify(dto.foodPreferences || {}),
        healthInfo: JSON.stringify(dto.healthInfo || {}),
        adherence: JSON.stringify(dto.adherence || {}),
      },
      update: {
        age: dto.age,
        sex: dto.sex,
        height: dto.height,
        weight: dto.weight,
        photoUrl: dto.photoUrl,
        primaryGoal: dto.primaryGoal,
        goalSpecific: JSON.stringify(dto.goalSpecific || {}),
        lifestyle: JSON.stringify(dto.lifestyle || {}),
        training: JSON.stringify(dto.training || {}),
        foodPreferences: JSON.stringify(dto.foodPreferences || {}),
        healthInfo: JSON.stringify(dto.healthInfo || {}),
        adherence: JSON.stringify(dto.adherence || {}),
      },
    });

    // Mark user as onboarded
    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingComplete: true },
    });

    // Trigger initial plan generation using the Rule Engine
    const initialPlan = await this.engineService.processOnboarding(
      userId,
      onboardingData,
    );

    return {
      success: true,
      message: 'Onboarding completed successfully',
      data: {
        onboarding: onboardingData,
        initialPlan,
      },
    };
  }

  async getOnboardingProfile(userId: string) {
    const data = await this.prisma.onboardingData.findUnique({
      where: { userId },
    });

    if (!data) {
      return null;
    }

    // Parse JSON fields back to objects
    return {
      ...data,
      goalSpecific: JSON.parse(data.goalSpecific),
      lifestyle: JSON.parse(data.lifestyle),
      training: JSON.parse(data.training),
      foodPreferences: JSON.parse(data.foodPreferences),
      healthInfo: JSON.parse(data.healthInfo),
      adherence: JSON.parse(data.adherence),
    };
  }
}
