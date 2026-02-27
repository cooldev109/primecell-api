import { Module } from '@nestjs/common';
import { SupplementsController } from './supplements.controller';
import { SupplementsService } from './supplements.service';

/**
 * Supplements Module
 *
 * ⭐ CRITICAL: This is a CORE module, not optional!
 *
 * Provides supplement catalog and personalized supplement recommendations
 * for all users as part of the PrimeCell Protocol.
 *
 * Key Features:
 * - Supplement catalog (KyoSlim, CreaPrime Creatine, Shape Protein)
 * - Personalized recommendations based on user goals
 * - Supplement protocol organization (primary, support, optional)
 * - Integration with nutrition and training plans
 */
@Module({
  controllers: [SupplementsController],
  providers: [SupplementsService],
  exports: [SupplementsService],
})
export class SupplementsModule {}
