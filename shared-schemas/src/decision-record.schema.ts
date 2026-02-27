import { z } from 'zod';

/**
 * Decision Record Schema
 * Immutable audit trail of engine decisions
 */

// Derived Signals Schema (output from signal interpreter)
export const TrendSignalSchema = z.object({
  weight: z.object({
    direction: z.enum(['increasing', 'decreasing', 'stable']),
    rateOfChange: z.number(), // kg/week
    trend: z.array(z.number()), // Last 3 weeks trend data
  }).optional(),
  waist: z.object({
    direction: z.enum(['increasing', 'decreasing', 'stable']),
    rateOfChange: z.number(), // cm/week
    trend: z.array(z.number()), // Last 3 weeks trend data
  }).optional(),
});

export const RecoveryRiskSchema = z.object({
  level: z.enum(['low', 'moderate', 'high', 'critical']),
  score: z.number().min(0).max(10),
  factors: z.object({
    lowEnergy: z.boolean(),
    highHunger: z.boolean(),
    poorSleep: z.boolean(),
    highStress: z.boolean(),
  }),
});

export const DerivedSignalsSchema = z.object({
  trend: TrendSignalSchema,
  confidence: z.number().min(0).max(1), // 0.0 to 1.0
  confidenceFactors: z.object({
    adherenceScore: z.number().min(0).max(1),
    dataQualityScore: z.number().min(0).max(1),
    eventImpactScore: z.number().min(0).max(1),
  }),
  recoveryRisk: RecoveryRiskSchema,
  plateauDetected: z.boolean(),
  recompDetected: z.boolean(), // Body recomposition (weight stable, waist decreasing)
});

// Engine State Schema
export const EngineStateSchema = z.object({
  nutritionMode: z.enum([
    'CUT_ACTIVE',
    'CUT_HOLD',
    'CUT_RECOVERY',
    'MAINTAIN',
    'GAIN_ACTIVE',
    'GAIN_HOLD',
  ]),
  trainingMode: z.enum(['PROGRESS', 'HOLD', 'DELOAD']),
  locks: z.object({
    antiReversalLockUntil: z.string().datetime().optional(), // Prevent yo-yo changes
    programLockUntil: z.string().datetime().optional(), // Maintain program consistency
  }),
  weeksSinceLastDeload: z.number().int().min(0),
  weeksSinceLastChange: z.number().int().min(0),
});

// Actions Schema
export const CalorieActionSchema = z.object({
  type: z.literal('calorie_change'),
  delta: z.number(), // -200, -150, -100, -50, 0, +50, +100, +150, +200
  previousCalories: z.number().positive(),
  newCalories: z.number().positive(),
  reason: z.string(),
});

export const TrainingActionSchema = z.object({
  type: z.literal('training_change'),
  volumeDelta: z.number(), // e.g., 1.0 = no change, 1.05 = +5%, 0.95 = -5%
  intensityDelta: z.number(),
  reason: z.string(),
});

export const ActionSetSchema = z.object({
  calorieAction: CalorieActionSchema,
  trainingAction: TrainingActionSchema,
  guardrailsApplied: z.array(z.string()), // e.g., ["calorie_floor_enforced", "max_deficit_enforced"]
});

// Input Snapshot Schema
export const InputSnapshotSchema = z.object({
  onboardingProfile: z.any(), // Full onboarding data
  recentCheckins: z.array(z.any()), // Last 2-3 check-ins
  currentPlan: z.any(), // Current plan before this decision
});

// Output Snapshot Schema
export const OutputSnapshotSchema = z.object({
  nutritionPlan: z.object({
    calories: z.number().positive(),
    macros: z.object({
      protein: z.number().positive(),
      carbs: z.number().positive(),
      fat: z.number().positive(),
    }),
  }),
  trainingPlan: z.object({
    programId: z.string(),
    week: z.number().int().positive(),
    volumeAdjustment: z.number(),
    intensityAdjustment: z.number(),
  }),
});

// Complete Decision Record Schema
export const DecisionRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  checkinId: z.string(),
  planVersionId: z.string(),

  // Input data
  inputSnapshot: InputSnapshotSchema,

  // Derived signals
  derivedSignals: DerivedSignalsSchema,

  // Engine state
  engineState: EngineStateSchema,

  // Rules fired
  rulesFired: z.array(z.string()), // e.g., ["plateau_detected", "recovery_risk_high"]

  // Actions taken
  actions: ActionSetSchema,

  // Guardrails applied
  guardrailsApplied: z.array(z.string()),

  // Output
  outputSnapshot: OutputSnapshotSchema,

  // Metadata
  engineVersion: z.string(), // e.g., "1.0.0"
  rulePackVersion: z.string(), // e.g., "v1"
  hash: z.string().optional(), // SHA-256 hash for tamper detection

  createdAt: z.string().datetime(),
});

// TypeScript types
export type TrendSignal = z.infer<typeof TrendSignalSchema>;
export type RecoveryRisk = z.infer<typeof RecoveryRiskSchema>;
export type DerivedSignals = z.infer<typeof DerivedSignalsSchema>;
export type EngineState = z.infer<typeof EngineStateSchema>;
export type CalorieAction = z.infer<typeof CalorieActionSchema>;
export type TrainingAction = z.infer<typeof TrainingActionSchema>;
export type ActionSet = z.infer<typeof ActionSetSchema>;
export type InputSnapshot = z.infer<typeof InputSnapshotSchema>;
export type OutputSnapshot = z.infer<typeof OutputSnapshotSchema>;
export type DecisionRecord = z.infer<typeof DecisionRecordSchema>;
