/**
 * Unit Test: Deterministic Shuffle Logic
 * 
 * This test validates the core shuffle and balancing logic without requiring a running server.
 */

// Mock Joya model shuffle functions
const MAX_CONSECUTIVE_CATEGORY = 3;
const MAX_BALANCING_ITERATIONS = 100;

/**
 * Seeded random number generator (Mulberry32)
 */
function seededRandom(seed) {
  let state = seed;
  return function() {
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher-Yates shuffle with seeded RNG
 */
function shuffleArraySeeded(array, seed) {
  const shuffled = [...array];
  const random = seededRandom(seed);
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Balance categories to ensure no more than MAX_CONSECUTIVE_CATEGORY consecutive products from same category
 */
function balanceCategories(products, maxConsecutive = MAX_CONSECUTIVE_CATEGORY) {
  if (!products || products.length <= maxConsecutive) {
    return products;
  }

  const result = [...products];
  let changes = true;
  let iterations = 0;

  while (changes && iterations < MAX_BALANCING_ITERATIONS) {
    changes = false;
    iterations++;

    for (let i = 0; i <= result.length - maxConsecutive - 1; i++) {
      const window = result.slice(i, i + maxConsecutive + 1);
      const firstCategory = window[0]?.categoria;
      
      if (!firstCategory) continue;

      const allSameCategory = window.every(p => p?.categoria === firstCategory);
      
      if (allSameCategory) {
        let swapIndex = -1;
        for (let j = i + maxConsecutive + 1; j < result.length; j++) {
          if (result[j]?.categoria !== firstCategory) {
            swapIndex = j;
            break;
          }
        }

        if (swapIndex !== -1) {
          const temp = result[i + maxConsecutive];
          result[i + maxConsecutive] = result[swapIndex];
          result[swapIndex] = temp;
          changes = true;
        }
      }
    }
  }

  return result;
}

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

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Test data
function createMockProducts(count, categories) {
  const products = [];
  for (let i = 0; i < count; i++) {
    products.push({
      id: i + 1,
      nombre: `Product ${i + 1}`,
      categoria: categories[i % categories.length],
      _uniqueKey: `${i + 1}`
    });
  }
  return products;
}

/**
 * Test 1: Same seed produces same shuffle order
 */
function testDeterministicShuffle() {
  logInfo('\n📋 Test 1: Same seed produces deterministic shuffle order');
  
  const products = createMockProducts(20, ['Anillos', 'Collares', 'Aretes', 'Pulseras']);
  const seed = 12345;
  
  const shuffled1 = shuffleArraySeeded(products, seed);
  const shuffled2 = shuffleArraySeeded(products, seed);
  
  // Check if both shuffles are identical
  let orderMatches = true;
  for (let i = 0; i < shuffled1.length; i++) {
    if (shuffled1[i].id !== shuffled2[i].id) {
      orderMatches = false;
      break;
    }
  }
  
  if (orderMatches) {
    logSuccess('Same seed produces identical shuffle order');
    return true;
  } else {
    logError('Order does not match with same seed');
    return false;
  }
}

/**
 * Test 2: Different seeds produce different orders
 */
function testDifferentSeeds() {
  logInfo('\n📋 Test 2: Different seeds produce different orders');
  
  const products = createMockProducts(30, ['Anillos', 'Collares', 'Aretes', 'Pulseras']);
  
  const shuffled1 = shuffleArraySeeded(products, 12345);
  const shuffled2 = shuffleArraySeeded(products, 67890);
  
  // Count differences
  let differences = 0;
  for (let i = 0; i < shuffled1.length; i++) {
    if (shuffled1[i].id !== shuffled2[i].id) {
      differences++;
    }
  }
  
  const differencePercentage = (differences / shuffled1.length) * 100;
  
  if (differencePercentage > 50) {
    logSuccess(`Different seeds produce different orders (${differencePercentage.toFixed(1)}% difference)`);
    return true;
  } else {
    logError(`Orders are too similar (${differencePercentage.toFixed(1)}% difference)`);
    return false;
  }
}

/**
 * Test 3: Category balancing enforces max 3 consecutive rule
 */
function testCategoryBalancing() {
  logInfo('\n📋 Test 3: Category balancing enforces max 3 consecutive rule');
  
  // Create products with intentional clustering
  const products = [
    ...createMockProducts(10, ['Anillos']),
    ...createMockProducts(10, ['Collares']),
    ...createMockProducts(10, ['Aretes']),
    ...createMockProducts(10, ['Pulseras']),
  ];
  
  // Shuffle with seed
  const shuffled = shuffleArraySeeded(products, 99999);
  
  // Apply balancing
  const balanced = balanceCategories(shuffled);
  
  // Check for violations
  let violations = 0;
  let consecutiveCount = 1;
  let previousCategory = null;
  
  for (let i = 0; i < balanced.length; i++) {
    const currentCategory = balanced[i].categoria;
    
    if (currentCategory === previousCategory) {
      consecutiveCount++;
      if (consecutiveCount > 3) {
        violations++;
      }
    } else {
      consecutiveCount = 1;
      previousCategory = currentCategory;
    }
  }
  
  if (violations === 0) {
    logSuccess(`No category balancing violations (max 3 consecutive enforced)`);
    return true;
  } else {
    logError(`Found ${violations} category balancing violations`);
    return false;
  }
}

/**
 * Test 4: Balancing is deterministic with same seed
 */
function testDeterministicBalancing() {
  logInfo('\n📋 Test 4: Balancing is deterministic with same seed');
  
  const products = createMockProducts(50, ['Anillos', 'Collares', 'Aretes', 'Pulseras']);
  const seed = 54321;
  
  // Run shuffle and balance twice
  const shuffled1 = shuffleArraySeeded(products, seed);
  const balanced1 = balanceCategories(shuffled1);
  
  const shuffled2 = shuffleArraySeeded(products, seed);
  const balanced2 = balanceCategories(shuffled2);
  
  // Check if results are identical
  let orderMatches = true;
  for (let i = 0; i < balanced1.length; i++) {
    if (balanced1[i].id !== balanced2[i].id) {
      orderMatches = false;
      break;
    }
  }
  
  if (orderMatches) {
    logSuccess('Balancing is deterministic with same seed');
    return true;
  } else {
    logError('Balancing produces different results with same seed');
    return false;
  }
}

/**
 * Test 5: All products are preserved after shuffle and balance
 */
function testProductPreservation() {
  logInfo('\n📋 Test 5: All products preserved after shuffle and balance');
  
  const products = createMockProducts(30, ['Anillos', 'Collares', 'Aretes']);
  const seed = 11111;
  
  const shuffled = shuffleArraySeeded(products, seed);
  const balanced = balanceCategories(shuffled);
  
  // Check that all products are still present
  const originalIds = new Set(products.map(p => p.id));
  const balancedIds = new Set(balanced.map(p => p.id));
  
  if (originalIds.size === balancedIds.size && 
      [...originalIds].every(id => balancedIds.has(id))) {
    logSuccess('All products preserved after shuffle and balance');
    return true;
  } else {
    logError('Some products lost or duplicated');
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('======================================================================');
  console.log('🧪 DETERMINISTIC SHUFFLE UNIT TESTS');
  console.log('======================================================================');
  
  const tests = [
    { name: 'Deterministic Shuffle', fn: testDeterministicShuffle },
    { name: 'Different Seeds', fn: testDifferentSeeds },
    { name: 'Category Balancing', fn: testCategoryBalancing },
    { name: 'Deterministic Balancing', fn: testDeterministicBalancing },
    { name: 'Product Preservation', fn: testProductPreservation },
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
  
  console.log('\n======================================================================');
  console.log('📊 TEST SUMMARY');
  console.log('======================================================================');
  console.log(`Total tests: ${tests.length}`);
  log(`Passed: ${passed}`, passed === tests.length ? 'green' : 'yellow');
  log(`Failed: ${failed}`, failed === 0 ? 'green' : 'red');
  console.log('======================================================================\n');
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests();
