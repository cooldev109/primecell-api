import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { PlansModule } from './plans/plans.module';
import { CheckinsModule } from './checkins/checkins.module';
import { EngineModule } from './engine/engine.module';
import { SupplementsModule } from './supplements/supplements.module';
import { RuleEngineModule } from './rule-engine/rule-engine.module';
import { AIModule } from './ai/ai.module';
import { MealsModule } from './meals/meals.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    OnboardingModule,
    PlansModule,
    CheckinsModule,
    EngineModule,
    SupplementsModule, // ⭐ CORE Module: Supplements are structural components
    RuleEngineModule, // ⭐ CORE Module: Deterministic plan generation
    AIModule, // ⭐ COMMUNICATION Module: Explanations and feedback
    MealsModule, // Meal logging & tracking
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
