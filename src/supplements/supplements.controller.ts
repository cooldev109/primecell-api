import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SupplementsService } from './supplements.service';
import {
  SupplementResponseDto,
  SupplementRecommendationResponseDto,
  UserSupplementProtocolDto,
} from './dto';

/**
 * Supplements Controller
 *
 * ⭐ CRITICAL: Supplements are STRUCTURAL COMPONENTS of the PrimeCell Protocol.
 * These endpoints provide access to the supplement catalog and personalized
 * supplement recommendations for users.
 *
 * All endpoints require JWT authentication.
 */
@ApiTags('Supplements')
@ApiBearerAuth()
@Controller('supplements')
@UseGuards(JwtAuthGuard)
export class SupplementsController {
  constructor(private readonly supplementsService: SupplementsService) {}

  /**
   * Get all available supplements in the catalog
   *
   * Returns all active supplement products (KyoSlim, CreaPrime, Shape Protein)
   */
  @Get()
  @ApiOperation({
    summary: 'Get all supplements',
    description:
      'Retrieve all available supplement products in the PrimeCell catalog. This includes KyoSlim, CreaPrime Creatine, and Shape Protein.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all active supplements',
    type: [SupplementResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getAllSupplements(): Promise<SupplementResponseDto[]> {
    return this.supplementsService.getAllSupplements();
  }

  /**
   * Get a specific supplement by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get supplement by ID',
    description: 'Retrieve detailed information about a specific supplement.',
  })
  @ApiParam({
    name: 'id',
    description: 'Supplement ID',
    example: 'cml80u8l100004i6z45jup7ce',
  })
  @ApiResponse({
    status: 200,
    description: 'Supplement details',
    type: SupplementResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Supplement not found',
  })
  async getSupplementById(
    @Param('id') id: string,
  ): Promise<SupplementResponseDto> {
    return this.supplementsService.getSupplementById(id);
  }

  /**
   * Get current user's supplement recommendations
   *
   * ⭐ CORE FEATURE: Returns personalized supplement recommendations
   * based on the user's goals and current plan.
   */
  @Get('recommendations/me')
  @ApiOperation({
    summary: 'Get my supplement recommendations',
    description:
      '⭐ CORE FEATURE: Get personalized supplement recommendations for the authenticated user. ' +
      'Recommendations are based on the user\'s primary goal and current nutrition/training plan. ' +
      'Every user receives supplement recommendations as part of the PrimeCell Protocol.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active supplement recommendations',
    type: [SupplementRecommendationResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getMyRecommendations(
    @Request() req,
  ): Promise<SupplementRecommendationResponseDto[]> {
    const userId = req.user.id;
    return this.supplementsService.getUserRecommendations(userId);
  }

  /**
   * Get current user's complete supplement protocol
   *
   * ⭐ CORE FEATURE: Returns the full supplement protocol organized by priority
   * (primary, support, optional)
   */
  @Get('protocol/me')
  @ApiOperation({
    summary: 'Get my supplement protocol',
    description:
      '⭐ CORE FEATURE: Get the complete supplement protocol for the authenticated user. ' +
      'This organizes recommendations by priority:\n' +
      '- **Primary**: Goal-specific supplements (KyoSlim for fat loss, CreaPrime for muscle gain)\n' +
      '- **Support**: Supplements for all users (Shape Protein for daily protein intake)\n' +
      '- **Optional**: Additional supplements based on specific needs\n\n' +
      'The protocol includes personalized dosage and timing instructions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Complete supplement protocol with all recommendations',
    type: UserSupplementProtocolDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'No active plan found for user',
  })
  async getMyProtocol(@Request() req): Promise<UserSupplementProtocolDto> {
    const userId = req.user.id;
    return this.supplementsService.getUserProtocol(userId);
  }

  /**
   * Get supplement recommendations for a specific user (admin/coach access)
   *
   * Note: In production, this should have additional role-based guards
   */
  @Get('recommendations/user/:userId')
  @ApiOperation({
    summary: 'Get supplement recommendations for a user',
    description:
      'Get supplement recommendations for a specific user. This endpoint is intended for admin/coach access.',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: 'cml80u8k900034i6z789abcde',
  })
  @ApiResponse({
    status: 200,
    description: 'List of supplement recommendations',
    type: [SupplementRecommendationResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'User not found or no recommendations',
  })
  async getUserRecommendations(
    @Param('userId') userId: string,
  ): Promise<SupplementRecommendationResponseDto[]> {
    // TODO: Add role-based authorization guard for admin/coach
    return this.supplementsService.getUserRecommendations(userId);
  }

  /**
   * Get supplement protocol for a specific user (admin/coach access)
   */
  @Get('protocol/user/:userId')
  @ApiOperation({
    summary: 'Get supplement protocol for a user',
    description:
      'Get complete supplement protocol for a specific user. This endpoint is intended for admin/coach access.',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: 'cml80u8k900034i6z789abcde',
  })
  @ApiResponse({
    status: 200,
    description: 'Complete supplement protocol',
    type: UserSupplementProtocolDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found or no active plan',
  })
  async getUserProtocol(
    @Param('userId') userId: string,
  ): Promise<UserSupplementProtocolDto> {
    // TODO: Add role-based authorization guard for admin/coach
    return this.supplementsService.getUserProtocol(userId);
  }
}
