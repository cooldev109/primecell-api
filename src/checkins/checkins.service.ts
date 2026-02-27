import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitCheckinDto } from './dto/submit-checkin.dto';
import { EngineService } from '../engine/engine.service';

@Injectable()
export class CheckinsService {
  constructor(
    private prisma: PrismaService,
    private engineService: EngineService,
  ) {}

  async submitCheckin(userId: string, dto: SubmitCheckinDto) {
    // Get current week number from ActivePlanPointer
    const activePlan = await this.prisma.activePlanPointer.findUnique({
      where: { userId },
    });

    if (!activePlan) {
      throw new Error('No active plan found for user. Please complete onboarding first.');
    }

    const weekNumber = activePlan.currentWeek;

    // Save check-in (immutable - append only)
    const checkin = await this.prisma.weeklyCheckin.create({
      data: {
        userId,
        weekNumber,
        weight: dto.weight,
        waist: dto.waist,
        photoUrl: dto.photoUrl,
        energy: dto.energy,
        hunger: dto.hunger,
        sleep: dto.sleep,
        stress: dto.stress,
        adherence: dto.adherence,
        events: JSON.stringify(dto.events || []),
        notes: dto.notes,
        perception: dto.perception,
      },
    });

    // Trigger plan adjustment using the Rule Engine
    const adjustedPlan = await this.engineService.processCheckin(userId, checkin);

    return {
      success: true,
      message: 'Check-in submitted successfully',
      data: {
        checkin: {
          ...checkin,
          events: JSON.parse(checkin.events),
        },
        adjustedPlan,
      },
    };
  }

  async getCheckinHistory(userId: string, limit: number = 12) {
    const checkins = await this.prisma.weeklyCheckin.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return checkins.map((c) => ({
      ...c,
      events: JSON.parse(c.events),
    }));
  }

  async getLatestCheckin(userId: string) {
    const checkin = await this.prisma.weeklyCheckin.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!checkin) {
      return null;
    }

    return {
      ...checkin,
      events: JSON.parse(checkin.events),
    };
  }

  async getCheckinTrend(userId: string, weeks: number = 3) {
    const checkins = await this.prisma.weeklyCheckin.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: weeks,
    });

    if (checkins.length === 0) {
      return null;
    }

    // Calculate trends
    const weights = checkins.map((c) => c.weight).reverse();
    const waists = checkins.filter((c) => c.waist).map((c) => c.waist).reverse();

    return {
      weights,
      waists,
      avgEnergy: checkins.reduce((sum, c) => sum + c.energy, 0) / checkins.length,
      avgHunger: checkins.reduce((sum, c) => sum + c.hunger, 0) / checkins.length,
      avgSleep: checkins.reduce((sum, c) => sum + c.sleep, 0) / checkins.length,
      avgStress: checkins.reduce((sum, c) => sum + c.stress, 0) / checkins.length,
      adherence: checkins.map((c) => c.adherence),
    };
  }
}
