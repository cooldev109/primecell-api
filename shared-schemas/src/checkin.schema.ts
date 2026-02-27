import { z } from 'zod';

/**
 * Weekly Check-In Schema
 * Phase 2 - Recurring Input
 */

// Step 1: Body Metrics
export const BodyMetricsSchema = z.object({
  weight: z.number().positive().optional(), // in kg
  waist: z.number().positive().optional(), // in cm
  photoUrl: z.string().url().optional(),
});

// Step 2: Subjective Signals (0-10 scale)
export const SubjectiveSignalsSchema = z.object({
  energy: z.number().int().min(0).max(10),
  hunger: z.number().int().min(0).max(10),
  sleep: z.number().int().min(0).max(10),
  stress: z.number().int().min(0).max(10),
});

// Step 3: Adherence Level
export const AdherenceLevelSchema = z.enum([
  '100',      // 100% - followed almost everything
  '80-90',    // 80-90% - made small adaptations
  '60-70',    // 60-70% - had several deviations
  '<60',      // <60% - difficult week
]);

// Step 4: Contextual Events
export const ContextualEventsSchema = z.object({
  events: z.array(
    z.enum([
      'meals_outside',
      'travel',
      'illness',
      'hormonal_changes',
      'emotional_stress',
      'poor_sleep',
      'no_events',
    ])
  ).min(1),
  notes: z.string().max(500).optional(),
});

// Step 5: Self-Perception
export const SelfPerceptionSchema = z.enum([
  'progressing',          // I feel I am progressing
  'same_confident',       // I feel the same, but confident
  'frustrated',           // I feel a bit frustrated
  'unsure',               // I'm not sure how to evaluate
]);

// Combined Weekly Check-In Schema
export const WeeklyCheckinInputSchema = z.object({
  bodyMetrics: BodyMetricsSchema,
  subjectiveSignals: SubjectiveSignalsSchema,
  adherence: AdherenceLevelSchema,
  contextualEvents: ContextualEventsSchema,
  selfPerception: SelfPerceptionSchema,
});

// Check-In Response Schema (output after engine processing)
export const CheckinResponseSchema = z.object({
  success: z.boolean(),
  weekNumber: z.number().int().positive(),
  planUpdated: z.boolean(),
  updatedPlan: z.object({
    nutritionPlanId: z.string(),
    trainingProgramId: z.string(),
    changes: z.string(), // Summary of changes
  }).optional(),
  explanation: z.object({
    progressSummary: z.string(),
    whyThisDecision: z.string(),
    whatToDoNext: z.array(z.string()),
    safetyNote: z.string().optional(),
  }),
  decisionRecordId: z.string(),
});

// TypeScript types
export type BodyMetrics = z.infer<typeof BodyMetricsSchema>;
export type SubjectiveSignals = z.infer<typeof SubjectiveSignalsSchema>;
export type AdherenceLevel = z.infer<typeof AdherenceLevelSchema>;
export type ContextualEvents = z.infer<typeof ContextualEventsSchema>;
export type SelfPerception = z.infer<typeof SelfPerceptionSchema>;
export type WeeklyCheckinInput = z.infer<typeof WeeklyCheckinInputSchema>;
export type CheckinResponse = z.infer<typeof CheckinResponseSchema>;
