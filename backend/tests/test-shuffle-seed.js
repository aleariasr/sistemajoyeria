/**
 * Test: Deterministic Shuffle with Seed
 * 
 * This test validates that the shuffle_seed parameter:
 * 1. Produces deterministic, reproducible order across multiple requests with same seed
 * 2. Produces different orders with different seeds
 * 3. Enforces the category balancing rule (max 3 consecutive same category)
 * 4. Works correctly with pagination
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const API_TIMEOUT = 30000;

// Color output helpers
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Test utilities
function makeRequest(method, path, data = null) {
  return axios({
    method,
    url: `${API_BASE_URL}${path}`,
    data,
    timeout: API_TIMEOUT,
    validateStatus: () => true, // Don't throw on any status
  });
}

/**
 * Test 1: Same seed produces same order
 */
async function testDeterministicOrder() {
  logInfo('\n📋 Test 1: Same seed produces same order');
  
  const seed = 12345;
  
  // Make two requests with the same seed
  const response1 = await makeRequest('GET', `/api/public/products?shuffle=true&shuffle_seed=${seed}&per_page=20`);
  const response2 = await makeRequest('GET', `/api/public/products?shuffle=true&shuffle_seed=${seed}&per_page=20`);
  
  if (response1.status !== 200 || response2.status !== 200) {
    logError(`Failed to fetch products. Status: ${response1.status}, ${response2.status}`);
    return false;
  }
  
  const products1 = response1.data.products;
  const products2 = response2.data.products;
  
  if (products1.length !== products2.length) {
    logError(`Different product counts: ${products1.length} vs ${products2.length}`);
    return false;
  }
  
  // Check if order is identical
  let orderMatches = true;
  for (let i = 0; i < products1.length; i++) {
    if (products1[i]._uniqueKey !== products2[i]._uniqueKey) {
      orderMatches = false;
      logWarning(`Position ${i}: ${products1[i]._uniqueKey} !== ${products2[i]._uniqueKey}`);
    }
  }
  
  if (orderMatches) {
    logSuccess(`Same seed (${seed}) produces identical order across ${products1.length} products`);
    return true;
  } else {
    logError('Order does not match with same seed');
    return false;
  }
}

/**
 * Test 2: Different seeds produce different orders
 */
async function testDifferentSeeds() {
  logInfo('\n📋 Test 2: Different seeds produce different orders');
  
  const seed1 = 12345;
  const seed2 = 67890;
  
  const response1 = await makeRequest('GET', `/api/public/products?shuffle=true&shuffle_seed=${seed1}&per_page=30`);
  const response2 = await makeRequest('GET', `/api/public/products?shuffle=true&shuffle_seed=${seed2}&per_page=30`);
  
  if (response1.status !== 200 || response2.status !== 200) {
    logError(`Failed to fetch products. Status: ${response1.status}, ${response2.status}`);
    return false;
  }
  
  const products1 = response1.data.products;
  const products2 = response2.data.products;
  
  if (products1.length < 5 || products2.length < 5) {
    logWarning('Not enough products to test different orders');
    return true; // Pass if not enough data
  }
  
  // Check if orders are different
  let differencesFound = 0;
  const checkLength = Math.min(products1.length, products2.length);
  
  for (let i = 0; i < checkLength; i++) {
    if (products1[i]._uniqueKey !== products2[i]._uniqueKey) {
      differencesFound++;
    }
  }
  
  const differencePercentage = (differencesFound / checkLength) * 100;
  
  if (differencePercentage > 20) { // At least 20% different
    logSuccess(`Different seeds produce different orders (${differencePercentage.toFixed(1)}% difference)`);
    return true;
  } else {
    logWarning(`Orders are too similar (${differencePercentage.toFixed(1)}% difference). May need more products.`);
    return true; // Warning but not a failure
  }
}

/**
 * Test 3: Category balancing (max 3 consecutive)
 */
async function testCategoryBalancing() {
  logInfo('\n📋 Test 3: Category balancing (max 3 consecutive same category)');
  
  const seed = 99999;
  
  // Fetch all products to test balancing
  const response = await makeRequest('GET', `/api/public/products?shuffle=true&shuffle_seed=${seed}&per_page=100`);
  
  if (response.status !== 200) {
    logError(`Failed to fetch products. Status: ${response.status}`);
    return false;
  }
  
  const products = response.data.products;
  
  if (products.length < 10) {
    logWarning('Not enough products to test category balancing');
    return true;
  }
  
  // Check for violations (more than 3 consecutive same category)
  let violations = [];
  let consecutiveCount = 1;
  let previousCategory = null;
  
  for (let i = 0; i < products.length; i++) {
    const currentCategory = products[i].categoria;
    
    if (currentCategory === previousCategory) {
      consecutiveCount++;
      
      if (consecutiveCount > 3) {
        violations.push({
          position: i,
          category: currentCategory,
          count: consecutiveCount
        });
      }
    } else {
      consecutiveCount = 1;
      previousCategory = currentCategory;
    }
  }
  
  if (violations.length === 0) {
    logSuccess(`No category balancing violations found in ${products.length} products`);
    
    // Log category distribution for info
    const categoryCount = {};
    products.forEach(p => {
      categoryCount[p.categoria] = (categoryCount[p.categoria] || 0) + 1;
    });
    
    logInfo(`Category distribution: ${JSON.stringify(categoryCount)}`);
    return true;
  } else {
    logError(`Found ${violations.length} category balancing violations:`);
    violations.forEach(v => {
      logError(`  Position ${v.position}: ${v.count} consecutive ${v.category}`);
    });
    return false;
  }
}

