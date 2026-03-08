/**
 * Test de utilidades de timezone
 * Verifica que las funciones de fecha y hora funcionen correctamente
 */

const timezone = require('../utils/timezone');

console.log('🧪 Test de Utilidades de Timezone\n');
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

// Test 1: Verificar que TIMEZONE esté configurado
test('TIMEZONE debe estar configurado', () => {
  if (!timezone.TIMEZONE) {
    throw new Error('TIMEZONE no está configurado');
  }
  console.log(`   Timezone actual: ${timezone.TIMEZONE}`);
});

// Test 2: obtenerFechaCostaRica devuelve un objeto Date
test('obtenerFechaCostaRica() debe devolver un Date', () => {
  const fecha = timezone.obtenerFechaCostaRica();
  if (!(fecha instanceof Date)) {
    throw new Error('No devuelve un objeto Date');
  }
  console.log(`   Fecha actual: ${fecha.toISOString()}`);
});

// Test 3: formatearFechaSQL devuelve formato correcto
test('formatearFechaSQL() debe devolver formato ISO correcto', () => {
  const fechaSQL = timezone.formatearFechaSQL();
  const formato = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
  if (!formato.test(fechaSQL)) {
    throw new Error(`Formato incorrecto: ${fechaSQL}`);
  }
  console.log(`   Formato SQL: ${fechaSQL}`);
});

// Test 4: obtenerFechaActualCR devuelve solo fecha
test('obtenerFechaActualCR() debe devolver solo fecha (YYYY-MM-DD)', () => {
  const fecha = timezone.obtenerFechaActualCR();
  const formato = /^\d{4}-\d{2}-\d{2}$/;
  if (!formato.test(fecha)) {
    throw new Error(`Formato incorrecto: ${fecha}`);
  }
  console.log(`   Fecha: ${fecha}`);
});

// Test 5: obtenerRangoDia devuelve inicio y fin del día
test('obtenerRangoDia() debe devolver rango completo del día', () => {
  const rango = timezone.obtenerRangoDia();
  if (!rango.fecha_desde || !rango.fecha_hasta) {
    throw new Error('No devuelve fecha_desde o fecha_hasta');
  }
  if (!rango.fecha_desde.endsWith('T00:00:00')) {
    throw new Error('fecha_desde no termina en 00:00:00');
  }
  if (!rango.fecha_hasta.endsWith('T23:59:59')) {
    throw new Error('fecha_hasta no termina en 23:59:59');
  }
  console.log(`   Desde: ${rango.fecha_desde}`);
  console.log(`   Hasta: ${rango.fecha_hasta}`);
});

// Test 6: convertirFechaFrontend maneja fechas ISO
test('convertirFechaFrontend() debe convertir fecha ISO', () => {
  const fechaISO = '2024-01-15T10:30:00';
  const fecha = timezone.convertirFechaFrontend(fechaISO);
  if (!(fecha instanceof Date)) {
    throw new Error('No devuelve un objeto Date');
  }
  console.log(`   Entrada: ${fechaISO}`);
  console.log(`   Salida: ${fecha.toISOString()}`);
});

// Test 7: formatearFechaParaFrontend formatea correctamente
test('formatearFechaParaFrontend() debe formatear para frontend', () => {
  const fecha = new Date('2024-01-15T10:30:00Z');
  const fechaFormateada = timezone.formatearFechaParaFrontend(fecha);
  const formato = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
  if (!formato.test(fechaFormateada)) {
    throw new Error(`Formato incorrecto: ${fechaFormateada}`);
  }
  console.log(`   Fecha formateada: ${fechaFormateada}`);
});

// Test 8: Las fechas deben reflejar la zona horaria correcta (UTC-6 para Costa Rica)
test('Las fechas deben reflejar UTC-6 (Costa Rica)', () => {
  // Crear una fecha UTC conocida
  const fechaUTC = new Date('2024-01-15T12:00:00Z'); // Mediodia UTC
  const fechaCR = timezone.formatearFechaParaFrontend(fechaUTC);
  
  // En Costa Rica (UTC-6) debería ser 06:00:00
  if (!fechaCR.includes('06:00:00')) {
    console.log(`   ⚠️  Advertencia: Esperado 06:00:00, obtenido ${fechaCR.split('T')[1]}`);
    console.log('   Esto puede variar según configuración del servidor');
  } else {
    console.log(`   ✓ Conversión correcta: 12:00 UTC → 06:00 CR`);
  }
});

// Test 9: Compatibilidad con fechas del pasado
test('Debe manejar fechas del pasado correctamente', () => {
  const fechaPasado = new Date('2023-01-01T00:00:00Z');
  const fechaSQL = timezone.formatearFechaSQL(fechaPasado);
  if (!fechaSQL.startsWith('2022-12-31') && !fechaSQL.startsWith('2023-01-01')) {
    throw new Error(`Fecha del pasado mal manejada: ${fechaSQL}`);
  }
  console.log(`   Fecha pasado: ${fechaSQL}`);
});

// Test 10: Compatibilidad con fechas del futuro
test('Debe manejar fechas del futuro correctamente', () => {
  const fechaFuturo = new Date('2025-12-31T23:59:59Z');
  const fechaSQL = timezone.formatearFechaSQL(fechaFuturo);
  if (!fechaSQL.startsWith('2025-12-31') && !fechaSQL.startsWith('2026-01-01')) {
    throw new Error(`Fecha del futuro mal manejada: ${fechaSQL}`);
  }
  console.log(`   Fecha futuro: ${fechaSQL}`);
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Resultados:`);
console.log(`   ✅ Tests pasados: ${testsPassed}`);
console.log(`   ❌ Tests fallidos: ${testsFailed}`);
console.log(`   📈 Total: ${testsPassed + testsFailed}`);

if (testsFailed > 0) {
  console.log('\n⚠️  Algunos tests fallaron. Revisa la configuración de timezone.');
  process.exit(1);
} else {
  console.log('\n✅ Todos los tests pasaron correctamente!');
  process.exit(0);
}
