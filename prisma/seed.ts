/**
 * PrimeCell Database Seed Script
 *
 * Seeds the database with:
 * 1. CORE Supplement Products (KyoSlim, CreaPrime Creatine, Shape Protein)
 * 2. Meal Templates (breakfast, lunch, dinner options)
 * 3. Training Program Templates (beginner to advanced)
 *
 * CRITICAL: Supplements are STRUCTURAL COMPONENTS, not optional add-ons!
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ============================================================================
  // SUPPLEMENTS (CORE COMPONENTS) ⭐
  // ============================================================================

  console.log('📦 Seeding CORE Supplement Products...');

  const kyoSlim = await prisma.supplement.upsert({
    where: { productName: 'KyoSlim' },
    update: {},
    create: {
      productName: 'KyoSlim',
      category: 'fat_loss',
      description: 'Advanced metabolic support formula designed to support fat loss goals. KyoSlim is actively recommended for users focused on weight loss, fat loss, and metabolic health.',
      recommendedDosage: '2 capsules per day',
      timingGuidelines: 'Take 1 capsule in the morning with breakfast and 1 capsule in the afternoon',
      primaryGoals: JSON.stringify(['lose_fat', 'lose_weight', 'longevity']),
      supportGoals: JSON.stringify(['health_energy', 'performance']),
      benefits: JSON.stringify([
        'Supports healthy metabolism',
        'May help reduce appetite and cravings',
        'Promotes energy and fat utilization',
        'Supports cardiovascular health',
      ]),
      priority: 'critical',
      productUrl: 'https://example.com/kyoslim', // Replace with actual product URL
      isActive: true,
    },
  });

  const creaPrime = await prisma.supplement.upsert({
    where: { productName: 'CreaPrime Creatine' },
    update: {},
    create: {
      productName: 'CreaPrime Creatine',
      category: 'muscle_gain',
      description: 'Premium creatine monohydrate for muscle gain, strength, and performance. CreaPrime is the gold standard supplement for users focused on building muscle, increasing strength, and improving recovery.',
      recommendedDosage: '5g per day',
      timingGuidelines: 'Take 5g (1 scoop) post-workout or any time of day with water or your protein shake',
      primaryGoals: JSON.stringify(['gain_muscle', 'performance']),
      supportGoals: JSON.stringify(['health_energy', 'longevity']),
      benefits: JSON.stringify([
        'Increases muscle strength and power output',
        'Supports muscle growth and recovery',
        'Enhances high-intensity exercise performance',
        'Well-researched and safe for long-term use',
        'Improves cognitive function',
      ]),
      priority: 'critical',
      productUrl: 'https://example.com/creaprime', // Replace with actual product URL
      isActive: true,
    },
  });

  const shapeProtein = await prisma.supplement.upsert({
    where: { productName: 'Shape Protein' },
    update: {},
    create: {
      productName: 'Shape Protein',
      category: 'protein_support',
      description: 'High-quality protein powder for ALL users as a daily protein support tool. Shape Protein helps you hit your protein targets, maintain muscle mass, and support satiety throughout the day.',
      recommendedDosage: '1-2 servings per day (25-50g protein)',
      timingGuidelines: 'Use as needed to meet daily protein targets. Ideal post-workout, as a meal addition, or as a snack.',
      primaryGoals: JSON.stringify([
        'lose_fat',
        'lose_weight',
        'gain_muscle',
        'health_energy',
        'performance',
        'longevity',
      ]),
      supportGoals: JSON.stringify([]),
      benefits: JSON.stringify([
        'Helps meet daily protein requirements (1.6-2.2g/kg)',
        'Supports muscle maintenance and growth',
        'Promotes satiety and reduces hunger',
        'Convenient and versatile protein source',
        'Supports recovery and body composition',
      ]),
      priority: 'high',
      productUrl: 'https://example.com/shape-protein', // Replace with actual product URL
      isActive: true,
    },
  });

  console.log(`✅ Created KyoSlim (ID: ${kyoSlim.id})`);
  console.log(`✅ Created CreaPrime Creatine (ID: ${creaPrime.id})`);
  console.log(`✅ Created Shape Protein (ID: ${shapeProtein.id})\n`);

  // ============================================================================
  // MEAL TEMPLATES (Real Food Philosophy)
  // ============================================================================

  console.log('🍽️  Seeding Meal Templates...');

  const breakfastTemplates = [
    {
      templateId: 'breakfast_eggs_avocado_001',
      name: 'Scrambled Eggs with Avocado',
      category: 'breakfast',
      description: 'Protein-rich scrambled eggs with creamy avocado and whole grain toast',
      ingredients: JSON.stringify([
        { item: 'Eggs', quantity: '3 large' },
        { item: 'Avocado', quantity: '1/2 medium' },
        { item: 'Whole grain bread', quantity: '1-2 slices' },
        { item: 'Olive oil', quantity: '1 tsp' },
        { item: 'Salt and pepper', quantity: 'to taste' },
      ]),
      approxCalories: 450,
      approxProtein: 25,
      approxCarbs: 30,
      approxFat: 25,
      tags: JSON.stringify(['high_protein', 'quick', 'healthy_fats']),
      excludedFoods: JSON.stringify(['gluten']),
      prepTime: 10,
      difficulty: 'easy',
      isActive: true,
    },
    {
      templateId: 'breakfast_greek_yogurt_berries_002',
      name: 'Greek Yogurt with Berries & Nuts',
      category: 'breakfast',
      description: 'High-protein Greek yogurt topped with fresh berries, nuts, and a drizzle of honey',
      ingredients: JSON.stringify([
        { item: 'Greek yogurt (plain)', quantity: '200g' },
        { item: 'Mixed berries', quantity: '100g' },
        { item: 'Almonds or walnuts', quantity: '20g' },
        { item: 'Honey', quantity: '1 tsp (optional)' },
        { item: 'Chia seeds', quantity: '1 tbsp' },
      ]),
      approxCalories: 380,
      approxProtein: 28,
      approxCarbs: 35,
      approxFat: 15,
      tags: JSON.stringify(['high_protein', 'no_cooking', 'antioxidants']),
      excludedFoods: JSON.stringify(['dairy']),
      prepTime: 5,
      difficulty: 'easy',
      isActive: true,
    },
    {
      templateId: 'breakfast_oatmeal_protein_003',
      name: 'Protein Oatmeal Bowl',
      category: 'breakfast',
      description: 'Warm oatmeal cooked with protein powder, topped with banana and almond butter',
      ingredients: JSON.stringify([
        { item: 'Rolled oats', quantity: '60g' },
        { item: 'Shape Protein (vanilla)', quantity: '1 scoop' },
        { item: 'Banana', quantity: '1 medium' },
        { item: 'Almond butter', quantity: '1 tbsp' },
        { item: 'Cinnamon', quantity: '1/2 tsp' },
        { item: 'Water or milk', quantity: '250ml' },
      ]),
      approxCalories: 480,
      approxProtein: 32,
      approxCarbs: 55,
      approxFat: 14,
      tags: JSON.stringify(['high_protein', 'energizing', 'filling']),
      excludedFoods: JSON.stringify(['dairy', 'gluten']),
      prepTime: 10,
      difficulty: 'easy',
      isActive: true,
    },
  ];

  const lunchTemplates = [
    {
      templateId: 'lunch_chicken_rice_veggies_001',
      name: 'Grilled Chicken with Rice & Vegetables',
      category: 'lunch',
      description: 'Lean grilled chicken breast with brown rice and steamed vegetables',
      ingredients: JSON.stringify([
        { item: 'Chicken breast', quantity: '150g' },
        { item: 'Brown rice (cooked)', quantity: '150g' },
        { item: 'Broccoli', quantity: '100g' },
        { item: 'Carrots', quantity: '50g' },
        { item: 'Olive oil', quantity: '1 tbsp' },
        { item: 'Herbs and spices', quantity: 'to taste' },
      ]),
      approxCalories: 520,
      approxProtein: 42,
      approxCarbs: 50,
      approxFat: 14,
      tags: JSON.stringify(['high_protein', 'balanced', 'meal_prep_friendly']),
      excludedFoods: JSON.stringify([]),
      prepTime: 25,
      difficulty: 'easy',
      isActive: true,
    },
    {
      templateId: 'lunch_salmon_quinoa_salad_002',
      name: 'Salmon Quinoa Salad',
      category: 'lunch',
      description: 'Baked salmon over quinoa with mixed greens and lemon dressing',
      ingredients: JSON.stringify([
        { item: 'Salmon fillet', quantity: '150g' },
        { item: 'Quinoa (cooked)', quantity: '100g' },
        { item: 'Mixed salad greens', quantity: '100g' },
        { item: 'Cherry tomatoes', quantity: '50g' },
        { item: 'Cucumber', quantity: '50g' },
        { item: 'Olive oil', quantity: '1 tbsp' },
        { item: 'Lemon juice', quantity: '2 tbsp' },
      ]),
      approxCalories: 540,
      approxProtein: 38,
      approxCarbs: 40,
      approxFat: 24,
      tags: JSON.stringify(['high_protein', 'omega_3', 'nutrient_dense']),
      excludedFoods: JSON.stringify(['fish']),
      prepTime: 30,
      difficulty: 'moderate',
      isActive: true,
    },
  ];

  const dinnerTemplates = [
    {
      templateId: 'dinner_lean_beef_sweet_potato_001',
      name: 'Lean Beef with Sweet Potato',
      category: 'dinner',
      description: 'Lean beef steak with roasted sweet potato and green beans',
      ingredients: JSON.stringify([
        { item: 'Lean beef steak', quantity: '150g' },
        { item: 'Sweet potato', quantity: '200g' },
        { item: 'Green beans', quantity: '150g' },
        { item: 'Olive oil', quantity: '1 tbsp' },
        { item: 'Garlic', quantity: '2 cloves' },
      ]),
      approxCalories: 560,
      approxProtein: 45,
      approxCarbs: 48,
      approxFat: 18,
      tags: JSON.stringify(['high_protein', 'iron_rich', 'satisfying']),
      excludedFoods: JSON.stringify(['red_meat']),
      prepTime: 35,
      difficulty: 'moderate',
      isActive: true,
    },
    {
      templateId: 'dinner_turkey_veggie_stir_fry_002',
      name: 'Turkey & Veggie Stir-Fry',
      category: 'dinner',
      description: 'Lean ground turkey stir-fried with colorful vegetables and rice noodles',
      ingredients: JSON.stringify([
        { item: 'Lean ground turkey', quantity: '150g' },
        { item: 'Rice noodles', quantity: '80g dry' },
        { item: 'Bell peppers', quantity: '100g' },
        { item: 'Snap peas', quantity: '80g' },
        { item: 'Onion', quantity: '50g' },
        { item: 'Soy sauce (low sodium)', quantity: '2 tbsp' },
        { item: 'Sesame oil', quantity: '1 tsp' },
      ]),
      approxCalories: 490,
      approxProtein: 40,
      approxCarbs: 52,
      approxFat: 12,
      tags: JSON.stringify(['high_protein', 'quick', 'colorful']),
      excludedFoods: JSON.stringify(['gluten']),
      prepTime: 20,
      difficulty: 'easy',
      isActive: true,
    },
  ];

  for (const template of [...breakfastTemplates, ...lunchTemplates, ...dinnerTemplates]) {
    await prisma.mealTemplate.upsert({
      where: { templateId: template.templateId },
      update: {},
      create: template,
    });
  }

  console.log(`✅ Created ${breakfastTemplates.length} breakfast templates`);
  console.log(`✅ Created ${lunchTemplates.length} lunch templates`);
  console.log(`✅ Created ${dinnerTemplates.length} dinner templates\n`);

  // ============================================================================
  // TRAINING PROGRAM TEMPLATES
  // ============================================================================

  console.log('🏋️  Seeding Training Program Templates...');

  const trainingPrograms = [
    {
      programId: 'beginner_upper_lower',
      name: 'Beginner Upper/Lower Split',
      level: 'beginner',
      description: 'A simple 4-day upper/lower split perfect for beginners. Focuses on compound movements and building a solid foundation.',
      daysPerWeek: 4,
      programLength: 8,
      workouts: JSON.stringify([
        {
          day: 'Upper A',
          exercises: [
            { name: 'Bench Press', sets: 3, reps: '8-10', rest: '90s' },
            { name: 'Barbell Row', sets: 3, reps: '8-10', rest: '90s' },
            { name: 'Overhead Press', sets: 3, reps: '8-10', rest: '90s' },
            { name: 'Pull-ups or Lat Pulldown', sets: 3, reps: '8-10', rest: '90s' },
            { name: 'Bicep Curls', sets: 2, reps: '10-12', rest: '60s' },
            { name: 'Tricep Extensions', sets: 2, reps: '10-12', rest: '60s' },
          ],
        },
        {
          day: 'Lower A',
          exercises: [
            { name: 'Squat', sets: 3, reps: '8-10', rest: '120s' },
            { name: 'Romanian Deadlift', sets: 3, reps: '8-10', rest: '90s' },
            { name: 'Leg Press', sets: 3, reps: '10-12', rest: '90s' },
            { name: 'Leg Curl', sets: 3, reps: '10-12', rest: '60s' },
            { name: 'Calf Raises', sets: 3, reps: '12-15', rest: '60s' },
          ],
        },
        {
          day: 'Upper B',
          exercises: [
            { name: 'Incline Dumbbell Press', sets: 3, reps: '8-10', rest: '90s' },
            { name: 'Cable Row', sets: 3, reps: '8-10', rest: '90s' },
            { name: 'Lateral Raises', sets: 3, reps: '12-15', rest: '60s' },
            { name: 'Face Pulls', sets: 3, reps: '12-15', rest: '60s' },
            { name: 'Hammer Curls', sets: 2, reps: '10-12', rest: '60s' },
            { name: 'Overhead Tricep Extension', sets: 2, reps: '10-12', rest: '60s' },
          ],
        },
        {
          day: 'Lower B',
          exercises: [
            { name: 'Deadlift', sets: 3, reps: '6-8', rest: '120s' },
            { name: 'Bulgarian Split Squat', sets: 3, reps: '10-12', rest: '90s' },
            { name: 'Leg Extension', sets: 3, reps: '10-12', rest: '60s' },
            { name: 'Hamstring Curl', sets: 3, reps: '10-12', rest: '60s' },
            { name: 'Standing Calf Raises', sets: 3, reps: '12-15', rest: '60s' },
          ],
        },
      ]),
      deloadSchedule: JSON.stringify({
        frequency: 'every_4_weeks',
        volumeReduction: 40,
        intensityReduction: 10,
      }),
      progressionRules: JSON.stringify({
        overloadType: 'linear',
        weightIncrease: '2.5-5kg when hit top of rep range',
      }),
      trainingTypes: JSON.stringify(['weight_training']),
      equipment: JSON.stringify(['barbell', 'dumbbells', 'cables', 'machines']),
      isActive: true,
    },
    {
      programId: 'intermediate_ppl',
      name: 'Intermediate Push/Pull/Legs',
      level: 'intermediate',
      description: '6-day Push/Pull/Legs split for intermediate lifters looking to increase training volume and frequency.',
      daysPerWeek: 6,
      programLength: 12,
      workouts: JSON.stringify([
        {
          day: 'Push A',
          exercises: [
            { name: 'Bench Press', sets: 4, reps: '6-8', rest: '120s' },
            { name: 'Overhead Press', sets: 3, reps: '8-10', rest: '90s' },
            { name: 'Incline Dumbbell Press', sets: 3, reps: '8-10', rest: '90s' },
            { name: 'Lateral Raises', sets: 3, reps: '12-15', rest: '60s' },
            { name: 'Tricep Pushdowns', sets: 3, reps: '10-12', rest: '60s' },
            { name: 'Overhead Tricep Extension', sets: 3, reps: '10-12', rest: '60s' },
          ],
        },
        // Additional days omitted for brevity
      ]),
      deloadSchedule: JSON.stringify({
        frequency: 'every_6_weeks',
        volumeReduction: 50,
        intensityReduction: 15,
      }),
      progressionRules: JSON.stringify({
        overloadType: 'undulating',
        periodization: 'daily_undulating',
      }),
      trainingTypes: JSON.stringify(['weight_training']),
      equipment: JSON.stringify(['barbell', 'dumbbells', 'cables', 'machines']),
      isActive: true,
    },
  ];

  for (const program of trainingPrograms) {
    await prisma.trainingProgramTemplate.upsert({
      where: { programId: program.programId },
      update: {},
      create: program,
    });
  }

  console.log(`✅ Created ${trainingPrograms.length} training program templates\n`);

  console.log('✨ Database seed completed successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
