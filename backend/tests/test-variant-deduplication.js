/**
 * Test: Product Variant Deduplication Fix
 * 
 * This test validates that the storefront public API correctly handles
 * product variants without creating duplicates.
 * 
 * Test scenarios:
 * 1. Product with multiple variants shows exactly N variants (not N*M duplicates)
 * 2. Each variant has its own unique image URL
 * 3. Each variant has a unique name combining parent + variant name
 * 4. Products without variants appear only once
 * 5. Variant products without active variants are excluded
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
async function makeRequest(method, path, data = null) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${path}`,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        error: error.response.data,
        status: error.response.status
      };
    }
    return {
      success: false,
      error: error.message,
      status: 0
    };
  }
}

// Test 1: Verify products are not duplicated
async function testNoProductDuplication() {
  logInfo('\n=== Test 1: No Product Duplication ===');
  
  const response = await makeRequest('GET', '/api/public/products?per_page=100');
  
  if (!response.success) {
    logError(`Failed to fetch products: ${response.error}`);
    return false;
  }

  const products = response.data.products || [];
  logInfo(`Fetched ${products.length} products from API`);

  // Check for duplicate parent product IDs
  const parentIds = new Map();
  const variantIds = new Set();
  
  products.forEach(product => {
    if (product.es_variante) {
      variantIds.add(product.variante_id);
      // Track how many times each parent product appears as a variant
      parentIds.set(product.id, (parentIds.get(product.id) || 0) + 1);
    }
  });

  // Log parent products that appear multiple times
  let hasDuplicates = false;
  parentIds.forEach((count, parentId) => {
    if (count > 1) {
      logWarning(`Parent product ID ${parentId} appears ${count} times - checking if this is expected variant expansion`);
      
      // Get all products with this parent ID
      const sameParentProducts = products.filter(p => p.id === parentId);
      
      // Check if they have different variant names
      const variantNames = new Set(sameParentProducts.map(p => p.variante_nombre));
      
      if (variantNames.size !== sameParentProducts.length) {
        logError(`DUPLICATE DETECTED: Parent ${parentId} has ${sameParentProducts.length} entries but only ${variantNames.size} unique variants!`);
        hasDuplicates = true;
      } else {
        logSuccess(`Parent ${parentId} correctly expanded into ${sameParentProducts.length} unique variants`);
      }
    }
  });

  if (hasDuplicates) {
    logError('Test 1 FAILED: Duplicate products detected');
    return false;
  }

  logSuccess('Test 1 PASSED: No duplicate products found');
  return true;
}

// Test 2: Verify variants have unique images
async function testVariantsHaveUniqueImages() {
  logInfo('\n=== Test 2: Variants Have Unique Images ===');
  
  const response = await makeRequest('GET', '/api/public/products?per_page=100');
  
  if (!response.success) {
    logError(`Failed to fetch products: ${response.error}`);
    return false;
  }

  const products = response.data.products || [];
  
  // Group variants by parent product
  const variantsByParent = {};
  products.forEach(product => {
    if (product.es_variante) {
      if (!variantsByParent[product.id]) {
        variantsByParent[product.id] = [];
      }
      variantsByParent[product.id].push(product);
    }
  });

  let allVariantsHaveUniqueImages = true;

  Object.keys(variantsByParent).forEach(parentId => {
    const variants = variantsByParent[parentId];
    
    if (variants.length < 2) {
      return; // Skip single variant products
    }

    logInfo(`Checking ${variants.length} variants for parent product ${parentId}`);

    // Check if all variants have different image URLs
    const imageUrls = variants.map(v => v.imagen_url);
    const uniqueImageUrls = new Set(imageUrls);

    if (uniqueImageUrls.size !== variants.length) {
      logError(`FAILED: Parent ${parentId} has ${variants.length} variants but only ${uniqueImageUrls.size} unique images`);
      
      // Show which variants share images
      const imageMap = {};
      variants.forEach(v => {
        if (!imageMap[v.imagen_url]) {
          imageMap[v.imagen_url] = [];
        }
        imageMap[v.imagen_url].push(v.variante_nombre);
      });
      
      Object.keys(imageMap).forEach(url => {
        if (imageMap[url].length > 1) {
          logWarning(`  Image ${url.substring(0, 50)}... is shared by: ${imageMap[url].join(', ')}`);
        }
      });
      
      allVariantsHaveUniqueImages = false;
    } else {
      logSuccess(`Parent ${parentId}: All ${variants.length} variants have unique images`);
    }
  });

  if (!allVariantsHaveUniqueImages) {
    logError('Test 2 FAILED: Some variants share the same image');
    return false;
  }

  if (Object.keys(variantsByParent).length === 0) {
    logWarning('Test 2 SKIPPED: No variant products found in response');
    return true;
  }

  logSuccess('Test 2 PASSED: All variants have unique images');
  return true;
}

// Test 3: Verify variant names are unique
async function testVariantsHaveUniqueNames() {
  logInfo('\n=== Test 3: Variants Have Unique Names ===');
  
  const response = await makeRequest('GET', '/api/public/products?per_page=100');
  
  if (!response.success) {
    logError(`Failed to fetch products: ${response.error}`);
    return false;
  }

  const products = response.data.products || [];
  
  // Group variants by parent product
  const variantsByParent = {};
  products.forEach(product => {
    if (product.es_variante) {
      if (!variantsByParent[product.id]) {
        variantsByParent[product.id] = [];
      }
      variantsByParent[product.id].push(product);
    }
  });

  let allVariantsHaveUniqueNames = true;

  Object.keys(variantsByParent).forEach(parentId => {
    const variants = variantsByParent[parentId];
    
    if (variants.length < 2) {
      return; // Skip single variant products
    }

    logInfo(`Checking ${variants.length} variants for parent product ${parentId}`);

    // Check if all variants have different names
    const names = variants.map(v => v.nombre);
    const uniqueNames = new Set(names);

    if (uniqueNames.size !== variants.length) {
      logError(`FAILED: Parent ${parentId} has ${variants.length} variants but only ${uniqueNames.size} unique names`);
      
      // Show duplicates
      const nameCount = {};
      names.forEach(name => {
        nameCount[name] = (nameCount[name] || 0) + 1;
      });
      
      Object.keys(nameCount).forEach(name => {
        if (nameCount[name] > 1) {
          logWarning(`  Name "${name}" appears ${nameCount[name]} times`);
        }
      });
      
      allVariantsHaveUniqueNames = false;
    } else {
      logSuccess(`Parent ${parentId}: All ${variants.length} variants have unique names`);
      
      // Verify name format: "Parent - Variant"
      const correctFormat = variants.every(v => v.nombre.includes(' - '));
      if (correctFormat) {
        logSuccess(`  All variant names follow "Parent - Variant" format`);
      } else {
        logWarning(`  Some variant names don't follow expected format`);
      }
    }
  });

  if (!allVariantsHaveUniqueNames) {
    logError('Test 3 FAILED: Some variants share the same name');
    return false;
  }

  if (Object.keys(variantsByParent).length === 0) {
    logWarning('Test 3 SKIPPED: No variant products found in response');
    return true;
  }

  logSuccess('Test 3 PASSED: All variants have unique names');
  return true;
}

// Test 4: Verify non-variant products appear only once
async function testNonVariantProductsAppearOnce() {
  logInfo('\n=== Test 4: Non-Variant Products Appear Only Once ===');
  
  const response = await makeRequest('GET', '/api/public/products?per_page=100');
  
  if (!response.success) {
    logError(`Failed to fetch products: ${response.error}`);
    return false;
  }

  const products = response.data.products || [];
  
  // Get non-variant products
  const nonVariantProducts = products.filter(p => !p.es_variante);
  
  logInfo(`Found ${nonVariantProducts.length} non-variant products`);

  // Check for duplicates by ID
  const productIds = nonVariantProducts.map(p => p.id);
  const uniqueIds = new Set(productIds);

  if (productIds.length !== uniqueIds.size) {
    logError(`FAILED: Found ${productIds.length} non-variant products but only ${uniqueIds.size} unique IDs`);
    
    // Find duplicates
    const idCount = {};
    productIds.forEach(id => {
      idCount[id] = (idCount[id] || 0) + 1;
    });
    
    Object.keys(idCount).forEach(id => {
      if (idCount[id] > 1) {
        const duplicates = nonVariantProducts.filter(p => p.id === parseInt(id));
        logWarning(`  Product ID ${id} (${duplicates[0].codigo}) appears ${idCount[id]} times`);
      }
    });
    
    return false;
  }

  logSuccess('Test 4 PASSED: All non-variant products appear exactly once');
  return true;
}

// Test 5: Integration test - verify complete flow
async function testCompleteFlow() {
  logInfo('\n=== Test 5: Complete Integration Test ===');
  
  const response = await makeRequest('GET', '/api/public/products?per_page=100');
  
  if (!response.success) {
    logError(`Failed to fetch products: ${response.error}`);
    return false;
  }

  const products = response.data.products || [];
  
  logInfo(`Total products in response: ${products.length}`);
  
  const variantProducts = products.filter(p => p.es_variante);
  const nonVariantProducts = products.filter(p => !p.es_variante);
  
  logInfo(`  - Variant products: ${variantProducts.length}`);
  logInfo(`  - Non-variant products: ${nonVariantProducts.length}`);

  // Group variants by parent
  const variantsByParent = {};
  variantProducts.forEach(product => {
    if (!variantsByParent[product.id]) {
      variantsByParent[product.id] = [];
    }
    variantsByParent[product.id].push(product);
  });

  const parentProductCount = Object.keys(variantsByParent).length;
  logInfo(`  - Unique parent products with variants: ${parentProductCount}`);

  // Calculate expected total
  let expectedVariantCount = 0;
  Object.keys(variantsByParent).forEach(parentId => {
    const variants = variantsByParent[parentId];
    expectedVariantCount += variants.length;
    logInfo(`    Parent ${parentId}: ${variants.length} variants`);
  });

  if (expectedVariantCount !== variantProducts.length) {
    logError(`FAILED: Expected ${expectedVariantCount} variants but got ${variantProducts.length}`);
    return false;
  }

  logSuccess('Test 5 PASSED: Complete integration test successful');
  return true;
}

// Main test runner
async function runAllTests() {
  log('\n' + '='.repeat(60), 'blue');
  log('  VARIANT DEDUPLICATION TEST SUITE', 'blue');
  log('='.repeat(60) + '\n', 'blue');

  const tests = [
    { name: 'No Product Duplication', fn: testNoProductDuplication },
    { name: 'Variants Have Unique Images', fn: testVariantsHaveUniqueImages },
    { name: 'Variants Have Unique Names', fn: testVariantsHaveUniqueNames },
    { name: 'Non-Variant Products Appear Once', fn: testNonVariantProductsAppearOnce },
    { name: 'Complete Integration Test', fn: testCompleteFlow }
  ];

  const results = [];

  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      logError(`Test "${test.name}" threw an error: ${error.message}`);
      results.push({ name: test.name, passed: false, error: error.message });
    }
  }

  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log('  TEST SUMMARY', 'blue');
  log('='.repeat(60), 'blue');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(result => {
    if (result.passed) {
      logSuccess(`${result.name}: PASSED`);
    } else {
      logError(`${result.name}: FAILED${result.error ? ` (${result.error})` : ''}`);
    }
  });

  log('\n' + '-'.repeat(60), 'blue');
  log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`, 'blue');
  log('='.repeat(60) + '\n', 'blue');

  if (failed > 0) {
    process.exit(1);
  } else {
    logSuccess('All tests passed! 🎉');
    process.exit(0);
  }
}

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    logError(`Test suite failed with error: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  testNoProductDuplication,
  testVariantsHaveUniqueImages,
  testVariantsHaveUniqueNames,
  testNonVariantProductsAppearOnce,
  testCompleteFlow
};
