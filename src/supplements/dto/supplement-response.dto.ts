import { ApiProperty } from '@nestjs/swagger';

/**
 * Supplement Response DTO
 * Represents a supplement product in the PrimeCell protocol
 *
 * CRITICAL: Supplements are STRUCTURAL COMPONENTS, not optional add-ons!
 */
export class SupplementResponseDto {
  @ApiProperty({
    description: 'Unique supplement ID',
    example: 'cml80u8l100004i6z45jup7ce',
  })
  id: string;

  @ApiProperty({
    description: 'Product name',
    example: 'KyoSlim',
    enum: ['KyoSlim', 'CreaPrime Creatine', 'Shape Protein'],
  })
  productName: string;

  @ApiProperty({
    description: 'Supplement category',
    example: 'fat_loss',
    enum: ['fat_loss', 'muscle_gain', 'protein_support'],
  })
  category: string;

  @ApiProperty({
    description: 'Product description',
    example:
      'Advanced metabolic support formula designed to support fat loss goals.',
  })
  description: string;

  @ApiProperty({
    description: 'Recommended dosage',
    example: '2 capsules per day',
  })
  recommendedDosage: string;

  @ApiProperty({
    description: 'Timing guidelines',
    example:
      'Take 1 capsule in the morning with breakfast and 1 capsule in the afternoon',
  })
  timingGuidelines: string;

  @ApiProperty({
    description: 'Primary goals this supplement supports',
    example: ['lose_fat', 'lose_weight', 'longevity'],
    type: [String],
  })
  primaryGoals: string[];

  @ApiProperty({
    description: 'Support goals (secondary benefits)',
    example: ['health_energy', 'performance'],
    type: [String],
  })
  supportGoals: string[];

  @ApiProperty({
    description: 'Product benefits',
    example: [
      'Supports healthy metabolism',
      'May help reduce appetite and cravings',
    ],
    type: [String],
  })
  benefits: string[];

  @ApiProperty({
    description: 'Priority level',
    example: 'critical',
    enum: ['critical', 'high', 'support'],
  })
  priority: string;

  @ApiProperty({
    description: 'Product URL (for e-commerce)',
    example: 'https://example.com/kyoslim',
    required: false,
  })
  productUrl?: string;

  @ApiProperty({
    description: 'Whether the product is active',
    example: true,
  })
  isActive: boolean;
}
