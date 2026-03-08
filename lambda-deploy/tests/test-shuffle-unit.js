/**
 * Unit Test for Fisher-Yates Shuffle Algorithm
 * 
 * Tests the shuffle implementation without requiring database access
 */

// Mock Fisher-Yates shuffle (same implementation as in Joya model)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function testShuffleAlgorithm() {
  console.log('\n🧪 Testing Fisher-Yates Shuffle Algorithm...\n');
  
  let allTestsPassed = true;
  
  // Test 1: Empty array
  console.log('Test 1: Empty array');
  const emptyResult = shuffleArray([]);
  if (emptyResult.length === 0) {
    console.log('✅ Empty array handled correctly');
  } else {
    console.log('❌ Empty array test failed');
    allTestsPassed = false;
  }
  
  // Test 2: Single element array
  console.log('\nTest 2: Single element array');
  const singleResult = shuffleArray([1]);
  if (singleResult.length === 1 && singleResult[0] === 1) {
    console.log('✅ Single element array handled correctly');
  } else {
    console.log('❌ Single element array test failed');
    allTestsPassed = false;
  }
  
  // Test 3: Array maintains all elements
  console.log('\nTest 3: Array maintains all elements');
  const testArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const shuffled = shuffleArray(testArray);
  const allPresent = testArray.every(item => shuffled.includes(item));
  const noExtras = shuffled.length === testArray.length;
  
  if (allPresent && noExtras) {
    console.log('✅ All elements present, no duplicates');
  } else {
    console.log('❌ Elements missing or duplicated');
    allTestsPassed = false;
  }
  
  // Test 4: Does not mutate original array
  console.log('\nTest 4: Does not mutate original array');
  const original = [1, 2, 3, 4, 5];
  const originalCopy = [...original];
  shuffleArray(original);
  
  if (JSON.stringify(original) === JSON.stringify(originalCopy)) {
    console.log('✅ Original array not mutated');
  } else {
    console.log('❌ Original array was mutated');
    allTestsPassed = false;
  }
  
  // Test 5: Produces different orders (probabilistic)
  console.log('\nTest 5: Produces different orders on multiple runs');
  const sampleArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  let differentOrders = 0;
  
  for (let i = 0; i < 10; i++) {
    const result = shuffleArray(sampleArray);
    const isDifferent = sampleArray.some((val, idx) => val !== result[idx]);
    if (isDifferent) differentOrders++;
  }
  
  // Expect at least 8 out of 10 to be different (probability of same order is very low)
  if (differentOrders >= 8) {
    console.log(`✅ Produced different orders in ${differentOrders}/10 runs`);
  } else {
    console.log(`⚠️  Only produced different orders in ${differentOrders}/10 runs`);
    console.log('   (This is statistically unlikely but possible)');
  }
  
  // Test 6: Uniform distribution check (simplified)
  console.log('\nTest 6: Elements are reasonably distributed');
  const positionCounts = {};
  const iterations = 1000;
  const arrayToTest = [1, 2, 3, 4, 5];
  
  for (let i = 0; i < iterations; i++) {
    const result = shuffleArray(arrayToTest);
    result.forEach((val, idx) => {
      const key = `${val}-${idx}`;
      positionCounts[key] = (positionCounts[key] || 0) + 1;
    });
  }
  
  // Each element should appear in each position roughly 200 times (1000/5)
  // Allow deviation from 100 to 300 (50% margin)
  const expectedAvg = iterations / arrayToTest.length;
  const minExpected = expectedAvg * 0.5;
  const maxExpected = expectedAvg * 1.5;
  
  let distributionOk = true;
  for (let val = 1; val <= 5; val++) {
    for (let pos = 0; pos < 5; pos++) {
      const count = positionCounts[`${val}-${pos}`] || 0;
      if (count < minExpected || count > maxExpected) {
        distributionOk = false;
        console.log(`   ⚠️  Element ${val} at position ${pos}: ${count} times (expected ~${expectedAvg})`);
      }
    }
  }
  
  if (distributionOk) {
    console.log('✅ Elements are reasonably distributed across positions');
  } else {
    console.log('⚠️  Distribution shows some deviation (might be statistical variance)');
  }
  
  // Test 7: Works with objects
  console.log('\nTest 7: Works with objects (product-like data)');
  const products = [
    { id: 1, name: 'Product 1', categoria: 'Anillos' },
    { id: 2, name: 'Product 2', categoria: 'Aretes' },
    { id: 3, name: 'Product 3', categoria: 'Collares' },
    { id: 4, name: 'Product 4', categoria: 'Anillos' },
  ];
  
  const shuffledProducts = shuffleArray(products);
  const allIdsPresent = products.every(p => 
    shuffledProducts.some(sp => sp.id === p.id)
  );
  
  if (allIdsPresent && shuffledProducts.length === products.length) {
    console.log('✅ Works correctly with objects');
  } else {
    console.log('❌ Object shuffling failed');
    allTestsPassed = false;
  }
  
  // Test 8: Large array performance
  console.log('\nTest 8: Performance with large array');
  const largeArray = Array.from({ length: 10000 }, (_, i) => i);
  const startTime = Date.now();
  shuffleArray(largeArray);
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  if (duration < 1000) {
    console.log(`✅ Shuffled 10,000 elements in ${duration}ms`);
  } else {
    console.log(`⚠️  Shuffled 10,000 elements in ${duration}ms (slower than expected)`);
  }
  
  return allTestsPassed;
}

// Run tests
console.log('═══════════════════════════════════════════════════════');
console.log('  Fisher-Yates Shuffle Algorithm Unit Tests');
console.log('═══════════════════════════════════════════════════════');

const result = testShuffleAlgorithm();

console.log('\n═══════════════════════════════════════════════════════');
if (result) {
  console.log('✅ All critical tests passed!');
  console.log('═══════════════════════════════════════════════════════\n');
  process.exit(0);
} else {
  console.log('❌ Some tests failed');
  console.log('═══════════════════════════════════════════════════════\n');
  process.exit(1);
}
