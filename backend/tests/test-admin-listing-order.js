/**
 * Test script for Admin Listing (POS) - Order and Totals
 * Tests the /api/joyas endpoint to verify:
 * 1. DESC order by fecha_creacion with fallback to id DESC
 * 2. Correct total count with pagination
 * 3. No duplicates in results
 * 4. Stable ordering across multiple requests
 */

const axios = require('axios');

const API_URL = process.env.TEST_API_URL || 'http://localhost:3001/api';

// Test credentials - ensure these match your test environment
const TEST_USER = {
  username: process.env.TEST_USERNAME || 'admin',
  password: process.env.TEST_PASSWORD || 'admin123'
};

let sessionCookie = null;

/**
 * Login to get session cookie
 */
async function login() {
  console.log('🔐 Logging in...');
  try {
    const response = await axios.post(
      `${API_URL}/auth/login`,
      TEST_USER,
      {
        withCredentials: true,
        validateStatus: () => true
      }
    );

    if (response.status === 200 && response.headers['set-cookie']) {
      sessionCookie = response.headers['set-cookie'];
      console.log('✅ Login successful\n');
      return true;
    } else {
      console.log('❌ Login failed:', response.status, response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return false;
  }
}

/**
 * Make authenticated request to /api/joyas
 */
async function getJoyas(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_URL}/joyas${queryString ? '?' + queryString : ''}`;
  
  const response = await axios.get(url, {
    headers: {
      Cookie: sessionCookie
    },
    withCredentials: true
  });
  
  return response.data;
}

/**
 * Test 1: Verify DESC order by fecha_creacion and id
 */
async function testOrderDESC() {
  console.log('Test 1: Verify DESC order by fecha_creacion (fallback id DESC)');
  
  try {
    const data = await getJoyas({ pagina: 1, por_pagina: 20 });
    
    if (!data.joyas || data.joyas.length === 0) {
      console.log('⚠️  No joyas found in database. Skipping order test.');
      return;
    }
    
    console.log(`  📦 Retrieved ${data.joyas.length} joyas (total: ${data.total})`);
    
    // Check that fecha_creacion is in DESC order
    let previousFecha = null;
    let previousId = null;
    let orderViolations = 0;
    
    for (const joya of data.joyas) {
      const currentFecha = joya.fecha_creacion ? new Date(joya.fecha_creacion) : null;
      const currentId = joya.id;
      
      if (previousFecha !== null && currentFecha !== null) {
        // If same fecha_creacion, check id is DESC
        if (currentFecha.getTime() === previousFecha.getTime()) {
          if (currentId > previousId) {
            orderViolations++;
            console.log(`  ⚠️  Order violation: same fecha_creacion but id not DESC (${previousId} -> ${currentId})`);
          }
        } else if (currentFecha > previousFecha) {
          orderViolations++;
          console.log(`  ⚠️  Order violation: fecha_creacion not DESC (${previousFecha.toISOString()} -> ${currentFecha.toISOString()})`);
        }
      }
      
      previousFecha = currentFecha;
      previousId = currentId;
    }
    
    if (orderViolations === 0) {
      console.log('  ✅ Order is correct: DESC by fecha_creacion, fallback id DESC');
    } else {
      console.log(`  ❌ Found ${orderViolations} order violations`);
    }
    
    // Display first 3 items for verification
    console.log('  First 3 items:');
    data.joyas.slice(0, 3).forEach((j, i) => {
      console.log(`    ${i + 1}. ID=${j.id}, fecha=${j.fecha_creacion ? new Date(j.fecha_creacion).toISOString() : 'NULL'}, codigo=${j.codigo}`);
    });
    
    console.log('');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.status, error.response.data);
    }
  }
}

/**
 * Test 2: Verify correct totals with pagination
 */
async function testCorrectTotals() {
  console.log('Test 2: Verify correct totals with pagination');
  
  try {
    // Get first page
    const page1 = await getJoyas({ pagina: 1, por_pagina: 10 });
    console.log(`  📦 Page 1: ${page1.joyas.length} items, total: ${page1.total}, total_pages: ${page1.total_paginas}`);
    
    if (page1.total_paginas > 1) {
      // Get second page
      const page2 = await getJoyas({ pagina: 2, por_pagina: 10 });
      console.log(`  📦 Page 2: ${page2.joyas.length} items, total: ${page2.total}, total_pages: ${page2.total_paginas}`);
      
      // Verify totals are consistent
      if (page1.total === page2.total && page1.total_paginas === page2.total_paginas) {
        console.log('  ✅ Totals are consistent across pages');
      } else {
        console.log('  ❌ Totals are inconsistent:', {
          page1: { total: page1.total, total_paginas: page1.total_paginas },
          page2: { total: page2.total, total_paginas: page2.total_paginas }
        });
      }
      
      // Verify total_paginas calculation
      const expectedPages = Math.ceil(page1.total / 10);
      if (page1.total_paginas === expectedPages) {
        console.log(`  ✅ total_paginas calculation correct: ${page1.total_paginas} = ceil(${page1.total} / 10)`);
      } else {
        console.log(`  ❌ total_paginas calculation incorrect: ${page1.total_paginas} != ceil(${page1.total} / 10) = ${expectedPages}`);
      }
    } else {
      console.log('  ⚠️  Only 1 page of results, cannot test pagination consistency');
      
      // At least verify single page total
      if (page1.joyas.length <= page1.total) {
        console.log(`  ✅ Single page: ${page1.joyas.length} items <= ${page1.total} total`);
      } else {
        console.log(`  ❌ Single page: ${page1.joyas.length} items > ${page1.total} total (should not happen)`);
      }
    }
    
    console.log('');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.status, error.response.data);
    }
  }
}

/**
 * Test 3: Verify no duplicates in results
 */
async function testNoDuplicates() {
  console.log('Test 3: Verify no duplicates in results');
  
  try {
    const data = await getJoyas({ pagina: 1, por_pagina: 50 });
    
    if (!data.joyas || data.joyas.length === 0) {
      console.log('⚠️  No joyas found in database. Skipping duplicates test.');
      return;
    }
    
    const ids = data.joyas.map(j => j.id);
    const uniqueIds = new Set(ids);
    
    if (ids.length === uniqueIds.size) {
      console.log(`  ✅ No duplicates found: ${ids.length} items, all unique`);
    } else {
      console.log(`  ❌ Duplicates found: ${ids.length} items, ${uniqueIds.size} unique`);
      
      // Find duplicates
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
      console.log(`     Duplicate IDs:`, [...new Set(duplicates)]);
    }
    
    console.log('');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.status, error.response.data);
    }
  }
}

/**
 * Test 4: Verify stable ordering across multiple requests
 */
async function testStableOrder() {
  console.log('Test 4: Verify stable ordering across multiple requests');
  
  try {
    // Make 3 requests with same parameters
    const data1 = await getJoyas({ pagina: 1, por_pagina: 10 });
    const data2 = await getJoyas({ pagina: 1, por_pagina: 10 });
    const data3 = await getJoyas({ pagina: 1, por_pagina: 10 });
    
    if (!data1.joyas || data1.joyas.length === 0) {
      console.log('⚠️  No joyas found in database. Skipping stability test.');
      return;
    }
    
    const ids1 = data1.joyas.map(j => j.id).join(',');
    const ids2 = data2.joyas.map(j => j.id).join(',');
    const ids3 = data3.joyas.map(j => j.id).join(',');
    
    if (ids1 === ids2 && ids2 === ids3) {
      console.log(`  ✅ Order is stable across ${data1.joyas.length} items in 3 requests`);
    } else {
      console.log('  ❌ Order is NOT stable across requests');
      console.log('     Request 1:', ids1);
      console.log('     Request 2:', ids2);
      console.log('     Request 3:', ids3);
    }
    
    console.log('');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.status, error.response.data);
    }
  }
}

/**
 * Test 5: Verify filters don't break order or totals
 */
async function testFiltersWithOrder() {
  console.log('Test 5: Verify filters maintain correct order and totals');
  
  try {
    // First, get a sample categoria from the database
    const dataSample = await getJoyas({ pagina: 1, por_pagina: 50 });
    
    if (!dataSample.joyas || dataSample.joyas.length === 0) {
      console.log('⚠️  No joyas found in database. Skipping filter test.');
      return;
    }
    
    // Find the most common category to test with
    const categorias = dataSample.joyas
      .map(j => j.categoria)
      .filter(c => c && c.trim() !== '');
    
    if (categorias.length === 0) {
      console.log('⚠️  No categories found in joyas. Skipping filter test.');
      return;
    }
    
    const categoriaTest = categorias[0];
    console.log(`  ℹ️  Testing with category: "${categoriaTest}"`);
    
    // Test with category filter
    const data = await getJoyas({ pagina: 1, por_pagina: 20, categoria: categoriaTest });
    
    if (!data.joyas || data.joyas.length === 0) {
      console.log('⚠️  No joyas found with filter. Test inconclusive.');
      return;
    }
    
    console.log(`  📦 Filtered results: ${data.joyas.length} items (total: ${data.total})`);
    
    // Verify all items match the filter (case-insensitive)
    const allMatchFilter = data.joyas.every(j => 
      j.categoria && j.categoria.toLowerCase() === categoriaTest.toLowerCase()
    );
    
    if (allMatchFilter) {
      console.log('  ✅ All items match filter');
    } else {
      console.log('  ❌ Some items do not match filter');
    }
    
    // Verify order is still DESC
    let previousFecha = null;
    let orderOk = true;
    
    for (const joya of data.joyas) {
      const currentFecha = joya.fecha_creacion ? new Date(joya.fecha_creacion) : null;
      
      if (previousFecha !== null && currentFecha !== null && currentFecha > previousFecha) {
        orderOk = false;
        break;
      }
      
      previousFecha = currentFecha;
    }
    
    if (orderOk) {
      console.log('  ✅ Order is still DESC with filter applied');
    } else {
      console.log('  ❌ Order is NOT DESC with filter applied');
    }
    
    console.log('');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.status, error.response.data);
    }
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🧪 Admin Listing (POS) - Order and Totals Tests\n');
  console.log('Testing endpoint: GET /api/joyas\n');
  
  // Login first
  const loggedIn = await login();
  if (!loggedIn) {
    console.error('❌ Cannot run tests without authentication');
    process.exit(1);
  }
  
  // Run all tests
  await testOrderDESC();
  await testCorrectTotals();
  await testNoDuplicates();
  await testStableOrder();
  await testFiltersWithOrder();
  
  console.log('✅ All tests completed\n');
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests };
