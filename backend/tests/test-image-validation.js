/**
 * Test de validación de imágenes
 * Verifica que las funciones de validación de URLs de imágenes funcionen correctamente
 */

const imageValidation = require('../utils/imageValidation');

console.log('🧪 Test de Validación de Imágenes\n');
console.log('='.repeat(60));

let testsPassed = 0;
let testsFailed = 0;

function test(description, testFn) {
  try {
    testFn();
    console.log(`✅ ${description}`);
    testsPassed++;
  } catch (error) {
    console.error(`❌ ${description}`);
    console.error(`   Error: ${error.message}`);
    testsFailed++;
  }
}

// Test 1: URLs de Cloudinary válidas
test('Debe validar URLs de Cloudinary correctamente', () => {
  const urls = [
    'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    'https://res.cloudinary.com/test/image/upload/v1234567890/path/image.png',
    'https://res.cloudinary.com/test/image/upload/w_800,h_800,c_fill/test.webp'
  ];
  
  urls.forEach(url => {
    if (!imageValidation.isValidImageUrl(url)) {
      throw new Error(`URL de Cloudinary rechazada incorrectamente: ${url}`);
    }
  });
  console.log(`   ✓ ${urls.length} URLs de Cloudinary validadas`);
});

// Test 2: URLs de imágenes estándar válidas
test('Debe validar URLs de imágenes estándar', () => {
  const urls = [
    'https://example.com/image.jpg',
    'https://example.com/photo.png',
    'http://test.com/pic.jpeg',
    'https://cdn.example.com/assets/image.webp',
    'https://example.com/img.gif',
    'https://example.com/icon.svg'
  ];
  
  urls.forEach(url => {
    if (!imageValidation.isValidImageUrl(url)) {
      throw new Error(`URL válida rechazada: ${url}`);
    }
  });
  console.log(`   ✓ ${urls.length} URLs de imágenes validadas`);
});

// Test 3: URLs inválidas deben ser rechazadas
test('Debe rechazar URLs inválidas', () => {
  const invalidUrls = [
    'not-a-url',
    'ftp://example.com/image.jpg',
    'javascript:alert(1)',
    '',
    null,
    undefined,
    'https://example.com/file.pdf',
    'https://example.com/document.docx'
  ];
  
  invalidUrls.forEach(url => {
    if (imageValidation.isValidImageUrl(url)) {
      throw new Error(`URL inválida aceptada incorrectamente: ${url}`);
    }
  });
  console.log(`   ✓ ${invalidUrls.length} URLs inválidas rechazadas`);
});

// Test 4: cleanImageArray debe limpiar array correctamente
test('cleanImageArray debe filtrar imágenes inválidas', () => {
  const images = [
    { id: 1, url: 'https://example.com/1.jpg', orden_display: 0, es_principal: true },
    { id: 2, url: 'invalid-url', orden_display: 1, es_principal: false },
    { id: 3, url: null, orden_display: 2, es_principal: false },
    { id: 4, url: 'https://res.cloudinary.com/test/image/upload/4.png', orden_display: 3, es_principal: false }
  ];
  
  const cleaned = imageValidation.cleanImageArray(images);
  
  if (cleaned.length !== 2) {
    throw new Error(`Expected 2 valid images, got ${cleaned.length}`);
  }
  
  if (cleaned[0].id !== 1 || cleaned[1].id !== 4) {
    throw new Error('Images not filtered correctly');
  }
  
  console.log(`   ✓ Filtradas ${images.length - cleaned.length} imágenes inválidas`);
  console.log(`   ✓ ${cleaned.length} imágenes válidas conservadas`);
});

// Test 5: cleanImageArray debe normalizar estructura
test('cleanImageArray debe normalizar estructura de imágenes', () => {
  const images = [
    { id: 1, url: 'https://example.com/1.jpg', orden_display: 5, es_principal: true },
    { id: 2, url: 'https://example.com/2.jpg', orden: 3, es_principal: false }
  ];
  
  const cleaned = imageValidation.cleanImageArray(images);
  
  // Verificar que todas tengan la estructura correcta
  cleaned.forEach(img => {
    if (!img.hasOwnProperty('id') || !img.hasOwnProperty('url') || 
        !img.hasOwnProperty('orden') || !img.hasOwnProperty('es_principal')) {
      throw new Error('Estructura de imagen incorrecta');
    }
  });
  
  console.log(`   ✓ Estructura normalizada correctamente`);
});

