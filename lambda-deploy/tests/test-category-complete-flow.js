/**
 * Test del Flujo Completo: Frontend → Backend → Database
 * 
 * Este test documenta y verifica el flujo completo de filtrado por categorías
 * desde el storefront hasta la base de datos.
 */

const { supabase } = require('../supabase-db');
const Joya = require('../models/Joya');

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

async function testCompleteFlow() {
  log('\n🔄 Testing Complete Category Filter Flow', colors.blue);
  log('='.repeat(60), colors.blue);

  try {
    // Paso 1: Obtener categorías disponibles (como lo hace el frontend)
    log('\n📝 Step 1: Get available categories from API', colors.blue);
    const categoriasAPI = await Joya.obtenerCategoriasDisponibles();
    log(`   API returns: ${JSON.stringify(categoriasAPI)}`, colors.reset);
    
    if (categoriasAPI.length === 0) {
      log('⚠️  No categories found. Make sure there are active products with stock.', colors.yellow);
      return true;
    }

    // Paso 2: Simular lo que hace el frontend
    for (const categoriaOriginal of categoriasAPI) {
      log(`\n📝 Step 2: User clicks category "${categoriaOriginal}"`, colors.blue);
      
      // Frontend normaliza a minúsculas (como en page.tsx línea 35)
      const categoriaNormalizada = categoriaOriginal.toLowerCase();
      log(`   Frontend normalizes to: "${categoriaNormalizada}"`, colors.reset);
      
      // Paso 3: Frontend envía request al backend con categoría normalizada
      log(`\n📝 Step 3: Frontend sends API request with category="${categoriaNormalizada}"`, colors.blue);
      
      // Backend recibe y procesa (como en public.js)
      const filtros = {
        estado: 'Activo',
        con_stock: true,
        mostrar_en_storefront: true,
        categoria: categoriaNormalizada, // Minúscula del frontend
        pagina: 1,
        por_pagina: 50
      };
      
      // Paso 4: Backend ejecuta query con ilike (case-insensitive)
      log(`\n📝 Step 4: Backend queries with ilike (case-insensitive)`, colors.blue);
      const resultado = await Joya.obtenerTodas(filtros);
      
      // Paso 5: Verificar resultados
      log(`\n📝 Step 5: Verify results`, colors.blue);
      if (resultado.joyas.length === 0) {
        log(`   ❌ ERROR: No products found for category "${categoriaNormalizada}"`, colors.red);
        log(`   Expected to match database category "${categoriaOriginal}"`, colors.red);
        return false;
      }
      
      log(`   ✅ Found ${resultado.joyas.length} products`, colors.green);
      
      // Verificar que todos los productos tienen la categoría correcta (case-insensitive)
      const wrongCategory = resultado.joyas.find(
        j => j.categoria.toLowerCase() !== categoriaNormalizada
      );
      
      if (wrongCategory) {
        log(`   ❌ ERROR: Found product with wrong category: "${wrongCategory.categoria}"`, colors.red);
        return false;
      }
      
      log(`   ✅ All products match category "${categoriaOriginal}"`, colors.green);
      log(`   ✅ Flow works: "${categoriaOriginal}" → "${categoriaNormalizada}" → database match`, colors.green);
    }

    // Test adicional: Verificar que categorías inexistentes no devuelven nada
    log(`\n📝 Additional Test: Non-existent category`, colors.blue);
    const nonExistent = await Joya.obtenerTodas({
      estado: 'Activo',
      con_stock: true,
      mostrar_en_storefront: true,
      categoria: 'categoriaquenoexiste123',
      pagina: 1,
      por_pagina: 50
    });
    
    if (nonExistent.joyas.length === 0) {
      log(`   ✅ Correctly returns 0 products for non-existent category`, colors.green);
    } else {
      log(`   ❌ ERROR: Should return 0 products for non-existent category`, colors.red);
      return false;
    }

    log('\n' + '='.repeat(60), colors.green);
    log('🎉 Complete flow test passed!', colors.green);
    log('='.repeat(60), colors.green);
    log('\nFlow Summary:', colors.blue);
    log('1. API returns categories: ["Anillos", "Collares", ...]', colors.reset);
    log('2. User clicks "Anillos"', colors.reset);
    log('3. Frontend normalizes to "anillos" (lowercase)', colors.reset);
    log('4. Backend receives category="anillos"', colors.reset);
    log('5. Backend uses ilike for case-insensitive match', colors.reset);
    log('6. Database finds "Anillos" products ✅', colors.green);
    
    return true;

  } catch (error) {
    log(`\n❌ Test failed with error: ${error.message}`, colors.red);
    console.error(error);
    return false;
  }
}

// Run the test
testCompleteFlow()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
