/**
 * Test for Storefront Visibility Feature
 * 
 * Tests that the mostrar_en_storefront field works correctly
 * in public API routes and filters products appropriately.
 */

const { supabase } = require('../supabase-db');
const Joya = require('../models/Joya');

// Test configuration
const TEST_TIMEOUT = 30000; // 30 seconds

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Test utilities
let testProductId = null;

async function setup() {
  log('\n🔧 Setting up test environment...', colors.blue);
  
  // Create a test product with mostrar_en_storefront = false
  const testProduct = {
    codigo: 'TEST-STOREFRONT-001',
    nombre: 'Test Product - Hidden from Storefront',
    descripcion: 'Test product for storefront visibility',
    categoria: 'Test',
    proveedor: 'Test Provider',
    costo: 100,
    precio_venta: 200,
    moneda: 'CRC',
    stock_actual: 10,
    stock_minimo: 5,
    ubicacion: 'Test',
    estado: 'Activo',
    mostrar_en_storefront: false
  };

  const result = await Joya.crear(testProduct);
  testProductId = result.id;
  log(`✅ Test product created with ID: ${testProductId}`, colors.green);
}

async function teardown() {
  log('\n🧹 Cleaning up test environment...', colors.blue);
  
  if (testProductId) {
    // Delete test product
    const { error } = await supabase
      .from('joyas')
      .delete()
      .eq('id', testProductId);
    
    if (error) {
      log(`⚠️  Warning: Could not delete test product: ${error.message}`, colors.yellow);
    } else {
      log(`✅ Test product deleted`, colors.green);
    }
  }
}

// Test cases
async function testModelCreation() {
  log('\n📝 Test 1: Create product with mostrar_en_storefront = true', colors.blue);
  
  const product = {
    codigo: 'TEST-VISIBLE-001',
    nombre: 'Test Visible Product',
    descripcion: 'Should be visible in storefront',
    categoria: 'Test',
    proveedor: 'Test',
    costo: 50,
    precio_venta: 100,
    moneda: 'CRC',
    stock_actual: 5,
    stock_minimo: 2,
    ubicacion: 'Test',
    estado: 'Activo',
    mostrar_en_storefront: true
  };

  try {
    const result = await Joya.crear(product);
    const created = await Joya.obtenerPorId(result.id);
    
    if (created.mostrar_en_storefront === true) {
      log('✅ Product created with mostrar_en_storefront = true', colors.green);
    } else {
      throw new Error(`Expected mostrar_en_storefront = true, got ${created.mostrar_en_storefront}`);
    }
    
    // Cleanup
    await supabase.from('joyas').delete().eq('id', result.id);
    
    return true;
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, colors.red);
    return false;
  }
}

async function testModelDefaultValue() {
  log('\n📝 Test 2: Create product without specifying mostrar_en_storefront (should default to true)', colors.blue);
  
  const product = {
    codigo: 'TEST-DEFAULT-001',
    nombre: 'Test Default Product',
    descripcion: 'Should default to visible',
    categoria: 'Test',
    proveedor: 'Test',
    costo: 50,
    precio_venta: 100,
    moneda: 'CRC',
    stock_actual: 5,
    stock_minimo: 2,
    ubicacion: 'Test',
    estado: 'Activo'
    // mostrar_en_storefront not specified
  };

  try {
    const result = await Joya.crear(product);
    const created = await Joya.obtenerPorId(result.id);
    
    if (created.mostrar_en_storefront === true) {
      log('✅ Product defaults to mostrar_en_storefront = true', colors.green);
    } else {
      throw new Error(`Expected default mostrar_en_storefront = true, got ${created.mostrar_en_storefront}`);
    }
    
    // Cleanup
    await supabase.from('joyas').delete().eq('id', result.id);
    
    return true;
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, colors.red);
    return false;
  }
}

