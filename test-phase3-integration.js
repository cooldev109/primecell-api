/**
 * Phase 3 Integration Testing Script
 *
 * Tests the complete user flow including:
 * - User registration and authentication
 * - Onboarding submission (triggers Engine)
 * - Engine creates nutrition plans, training programs, and supplement recommendations
 * - Goal-to-supplement mapping verification
 * - Complete supplement protocol retrieval
 *
 * This tests the CORE integration between all modules.
 */

const BASE_URL = 'http://localhost:3010/api';

// Test state
let authToken = null;
let userId = null;
const testResults = [];

// Test scenarios with different goals
const testScenarios = [
  {
    name: 'Fat Loss User',
    goal: 'lose_fat',
    expectedPrimarySupplement: 'KyoSlim',
    onboardingData: {
      age: 30,
      sex: 'male',
      height: 180,
      weight: 90,
      primaryGoal: 'lose_fat',
      goalSpecific: {
        targetWeight: 80,
        targetDate: '2026-06-01',
      },
      lifestyle: {
        activityLevel: 'moderate',
        occupation: 'office_work',
      },
      training: {
        experience: 'intermediate',
        daysPerWeek: 4,
        preferredSplit: 'upper_lower',
      },
      foodPreferences: {
        mealsPerDay: 4,
        dietaryRestrictions: [],
      },
      healthInfo: {
        conditions: [],
        medications: [],
      },
    }
  },
  {
    name: 'Muscle Gain User',
    goal: 'gain_muscle',
    expectedPrimarySupplement: 'CreaPrime Creatine',
    onboardingData: {
      age: 25,
      sex: 'male',
      height: 175,
      weight: 70,
      primaryGoal: 'gain_muscle',
      goalSpecific: {
        targetWeight: 78,
        targetDate: '2026-08-01',
      },
      lifestyle: {
        activityLevel: 'very_active',
        occupation: 'active_work',
      },
      training: {
        experience: 'advanced',
        daysPerWeek: 5,
        preferredSplit: 'push_pull_legs',
      },
      foodPreferences: {
        mealsPerDay: 5,
        dietaryRestrictions: [],
      },
      healthInfo: {
        conditions: [],
        medications: [],
      },
    }
  }
];

// Helper function to make requests
async function request(method, endpoint, data = null, useAuth = false) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (useAuth && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const options = {
    method,
    headers,
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const contentType = response.headers.get('content-type');
    let responseData;

    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    return {
      status: response.status,
      statusText: response.statusText,
      data: responseData,
      success: response.ok,
    };
  } catch (error) {
    return {
      status: 0,
      statusText: error.message,
      data: null,
      success: false,
      error: error.message,
    };
  }
}

// Helper to log test results
function logTest(name, result, details = '') {
  const status = result.success ? '✅ PASS' : '❌ FAIL';
  console.log(`\n${status} ${name}`);
  console.log(`   Status: ${result.status} ${result.statusText}`);
  if (details) console.log(`   Details: ${details}`);
  if (!result.success && result.data) {
    console.log(`   Error:`, typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2));
  }
  testResults.push({ name, success: result.success, status: result.status, details });
  return result.success;
}

// Register a new user
async function registerUser(email, password, name) {
  console.log('\n=== REGISTRATION ===');
  const result = await request('POST', '/auth/register', {
    email,
    password,
    name,
  });

  if (logTest('User Registration', result, `Email: ${email}`)) {
    if (result.data && result.data.token) {
      authToken = result.data.token;
      userId = result.data.user?.id || result.data.id;
    }
  }

  return result.success;
}

// Login user
async function loginUser(email, password) {
  console.log('\n=== LOGIN ===');
  const result = await request('POST', '/auth/login', {
    email,
    password,
  });

  if (logTest('User Login', result, 'Token received')) {
    if (result.data && result.data.token) {
      authToken = result.data.token;
    }
  }

  return result.success;
}

// Submit onboarding (triggers Engine)
async function submitOnboarding(onboardingData) {
  console.log('\n=== ONBOARDING SUBMISSION (Triggers Engine) ===');
  const result = await request('POST', '/onboarding/submit', onboardingData, true);

  const details = result.success
    ? `Goal: ${onboardingData.primaryGoal}, Engine processing initiated`
    : 'Failed to submit onboarding';

  logTest('Onboarding Submission', result, details);

  if (result.success && result.data) {
    console.log('\n   📊 Engine Output:');
    console.log(`      - Nutrition Plan: Version ${result.data.nutritionPlan?.version || 'N/A'}`);
    console.log(`      - Training Program: Version ${result.data.trainingProgram?.version || 'N/A'}`);
    console.log(`      - Supplement Recommendations: ${result.data.supplementRecommendations?.length || 0} total`);
  }

  return result.success ? result.data : null;
}

