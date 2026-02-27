# PrimeCell Rule Engine

The Rule Engine is the **deterministic calculation system** that generates and updates all nutrition and training plans. It uses scientific formulas and metabolic safety rules to ensure all plans are safe, effective, and personalized.

## Architecture Principle

**Rule Engine generates plans. AI explains plans.**

- ✅ **Rule Engine**: TDEE calculations, macro calculations, energy balance, safety validation, plan adjustments
- ✅ **AI Service**: Explanations, meal suggestions, motivational feedback, exercise descriptions

## Directory Structure

```
rule-engine/
├── calculators/           # Core calculation engines
│   ├── tdee.calculator.ts          # BMR and TDEE calculations
│   ├── macro.calculator.ts         # Protein/fat/carbs calculations
│   └── energy-balance.calculator.ts # Deficit/surplus logic
├── validators/            # Safety and validation rules
│   ├── safety.validator.ts         # Metabolic safety constraints
│   └── adjustment.validator.ts     # Progress analysis and patterns
├── engines/              # High-level orchestration
│   ├── nutrition-plan-generator.engine.ts  # Complete nutrition plans
│   ├── training-plan-generator.engine.ts   # Complete training programs
│   └── adjustment.engine.ts        # Check-in processing and updates
├── rule-engine.service.ts  # Main service (Injectable)
├── rule-engine.module.ts   # NestJS module
└── index.ts               # Barrel exports
```

## Core Components

### 1. TDEE Calculator

**Purpose**: Calculate Total Daily Energy Expenditure

**Formula**: Mifflin-St Jeor equation
```typescript
BMR (male) = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
BMR (female) = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161
TDEE = BMR × Activity Multiplier
```

**Activity Multipliers**:
- Sedentary: 1.2
- Light: 1.375
- Moderate: 1.55
- Active: 1.725
- Very Active: 1.9

### 2. Macro Calculator

**Purpose**: Calculate optimal protein, fat, and carbohydrate targets

**Protein Ratios** (g/kg body weight):
- Weight loss: 2.0-2.4 g/kg (preserve muscle during deficit)
- Maintenance: 1.8-2.2 g/kg
- Muscle gain: 1.6-2.2 g/kg

**Fat Ratios** (g/kg body weight):
- Weight loss: 0.8-1.0 g/kg
- Maintenance: 0.8-1.2 g/kg
- Muscle gain: 0.8-1.0 g/kg

**Carbs**: Calculated from remaining calories after protein and fat

### 3. Energy Balance Calculator

**Purpose**: Determine calorie targets based on goals

**Deficit/Surplus Ranges**:
- Weight loss: 20-25% deficit (max 500 cal/day)
- Maintenance: 0% change
- Muscle gain: 8-12% surplus (max 300 cal/day)

**Safety Limits**:
- Maximum deficit: 500 cal/day
- Maximum surplus: 300 cal/day
- Maximum weekly weight loss: 1% of body weight

### 4. Safety Validator

**Purpose**: Ensure all plans meet metabolic safety constraints

**Constraints**:
- Minimum calories: 1500 (male), 1200 (female)
- Maximum deficit: 500 cal/day
- Maximum surplus: 300 cal/day
- Minimum protein: 1.6 g/kg body weight
- Maximum weekly weight loss: 1% body weight

### 5. Adjustment Engine

**Purpose**: Analyze progress from check-ins and recommend adjustments

**Pattern Detection**:
- **Too Fast**: Weight changing faster than expected
- **Too Slow**: Weight changing slower than expected
- **Stalled**: No change for 3+ weeks
- **On Track**: Progress as expected (±0.2kg tolerance)
- **Reversed**: Gaining during weight loss or losing during muscle gain

**Adjustment Rules**:
- Maximum adjustment: ±200 cal/week
- Tolerance: ±0.2kg/week
- Stall detection: 3+ weeks with <0.3kg range

## Usage Examples

### Generate Initial Nutrition Plan

```typescript
import { RuleEngineService } from './rule-engine';

const ruleEngine = new RuleEngineService();

const plan = ruleEngine.generateInitialNutritionPlan({
  weight: 80,
  height: 180,
  age: 30,
  gender: 'male',
  activityLevel: 'moderate',
  goal: 'weight_loss',
  mealsPerDay: 3,
});

console.log(plan);
// {
//   bmr: 1780,
//   tdee: 2759,
//   targetCalories: 2207,  // ~20% deficit
//   protein: 192,          // 2.4 g/kg
//   fat: 72,               // 0.9 g/kg
//   carbs: 306,            // Remaining calories
//   estimatedWeeklyWeightChange: -0.55,  // kg/week
//   validation: { isValid: true, violations: [], warnings: [] }
// }
```

### Analyze Check-In Progress

```typescript
const analysis = ruleEngine.analyzeProgress(
  [
    { weight: 79.2, createdAt: new Date('2024-01-15'), energyLevel: 4 },
    { weight: 80.0, createdAt: new Date('2024-01-08'), energyLevel: 3 },
  ],
  -0.5,  // Expected weekly change
  'weight_loss',
  2200,  // Current calories
  'male'
);

console.log(analysis);
// {
//   pattern: 'on_track',
//   shouldAdjustNutrition: false,
//   nutritionAdjustment: 0,
//   reason: 'Progress is on track. No adjustment needed.',
//   warnings: []
// }
```

### Adjust Plan Based on Progress

```typescript
if (analysis.shouldAdjustNutrition) {
  const newPlan = ruleEngine.adjustNutrition(
    currentPlan,
    analysis.nutritionAdjustment,  // e.g., -150 cal
    79.2,  // Current weight
    'male',
    'weight_loss'
  );

  // Save new plan version to database
}
```

## Integration with AI Service

The Rule Engine calculates the numbers. The AI Service explains them.

```typescript
// ❌ WRONG: AI generates plan
const plan = await aiService.generateNutritionPlan(userProfile);

// ✅ CORRECT: Rule engine generates, AI explains
const plan = ruleEngine.generateInitialNutritionPlan(userProfile);
const explanation = await aiService.explainNutritionPlan(plan, userProfile);

await database.save({
  ...plan,
  explanation,  // Human-readable text from AI
});
```

## Testing

Run unit tests:

```bash
npm test rule-engine
```

Tests cover:
- TDEE calculations for various body types
- Macro calculations for all goals
- Safety validation edge cases
- Adjustment recommendations
- Pattern detection

## Safety Guarantees

The Rule Engine ensures:

1. **No Extreme Deficits**: Maximum 500 cal/day deficit
2. **Minimum Calories**: Never below 1200 (F) or 1500 (M)
3. **Adequate Protein**: Minimum 1.6 g/kg for muscle preservation
4. **Safe Weight Loss**: Maximum 1% body weight per week
5. **Controlled Adjustments**: Maximum ±200 cal changes per week

## Future Enhancements

- [ ] Add metabolic adaptation detection
- [ ] Implement diet break recommendations
- [ ] Add refeed day scheduling
- [ ] Support macro cycling (high/low carb days)
- [ ] Add reverse dieting protocol
- [ ] Implement advanced periodization for training

## References

- Mifflin-St Jeor Equation: [Mifflin et al., 1990](https://pubmed.ncbi.nlm.nih.gov/2305711/)
- Protein Requirements: [Morton et al., 2018](https://pubmed.ncbi.nlm.nih.gov/28698222/)
- Energy Balance: [Hall & Chow, 2013](https://pubmed.ncbi.nlm.nih.gov/23390127/)
