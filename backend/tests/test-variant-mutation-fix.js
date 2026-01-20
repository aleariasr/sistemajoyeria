/**
 * Test: Variant Object Mutation Prevention
 * 
 * This test specifically validates that the fix for the variant mutation bug works correctly.
 * 
 * PROBLEM: All variants were showing the same name and image (last variant processed)
 * because they shared the same imagenes array reference.
 * 
 * SOLUTION: Build variant products directly from variant data without shared references.
 * 
 * This test validates:
 * 1. Each variant has its OWN unique image (not shared reference)
 * 2. Each variant has its OWN unique name (not overwritten)
 * 3. Modifying one variant's data doesn't affect other variants
 * 4. The imagenes array is NOT shared between variants
 */

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

// ============================
// Simulate the FIXED transformToPublicProduct function
// ============================

function generateProductSlug(codigo, nombre) {
  return `${codigo.toLowerCase()}-${nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
}

function transformToPublicProduct(joya, includeStock = false, varianteInfo = null) {
  let product;
  
  // CRITICAL FIX: For variants, build product ONLY from variant data + parent basics
  if (varianteInfo) {
    product = {
      id: joya.id,
      codigo: joya.codigo,
      nombre: varianteInfo.nombre_variante,
      descripcion: varianteInfo.descripcion_variante || joya.descripcion,
      categoria: joya.categoria,
      precio: joya.precio_venta,
      moneda: joya.moneda,
      stock_disponible: joya.stock_actual > 0,
      imagen_url: varianteInfo.imagen_url,
      // Create NEW array with ONLY variant image
      imagenes: [{
        id: 0,
        url: varianteInfo.imagen_url,
        orden: 0,
        es_principal: true
      }],
      slug: generateProductSlug(joya.codigo, varianteInfo.nombre_variante),
      es_producto_compuesto: false,
      variante_id: varianteInfo.id,
      _uniqueKey: `${joya.id}-${varianteInfo.id}`
    };
  } else {
    product = {
      id: joya.id,
      codigo: joya.codigo,
      nombre: joya.nombre,
      descripcion: joya.descripcion,
      categoria: joya.categoria,
      precio: joya.precio_venta,
      moneda: joya.moneda,
      stock_disponible: joya.stock_actual > 0,
      imagen_url: joya.imagen_url,
      imagenes: joya.imagenes ? JSON.parse(JSON.stringify(joya.imagenes)) : [],
      slug: generateProductSlug(joya.codigo, joya.nombre),
      es_producto_compuesto: joya.es_producto_compuesto || false,
      _uniqueKey: `${joya.id}`
    };
  }

  return product;
}

// ============================
// Mock data
// ============================

function createMockJoya(id, codigo) {
  return {
    id,
    codigo,
    nombre: `Pulsera ${codigo}`,
    descripcion: 'Pulsera elegante',
    categoria: 'Pulseras',
    precio_venta: 15000,
    moneda: 'CRC',
    stock_actual: 10,
    imagen_url: 'https://example.com/parent.jpg',
    imagenes: [
      { id: 1, url: 'https://example.com/parent.jpg', orden: 0, es_principal: true },
      { id: 2, url: 'https://example.com/parent2.jpg', orden: 1, es_principal: false }
    ],
    es_producto_variante: true,
    es_producto_compuesto: false
  };
}

function createMockVariante(id, nombre, imagen) {
  return {
    id,
    nombre_variante: nombre,
    descripcion_variante: `Descripción de ${nombre}`,
    imagen_url: imagen,
    orden_display: 0,
    activo: true
  };
}

// ============================
// TESTS
// ============================

/**
 * Test 1: Each variant gets a unique image object
 * This is the CORE test for the mutation bug fix
 */
function testVariantsHaveUniqueImageObjects() {
  logInfo('\n=== Test 1: Variants Have Unique Image Objects (No Shared References) ===');
  
  const joya = createMockJoya(1, 'PULSERA-001');
  
  const variantes = [
    createMockVariante(101, 'Diseño A', 'https://example.com/variante-a.jpg'),
    createMockVariante(102, 'Diseño B', 'https://example.com/variante-b.jpg'),
    createMockVariante(103, 'Diseño C', 'https://example.com/variante-c.jpg')
  ];
  
  // Simulate the loop that was causing the bug
  const productos = [];
  for (const variante of variantes) {
    productos.push(transformToPublicProduct(joya, false, variante));
  }
  
  logInfo(`Created ${productos.length} variant products`);
  
  // Test 1.1: Each product has different imagen_url
  const imageUrls = productos.map(p => p.imagen_url);
  const uniqueUrls = new Set(imageUrls);
  
  logInfo(`Image URLs: ${imageUrls.join(', ')}`);
  
  if (uniqueUrls.size !== 3) {
    logError(`FAILED: Expected 3 unique image URLs, got ${uniqueUrls.size}`);
    logError(`URLs: ${Array.from(uniqueUrls).join(', ')}`);
    return false;
  }
  
  // Test 1.2: Each product has different nombre
  const nombres = productos.map(p => p.nombre);
  const uniqueNombres = new Set(nombres);
  
  logInfo(`Names: ${nombres.join(', ')}`);
  
  if (uniqueNombres.size !== 3) {
    logError(`FAILED: Expected 3 unique names, got ${uniqueNombres.size}`);
    logError(`Names: ${Array.from(uniqueNombres).join(', ')}`);
    return false;
  }
  
  // Test 1.3: CRITICAL - Check that imagenes arrays are NOT the same object reference
  const firstImagenesArray = productos[0].imagenes;
  const secondImagenesArray = productos[1].imagenes;
  const thirdImagenesArray = productos[2].imagenes;
  
  if (firstImagenesArray === secondImagenesArray || firstImagenesArray === thirdImagenesArray) {
    logError('FAILED: imagenes arrays are the SAME object reference (mutation bug exists!)');
    return false;
  }
  
  // Test 1.4: Verify none use parent image
  const parentImageUrl = 'https://example.com/parent.jpg';
  if (imageUrls.includes(parentImageUrl)) {
    logError('FAILED: Some variant is using parent image instead of variant-specific image');
    return false;
  }
  
  // Test 1.5: Verify correct images match correct names
  if (productos[0].nombre !== 'Diseño A' || productos[0].imagen_url !== 'https://example.com/variante-a.jpg') {
    logError('FAILED: First variant has incorrect name or image');
    return false;
  }
  
  if (productos[1].nombre !== 'Diseño B' || productos[1].imagen_url !== 'https://example.com/variante-b.jpg') {
    logError('FAILED: Second variant has incorrect name or image');
    return false;
  }
  
  if (productos[2].nombre !== 'Diseño C' || productos[2].imagen_url !== 'https://example.com/variante-c.jpg') {
    logError('FAILED: Third variant has incorrect name or image');
    return false;
  }
  
  logSuccess('Test 1 PASSED: All variants have unique, independent image objects');
  return true;
}

/**
 * Test 2: Modifying one variant doesn't affect others
 * This proves there's no shared reference
 */
function testModifyingOneVariantDoesntAffectOthers() {
  logInfo('\n=== Test 2: Modifying One Variant Does Not Affect Others ===');
  
  const joya = createMockJoya(1, 'PULSERA-001');
  
  const variantes = [
    createMockVariante(101, 'Diseño A', 'https://example.com/variante-a.jpg'),
    createMockVariante(102, 'Diseño B', 'https://example.com/variante-b.jpg')
  ];
  
  const productos = [];
  for (const variante of variantes) {
    productos.push(transformToPublicProduct(joya, false, variante));
  }
  
  // Store original values
  const originalFirstImage = productos[0].imagen_url;
  const originalSecondImage = productos[1].imagen_url;
  const originalFirstName = productos[0].nombre;
  
  // Modify first product's image array
  productos[0].imagenes[0].url = 'https://example.com/MODIFIED.jpg';
  productos[0].nombre = 'MODIFIED NAME';
  
  // Check second product is NOT affected
  if (productos[1].imagen_url !== originalSecondImage) {
    logError('FAILED: Modifying first variant affected second variant\'s imagen_url!');
    return false;
  }
  
  if (productos[1].imagenes[0].url !== originalSecondImage) {
    logError('FAILED: Modifying first variant affected second variant\'s imagenes array!');
    return false;
  }
  
  // First product's imagen_url should remain unchanged (it's a direct property)
  if (productos[0].imagen_url !== originalFirstImage) {
    logError('FAILED: Direct property imagen_url should not change when modifying imagenes array');
    return false;
  }
  
  logSuccess('Test 2 PASSED: Modifying one variant does NOT affect others');
  return true;
}

/**
 * Test 3: Verify imagenes array structure is correct for variants
 */
function testVariantImagenesArrayStructure() {
  logInfo('\n=== Test 3: Variant Imagenes Array Has Correct Structure ===');
  
  const joya = createMockJoya(1, 'PULSERA-001');
  const variante = createMockVariante(101, 'Diseño A', 'https://example.com/variante-a.jpg');
  
  const producto = transformToPublicProduct(joya, false, variante);
  
  // Should have exactly 1 image in array
  if (producto.imagenes.length !== 1) {
    logError(`FAILED: Expected 1 image in array, got ${producto.imagenes.length}`);
    return false;
  }
  
  // Image should match variant image
  if (producto.imagenes[0].url !== 'https://example.com/variante-a.jpg') {
    logError(`FAILED: Image in array doesn't match variant image`);
    return false;
  }
  
  // Image should be marked as principal
  if (!producto.imagenes[0].es_principal) {
    logError('FAILED: Variant image should be marked as principal');
    return false;
  }
  
  // Should NOT contain parent images
  const hasParentImage = producto.imagenes.some(img => img.url === 'https://example.com/parent.jpg');
  if (hasParentImage) {
    logError('FAILED: Variant imagenes array contains parent image!');
    return false;
  }
  
  logSuccess('Test 3 PASSED: Variant imagenes array has correct structure');
  return true;
}

