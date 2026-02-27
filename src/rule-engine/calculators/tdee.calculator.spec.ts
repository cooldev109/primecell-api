/**
 * TDEE Calculator Tests
 */

import { calculateBMR, calculateTDEE, TDEEInput } from './tdee.calculator';

describe('TDEE Calculator', () => {
  describe('calculateBMR', () => {
    it('should calculate BMR correctly for male', () => {
      const input: TDEEInput = {
        weight: 80,
        height: 180,
        age: 30,
        gender: 'male',
        activityLevel: 'moderate',
      };

      const bmr = calculateBMR(input);

      // Expected: (10 × 80) + (6.25 × 180) - (5 × 30) + 5 = 800 + 1125 - 150 + 5 = 1780
      expect(bmr).toBe(1780);
    });

    it('should calculate BMR correctly for female', () => {
      const input: TDEEInput = {
        weight: 60,
        height: 165,
        age: 25,
        gender: 'female',
        activityLevel: 'moderate',
      };

      const bmr = calculateBMR(input);

      // Expected: (10 × 60) + (6.25 × 165) - (5 × 25) - 161 = 600 + 1031.25 - 125 - 161 = 1345.25 → 1345
      expect(bmr).toBe(1345);
    });

    it('should handle edge cases (very light person)', () => {
      const input: TDEEInput = {
        weight: 45,
        height: 155,
        age: 20,
        gender: 'female',
        activityLevel: 'sedentary',
      };

      const bmr = calculateBMR(input);
      expect(bmr).toBeGreaterThan(1000);
      expect(bmr).toBeLessThan(1400);
    });

    it('should handle edge cases (very heavy person)', () => {
      const input: TDEEInput = {
        weight: 120,
        height: 190,
        age: 40,
        gender: 'male',
        activityLevel: 'active',
      };

      const bmr = calculateBMR(input);
      expect(bmr).toBeGreaterThan(2000);
      expect(bmr).toBeLessThan(2400);
    });
  });

  describe('calculateTDEE', () => {
    it('should calculate TDEE for sedentary activity', () => {
      const input: TDEEInput = {
        weight: 70,
        height: 175,
        age: 28,
        gender: 'male',
        activityLevel: 'sedentary',
      };

      const result = calculateTDEE(input);

      expect(result.bmr).toBeGreaterThan(0);
      expect(result.tdee).toBe(Math.round(result.bmr * 1.2));
      expect(result.activityMultiplier).toBe(1.2);
    });

    it('should calculate TDEE for very active person', () => {
      const input: TDEEInput = {
        weight: 75,
        height: 180,
        age: 25,
        gender: 'male',
        activityLevel: 'very_active',
      };

      const result = calculateTDEE(input);

      expect(result.activityMultiplier).toBe(1.9);
      expect(result.tdee).toBeGreaterThan(result.bmr * 1.8);
    });

    it('should handle all activity levels', () => {
      const baseInput: TDEEInput = {
        weight: 70,
        height: 175,
        age: 30,
        gender: 'male',
        activityLevel: 'sedentary',
      };

      const activities: Array<TDEEInput['activityLevel']> = [
        'sedentary',
        'light',
        'moderate',
        'active',
        'very_active',
      ];

      const results = activities.map((activity) =>
        calculateTDEE({ ...baseInput, activityLevel: activity }),
      );

      // TDEE should increase with activity level
      for (let i = 1; i < results.length; i++) {
        expect(results[i].tdee).toBeGreaterThan(results[i - 1].tdee);
      }
    });
  });
});
