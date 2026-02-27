import { Module } from '@nestjs/common';
import { EngineService } from './engine.service';
import { SignalInterpreterService } from './services/signal-interpreter.service';
import { ActionSelectorService } from './services/action-selector.service';
import { PlanBuilderService } from './services/plan-builder.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SupplementsModule } from '../supplements/supplements.module';
import { RuleEngineModule } from '../rule-engine/rule-engine.module';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, SupplementsModule, RuleEngineModule, AIModule],
  providers: [
    EngineService,
    SignalInterpreterService,
    ActionSelectorService,
    PlanBuilderService,
  ],
  exports: [EngineService],
})
export class EngineModule {}
