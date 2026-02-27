import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlansService } from './plans.service';

@ApiTags('plans')
@Controller('plans')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get('current/nutrition')
  @ApiOperation({ summary: 'Get current nutrition plan' })
  async getCurrentNutritionPlan(@Request() req: any) {
    return this.plansService.getCurrentNutritionPlan(req.user.id);
  }

  @Get('current/training')
  @ApiOperation({ summary: 'Get current training program' })
  async getCurrentTrainingProgram(@Request() req: any) {
    return this.plansService.getCurrentTrainingProgram(req.user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get plan history' })
  async getPlanHistory(@Request() req: any) {
    return this.plansService.getPlanHistory(req.user.id);
  }
}
