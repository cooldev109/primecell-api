import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogMealDto } from './dto/log-meal.dto';

@Injectable()
export class MealsService {
  constructor(private prisma: PrismaService) {}

  async logMeal(userId: string, dto: LogMealDto) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const meal = await this.prisma.mealLog.create({
      data: {
        userId,
        name: dto.name,
        calories: dto.calories,
        protein: dto.protein,
        carbs: dto.carbs,
        fat: dto.fat,
        category: dto.category,
        date: today,
      },
    });

    return {
      success: true,
      data: meal,
    };
  }

  async getTodaysMeals(userId: string) {
    const today = new Date().toISOString().split('T')[0];

    const meals = await this.prisma.mealLog.findMany({
      where: {
        userId,
        date: today,
      },
      orderBy: {
        loggedAt: 'asc',
      },
    });

    return {
      success: true,
      data: meals,
    };
  }

  async deleteMeal(userId: string, mealId: string) {
    // Verify ownership
    const meal = await this.prisma.mealLog.findFirst({
      where: {
        id: mealId,
        userId,
      },
    });

    if (!meal) {
      throw new Error('Meal not found');
    }

    await this.prisma.mealLog.delete({
      where: { id: mealId },
    });

    return {
      success: true,
      message: 'Meal deleted',
    };
  }
}
