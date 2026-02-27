import { Controller, Post, Get, Body, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OnboardingService } from './onboarding.service';
import { SubmitOnboardingDto } from './dto/submit-onboarding.dto';

@ApiTags('onboarding')
@Controller('onboarding')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('submit')
  @ApiOperation({ summary: 'Submit onboarding questionnaire' })
  async submitOnboarding(
    @Request() req: any,
    @Body() dto: SubmitOnboardingDto,
  ) {
    return this.onboardingService.submitOnboarding(req.user.id, dto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get user onboarding profile' })
  async getOnboardingProfile(@Request() req: any) {
    return this.onboardingService.getOnboardingProfile(req.user.id);
  }
}
