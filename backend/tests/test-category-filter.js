/**
 * Test for Category Filtering in Public API
 * 
 * This test verifies that the category filter works correctly
 * in the public products endpoint (/api/public/products)
 */

const { supabase } = require('../supabase-db');
const Joya = require('../models/Joya');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testCategoryFiltering() {
  log('\n🧪 Testing Category Filtering', colors.blue);
  log('='.repeat(60), colors.blue);

  try {
    // Test 1: Get products without category filter
    log('\n📝 Test 1: Get all active products with stock', colors.blue);
    const allProducts = await Joya.obtenerTodas({
      estado: 'Activo',
      con_stock: true,
      mostrar_en_storefront: true,
      pagina: 1,
      por_pagina: 50
    });
    
    log(`✅ Found ${allProducts.joyas.length} products total`, colors.green);
    
    // Get unique categories from results
    const categories = [...new Set(allProducts.joyas.map(j => j.categoria).filter(c => c))];
    log(`   Categories: ${categories.join(', ')}`, colors.reset);

    // Test 2: Filter by each category
    log('\n📝 Test 2: Filter by specific categories', colors.blue);
    for (const categoria of categories) {
      const filtered = await Joya.obtenerTodas({
        estado: 'Activo',
        con_stock: true,
        mostrar_en_storefront: true,
        categoria: categoria,
        pagina: 1,
        por_pagina: 50
      });
      
      log(`✅ Category "${categoria}": ${filtered.joyas.length} products`, colors.green);
      
      // Verify all results match the category
      const wrongCategory = filtered.joyas.find(j => j.categoria !== categoria);
      if (wrongCategory) {
        log(`   ❌ ERROR: Found product with wrong category: ${wrongCategory.categoria}`, colors.red);
        return false;
      }
    }

    // Test 3: Test with a non-existent category
    log('\n📝 Test 3: Filter by non-existent category', colors.blue);
    const uniqueTestCategory = `TEST_NONEXISTENT_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const nonExistent = await Joya.obtenerTodas({
      estado: 'Activo',
      con_stock: true,
      mostrar_en_storefront: true,
      categoria: uniqueTestCategory,
      pagina: 1,
      por_pagina: 50
    });
    
    if (nonExistent.joyas.length === 0) {
      log(`✅ Correctly returns 0 products for non-existent category`, colors.green);
    } else {
      log(`   ❌ ERROR: Found ${nonExistent.joyas.length} products for non-existent category`, colors.red);
      return false;
    }

    // Test 4: Verify obtenerCategoriasDisponibles
    log('\n📝 Test 4: Get available categories', colors.blue);
    const availableCategories = await Joya.obtenerCategoriasDisponibles();
    log(`✅ Found ${availableCategories.length} available categories`, colors.green);
    log(`   Categories: ${availableCategories.join(', ')}`, colors.reset);
    
    // Verify no empty categories
    const emptyCategories = availableCategories.filter(c => !c || c.trim() === '');
    if (emptyCategories.length > 0) {
      log(`   ❌ ERROR: Found ${emptyCategories.length} empty categories`, colors.red);
      return false;
    }

    log('\n' + '='.repeat(60), colors.green);
    log('🎉 All category filtering tests passed!', colors.green);
    log('='.repeat(60), colors.green);
    
    return true;

  } catch (error) {
    log(`\n❌ Test failed with error: ${error.message}`, colors.red);
    console.error(error);
    return false;
  }
}

// Run the test
testCategoryFiltering()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