// Test 6: selectPrimaryImage debe seleccionar la imagen principal
test('selectPrimaryImage debe seleccionar imagen marcada como principal', () => {
  const images = [
    { id: 1, url: 'https://example.com/1.jpg', orden: 0, es_principal: false },
    { id: 2, url: 'https://example.com/2.jpg', orden: 1, es_principal: true },
    { id: 3, url: 'https://example.com/3.jpg', orden: 2, es_principal: false }
  ];
  
  const primaryUrl = imageValidation.selectPrimaryImage(images);
  
  if (primaryUrl !== 'https://example.com/2.jpg') {
    throw new Error(`Expected image 2, got ${primaryUrl}`);
  }
  
  console.log(`   ✓ Imagen principal seleccionada correctamente`);
});

// Test 7: selectPrimaryImage debe usar primera imagen si no hay principal
test('selectPrimaryImage debe usar primera imagen como fallback', () => {
  const images = [
    { id: 1, url: 'https://example.com/1.jpg', orden: 0, es_principal: false },
    { id: 2, url: 'https://example.com/2.jpg', orden: 1, es_principal: false }
  ];
  
  const primaryUrl = imageValidation.selectPrimaryImage(images);
  
  if (primaryUrl !== 'https://example.com/1.jpg') {
    throw new Error(`Expected first image, got ${primaryUrl}`);
  }
  
  console.log(`   ✓ Primera imagen usada como fallback`);
});

// Test 8: selectPrimaryImage debe usar fallbackImageUrl si no hay imágenes
test('selectPrimaryImage debe usar fallbackImageUrl', () => {
  const images = [];
  const fallback = 'https://example.com/fallback.jpg';
  
  const primaryUrl = imageValidation.selectPrimaryImage(images, fallback);
  
  if (primaryUrl !== fallback) {
    throw new Error(`Expected fallback, got ${primaryUrl}`);
  }
  
  console.log(`   ✓ Fallback usado correctamente`);
});

// Test 9: ensureProductHasValidImages debe limpiar producto completo
test('ensureProductHasValidImages debe validar y limpiar producto', () => {
  const product = {
    id: 1,
    nombre: 'Test Product',
    imagen_url: 'https://example.com/main.jpg',
    imagenes: [
      { id: 1, url: 'https://example.com/1.jpg', orden_display: 0, es_principal: true },
      { id: 2, url: 'invalid', orden_display: 1, es_principal: false }
    ]
  };
  
  const cleaned = imageValidation.ensureProductHasValidImages(product);
  
  if (cleaned.imagenes.length !== 1) {
    throw new Error(`Expected 1 valid image, got ${cleaned.imagenes.length}`);
  }
  
  if (cleaned.imagen_url !== 'https://example.com/1.jpg') {
    throw new Error('Primary image not set correctly');
  }
  
  console.log(`   ✓ Producto limpiado correctamente`);
});

// Test 10: ensureProductHasValidImages debe manejar productos sin imágenes
test('ensureProductHasValidImages debe manejar productos sin imágenes', () => {
  const product = {
    id: 1,
    nombre: 'Test Product',
    imagen_url: null,
    imagenes: []
  };
  
  const cleaned = imageValidation.ensureProductHasValidImages(product);
  
  if (cleaned.imagen_url !== null) {
    throw new Error('imagen_url should be null');
  }
  
  if (cleaned.imagenes.length !== 0) {
    throw new Error('imagenes should be empty array');
  }
  
  console.log(`   ✓ Producto sin imágenes manejado correctamente`);
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Resultados:`);
console.log(`   ✅ Tests pasados: ${testsPassed}`);
console.log(`   ❌ Tests fallidos: ${testsFailed}`);
console.log(`   📈 Total: ${testsPassed + testsFailed}`);

if (testsFailed > 0) {
  console.log('\n⚠️  Algunos tests fallaron. Revisa la implementación de validación de imágenes.');
  process.exit(1);
} else {
  console.log('\n✅ Todos los tests pasaron correctamente!');
  process.exit(0);
}
