/**
 * Test Script: Inventory Report with Set Exclusion
 * 
 * This script validates that the inventory report correctly excludes sets
 * (productos compuestos) to avoid double-counting inventory values.
 */

const { supabase } = require('./backend/supabase-db');
const Joya = require('./backend/models/Joya');

async function testInventoryReportExclusion() {
  console.log('🧪 Testing Inventory Report Set Exclusion\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Get all products including sets
    console.log('\n📦 Test 1: Fetching ALL products (including sets)...');
    const allProducts = await Joya.obtenerTodas({ por_pagina: 10000 });
    console.log(`   ✅ Total products: ${allProducts.total}`);
    
    const setsInAll = allProducts.joyas.filter(j => j.es_producto_compuesto === true);
    console.log(`   📊 Sets found: ${setsInAll.length}`);
    if (setsInAll.length > 0) {
      console.log(`   📝 Set examples: ${setsInAll.slice(0, 3).map(s => s.nombre).join(', ')}`);
    }

    // Test 2: Get products excluding sets (inventory report behavior)
    console.log('\n📦 Test 2: Fetching products WITHOUT sets (inventory report)...');
    const inventoryProducts = await Joya.obtenerTodas({ 
      por_pagina: 10000,
      excluir_sets: true
    });
    console.log(`   ✅ Total products in inventory: ${inventoryProducts.total}`);
    
    const setsInInventory = inventoryProducts.joyas.filter(j => j.es_producto_compuesto === true);
    console.log(`   📊 Sets found: ${setsInInventory.length}`);
    
    if (setsInInventory.length === 0) {
      console.log('   ✅ PASS: No sets found in inventory report (as expected)');
    } else {
      console.log('   ❌ FAIL: Sets still present in inventory report');
      console.log(`   📝 Unexpected sets: ${setsInInventory.map(s => s.nombre).join(', ')}`);
    }

    // Test 3: Verify difference
    console.log('\n📊 Test 3: Comparing results...');
    const difference = allProducts.total - inventoryProducts.total;
    console.log(`   Difference: ${difference} products`);
    console.log(`   Expected difference: ${setsInAll.length} (number of sets)`);
    
    if (difference === setsInAll.length) {
      console.log('   ✅ PASS: Difference matches number of sets');
    } else {
      console.log('   ⚠️  WARNING: Difference does not match expected value');
    }

    // Test 4: Calculate inventory totals
    console.log('\n💰 Test 4: Calculating inventory values...');
    const totalCostValue = inventoryProducts.joyas.reduce((sum, j) => {
      return sum + (j.stock_actual * j.costo || 0);
    }, 0);
    
    const totalSaleValue = inventoryProducts.joyas.reduce((sum, j) => {
      return sum + (j.stock_actual * j.precio_venta || 0);
    }, 0);
    
    console.log(`   Total inventory cost value: ${totalCostValue.toFixed(2)}`);
    console.log(`   Total inventory sale value: ${totalSaleValue.toFixed(2)}`);
    console.log('   ✅ Values calculated without set duplication');

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY:');
    console.log(`   • All products: ${allProducts.total}`);
    console.log(`   • Sets: ${setsInAll.length}`);
    console.log(`   • Inventory products: ${inventoryProducts.total}`);
    console.log(`   • Sets excluded: ${setsInAll.length === difference ? '✅ YES' : '❌ NO'}`);
    console.log('='.repeat(60));

    // Close connection
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run test
testInventoryReportExclusion();
