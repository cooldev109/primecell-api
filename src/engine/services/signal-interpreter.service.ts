import { Injectable } from '@nestjs/common';
import * as rulePack from '../../../shared-schemas/src/rule-pack-v1.json';

interface SubjectiveSignals {
  energy: number;
  hunger: number;
  sleep: number;
  stress: number;
}

interface CheckinData {
  weight: number;
  waist?: number;
  energy: number;
  hunger: number;
  sleep: number;
  stress: number;
  adherence: string;
  events: string[];
  createdAt: Date;
}

@Injectable()
export class SignalInterpreterService {
  /**
   * Analyze weight trend over multiple check-ins
   */
  analyzeTrend(checkins: CheckinData[]): {
    trend: 'decreasing' | 'stable' | 'increasing';
    avgWeightChange: number;
    confidence: number;
  } {
    if (checkins.length < 2) {
      return { trend: 'stable', avgWeightChange: 0, confidence: 0 };
    }

    // Sort by date (oldest first)
    const sorted = [...checkins].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    // Calculate weight change
    const firstWeight = sorted[0].weight;
    const lastWeight = sorted[sorted.length - 1].weight;
    const weightChange = lastWeight - firstWeight;

    // Determine trend
    let trend: 'decreasing' | 'stable' | 'increasing';
    const plateauThreshold = rulePack.trendAnalysis.plateauThreshold.maxWeightChange;

    if (Math.abs(weightChange) <= plateauThreshold) {
      trend = 'stable';
    } else if (weightChange < 0) {
      trend = 'decreasing';
    } else {
      trend = 'increasing';
    }

    // Calculate confidence
    const confidence = this.calculateConfidence(checkins);

    return {
      trend,
      avgWeightChange: weightChange,
      confidence,
    };
  }

  /**
   * Calculate confidence score based on adherence, data quality, and events
   */
  calculateConfidence(checkins: CheckinData[]): number {
    if (checkins.length === 0) return 0;

    // Calculate adherence score
    const adherenceScore = this.calculateAdherenceScore(checkins);

    // Calculate data quality score
    const dataQualityScore = this.calculateDataQualityScore(checkins);

    // Calculate event impact score
    const eventImpactScore = this.calculateEventImpactScore(checkins);

    // Weighted average
    const weights = rulePack.trendAnalysis.confidenceScoreWeights;
    const confidence =
      adherenceScore * weights.adherence +
      dataQualityScore * weights.dataQuality +
      eventImpactScore * weights.eventImpact;

    return Math.max(0, Math.min(1, confidence));
  }

  private calculateAdherenceScore(checkins: CheckinData[]): number {
    const adherenceScores = checkins.map((c) => {
      const mapping = (rulePack.adherenceMapping as any)[c.adherence];
      return mapping ? mapping.score : 0.5;
    });

    return adherenceScores.reduce((sum, score) => sum + score, 0) / adherenceScores.length;
  }

  private calculateDataQualityScore(checkins: CheckinData[]): number {
    // Data is high quality if:
    // 1. We have enough check-ins
    // 2. Check-ins are consistent (not missing weeks)

    const expectedCheckins = rulePack.trendAnalysis.trendWindow;
    const actualCheckins = checkins.length;

    if (actualCheckins >= expectedCheckins) {
      return 1.0;
    } else {
      return actualCheckins / expectedCheckins;
    }
  }

  private calculateEventImpactScore(checkins: CheckinData[]): number {
    // Start with perfect score
    let score = 1.0;

    // Reduce score based on events
    checkins.forEach((checkin) => {
      checkin.events.forEach((event) => {
        const impact = (rulePack.eventImpact as any)[event] || 0;
        score -= impact;
      });
    });

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Assess recovery risk from subjective signals
   */
  assessRecoveryRisk(signals: SubjectiveSignals): {
    riskLevel: 'low' | 'moderate' | 'high' | 'critical';
    riskScore: number;
    action: string;
  } {
    // Calculate risk score using formula from rule pack
    const riskScore =
      (10 - signals.energy) * rulePack.recoveryRiskScoring.weights.energy +
      signals.hunger * rulePack.recoveryRiskScoring.weights.hunger +
      (10 - signals.sleep) * rulePack.recoveryRiskScoring.weights.sleep +
      signals.stress * rulePack.recoveryRiskScoring.weights.stress;

    // Determine risk level
    const thresholds = rulePack.recoveryRiskScoring.thresholds;
    let riskLevel: 'low' | 'moderate' | 'high' | 'critical';
    let action: string;

    if (riskScore < thresholds.moderate.min) {
      riskLevel = 'low';
      action = thresholds.low.action;
    } else if (riskScore < thresholds.high.min) {
      riskLevel = 'moderate';
      action = thresholds.moderate.action;
    } else if (riskScore < thresholds.critical.min) {
      riskLevel = 'high';
      action = thresholds.high.action;
    } else {
      riskLevel = 'critical';
      action = thresholds.critical.action;
    }

    return { riskLevel, riskScore, action };
  }

  /**
   * Detect plateau (stable weight with high adherence)
   */
  detectPlateau(checkins: CheckinData[]): boolean {
    if (checkins.length < rulePack.trendAnalysis.trendWindow) {
      return false;
    }

    const { trend, avgWeightChange } = this.analyzeTrend(checkins);
    const avgAdherence = this.calculateAdherenceScore(checkins);

    const plateauThreshold = rulePack.trendAnalysis.plateauThreshold;
    const minAdherence = plateauThreshold.minAdherence / 100;

    return (
      trend === 'stable' &&
      Math.abs(avgWeightChange) <= plateauThreshold.maxWeightChange &&
      avgAdherence >= minAdherence
    );
  }

  /**
   * Detect recomposition (stable weight but waist decreasing)
   */
  detectRecomp(checkins: CheckinData[]): boolean {
    if (checkins.length < 2) {
      return false;
    }

    const sorted = [...checkins].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    // Check if we have waist measurements
    const hasWaist = sorted.every((c) => c.waist !== null && c.waist !== undefined);
    if (!hasWaist) {
      return false;
    }

    const firstWaist = sorted[0].waist!;
    const lastWaist = sorted[sorted.length - 1].waist!;
    const waistChange = lastWaist - firstWaist;

    const { trend } = this.analyzeTrend(checkins);
    const recompThreshold = rulePack.trendAnalysis.recompThreshold;

    return trend === 'stable' && waistChange <= recompThreshold.minWaistDecrease;
  }
}
