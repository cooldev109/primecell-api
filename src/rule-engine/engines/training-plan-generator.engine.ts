/**
 * Training Plan Generator Engine
 * Selects appropriate training programs based on user profile
 */

export interface TrainingPlanInput {
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  daysPerWeek: number;
  equipment: 'gym' | 'home' | 'minimal';
  goal: 'strength' | 'hypertrophy' | 'endurance' | 'general_fitness';
  age: number;
  injuries?: string[];
}

export interface TrainingPlanResult {
  programId: string;
  programName: string;
  description: string;

  // Volume and intensity
  initialVolume: number; // Sets per muscle group per week
  initialIntensity: 'light' | 'moderate' | 'hard';
  volumeMultiplier: number;
  intensityMultiplier: number;

  // Schedule
  daysPerWeek: number;
  isDeloadWeek: boolean;
  deloadFrequency: number; // Every N weeks

  // Progression
  progressionScheme: string;

  // Validation
  isValid: boolean;
  warnings: string[];
}

/**
 * Program selection matrix based on experience and days per week
 */
const PROGRAM_TEMPLATES: Record<string, any> = {
  'beginner_3day': {
    programId: 'full_body_beginner',
    programName: 'Beginner Full Body',
    description: 'Full body workouts 3x per week for building foundation',
    volume: 12, // sets per muscle group per week
    intensity: 'moderate',
    progressionScheme: 'linear',
  },
  'beginner_4day': {
    programId: 'upper_lower_beginner',
    programName: 'Beginner Upper/Lower Split',
    description: 'Upper/lower split for balanced development',
    volume: 14,
    intensity: 'moderate',
    progressionScheme: 'linear',
  },
  'intermediate_4day': {
    programId: 'upper_lower_intermediate',
    programName: 'Intermediate Upper/Lower',
    description: 'Progressive upper/lower split with periodization',
    volume: 16,
    intensity: 'hard',
    progressionScheme: 'wave_loading',
  },
  'intermediate_5day': {
    programId: 'ppl_intermediate',
    programName: 'Push/Pull/Legs',
    description: 'Classic PPL split for muscle building',
    volume: 18,
    intensity: 'hard',
    progressionScheme: 'double_progression',
  },
  'intermediate_6day': {
    programId: 'ppl_high_frequency',
    programName: 'High-Frequency PPL',
    description: 'PPL twice per week for advanced recovery',
    volume: 20,
    intensity: 'hard',
    progressionScheme: 'daily_undulation',
  },
  'advanced_5day': {
    programId: 'powerbuilding_advanced',
    programName: 'Powerbuilding Program',
    description: 'Strength and hypertrophy combined',
    volume: 20,
    intensity: 'hard',
    progressionScheme: 'block_periodization',
  },
  'advanced_6day': {
    programId: 'arnold_split_advanced',
    programName: 'Arnold Split',
    description: 'High-volume chest/back, shoulders/arms, legs split',
    volume: 22,
    intensity: 'hard',
    progressionScheme: 'daily_undulation',
  },
};

/**
 * Select appropriate program based on input
 */
export function selectTrainingProgram(input: TrainingPlanInput): string {
  const { experienceLevel, daysPerWeek, equipment } = input;

  // Adjust for home/minimal equipment
  let adjustedDays = daysPerWeek;
  if (equipment === 'minimal' && daysPerWeek > 4) {
    adjustedDays = 4; // Limit to 4 days for minimal equipment
  }

  // Select program key
  let programKey = `${experienceLevel}_${adjustedDays}day`;

  // Fallback logic
  if (!PROGRAM_TEMPLATES[programKey]) {
    if (experienceLevel === 'beginner') {
      programKey = adjustedDays >= 4 ? 'beginner_4day' : 'beginner_3day';
    } else if (experienceLevel === 'intermediate') {
      if (adjustedDays >= 6) programKey = 'intermediate_6day';
      else if (adjustedDays >= 5) programKey = 'intermediate_5day';
      else programKey = 'intermediate_4day';
    } else {
      programKey = adjustedDays >= 6 ? 'advanced_6day' : 'advanced_5day';
    }
  }

  return programKey;
}

/**
 * Generate complete training plan
 */
export function generateTrainingPlan(input: TrainingPlanInput): TrainingPlanResult {
  const { experienceLevel, daysPerWeek, equipment, goal, age, injuries = [] } = input;

  // Select program template
  const programKey = selectTrainingProgram(input);
  const template = PROGRAM_TEMPLATES[programKey];

  // Adjust volume based on age
  let volumeMultiplier = 1.0;
  if (age >= 50) {
    volumeMultiplier = 0.85; // Reduce volume for older adults
  } else if (age >= 40) {
    volumeMultiplier = 0.9;
  }

  // Adjust intensity based on experience and injuries
  let intensityMultiplier = 1.0;
  if (injuries.length > 0) {
    intensityMultiplier = 0.9; // Reduce intensity if injuries present
  }

  // Adjust volume for goal
  if (goal === 'strength') {
    volumeMultiplier *= 0.9; // Lower volume, higher intensity for strength
    intensityMultiplier *= 1.1;
  } else if (goal === 'hypertrophy') {
    volumeMultiplier *= 1.1; // Higher volume for hypertrophy
  } else if (goal === 'endurance') {
    volumeMultiplier *= 1.2; // Much higher volume for endurance
    intensityMultiplier *= 0.8; // Lower intensity
  }

  // Calculate deload frequency (every 4-6 weeks depending on intensity)
  const deloadFrequency = template.intensity === 'hard' ? 4 : 6;

  // Warnings
  const warnings: string[] = [];
  if (equipment === 'minimal' && daysPerWeek > 4) {
    warnings.push('Days per week reduced to 4 due to minimal equipment');
  }
  if (age >= 50 && template.volume > 18) {
    warnings.push('Volume reduced by 15% to accommodate recovery needs');
  }
  if (injuries.length > 0) {
    warnings.push('Intensity reduced by 10% due to reported injuries');
  }

  return {
    programId: template.programId,
    programName: template.programName,
    description: template.description,

    initialVolume: Math.round(template.volume * volumeMultiplier),
    initialIntensity: template.intensity,
    volumeMultiplier,
    intensityMultiplier,

    daysPerWeek: input.daysPerWeek,
    isDeloadWeek: false,
    deloadFrequency,

    progressionScheme: template.progressionScheme,

    isValid: true,
    warnings,
  };
}

/**
 * Adjust training volume based on progress
 */
export function adjustTrainingVolume(
  currentVolume: number,
  progressIndicator: 'stalling' | 'progressing' | 'regressing',
): number {
  switch (progressIndicator) {
    case 'regressing':
      // Reduce volume by 10% if regressing
      return Math.round(currentVolume * 0.9);

    case 'stalling':
      // Increase volume by 5% if stalling
      return Math.round(currentVolume * 1.05);

    case 'progressing':
    default:
      // Maintain current volume if progressing well
      return currentVolume;
  }
}

/**
 * Determine if deload week is needed
 */
export function shouldDeload(weeksSinceDeload: number, deloadFrequency: number): boolean {
  return weeksSinceDeload >= deloadFrequency;
}