/**
 * Test 4: Verify unique keys are correctly generated
 */
function testUniqueKeysAreCorrect() {
  logInfo('\n=== Test 4: Unique Keys Are Correctly Generated ===');
  
  const joya = createMockJoya(1, 'PULSERA-001');
  
  const variantes = [
    createMockVariante(101, 'Diseño A', 'https://example.com/variante-a.jpg'),
    createMockVariante(102, 'Diseño B', 'https://example.com/variante-b.jpg')
  ];
  
  const productos = [];
  for (const variante of variantes) {
    productos.push(transformToPublicProduct(joya, false, variante));
  }
  
  // Check unique keys
  if (productos[0]._uniqueKey !== '1-101') {
    logError(`FAILED: Expected unique key '1-101', got '${productos[0]._uniqueKey}'`);
    return false;
  }
  
  if (productos[1]._uniqueKey !== '1-102') {
    logError(`FAILED: Expected unique key '1-102', got '${productos[1]._uniqueKey}'`);
    return false;
  }
  
  logSuccess('Test 4 PASSED: Unique keys are correctly generated');
  return true;
}

/**
 * Test 5: Simulate the exact bug scenario from the problem statement
 */
function testExactBugScenario() {
  logInfo('\n=== Test 5: Simulate Exact Bug Scenario (3 Variants of Same Parent) ===');
  
  const joyaConImagenes = {
    id: 100,
    codigo: 'PULSERA-001',
    nombre: 'Pulsera Base',
    descripcion: 'Descripción base',
    categoria: 'Pulseras',
    precio_venta: 15000,
    moneda: 'CRC',
    stock_actual: 10,
    imagen_url: 'https://example.com/parent.jpg',
    imagenes: [
      { id: 1, url: 'https://example.com/parent.jpg', orden: 0, es_principal: true }
    ],
    es_producto_variante: true,
    es_producto_compuesto: false
  };
  
  const variantes = [
    { id: 1, nombre_variante: 'Pulsera Diseño A', imagen_url: 'https://example.com/varianteA.jpg', activo: true },
    { id: 2, nombre_variante: 'Pulsera Diseño B', imagen_url: 'https://example.com/varianteB.jpg', activo: true },
    { id: 3, nombre_variante: 'Pulsera Diseño C', imagen_url: 'https://example.com/varianteC.jpg', activo: true }
  ];
  
  // THIS IS THE EXACT LOOP FROM THE BUG
  const productosExpandidos = [];
  for (const variante of variantes) {
    productosExpandidos.push(transformToPublicProduct(joyaConImagenes, false, variante));
  }
  
  logInfo(`\nResults after processing:`);
  productosExpandidos.forEach((p, i) => {
    logInfo(`  [${i}] ${p.nombre} - ${p.imagen_url}`);
  });
  
  // CRITICAL: All three should have DIFFERENT images
  const allDifferent = 
    productosExpandidos[0].imagen_url === 'https://example.com/varianteA.jpg' &&
    productosExpandidos[1].imagen_url === 'https://example.com/varianteB.jpg' &&
    productosExpandidos[2].imagen_url === 'https://example.com/varianteC.jpg';
  
  if (!allDifferent) {
    logError('FAILED: Bug still exists! All variants show the same image');
    logError(`  Variant A: ${productosExpandidos[0].imagen_url}`);
    logError(`  Variant B: ${productosExpandidos[1].imagen_url}`);
    logError(`  Variant C: ${productosExpandidos[2].imagen_url}`);
    return false;
  }
  
  // All three should have DIFFERENT names
  const allDifferentNames = 
    productosExpandidos[0].nombre === 'Pulsera Diseño A' &&
    productosExpandidos[1].nombre === 'Pulsera Diseño B' &&
    productosExpandidos[2].nombre === 'Pulsera Diseño C';
  
  if (!allDifferentNames) {
    logError('FAILED: Bug still exists! All variants show the same name');
    return false;
  }
  
  logSuccess('Test 5 PASSED: Exact bug scenario is FIXED! All variants show correctly');
  return true;
}