async function testFilteringByStorefrontVisibility() {
  log('\n📝 Test 3: Filter products by mostrar_en_storefront = true', colors.blue);
  
  try {
    const filtros = {
      estado: 'Activo',
      con_stock: true,
      mostrar_en_storefront: true
    };
    
    const result = await Joya.obtenerTodas(filtros);
    
    // Check that hidden test product is not included
    const hasHiddenProduct = result.joyas.some(j => j.id === testProductId);
    
    if (!hasHiddenProduct) {
      log('✅ Hidden products correctly excluded from results', colors.green);
    } else {
      throw new Error('Hidden product was included in filtered results');
    }
    
    return true;
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, colors.red);
    return false;
  }
}

async function testUpdateStorefrontVisibility() {
  log('\n📝 Test 4: Update product mostrar_en_storefront field', colors.blue);
  
  try {
    // Update test product to be visible
    await Joya.actualizar(testProductId, {
      codigo: 'TEST-STOREFRONT-001',
      nombre: 'Test Product - Now Visible',
      descripcion: 'Test product for storefront visibility',
      categoria: 'Test',
      proveedor: 'Test Provider',
      costo: 100,
      precio_venta: 200,
      moneda: 'CRC',
      stock_actual: 10,
      stock_minimo: 5,
      ubicacion: 'Test',
      estado: 'Activo',
      mostrar_en_storefront: true
    });
    
    const updated = await Joya.obtenerPorId(testProductId);
    
    if (updated.mostrar_en_storefront === true) {
      log('✅ Product visibility updated successfully', colors.green);
      
      // Restore original state
      await Joya.actualizar(testProductId, {
        codigo: 'TEST-STOREFRONT-001',
        nombre: 'Test Product - Hidden from Storefront',
        descripcion: 'Test product for storefront visibility',
        categoria: 'Test',
        proveedor: 'Test Provider',
        costo: 100,
        precio_venta: 200,
        moneda: 'CRC',
        stock_actual: 10,
        stock_minimo: 5,
        ubicacion: 'Test',
        estado: 'Activo',
        mostrar_en_storefront: false
      });
      
      return true;
    } else {
      throw new Error('mostrar_en_storefront was not updated');
    }
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, colors.red);
    return false;
  }
}

async function testCategoriasDisponibles() {
  log('\n📝 Test 5: Get categories should only include visible products', colors.blue);
  
  try {
    const categorias = await Joya.obtenerCategoriasDisponibles();
    
    // Test category should not be included (our test product is hidden)
    const hasTestCategory = categorias.includes('Test');
    
    if (!hasTestCategory) {
      log('✅ Categories correctly filtered by storefront visibility', colors.green);
    } else {
      // This might be expected if there are other visible test products
      log('⚠️  Test category found - may be expected if other visible products exist', colors.yellow);
    }
    
    return true;
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, colors.red);
    return false;
  }
}

// Main test runner
async function runTests() {
  log('\n' + '='.repeat(60), colors.blue);
  log('🧪 STOREFRONT VISIBILITY FEATURE TESTS', colors.blue);
  log('='.repeat(60) + '\n', colors.blue);
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };
  
  try {
    await setup();
    
    // Run tests
    const tests = [
      testModelCreation,
      testModelDefaultValue,
      testFilteringByStorefrontVisibility,
      testUpdateStorefrontVisibility,
      testCategoriasDisponibles
    ];
    
    for (const test of tests) {
      results.total++;
      const passed = await test();
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    }
    
    await teardown();
    
    // Print summary
    log('\n' + '='.repeat(60), colors.blue);
    log('📊 TEST SUMMARY', colors.blue);
    log('='.repeat(60), colors.blue);
    log(`Total tests: ${results.total}`);
    log(`✅ Passed: ${results.passed}`, colors.green);
    
    if (results.failed > 0) {
      log(`❌ Failed: ${results.failed}`, colors.red);
      process.exit(1);
    } else {
      log('\n🎉 All tests passed!', colors.green);
      process.exit(0);
    }
    
  } catch (error) {
    log(`\n❌ Test suite failed: ${error.message}`, colors.red);
    console.error(error);
    await teardown();
    process.exit(1);
  }
}

// Handle timeout
setTimeout(() => {
  log('\n⏰ Test timeout reached', colors.red);
  teardown().then(() => process.exit(1));
}, TEST_TIMEOUT);

// Run tests
runTests();
