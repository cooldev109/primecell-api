import { Controller, Post, Get, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MealsService } from './meals.service';
import { LogMealDto } from './dto/log-meal.dto';

@Controller('meals')
@UseGuards(JwtAuthGuard)
export class MealsController {
  constructor(private mealsService: MealsService) {}

  @Post('log')
  async logMeal(@Req() req, @Body() dto: LogMealDto) {
    return this.mealsService.logMeal(req.user.userId, dto);
  }

  @Get('today')
  async getTodaysMeals(@Req() req) {
    return this.mealsService.getTodaysMeals(req.user.userId);
  }

  @Delete(':id')
  async deleteMeal(@Req() req, @Param('id') mealId: string) {
    return this.mealsService.deleteMeal(req.user.userId, mealId);
  }
}