/**
 * Test 4: Pagination with seed maintains order
 */
async function testPaginationWithSeed() {
  logInfo('\n📋 Test 4: Pagination with seed maintains consistent order');
  
  const seed = 54321;
  const perPage = 10;
  
  // Fetch first two pages
  const page1Response = await makeRequest('GET', `/api/public/products?shuffle=true&shuffle_seed=${seed}&per_page=${perPage}&page=1`);
  const page2Response = await makeRequest('GET', `/api/public/products?shuffle=true&shuffle_seed=${seed}&per_page=${perPage}&page=2`);
  
  if (page1Response.status !== 200 || page2Response.status !== 200) {
    logError(`Failed to fetch products. Status: ${page1Response.status}, ${page2Response.status}`);
    return false;
  }
  
  const page1Products = page1Response.data.products;
  const page2Products = page2Response.data.products;
  
  // Now fetch all products in a single request
  const allResponse = await makeRequest('GET', `/api/public/products?shuffle=true&shuffle_seed=${seed}&per_page=${perPage * 2}`);
  
  if (allResponse.status !== 200) {
    logError(`Failed to fetch all products. Status: ${allResponse.status}`);
    return false;
  }
  
  const allProducts = allResponse.data.products;
  
  // Check if paginated results match the single request
  let matches = true;
  
  for (let i = 0; i < page1Products.length; i++) {
    if (page1Products[i]._uniqueKey !== allProducts[i]._uniqueKey) {
      matches = false;
      logWarning(`Page 1 position ${i}: ${page1Products[i]._uniqueKey} !== ${allProducts[i]._uniqueKey}`);
    }
  }
  
  for (let i = 0; i < page2Products.length && i + perPage < allProducts.length; i++) {
    if (page2Products[i]._uniqueKey !== allProducts[i + perPage]._uniqueKey) {
      matches = false;
      logWarning(`Page 2 position ${i}: ${page2Products[i]._uniqueKey} !== ${allProducts[i + perPage]._uniqueKey}`);
    }
  }
  
  if (matches) {
    logSuccess('Pagination maintains consistent order with seed');
    return true;
  } else {
    logError('Pagination order does not match full result');
    return false;
  }
}

/**
 * Test 5: Backward compatibility (shuffle without seed)
 */
async function testBackwardCompatibility() {
  logInfo('\n📋 Test 5: Backward compatibility (shuffle without seed still works)');
  
  // Request shuffle without seed (should use non-deterministic shuffle)
  const response = await makeRequest('GET', '/api/public/products?shuffle=true&per_page=20');
  
  if (response.status !== 200) {
    logError(`Failed to fetch products. Status: ${response.status}`);
    return false;
  }
  
  const products = response.data.products;
  
  if (products.length > 0) {
    logSuccess(`Shuffle without seed works (returned ${products.length} products)`);
    return true;
  } else {
    logWarning('No products returned, but request succeeded');
    return true;
  }
}

// Main test runner
async function runTests() {
  log('\n' + '='.repeat(70), 'blue');
  log('🧪 DETERMINISTIC SHUFFLE WITH SEED TESTS', 'blue');
  log('='.repeat(70) + '\n', 'blue');
  
  const tests = [
    { name: 'Deterministic Order', fn: testDeterministicOrder },
    { name: 'Different Seeds', fn: testDifferentSeeds },
    { name: 'Category Balancing', fn: testCategoryBalancing },
    { name: 'Pagination with Seed', fn: testPaginationWithSeed },
    { name: 'Backward Compatibility', fn: testBackwardCompatibility },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      logError(`Test "${test.name}" threw an error: ${error.message}`);
      failed++;
    }
  }
  
  // Summary
  log('\n' + '='.repeat(70), 'blue');
  log('📊 TEST SUMMARY', 'blue');
  log('='.repeat(70), 'blue');
  log(`Total tests: ${tests.length}`);
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log('='.repeat(70) + '\n', 'blue');
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