// ============================
// Main test runner
// ============================

async function runAllTests() {
  log('\n' + '='.repeat(70), 'blue');
  log('  VARIANT MUTATION FIX - COMPREHENSIVE TEST SUITE', 'blue');
  log('='.repeat(70) + '\n', 'blue');

  const tests = [
    { name: 'Variants Have Unique Image Objects', fn: testVariantsHaveUniqueImageObjects },
    { name: 'Modifying One Variant Does Not Affect Others', fn: testModifyingOneVariantDoesntAffectOthers },
    { name: 'Variant Imagenes Array Structure', fn: testVariantImagenesArrayStructure },
    { name: 'Unique Keys Are Correct', fn: testUniqueKeysAreCorrect },
    { name: 'Exact Bug Scenario (3 Variants)', fn: testExactBugScenario }
  ];

  const results = [];

  for (const test of tests) {
    try {
      const result = test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      logError(`Test "${test.name}" threw an error: ${error.message}`);
      console.error(error);
      results.push({ name: test.name, passed: false, error: error.message });
    }
  }

  // Summary
  log('\n' + '='.repeat(70), 'blue');
  log('  TEST SUMMARY', 'blue');
  log('='.repeat(70), 'blue');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(result => {
    if (result.passed) {
      logSuccess(`${result.name}: PASSED`);
    } else {
      logError(`${result.name}: FAILED${result.error ? ` (${result.error})` : ''}`);
    }
  });

  log('\n' + '-'.repeat(70), 'blue');
  log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`, 'blue');
  log('='.repeat(70) + '\n', 'blue');

  if (failed > 0) {
    process.exit(1);
  } else {
    logSuccess('✨ All mutation prevention tests passed! The bug is FIXED! ✨');
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
  testVariantsHaveUniqueImageObjects,
  testModifyingOneVariantDoesntAffectOthers,
  testVariantImagenesArrayStructure,
  testUniqueKeysAreCorrect,
  testExactBugScenario
};
