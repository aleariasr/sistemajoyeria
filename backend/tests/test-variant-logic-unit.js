/**
 * Unit Test: Variant Deduplication Logic
 * 
 * This test validates the deduplication and variant expansion logic
 * without requiring a live server or database connection.
 * 
 * It simulates the exact logic from backend/routes/public.js to ensure:
 * 1. Duplicate parent products are detected and skipped
 * 2. Variants are expanded correctly
 * 3. Each variant has unique properties
 * 4. Products without variants appear only once
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

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Mock data simulating database results
function createMockJoya(id, codigo, hasVariants = false) {
  return {
    id,
    codigo,
    nombre: `Product ${codigo}`,
    descripcion: 'Test product',
    categoria: 'Test',
    precio_venta: 1000,
    moneda: 'CRC',
    stock_actual: 10,
    imagen_url: `https://example.com/img${id}.jpg`,
    es_producto_variante: hasVariants,
    es_producto_compuesto: false
  };
}

function createMockVariante(id, nombre, imagen_url) {
  return {
    id,
    nombre_variante: nombre,
    descripcion_variante: `Variant ${nombre}`,
    imagen_url,
    orden_display: 0,
    activo: true
  };
}

// Simulate the transformToPublicProduct function (matches backend/routes/public.js)
function generateProductSlug(codigo, nombre) {
  return `${codigo.toLowerCase()}-${nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
}

function transformToPublicProduct(joya, includeStock = false, varianteInfo = null) {
  let product = {
    id: joya.id,
    codigo: joya.codigo,
    nombre: joya.nombre,
    descripcion: joya.descripcion,
    categoria: joya.categoria,
    precio: joya.precio_venta,
    moneda: joya.moneda,
    stock_disponible: joya.stock_actual > 0,
    imagen_url: joya.imagen_url,
    imagenes: joya.imagenes || [],
    slug: generateProductSlug(joya.codigo, joya.nombre),
    es_producto_variante: joya.es_producto_variante || false,
    es_producto_compuesto: joya.es_producto_compuesto || false
  };

  // If this is a variant expansion, override image and name
  if (varianteInfo) {
    product.es_variante = true;
    product.variante_id = varianteInfo.id;
    product.variante_nombre = varianteInfo.nombre_variante;
    product.nombre = `${joya.nombre} - ${varianteInfo.nombre_variante}`;
    product.imagen_url = varianteInfo.imagen_url; // CRITICAL: Use variant's specific image
    product.descripcion = varianteInfo.descripcion_variante || joya.descripcion;
    
    // For variants, the main image should be the variant image
    // Override imagenes array to show only the variant image as primary
    product.imagenes = [
      {
        id: 0,
        url: varianteInfo.imagen_url,
        orden: 0,
        es_principal: true
      }
    ];
  }

  return product;
}

// Simulate the product expansion logic from routes/public.js
function expandProducts(joyasFromDB, imagesByJoya, variantesByProducto) {
  const productosExpandidos = [];
  const procesadosIds = new Set(); // Track processed parent products to avoid duplicates

  for (const joya of joyasFromDB) {
    // Skip if this product was already processed
    if (procesadosIds.has(joya.id)) {
      console.warn(`⚠️  Producto duplicado detectado: ${joya.id} - ${joya.codigo}. Saltando...`);
      continue;
    }
    procesadosIds.add(joya.id);

    const imagenes = imagesByJoya[joya.id] || [];
    
    // Don't mutate joya directly - create new object for images
    const joyaConImagenes = {
      ...joya,
      imagenes: imagenes.map(img => ({
        id: img.id,
        url: img.imagen_url,
        orden: img.orden_display,
        es_principal: img.es_principal
      }))
    };

    if (joyaConImagenes.es_producto_variante) {
      const variantes = variantesByProducto[joyaConImagenes.id] || [];
      
      if (variantes.length === 0) {
        console.warn(`⚠️  Producto ${joyaConImagenes.codigo} marcado como variante pero sin variantes activas`);
        continue; // Don't show parent if it has no active variants
      }
      
      for (const variante of variantes) {
        productosExpandidos.push(transformToPublicProduct(joyaConImagenes, false, variante));
      }
    } else {
      productosExpandidos.push(transformToPublicProduct(joyaConImagenes));
    }
  }

  return { productosExpandidos, procesadosIds };
}

// Test 1: No duplication with duplicate input
function testNoDuplication() {
  logInfo('\n=== Test 1: Deduplication with Duplicate Parent Products ===');
  
  // Simulate database returning the same product 3 times (e.g., from a join or query bug)
  const joya1 = createMockJoya(1, 'PROD-001', true);
  const joyasFromDB = [joya1, joya1, joya1]; // Same product 3 times!
  
  const imagesByJoya = {
    1: [{ id: 1, imagen_url: 'https://example.com/img1.jpg', orden_display: 0, es_principal: true }]
  };
  
  // 3 variants for the product
  const variantesByProducto = {
    1: [
      createMockVariante(101, 'Variant A', 'https://example.com/var-a.jpg'),
      createMockVariante(102, 'Variant B', 'https://example.com/var-b.jpg'),
      createMockVariante(103, 'Variant C', 'https://example.com/var-c.jpg')
    ]
  };
  
  const { productosExpandidos, procesadosIds } = expandProducts(joyasFromDB, imagesByJoya, variantesByProducto);
  
  logInfo(`Input: ${joyasFromDB.length} products from DB (3 duplicates of same product)`);
  logInfo(`Unique products processed: ${procesadosIds.size}`);
  logInfo(`Output: ${productosExpandidos.length} expanded products`);
  
  // Should process the parent only once
  if (procesadosIds.size !== 1) {
    logError(`FAILED: Expected 1 unique product, got ${procesadosIds.size}`);
    return false;
  }
  
  // Should expand to exactly 3 variants (not 9!)
  if (productosExpandidos.length !== 3) {
    logError(`FAILED: Expected 3 variants, got ${productosExpandidos.length}`);
    return false;
  }
  
  logSuccess('Test 1 PASSED: Deduplication works correctly (3 variants, not 9)');
  return true;
}

// Test 2: Variants have unique images
function testVariantUniqueImages() {
  logInfo('\n=== Test 2: Variants Have Unique Images ===');
  
  const joya1 = createMockJoya(1, 'PROD-001', true);
  const joyasFromDB = [joya1];
  
  const imagesByJoya = {
    1: [{ id: 1, imagen_url: 'https://example.com/parent.jpg', orden_display: 0, es_principal: true }]
  };
  
  const variantesByProducto = {
    1: [
      createMockVariante(101, 'Variant A', 'https://example.com/var-a.jpg'),
      createMockVariante(102, 'Variant B', 'https://example.com/var-b.jpg'),
      createMockVariante(103, 'Variant C', 'https://example.com/var-c.jpg')
    ]
  };
  
  const { productosExpandidos } = expandProducts(joyasFromDB, imagesByJoya, variantesByProducto);
  
  // Check each variant has its own image, not the parent's
  const images = productosExpandidos.map(p => p.imagen_url);
  const uniqueImages = new Set(images);
  
  logInfo(`Variant images: ${images.join(', ')}`);
  
  if (uniqueImages.size !== 3) {
    logError(`FAILED: Expected 3 unique images, got ${uniqueImages.size}`);
    return false;
  }
  
  // None should use the parent image
  if (images.includes('https://example.com/parent.jpg')) {
    logError('FAILED: Some variant is using parent image instead of variant-specific image');
    return false;
  }
  
  // All should be variant images
  const expectedImages = ['https://example.com/var-a.jpg', 'https://example.com/var-b.jpg', 'https://example.com/var-c.jpg'];
  const allCorrect = images.every(img => expectedImages.includes(img));
  
  if (!allCorrect) {
    logError('FAILED: Not all variants use their specific images');
    return false;
  }
  
  logSuccess('Test 2 PASSED: All variants have unique, correct images');
  return true;
}

// Test 3: Variants have unique names
function testVariantUniqueNames() {
  logInfo('\n=== Test 3: Variants Have Unique Names ===');
  
  const joya1 = createMockJoya(1, 'PROD-001', true);
  const joyasFromDB = [joya1];
  
  const imagesByJoya = { 1: [] };
  
  const variantesByProducto = {
    1: [
      createMockVariante(101, 'Variant A', 'https://example.com/var-a.jpg'),
      createMockVariante(102, 'Variant B', 'https://example.com/var-b.jpg'),
      createMockVariante(103, 'Variant C', 'https://example.com/var-c.jpg')
    ]
  };
  
  const { productosExpandidos } = expandProducts(joyasFromDB, imagesByJoya, variantesByProducto);
  
  const names = productosExpandidos.map(p => p.nombre);
  const uniqueNames = new Set(names);
  
  logInfo(`Variant names: ${names.join(', ')}`);
  
  if (uniqueNames.size !== 3) {
    logError(`FAILED: Expected 3 unique names, got ${uniqueNames.size}`);
    return false;
  }
  
  // Check name format: "Product PROD-001 - Variant X"
  const correctFormat = names.every(name => name.includes(' - Variant '));
  if (!correctFormat) {
    logError('FAILED: Not all variant names follow "Parent - Variant" format');
    return false;
  }
  
  logSuccess('Test 3 PASSED: All variants have unique names in correct format');
  return true;
}

// Test 4: Non-variant products appear once
function testNonVariantProductsAppearOnce() {
  logInfo('\n=== Test 4: Non-Variant Products Appear Only Once ===');
  
  const joya1 = createMockJoya(1, 'PROD-001', false);
  const joya2 = createMockJoya(2, 'PROD-002', false);
  const joyasFromDB = [joya1, joya2];
  
  const imagesByJoya = {
    1: [{ id: 1, imagen_url: 'https://example.com/img1.jpg', orden_display: 0, es_principal: true }],
    2: [{ id: 2, imagen_url: 'https://example.com/img2.jpg', orden_display: 0, es_principal: true }]
  };
  
  const variantesByProducto = {};
  
  const { productosExpandidos } = expandProducts(joyasFromDB, imagesByJoya, variantesByProducto);
  
  logInfo(`Input: ${joyasFromDB.length} non-variant products`);
  logInfo(`Output: ${productosExpandidos.length} products`);
  
  if (productosExpandidos.length !== 2) {
    logError(`FAILED: Expected 2 products, got ${productosExpandidos.length}`);
    return false;
  }
  
  // Check none are marked as variants
  const hasVariants = productosExpandidos.some(p => p.es_variante);
  if (hasVariants) {
    logError('FAILED: Non-variant products incorrectly marked as variants');
    return false;
  }
  
  logSuccess('Test 4 PASSED: Non-variant products appear exactly once');
  return true;
}

// Test 5: Mix of variant and non-variant products
function testMixedProducts() {
  logInfo('\n=== Test 5: Mix of Variant and Non-Variant Products ===');
  
  const joya1 = createMockJoya(1, 'PROD-001', true);  // Has 2 variants
  const joya2 = createMockJoya(2, 'PROD-002', false); // No variants
  const joya3 = createMockJoya(3, 'PROD-003', true);  // Has 3 variants
  const joyasFromDB = [joya1, joya2, joya3];
  
  const imagesByJoya = {
    1: [],
    2: [],
    3: []
  };
  
  const variantesByProducto = {
    1: [
      createMockVariante(101, 'Variant A', 'https://example.com/1a.jpg'),
      createMockVariante(102, 'Variant B', 'https://example.com/1b.jpg')
    ],
    3: [
      createMockVariante(301, 'Variant X', 'https://example.com/3x.jpg'),
      createMockVariante(302, 'Variant Y', 'https://example.com/3y.jpg'),
      createMockVariante(303, 'Variant Z', 'https://example.com/3z.jpg')
    ]
  };
  
  const { productosExpandidos } = expandProducts(joyasFromDB, imagesByJoya, variantesByProducto);
  
  logInfo(`Input: 3 parent products (2 with variants, 1 without)`);
  logInfo(`Output: ${productosExpandidos.length} products`);
  
  // Expected: 2 variants + 1 regular + 3 variants = 6 total
  if (productosExpandidos.length !== 6) {
    logError(`FAILED: Expected 6 products (2+1+3), got ${productosExpandidos.length}`);
    return false;
  }
  
  // Count variant vs non-variant
  const variants = productosExpandidos.filter(p => p.es_variante);
  const nonVariants = productosExpandidos.filter(p => !p.es_variante);
  
  logInfo(`  - Variant products: ${variants.length}`);
  logInfo(`  - Non-variant products: ${nonVariants.length}`);
  
  if (variants.length !== 5) {
    logError(`FAILED: Expected 5 variants, got ${variants.length}`);
    return false;
  }
  
  if (nonVariants.length !== 1) {
    logError(`FAILED: Expected 1 non-variant, got ${nonVariants.length}`);
    return false;
  }
  
  logSuccess('Test 5 PASSED: Mixed products expanded correctly');
  return true;
}

// Test 6: Product marked as variant but with no active variants
function testProductWithNoActiveVariants() {
  logInfo('\n=== Test 6: Product Marked as Variant but No Active Variants ===');
  
  const joya1 = createMockJoya(1, 'PROD-001', true); // Marked as has variants
  const joyasFromDB = [joya1];
  
  const imagesByJoya = { 1: [] };
  const variantesByProducto = { 1: [] }; // No active variants!
  
  const { productosExpandidos } = expandProducts(joyasFromDB, imagesByJoya, variantesByProducto);
  
  logInfo(`Input: 1 product marked as variant with 0 active variants`);
  logInfo(`Output: ${productosExpandidos.length} products`);
  
  // Should be excluded from results
  if (productosExpandidos.length !== 0) {
    logError(`FAILED: Expected 0 products (parent should be hidden), got ${productosExpandidos.length}`);
    return false;
  }
  
  logSuccess('Test 6 PASSED: Product without active variants correctly excluded');
  return true;
}

// Main test runner
async function runAllTests() {
  log('\n' + '='.repeat(60), 'blue');
  log('  VARIANT DEDUPLICATION UNIT TEST SUITE', 'blue');
  log('='.repeat(60) + '\n', 'blue');

  const tests = [
    { name: 'Deduplication with Duplicate Parents', fn: testNoDuplication },
    { name: 'Variants Have Unique Images', fn: testVariantUniqueImages },
    { name: 'Variants Have Unique Names', fn: testVariantUniqueNames },
    { name: 'Non-Variant Products Appear Once', fn: testNonVariantProductsAppearOnce },
    { name: 'Mix of Variant and Non-Variant', fn: testMixedProducts },
    { name: 'Product With No Active Variants', fn: testProductWithNoActiveVariants }
  ];

  const results = [];

  for (const test of tests) {
    try {
      const result = test.fn();
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
    logSuccess('All unit tests passed! 🎉');
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
  testNoDuplication,
  testVariantUniqueImages,
  testVariantUniqueNames,
  testNonVariantProductsAppearOnce,
  testMixedProducts,
  testProductWithNoActiveVariants
};
