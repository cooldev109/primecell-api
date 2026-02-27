import { Controller, Post, Get, Body, Request, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckinsService } from './checkins.service';
import { SubmitCheckinDto } from './dto/submit-checkin.dto';

@ApiTags('checkins')
@Controller('checkins')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CheckinsController {
  constructor(private readonly checkinsService: CheckinsService) {}

  @Post('submit')
  @ApiOperation({ summary: 'Submit weekly check-in' })
  async submitCheckin(
    @Request() req: any,
    @Body() dto: SubmitCheckinDto,
  ) {
    return this.checkinsService.submitCheckin(req.user.id, dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get check-in history' })
  async getCheckinHistory(
    @Request() req: any,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 12;
    return this.checkinsService.getCheckinHistory(req.user.id, limitNum);
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get latest check-in' })
  async getLatestCheckin(@Request() req: any) {
    return this.checkinsService.getLatestCheckin(req.user.id);
  }
}
