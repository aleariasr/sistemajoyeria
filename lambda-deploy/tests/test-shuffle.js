/**
 * Test for Backend Shuffle Functionality
 * 
 * Validates that:
 * 1. Fisher-Yates shuffle works correctly
 * 2. Shuffle parameter is respected
 * 3. Products are properly randomized across pages
 * 4. Normal pagination still works without shuffle
 */

const Joya = require('../models/Joya');

// Helper to check if an array is shuffled (not in original order)
function isShuffled(original, shuffled) {
  if (original.length !== shuffled.length) return false;
  
  // Check if at least some elements are in different positions
  let differentPositions = 0;
  for (let i = 0; i < original.length; i++) {
    if (original[i].id !== shuffled[i].id) {
      differentPositions++;
    }
  }
  
  // If more than 30% of elements are in different positions, consider it shuffled
  return differentPositions > original.length * 0.3;
}

// Helper to check if all products are present after shuffle
function allProductsPresent(original, shuffled) {
  const originalIds = new Set(original.map(p => p.id));
  const shuffledIds = new Set(shuffled.map(p => p.id));
  
  if (originalIds.size !== shuffledIds.size) return false;
  
  for (let id of originalIds) {
    if (!shuffledIds.has(id)) return false;
  }
  
  return true;
}

async function testShuffleFunction() {
  console.log('\n🧪 Testing Fisher-Yates Shuffle Implementation...\n');
  
  // Test 1: Shuffle function exists
  console.log('Test 1: Shuffle function exists');
  if (typeof Joya._shuffleArray === 'function') {
    console.log('✅ Fisher-Yates shuffle function is available');
  } else {
    console.log('❌ Shuffle function not found');
    return false;
  }
  
  // Test 2: Shuffle produces different order
  console.log('\nTest 2: Shuffle produces different order');
  const testArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const shuffled = Joya._shuffleArray(testArray);
  
  if (shuffled.length === testArray.length) {
    console.log('✅ Shuffled array has same length');
  } else {
    console.log('❌ Shuffled array length mismatch');
    return false;
  }
  
  // Test 3: All elements present after shuffle
  console.log('\nTest 3: All elements present after shuffle');
  const allPresent = testArray.every(item => shuffled.includes(item));
  if (allPresent) {
    console.log('✅ All elements present after shuffle');
  } else {
    console.log('❌ Some elements missing after shuffle');
    return false;
  }
  
  // Test 4: Order is different (run multiple times)
  console.log('\nTest 4: Shuffle produces different orders on multiple runs');
  let differentOrders = 0;
  for (let i = 0; i < 5; i++) {
    const shuffled = Joya._shuffleArray(testArray);
    const isDifferent = testArray.some((val, idx) => val !== shuffled[idx]);
    if (isDifferent) differentOrders++;
  }
  
  if (differentOrders >= 4) {
    console.log(`✅ Shuffle produced different orders in ${differentOrders}/5 runs`);
  } else {
    console.log(`⚠️  Shuffle only produced different orders in ${differentOrders}/5 runs (expected at least 4)`);
  }
  
  return true;
}

async function testBackendShuffleParameter() {
  console.log('\n🧪 Testing Backend Shuffle with Query Parameter...\n');
  
  try {
    // Test 5: Fetch without shuffle (normal pagination)
    console.log('Test 5: Normal pagination without shuffle');
    const normalResult = await Joya.obtenerTodas({
      estado: 'Activo',
      con_stock: true,
      mostrar_en_storefront: true,
      pagina: 1,
      por_pagina: 10,
      shuffle: false
    });
    
    if (normalResult.joyas && normalResult.joyas.length > 0) {
      console.log(`✅ Normal fetch returned ${normalResult.joyas.length} products`);
      console.log(`   Total products available: ${normalResult.total}`);
    } else {
      console.log('⚠️  No products available for testing');
      return false;
    }
    
    // Test 6: Fetch with shuffle enabled
    console.log('\nTest 6: Fetch with shuffle enabled');
    const shuffledResult = await Joya.obtenerTodas({
      estado: 'Activo',
      con_stock: true,
      mostrar_en_storefront: true,
      pagina: 1,
      por_pagina: 10,
      shuffle: true
    });
    
    if (shuffledResult.joyas && shuffledResult.joyas.length > 0) {
      console.log(`✅ Shuffled fetch returned ${shuffledResult.joyas.length} products`);
      console.log(`   Total products available: ${shuffledResult.total}`);
    } else {
      console.log('❌ Shuffle fetch failed');
      return false;
    }
    
    // Test 7: Verify pagination metadata is correct
    console.log('\nTest 7: Pagination metadata with shuffle');
    if (shuffledResult.pagina === 1 && shuffledResult.por_pagina === 10) {
      console.log('✅ Pagination metadata is correct');
    } else {
      console.log('❌ Pagination metadata incorrect');
      return false;
    }
    
    // Test 8: Fetch multiple pages with shuffle
    console.log('\nTest 8: Multiple pages with shuffle maintain randomization');
    if (shuffledResult.total > 10) {
      const page2Result = await Joya.obtenerTodas({
        estado: 'Activo',
        con_stock: true,
        mostrar_en_storefront: true,
        pagina: 2,
        por_pagina: 10,
        shuffle: true
      });
      
      if (page2Result.joyas && page2Result.joyas.length > 0) {
        console.log(`✅ Page 2 returned ${page2Result.joyas.length} products`);
        
        // Check that page 1 and page 2 products don't overlap
        const page1Ids = new Set(shuffledResult.joyas.map(p => p.id));
        const page2Ids = new Set(page2Result.joyas.map(p => p.id));
        const overlap = [...page1Ids].filter(id => page2Ids.has(id)).length;
        
        if (overlap === 0) {
          console.log('✅ No product overlap between pages');
        } else {
          console.log(`⚠️  ${overlap} products overlap between pages`);
        }
      } else {
        console.log('⚠️  Not enough products for page 2 test');
      }
    } else {
      console.log('⚠️  Not enough products to test multiple pages (need > 10)');
    }
    
    // Test 9: Verify shuffle produces different results on multiple calls
    console.log('\nTest 9: Shuffle produces different results on multiple calls');
    const firstShuffled = shuffledResult.joyas;
    const secondShuffled = await Joya.obtenerTodas({
      estado: 'Activo',
      con_stock: true,
      mostrar_en_storefront: true,
      pagina: 1,
      por_pagina: 10,
      shuffle: true
    });
    
    if (firstShuffled.length > 5 && secondShuffled.joyas.length > 5) {
      const firstIds = firstShuffled.map(p => p.id).join(',');
      const secondIds = secondShuffled.joyas.map(p => p.id).join(',');
      
      if (firstIds !== secondIds) {
        console.log('✅ Shuffle produces different orders on multiple calls');
      } else {
        console.log('⚠️  Shuffle produced same order (might happen rarely by chance)');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error testing backend shuffle:', error);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Backend Shuffle Functionality Tests');
  console.log('═══════════════════════════════════════════════════════');
  
  const shuffleTest = await testShuffleFunction();
  const backendTest = await testBackendShuffleParameter();
  
  console.log('\n═══════════════════════════════════════════════════════');
  if (shuffleTest && backendTest) {
    console.log('✅ All tests passed!');
    console.log('═══════════════════════════════════════════════════════\n');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    console.log('═══════════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runTests();
}

module.exports = { testShuffleFunction, testBackendShuffleParameter };
