/**
 * Macro Calculator Tests
 */

import { calculateMacros, validateMacros, MacroInput } from './macro.calculator';

describe('Macro Calculator', () => {
  describe('calculateMacros', () => {
    it('should calculate macros for weight loss', () => {
      const input: MacroInput = {
        weight: 80,
        targetCalories: 2000,
        goal: 'weight_loss',
        activityLevel: 'moderate',
      };

      const result = calculateMacros(input);

      // Weight loss: protein 2.0-2.4 g/kg → ~192g (2.4 × 80)
      expect(result.protein).toBeGreaterThanOrEqual(160);
      expect(result.protein).toBeLessThanOrEqual(200);

      // Fat should be ~0.8-1.0 g/kg → ~70g
      expect(result.fat).toBeGreaterThanOrEqual(60);
      expect(result.fat).toBeLessThanOrEqual(85);

      // Carbs fill the rest
      expect(result.carbs).toBeGreaterThan(0);

      // Total calories should be close to target
      const totalCal =
        result.proteinCalories + result.fatCalories + result.carbsCalories;
      expect(Math.abs(totalCal - 2000)).toBeLessThan(100);
    });

    it('should calculate macros for muscle gain', () => {
      const input: MacroInput = {
        weight: 70,
        targetCalories: 2800,
        goal: 'muscle_gain',
        activityLevel: 'active',
      };

      const result = calculateMacros(input);

      // Muscle gain: protein 1.6-2.2 g/kg → ~133g (1.9 × 70)
      expect(result.protein).toBeGreaterThanOrEqual(112);
      expect(result.protein).toBeLessThanOrEqual(160);

      // Fat ~0.8-1.0 g/kg → ~63g
      expect(result.fat).toBeGreaterThanOrEqual(56);
      expect(result.fat).toBeLessThanOrEqual(75);

      // Carbs should be high for muscle gain
      expect(result.carbs).toBeGreaterThan(250);
    });

    it('should calculate macros for maintenance', () => {
      const input: MacroInput = {
        weight: 75,
        targetCalories: 2400,
        goal: 'maintenance',
        activityLevel: 'moderate',
      };

      const result = calculateMacros(input);

      // Maintenance: protein 1.8-2.2 g/kg → ~150g
      expect(result.protein).toBeGreaterThanOrEqual(135);
      expect(result.protein).toBeLessThanOrEqual(170);

      // Balanced macros
      expect(result.fat).toBeGreaterThan(50);
      expect(result.carbs).toBeGreaterThan(200);
    });

    it('should ensure macros add up to target calories', () => {
      const input: MacroInput = {
        weight: 80,
        targetCalories: 2200,
        goal: 'weight_loss',
        activityLevel: 'moderate',
      };

      const result = calculateMacros(input);

      const totalCalories =
        result.protein * 4 + result.fat * 9 + result.carbs * 4;

      // Should be within 5% of target
      expect(Math.abs(totalCalories - 2200)).toBeLessThan(110);
    });

    it('should not produce negative carbs', () => {
      const input: MacroInput = {
        weight: 100, // Very heavy person
        targetCalories: 1500, // Very low calories
        goal: 'weight_loss',
        activityLevel: 'sedentary',
      };

      const result = calculateMacros(input);

      expect(result.carbs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('validateMacros', () => {
    it('should validate macros within tolerance', () => {
      const result = {
        protein: 150,
        fat: 60,
        carbs: 250,
        proteinCalories: 600,
        fatCalories: 540,
        carbsCalories: 1000,
      };

      const isValid = validateMacros(result, 2150);

      // Total = 2140, target = 2150, diff = 10 (< 5%)
      expect(isValid).toBe(true);
    });

    it('should reject macros outside tolerance', () => {
      const result = {
        protein: 200,
        fat: 100,
        carbs: 100,
        proteinCalories: 800,
        fatCalories: 900,
        carbsCalories: 400,
      };

      const isValid = validateMacros(result, 2500);

      // Total = 2100, target = 2500, diff = 400 (16%)
      expect(isValid).toBe(false);
    });
  });
});
