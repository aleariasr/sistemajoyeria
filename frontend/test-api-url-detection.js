/**
 * Test de detección automática de URL del API
 * 
 * Este script verifica que la lógica de detección de URL del backend
 * funcione correctamente en diferentes escenarios
 */

// Simular diferentes entornos de window.location
const testCases = [
  {
    name: 'Localhost (desarrollo)',
    location: { protocol: 'http:', hostname: 'localhost' },
    envVar: undefined,
    expected: 'http://localhost:3001/api'
  },
  {
    name: 'IP local (dispositivo móvil)',
    location: { protocol: 'http:', hostname: '192.168.1.100' },
    envVar: undefined,
    expected: 'http://192.168.1.100:3001/api'
  },
  {
    name: 'IP local diferente',
    location: { protocol: 'http:', hostname: '10.0.0.50' },
    envVar: undefined,
    expected: 'http://10.0.0.50:3001/api'
  },
  {
    name: 'Variable de entorno configurada',
    location: { protocol: 'http:', hostname: 'localhost' },
    envVar: 'https://api.midominio.com/api',
    expected: 'https://api.midominio.com/api'
  },
  {
    name: 'HTTPS en producción',
    location: { protocol: 'https:', hostname: 'miapp.com' },
    envVar: undefined,
    expected: 'https://miapp.com:3001/api'
  }
];

// Función de detección de URL del API (copiada del código real)
function getApiUrl(windowLocation, envApiUrl) {
  // Si hay una variable de entorno configurada, usarla
  if (envApiUrl) {
    return envApiUrl;
  }
  
  // De lo contrario, construir la URL usando el mismo host que el frontend
  // pero con el puerto del backend (3001)
  const protocol = windowLocation.protocol; // http: o https:
  const hostname = windowLocation.hostname; // localhost, 192.168.1.100, etc.
  return `${protocol}//${hostname}:3001/api`;
}

// Ejecutar pruebas
console.log('🧪 Ejecutando tests de detección de URL del API\n');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = getApiUrl(testCase.location, testCase.envVar);
  const success = result === testCase.expected;
  
  if (success) {
    console.log(`\n✅ Test ${index + 1}: ${testCase.name}`);
    console.log(`   Resultado: ${result}`);
    passed++;
  } else {
    console.log(`\n❌ Test ${index + 1}: ${testCase.name}`);
    console.log(`   Esperado:  ${testCase.expected}`);
    console.log(`   Obtenido:  ${result}`);
    failed++;
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Resultados: ${passed} pasaron, ${failed} fallaron`);

if (failed === 0) {
  console.log('\n✅ Todos los tests pasaron correctamente!');
  process.exit(0);
} else {
  console.log('\n❌ Algunos tests fallaron');
  process.exit(1);
}
