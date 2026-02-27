import { ApiProperty } from '@nestjs/swagger';
import { SupplementResponseDto } from './supplement-response.dto';

/**
 * Supplement Recommendation Response DTO
 * Represents a personalized supplement recommendation for a user
 *
 * CRITICAL: Every user gets supplement recommendations based on their goals.
 * This is a CORE feature, not optional!
 */
export class SupplementRecommendationResponseDto {
  @ApiProperty({
    description: 'Unique recommendation ID',
    example: 'cml80u9ab00104i6zxyz12345',
  })
  id: string;

  @ApiProperty({
    description: 'User ID this recommendation is for',
    example: 'cml80u8k900034i6z789abcde',
  })
  userId: string;

  @ApiProperty({
    description: 'Supplement product details',
    type: SupplementResponseDto,
  })
  supplement: SupplementResponseDto;

  @ApiProperty({
    description: 'Nutrition plan version this recommendation belongs to',
    example: 1,
  })
  nutritionPlanVersion: number;

  @ApiProperty({
    description: 'Training plan version this recommendation belongs to',
    example: 1,
  })
  trainingPlanVersion: number;

  @ApiProperty({
    description: 'Priority level for this user',
    example: 'primary',
    enum: ['primary', 'support', 'optional'],
  })
  priority: string;

  @ApiProperty({
    description: 'Reason this supplement is recommended',
    example:
      'KyoSlim is recommended to support your weight loss goal. It helps with metabolism and appetite control.',
  })
  reason: string;

  @ApiProperty({
    description: 'Personalized dosage instructions',
    example: 'Take 2 capsules per day: 1 in the morning, 1 in the afternoon',
  })
  dosageInstructions: string;

  @ApiProperty({
    description: 'Personalized timing instructions',
    example:
      'Take with breakfast and lunch for optimal absorption and sustained effect',
  })
  timingInstructions: string;

  @ApiProperty({
    description: 'Whether this recommendation is currently active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Creation date',
    example: '2026-02-04T10:30:00Z',
  })
  createdAt: Date;
}

/**
 * User Supplement Protocol Response DTO
 * Complete supplement protocol for a user (all recommendations)
 */
export class UserSupplementProtocolDto {
  @ApiProperty({
    description: 'User ID',
    example: 'cml80u8k900034i6z789abcde',
  })
  userId: string;

  @ApiProperty({
    description: 'Current nutrition plan version',
    example: 1,
  })
  nutritionPlanVersion: number;

  @ApiProperty({
    description: 'Current training plan version',
    example: 1,
  })
  trainingPlanVersion: number;

  @ApiProperty({
    description: 'Primary supplement recommendations (goal-specific)',
    type: [SupplementRecommendationResponseDto],
  })
  primary: SupplementRecommendationResponseDto[];

  @ApiProperty({
    description: 'Support supplement recommendations (for all users)',
    type: [SupplementRecommendationResponseDto],
  })
  support: SupplementRecommendationResponseDto[];

  @ApiProperty({
    description: 'Optional supplement recommendations',
    type: [SupplementRecommendationResponseDto],
    required: false,
  })
  optional?: SupplementRecommendationResponseDto[];

  @ApiProperty({
    description: 'Protocol summary',
    example:
      'Your supplement protocol includes KyoSlim for fat loss support and Shape Protein for daily protein intake.',
  })
  summary: string;
}