// Get current nutrition plan
async function getCurrentNutritionPlan() {
  console.log('\n=== GET CURRENT NUTRITION PLAN ===');
  const result = await request('GET', '/plans/current/nutrition', null, true);

  if (result.success && result.data) {
    const details = `Mode: ${result.data.mode}, Target: ${result.data.caloriesTarget} cals, ${result.data.mealsPerDay} meals/day`;
    logTest('Get Current Nutrition Plan', result, details);

    console.log('\n   🍽️ Nutrition Plan Details:');
    console.log(`      - Calories: ${result.data.caloriesMin}-${result.data.caloriesMax} (target: ${result.data.caloriesTarget})`);
    console.log(`      - Protein: ${result.data.proteinGrams}g`);
    console.log(`      - Carbs: ${result.data.carbsGrams}g`);
    console.log(`      - Fat: ${result.data.fatGrams}g`);
    console.log(`      - Meals per day: ${result.data.mealsPerDay}`);
  } else {
    logTest('Get Current Nutrition Plan', result, 'No plan found');
  }

  return result.success ? result.data : null;
}

// Get current training program
async function getCurrentTrainingProgram() {
  console.log('\n=== GET CURRENT TRAINING PROGRAM ===');
  const result = await request('GET', '/plans/current/training', null, true);

  if (result.success && result.data) {
    const details = `Program: ${result.data.programId}, Week: ${result.data.weekNumber}, Intensity: ${result.data.intensityLevel}`;
    logTest('Get Current Training Program', result, details);

    console.log('\n   🏋️ Training Program Details:');
    console.log(`      - Program ID: ${result.data.programId}`);
    console.log(`      - Week: ${result.data.weekNumber}`);
    console.log(`      - Intensity: ${result.data.intensityLevel}`);
    console.log(`      - Deload: ${result.data.isDeloadWeek ? 'Yes' : 'No'}`);
  } else {
    logTest('Get Current Training Program', result, 'No program found');
  }

  return result.success ? result.data : null;
}

// Get supplement recommendations
async function getSupplementRecommendations() {
  console.log('\n=== GET SUPPLEMENT RECOMMENDATIONS ===');
  const result = await request('GET', '/supplements/recommendations/me', null, true);

  if (result.success && result.data) {
    const count = Array.isArray(result.data) ? result.data.length : 0;
    logTest('Get Supplement Recommendations', result, `${count} recommendations`);

    if (count > 0) {
      console.log('\n   💊 Supplement Recommendations:');
      result.data.forEach((rec, index) => {
        console.log(`      ${index + 1}. ${rec.supplement?.productName || 'Unknown'}`);
        console.log(`         - Priority: ${rec.priority}`);
        console.log(`         - Reason: ${rec.reason}`);
      });
    }
  } else {
    logTest('Get Supplement Recommendations', result, 'No recommendations found');
  }

  return result.success ? result.data : [];
}

// Get complete supplement protocol
async function getSupplementProtocol() {
  console.log('\n=== GET COMPLETE SUPPLEMENT PROTOCOL ===');
  const result = await request('GET', '/supplements/protocol/me', null, true);

  if (result.success && result.data) {
    logTest('Get Supplement Protocol', result, result.data.summary || 'Protocol retrieved');

    console.log('\n   📋 Complete Supplement Protocol:');
    console.log(`      Summary: ${result.data.summary}`);
    console.log(`      Primary Supplements: ${result.data.primary?.length || 0}`);
    console.log(`      Support Supplements: ${result.data.support?.length || 0}`);
    console.log(`      Optional Supplements: ${result.data.optional?.length || 0}`);

    if (result.data.primary && result.data.primary.length > 0) {
      console.log('\n   🎯 Primary (Goal-Specific):');
      result.data.primary.forEach(s => {
        console.log(`      - ${s.supplement?.productName || 'Unknown'} (${s.priority})`);
      });
    }

    if (result.data.support && result.data.support.length > 0) {
      console.log('\n   🛡️ Support (All Users):');
      result.data.support.forEach(s => {
        console.log(`      - ${s.supplement?.productName || 'Unknown'} (${s.priority})`);
      });
    }
  } else {
    logTest('Get Supplement Protocol', result, 'No protocol found');
  }

  return result.success ? result.data : null;
}

// Verify goal-to-supplement mapping
function verifySupplementMapping(recommendations, expectedPrimarySupplement, userGoal) {
  console.log('\n=== VERIFY GOAL-TO-SUPPLEMENT MAPPING ===');

  const primaryRec = recommendations.find(r => r.priority === 'primary');
  const hasPrimarySupplement = primaryRec && primaryRec.supplement?.productName === expectedPrimarySupplement;
  const hasShapeProtein = recommendations.some(r => r.supplement?.productName === 'Shape Protein');

  const result = {
    success: hasPrimarySupplement && hasShapeProtein,
    status: hasPrimarySupplement && hasShapeProtein ? 200 : 500,
    statusText: hasPrimarySupplement && hasShapeProtein ? 'OK' : 'Mapping Error',
  };

  const details = hasPrimarySupplement && hasShapeProtein
    ? `Correct: ${expectedPrimarySupplement} for ${userGoal} + Shape Protein for all users`
    : `Incorrect mapping for goal: ${userGoal}`;

  logTest('Goal-to-Supplement Mapping', result, details);

  if (!hasPrimarySupplement) {
    console.log(`   ❌ Expected primary supplement: ${expectedPrimarySupplement}`);
    console.log(`   ❌ Got: ${primaryRec?.supplement?.productName || 'None'}`);
  }

  if (!hasShapeProtein) {
    console.log(`   ❌ Missing Shape Protein (required for all users)`);
  }

  if (hasPrimarySupplement && hasShapeProtein) {
    console.log(`   ✅ Correct goal-to-supplement mapping verified`);
    console.log(`   ✅ ${expectedPrimarySupplement} assigned for goal: ${userGoal}`);
    console.log(`   ✅ Shape Protein assigned (all users)`);
  }

  return result.success;
}

