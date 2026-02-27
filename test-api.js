/**
 * Phase 2 API Testing Script
 * Tests all implemented endpoints
 */

const BASE_URL = 'http://localhost:3010/api';

// Test state
let authToken = null;
let testUserId = null;
const testResults = [];

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
  if (!result.success) {
    console.log(`   Error:`, JSON.stringify(result.data, null, 2));
  }
  testResults.push({ name, success: result.success, status: result.status, details });
}

// Test 1: Health Check
async function testHealthCheck() {
  console.log('\n=== TEST 1: Health Check ===');
  const result = await request('GET', '/health');
  logTest('Health Check', result, result.data?.status);
}

// Test 2: Register User
async function testRegister() {
  console.log('\n=== TEST 2: User Registration ===');
  const testEmail = `test${Date.now()}@primecell.com`;
  const result = await request('POST', '/auth/register', {
    email: testEmail,
    password: 'TestPassword123!',
    name: 'Test User',
  });

  if (result.success && result.data) {
    testUserId = result.data.user?.id || result.data.id;
  }

  logTest('Register User', result, `Email: ${testEmail}`);
  return testEmail;
}

// Test 3: Login User
async function testLogin(email) {
  console.log('\n=== TEST 3: User Login ===');
  const result = await request('POST', '/auth/login', {
    email: email,
    password: 'TestPassword123!',
  });

  if (result.success && result.data) {
    authToken = result.data.access_token || result.data.token;
  }

  logTest('Login User', result, authToken ? 'Token received' : 'No token');
}

// Test 4: Get Current User
async function testGetCurrentUser() {
  console.log('\n=== TEST 4: Get Current User (Protected) ===');
  const result = await request('GET', '/auth/me', null, true);
  logTest('Get Current User', result, result.data?.email || '');
}

// Test 5: Get All Supplements (Catalog)
async function testGetSupplements() {
  console.log('\n=== TEST 5: Get Supplements Catalog ===');
  const result = await request('GET', '/supplements', null, true);
  const count = Array.isArray(result.data) ? result.data.length : 0;
  logTest('Get Supplements Catalog', result, `${count} supplements found`);

  if (result.success && Array.isArray(result.data)) {
    console.log('\n   📦 Available Supplements:');
    result.data.forEach(s => {
      console.log(`      - ${s.productName} (${s.category}) - Priority: ${s.priority}`);
    });
  }
}

// Test 6: Get Specific Supplement
async function testGetSupplementById() {
  console.log('\n=== TEST 6: Get Supplement by Product Name ===');
  // First get all supplements to get an ID
  const allSupps = await request('GET', '/supplements', null, true);

  if (allSupps.success && allSupps.data && allSupps.data.length > 0) {
    const firstSuppId = allSupps.data[0].id;
    const result = await request('GET', `/supplements/${firstSuppId}`, null, true);
    logTest('Get Supplement by ID', result, result.data?.productName || '');
  } else {
    logTest('Get Supplement by ID', { success: false, status: 0 }, 'No supplements available');
  }
}

// Test 7: Get Current Nutrition Plan
async function testGetNutritionPlan() {
  console.log('\n=== TEST 7: Get Current Nutrition Plan ===');
  const result = await request('GET', '/plans/nutrition', null, true);
  logTest('Get Nutrition Plan', result,
    result.success ? `Version ${result.data?.version}, ${result.data?.caloriesTarget} cals` : 'No plan found'
  );
}

// Test 8: Get Current Training Program
async function testGetTrainingProgram() {
  console.log('\n=== TEST 8: Get Current Training Program ===');
  const result = await request('GET', '/plans/training', null, true);
  logTest('Get Training Program', result,
    result.success ? `Version ${result.data?.version}, ${result.data?.programId}` : 'No program found'
  );
}

// Test 9: Get User Supplement Recommendations
async function testGetRecommendations() {
  console.log('\n=== TEST 9: Get My Supplement Recommendations ===');
  const result = await request('GET', '/supplements/recommendations/me', null, true);
  const count = Array.isArray(result.data) ? result.data.length : 0;
  logTest('Get Recommendations', result, `${count} recommendations`);

  if (result.success && Array.isArray(result.data)) {
    console.log('\n   💊 Your Recommendations:');
    result.data.forEach(r => {
      console.log(`      - ${r.supplement?.productName} (${r.priority}): ${r.reason}`);
    });
  }
}

// Test 10: Get User Supplement Protocol
async function testGetProtocol() {
  console.log('\n=== TEST 10: Get My Supplement Protocol ===');
  const result = await request('GET', '/supplements/protocol/me', null, true);
  logTest('Get Supplement Protocol', result, result.data?.summary || '');

  if (result.success && result.data) {
    console.log('\n   📋 Your Protocol:');
    console.log(`      Summary: ${result.data.summary}`);
    console.log(`      Primary: ${result.data.primary?.length || 0} supplements`);
    console.log(`      Support: ${result.data.support?.length || 0} supplements`);
  }
}

// Test 11: Get Plan History
async function testGetPlanHistory() {
  console.log('\n=== TEST 11: Get Plan History ===');
  const result = await request('GET', '/plans/history', null, true);
  const nutritionCount = result.data?.nutritionPlans?.length || 0;
  const trainingCount = result.data?.trainingPrograms?.length || 0;
  logTest('Get Plan History', result, `${nutritionCount} nutrition plans, ${trainingCount} training programs`);
}

// Test 12: Get Check-in History
async function testGetCheckinHistory() {
  console.log('\n=== TEST 12: Get Check-in History ===');
  const result = await request('GET', '/checkins/history', null, true);
  const count = Array.isArray(result.data) ? result.data.length : 0;
  logTest('Get Check-in History', result, `${count} check-ins`);
}

// Main test runner
async function runAllTests() {
  console.log('\n🧪 ========================================');
  console.log('   PHASE 2 API TESTING');
  console.log('   PrimeCell - Supplement Integration');
  console.log('========================================\n');

  let testEmail;

  try {
    // Public endpoints
    await testHealthCheck();

    // Authentication
    testEmail = await testRegister();
    await testLogin(testEmail);

    // Protected endpoints (require auth)
    await testGetCurrentUser();

    // Supplements (CORE feature)
    await testGetSupplements();
    await testGetSupplementById();
    await testGetRecommendations();
    await testGetProtocol();

    // Plans
    await testGetNutritionPlan();
    await testGetTrainingProgram();
    await testGetPlanHistory();

    // Check-ins
    await testGetCheckinHistory();

  } catch (error) {
    console.error('\n❌ Test execution error:', error);
  }

  // Summary
  console.log('\n\n📊 ========================================');
  console.log('   TEST SUMMARY');
  console.log('========================================\n');

  const passed = testResults.filter(t => t.success).length;
  const failed = testResults.filter(t => !t.success).length;
  const total = testResults.length;

  console.log(`   Total Tests: ${total}`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n   Failed Tests:');
    testResults.filter(t => !t.success).forEach(t => {
      console.log(`      - ${t.name} (${t.status})`);
    });
  }

  console.log('\n========================================\n');
}

// Run tests
runAllTests().catch(console.error);
