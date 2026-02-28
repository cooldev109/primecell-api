/**
 * TypeScript types for Rule Pack configuration
 */

export interface RulePack {
  version: string;
  createdAt: string;
  description: string;

  calorieAdjustments: {
    candidateDeltas: number[];
    deadband: number;
    maxWeeklyChange: number;
    comment: string;
  };

  safetyConstraints: {
    calorieFloor: {
      female: number;
      male: number;
      comment: string;
    };
    maxDeficitPercent: number;
    maxSurplusPercent: number;
    proteinMinimum: {
      deficit: number;
      surplus: number;
      unit: string;
      comment: string;
    };
    comment: string;
  };

  trendAnalysis: {
    trendWindow: number;
    trendWindowUnit: string;
    confidenceScoreWeights: {
      adherence: number;
      dataQuality: number;
      eventImpact: number;
    };
    minimumConfidenceForAction: number;
    plateauThreshold: {
      maxWeightChange: number;
      maxWeightChangeUnit: string;
      minAdherence: number;
      minAdherenceUnit: string;
    };
    recompThreshold: {
      weightChangeRange: [number, number];
      weightChangeRangeUnit: string;
      minWaistDecrease: number;
      minWaistDecreaseUnit: string;
    };
    comment: string;
  };

  recoveryRiskScoring: {
    formula: string;
    weights: {
      energy: number;
      hunger: number;
      sleep: number;
      stress: number;
    };
    thresholds: {
      low: { max: number; action: string };
      moderate: { min: number; max: number; action: string };
      high: { min: number; max: number; action: string };
      critical: { min: number; action: string };
    };
    comment: string;
  };

  stateMachineLocks: {
    antiReversalLock: {
      duration: number;
      durationUnit: string;
      comment: string;
    };
    programLock: {
      duration: number;
      durationUnit: string;
      comment: string;
    };
    deloadFrequency: {
      min: number;
      max: number;
      unit: string;
      comment: string;
    };
  };

  nutritionModes: {
    [key: string]: {
      description: string;
      transitions: {
        [key: string]: string;
      };
      duration?: string;
    };
  };

  trainingModes: {
    [key: string]: {
      description: string;
      volumeAdjustment: number | number[];
      intensityAdjustment: number | number[];
      triggers?: string[];
      duration?: string;
      comment?: string;
    };
  };

  trainingProgression: {
    volumeAdjustmentSteps: number[];
    intensityAdjustmentSteps: number[];
    deloadReduction: number;
    comment: string;
  };

  adherenceMapping: {
    [key: string]: {
      score: number;
      description: string;
    };
  };

  eventImpact: {
    [key: string]: number;
  };

  goalSpecificDefaults: {
    [key: string]: {
      initialDeficit?: number;
      initialSurplus?: number;
      initialDeficitUnit?: string;
      initialSurplusUnit?: string;
      proteinTarget: number;
      proteinUnit: string;
      supplements: string[];
    };
  };

  macroDistribution: {
    protein: {
      priority: number;
      calculation: string;
    };
    fat: {
      priority: number;
      minimum: number;
      maximum: number;
      unit: string;
    };
    carbs: {
      priority: number;
      calculation: string;
    };
  };

  metadata: {
    engineVersion: string;
    compatibleEngineVersions: string[];
    deprecated: boolean;
    nextVersion: string | null;
    changeLog: string;
  };
}

// Import the actual rule pack
import rulePack from './rule-pack-v1.json';
export const RULE_PACK_V1: RulePack = rulePack as unknown as RulePack;