// Run complete flow for a test scenario
async function runTestScenario(scenario) {
  console.log('\n\n' + '='.repeat(80));
  console.log(`🧪 TEST SCENARIO: ${scenario.name}`);
  console.log(`   Goal: ${scenario.goal}`);
  console.log(`   Expected Primary Supplement: ${scenario.expectedPrimarySupplement}`);
  console.log('='.repeat(80));

  const testEmail = `test${scenario.goal}${Date.now()}@primecell.com`;
  const testPassword = 'TestPassword123!';

  // Step 1: Register
  if (!(await registerUser(testEmail, testPassword, `Test ${scenario.name}`))) {
    console.log('\n❌ Registration failed, aborting scenario');
    return false;
  }

  // Step 2: Submit onboarding (triggers Engine)
  const onboardingResult = await submitOnboarding(scenario.onboardingData);
  if (!onboardingResult) {
    console.log('\n❌ Onboarding failed, aborting scenario');
    return false;
  }

  // Wait a moment for Engine to process (if async)
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Step 3: Verify nutrition plan created
  const nutritionPlan = await getCurrentNutritionPlan();
  if (!nutritionPlan) {
    console.log('\n❌ Nutrition plan not created by Engine');
    return false;
  }

  // Step 4: Verify training program created
  const trainingProgram = await getCurrentTrainingProgram();
  if (!trainingProgram) {
    console.log('\n❌ Training program not created by Engine');
    return false;
  }

  // Step 5: Get supplement recommendations
  const recommendations = await getSupplementRecommendations();
  if (!recommendations || recommendations.length === 0) {
    console.log('\n❌ Supplement recommendations not created by Engine');
    return false;
  }

  // Step 6: Get complete protocol
  const protocol = await getSupplementProtocol();
  if (!protocol) {
    console.log('\n❌ Supplement protocol not available');
    return false;
  }

  // Step 7: Verify goal-to-supplement mapping
  const mappingCorrect = verifySupplementMapping(
    recommendations,
    scenario.expectedPrimarySupplement,
    scenario.goal
  );

  if (!mappingCorrect) {
    console.log('\n❌ Goal-to-supplement mapping verification failed');
    return false;
  }

  console.log('\n✅ Complete user flow successful for ' + scenario.name);
  return true;
}

// Main test runner
async function runAllTests() {
  console.log('\n🧪 ========================================');
  console.log('   PHASE 3 INTEGRATION TESTING');
  console.log('   Complete User Flow + Engine + Supplements');
  console.log('========================================\n');

  const scenarioResults = [];

  for (const scenario of testScenarios) {
    const success = await runTestScenario(scenario);
    scenarioResults.push({ scenario: scenario.name, success });

    // Reset auth token for next scenario
    authToken = null;
    userId = null;
  }

  // Final Summary
  console.log('\n\n📊 ========================================');
  console.log('   PHASE 3 TEST SUMMARY');
  console.log('========================================\n');

  const totalTests = testResults.length;
  const passed = testResults.filter(t => t.success).length;
  const failed = totalTests - passed;
  const successRate = ((passed / totalTests) * 100).toFixed(1);

  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   Success Rate: ${successRate}%`);

  console.log('\n   Scenario Results:');
  scenarioResults.forEach(sr => {
    const status = sr.success ? '✅' : '❌';
    console.log(`   ${status} ${sr.scenario}`);
  });

  if (failed > 0) {
    console.log('\n   Failed Tests:');
    testResults.filter(t => !t.success).forEach(t => {
      console.log(`      - ${t.name} (${t.status})`);
    });
  }

  console.log('\n========================================\n');

  // Determine overall phase status
  const allScenariosPass = scenarioResults.every(sr => sr.success);
  const criticalTestsPass = passed / totalTests >= 0.8;

  if (allScenariosPass && criticalTestsPass) {
    console.log('✅ PHASE 3 INTEGRATION TESTING: COMPLETE');
    console.log('   All user flows working correctly');
    console.log('   Goal-to-supplement mapping verified');
    console.log('   Engine integration successful');
  } else {
    console.log('❌ PHASE 3 INTEGRATION TESTING: INCOMPLETE');
    console.log('   Some user flows or mappings failed');
    console.log('   Review failed tests above');
  }
}

// Run tests
runAllTests().catch(console.error);
