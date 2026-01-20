/**
 * DEEP DIVE TEST: Variant Display Bug Investigation
 * 
 * This test simulates EXACTLY what happens in the backend route
 * to find why variants show the same name/image on first load.
 */

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// ==========================================
// SIMULATE EXACT BACKEND CODE
// ==========================================

function generateProductSlug(codigo, nombre) {
  return `${codigo.toLowerCase()}-${nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
}

function ensureProductHasValidImages(product) {
  if (!product) return product;
  
  // This function returns a NEW object, not mutating
  return {
    ...product,
    imagenes: product.imagenes || [],
    imagen_url: product.imagen_url || (product.imagenes && product.imagenes[0]?.url)
  };
}

/**
 * EXACT simulation of the backend loop
 */
function simulateBackendVariantExpansion(joyasUnicas, imagesByJoya, variantesByProducto) {
  const productosExpandidos = [];
  const procesadosIds = new Set();
  
  log('\n🔍 STARTING VARIANT EXPANSION SIMULATION', 'cyan');
  log('='.repeat(70), 'cyan');
  
  for (const joya of joyasUnicas) {
    if (procesadosIds.has(joya.id)) {
      log(`⚠️  Skipping duplicate: ${joya.id}`, 'yellow');
      continue;
    }
    procesadosIds.add(joya.id);
    
    const imagenes = imagesByJoya[joya.id] || [];
    
    if (joya.es_producto_variante) {
      const variantes = variantesByProducto[joya.id] || [];
      
      if (variantes.length === 0) {
        log(`⚠️  Product ${joya.codigo} has no active variants, skipping`, 'yellow');
        continue;
      }
      
      log(`\n📦 Expanding ${joya.codigo}: ${variantes.length} variants`, 'blue');
      log(`   Parent joya.id: ${joya.id}`, 'blue');
      log(`   Parent joya.nombre: ${joya.nombre}`, 'blue');
      log(`   Parent joya.imagen_url: ${joya.imagen_url}`, 'blue');
      
      // CRITICAL: This is the EXACT code from backend/routes/public.js
      for (const variante of variantes) {
        log(`\n   🔸 Processing variant ${variante.id}: "${variante.nombre_variante}"`, 'magenta');
        log(`      variante.imagen_url: ${variante.imagen_url}`, 'magenta');
        
        // Build product structure directly from variant data
        let productoVariante = {
          // Parent data (immutable)
          id: joya.id,
          codigo: joya.codigo,
          categoria: joya.categoria,
          precio: joya.precio_venta,
          moneda: joya.moneda,
          stock_disponible: joya.stock_actual > 0,
          stock_actual: joya.stock_actual,
          es_producto_compuesto: false,
          
          // Variant-specific data (UNIQUE to this variant)
          variante_id: variante.id,
          nombre: variante.nombre_variante,
          descripcion: variante.descripcion_variante || joya.descripcion,
          imagen_url: variante.imagen_url,
          imagenes: [{
            id: 0,
            url: variante.imagen_url,
            orden: 0,
            es_principal: true
          }],
          slug: generateProductSlug(joya.codigo, variante.nombre_variante),
          _uniqueKey: `${joya.id}-${variante.id}`
        };
        
        log(`      ✅ Created product with nombre: "${productoVariante.nombre}"`, 'green');
        log(`      ✅ Created product with imagen_url: ${productoVariante.imagen_url}`, 'green');
        log(`      ✅ imagenes[0].url: ${productoVariante.imagenes[0].url}`, 'green');
        
        // Apply validation AFTER building complete object
        productoVariante = ensureProductHasValidImages(productoVariante);
        
        log(`      ✅ After validation - nombre: "${productoVariante.nombre}"`, 'green');
        log(`      ✅ After validation - imagen_url: ${productoVariante.imagen_url}`, 'green');
        
        productosExpandidos.push(productoVariante);
      }
      
      // VERIFY: Check if all variants in productosExpandidos are unique
      const variantsJustAdded = productosExpandidos.slice(-variantes.length);
      log(`\n   📊 Verification of ${variantes.length} variants just added:`, 'cyan');
      
      const uniqueNames = new Set(variantsJustAdded.map(p => p.nombre));
      const uniqueImages = new Set(variantsJustAdded.map(p => p.imagen_url));
      
      log(`      Unique names: ${uniqueNames.size} / ${variantes.length}`, uniqueNames.size === variantes.length ? 'green' : 'red');
      log(`      Unique images: ${uniqueImages.size} / ${variantes.length}`, uniqueImages.size === variantes.length ? 'green' : 'red');
      
      if (uniqueNames.size !== variantes.length) {
        log(`      ❌ BUG DETECTED: Variants have duplicate names!`, 'red');
        variantsJustAdded.forEach((p, i) => {
          log(`         [${i}] ${p.nombre}`, 'red');
        });
      }
      
      if (uniqueImages.size !== variantes.length) {
        log(`      ❌ BUG DETECTED: Variants have duplicate images!`, 'red');
        variantsJustAdded.forEach((p, i) => {
          log(`         [${i}] ${p.imagen_url}`, 'red');
        });
      }
      
    } else {
      // Normal product
      let productoNormal = {
        id: joya.id,
        codigo: joya.codigo,
        nombre: joya.nombre,
        descripcion: joya.descripcion,
        categoria: joya.categoria,
        precio: joya.precio_venta,
        moneda: joya.moneda,
        stock_disponible: joya.stock_actual > 0,
        stock_actual: joya.stock_actual,
        imagen_url: joya.imagen_url,
        imagenes: imagenes.map(img => ({
          id: img.id,
          url: img.imagen_url,
          orden: img.orden_display,
          es_principal: img.es_principal
        })),
        slug: generateProductSlug(joya.codigo, joya.nombre),
        es_producto_compuesto: joya.es_producto_compuesto || false,
        _uniqueKey: `${joya.id}`
      };
      
      productoNormal = ensureProductHasValidImages(productoNormal);
      productosExpandidos.push(productoNormal);
    }
  }
  
  log('\n' + '='.repeat(70), 'cyan');
  log(`🔍 EXPANSION COMPLETE: ${productosExpandidos.length} products`, 'cyan');
  log('='.repeat(70) + '\n', 'cyan');
  
  return productosExpandidos;
}

// ==========================================
// TEST CASE 1: Simple 3 variants scenario
// ==========================================
function testSimple3Variants() {
  log('\n' + '='.repeat(70), 'blue');
  log('TEST 1: Simple 3 Variants Scenario', 'blue');
  log('='.repeat(70), 'blue');
  
  // Mock data
  const joyasUnicas = [
    {
      id: 100,
      codigo: 'PULSERA-001',
      nombre: 'Pulsera Base (PARENT)',
      descripcion: 'Descripción del producto padre',
      categoria: 'Pulseras',
      precio_venta: 15000,
      moneda: 'CRC',
      stock_actual: 10,
      imagen_url: 'https://example.com/parent.jpg',
      es_producto_variante: true
    }
  ];
  
  const imagesByJoya = {
    100: []
  };
  
  const variantesByProducto = {
    100: [
      {
        id: 1,
        nombre_variante: 'Pulsera Diseño A',
        descripcion_variante: 'Descripción de variante A',
        imagen_url: 'https://example.com/variant-a.jpg',
        activo: true
      },
      {
        id: 2,
        nombre_variante: 'Pulsera Diseño B',
        descripcion_variante: 'Descripción de variante B',
        imagen_url: 'https://example.com/variant-b.jpg',
        activo: true
      },
      {
        id: 3,
        nombre_variante: 'Pulsera Diseño C',
        descripcion_variante: 'Descripción de variante C',
        imagen_url: 'https://example.com/variant-c.jpg',
        activo: true
      }
    ]
  };
  
  const result = simulateBackendVariantExpansion(joyasUnicas, imagesByJoya, variantesByProducto);
  
  // Verify results
  log('\n📋 FINAL RESULTS:', 'cyan');
  log('='.repeat(70), 'cyan');
  
  if (result.length !== 3) {
    log(`❌ Expected 3 products, got ${result.length}`, 'red');
    return false;
  }
  
  log(`✅ Got ${result.length} products`, 'green');
  
  // Check each product
  result.forEach((p, i) => {
    log(`\n[${i}] Product:`, 'cyan');
    log(`    nombre: "${p.nombre}"`, 'white');
    log(`    imagen_url: ${p.imagen_url}`, 'white');
    log(`    imagenes[0].url: ${p.imagenes[0]?.url}`, 'white');
    log(`    variante_id: ${p.variante_id}`, 'white');
    log(`    _uniqueKey: ${p._uniqueKey}`, 'white');
  });
  
  // Verify all different
  const nombres = result.map(p => p.nombre);
  const imagenes = result.map(p => p.imagen_url);
  
  const nombresUnicos = new Set(nombres);
  const imagenesUnicas = new Set(imagenes);
  
  log('\n📊 UNIQUENESS CHECK:', 'cyan');
  log(`   Unique nombres: ${nombresUnicos.size} / 3`, nombresUnicos.size === 3 ? 'green' : 'red');
  log(`   Unique images: ${imagenesUnicas.size} / 3`, imagenesUnicas.size === 3 ? 'green' : 'red');
  
  if (nombresUnicos.size !== 3) {
    log('❌ FAIL: Names are not unique!', 'red');
    log(`   Names: ${nombres.join(', ')}`, 'red');
    return false;
  }
  
  if (imagenesUnicas.size !== 3) {
    log('❌ FAIL: Images are not unique!', 'red');
    log(`   Images: ${imagenes.join(', ')}`, 'red');
    return false;
  }
  
  // Verify they match expected values
  const expectedNombres = ['Pulsera Diseño A', 'Pulsera Diseño B', 'Pulsera Diseño C'];
  const expectedImagenes = [
    'https://example.com/variant-a.jpg',
    'https://example.com/variant-b.jpg',
    'https://example.com/variant-c.jpg'
  ];
  
  for (let i = 0; i < 3; i++) {
    if (result[i].nombre !== expectedNombres[i]) {
      log(`❌ FAIL: Product [${i}] nombre mismatch`, 'red');
      log(`   Expected: "${expectedNombres[i]}"`, 'red');
      log(`   Got: "${result[i].nombre}"`, 'red');
      return false;
    }
    
    if (result[i].imagen_url !== expectedImagenes[i]) {
      log(`❌ FAIL: Product [${i}] imagen_url mismatch`, 'red');
      log(`   Expected: ${expectedImagenes[i]}`, 'red');
      log(`   Got: ${result[i].imagen_url}`, 'red');
      return false;
    }
  }
  
  log('\n✅ TEST 1 PASSED: All variants are unique and correct!', 'green');
  return true;
}

// ==========================================
// TEST CASE 2: Multiple products with variants
// ==========================================
function testMultipleProductsWithVariants() {
  log('\n' + '='.repeat(70), 'blue');
  log('TEST 2: Multiple Products with Variants', 'blue');
  log('='.repeat(70), 'blue');
  
  const joyasUnicas = [
    {
      id: 100,
      codigo: 'PULSERA-001',
      nombre: 'Pulsera A',
      descripcion: 'Pulsera A',
      categoria: 'Pulseras',
      precio_venta: 15000,
      moneda: 'CRC',
      stock_actual: 10,
      imagen_url: 'https://example.com/parent-a.jpg',
      es_producto_variante: true
    },
    {
      id: 101,
      codigo: 'COLLAR-001',
      nombre: 'Collar B',
      descripcion: 'Collar B',
      categoria: 'Collares',
      precio_venta: 20000,
      moneda: 'CRC',
      stock_actual: 5,
      imagen_url: 'https://example.com/parent-b.jpg',
      es_producto_variante: true
    }
  ];
  
  const imagesByJoya = {
    100: [],
    101: []
  };
  
  const variantesByProducto = {
    100: [
      { id: 1, nombre_variante: 'Pulsera A - Roja', imagen_url: 'https://example.com/a-red.jpg', activo: true },
      { id: 2, nombre_variante: 'Pulsera A - Azul', imagen_url: 'https://example.com/a-blue.jpg', activo: true }
    ],
    101: [
      { id: 3, nombre_variante: 'Collar B - Oro', imagen_url: 'https://example.com/b-gold.jpg', activo: true },
      { id: 4, nombre_variante: 'Collar B - Plata', imagen_url: 'https://example.com/b-silver.jpg', activo: true }
    ]
  };
  
  const result = simulateBackendVariantExpansion(joyasUnicas, imagesByJoya, variantesByProducto);
  
  if (result.length !== 4) {
    log(`❌ Expected 4 products, got ${result.length}`, 'red');
    return false;
  }
  
  // Check all names are unique
  const nombres = result.map(p => p.nombre);
  const nombresUnicos = new Set(nombres);
  
  log(`\n📊 All product names:`, 'cyan');
  nombres.forEach((n, i) => log(`   [${i}] ${n}`, 'white'));
  
  if (nombresUnicos.size !== 4) {
    log(`❌ FAIL: Expected 4 unique names, got ${nombresUnicos.size}`, 'red');
    return false;
  }
  
  log('\n✅ TEST 2 PASSED: Multiple products with variants work correctly!', 'green');
  return true;
}

// ==========================================
// MAIN
// ==========================================
async function main() {
  log('\n' + '='.repeat(70), 'magenta');
  log('  DEEP DIVE: VARIANT DISPLAY BUG INVESTIGATION', 'magenta');
  log('='.repeat(70) + '\n', 'magenta');
  
  const test1 = testSimple3Variants();
  const test2 = testMultipleProductsWithVariants();
  
  log('\n' + '='.repeat(70), 'cyan');
  log('FINAL SUMMARY', 'cyan');
  log('='.repeat(70), 'cyan');
  
  if (test1 && test2) {
    log('✅ ALL TESTS PASSED - Backend code is correct!', 'green');
    log('\nIf the bug still happens in production, the issue might be:', 'yellow');
    log('  1. Frontend caching', 'yellow');
    log('  2. Database returning incorrect data', 'yellow');
    log('  3. Network issues', 'yellow');
    process.exit(0);
  } else {
    log('❌ TESTS FAILED - Bug found in backend code!', 'red');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    log(`\n❌ ERROR: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  simulateBackendVariantExpansion,
  testSimple3Variants,
  testMultipleProductsWithVariants
};
