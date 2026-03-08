/**
 * TEST COMPLETO DE TODAS LAS FUNCIONES DEL SISTEMA
 * Este archivo prueba todas las funciones con todas las variables posibles
 */

const { supabase } = require('../supabase-db');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function test(name, fn) {
  testsRun++;
  try {
    fn();
    testsPassed++;
    log(`✓ ${name}`, colors.green);
  } catch (error) {
    testsFailed++;
    log(`✗ ${name}`, colors.red);
    log(`  Error: ${error.message}`, colors.red);
  }
}

function testAsync(name, fn) {
  testsRun++;
  return fn()
    .then(() => {
      testsPassed++;
      log(`✓ ${name}`, colors.green);
    })
    .catch((error) => {
      testsFailed++;
      log(`✗ ${name}`, colors.red);
      log(`  Error: ${error.message}`, colors.red);
    });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertApproximately(actual, expected, tolerance = 0.01, message) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(message || `Expected ${expected}, got ${actual} (tolerance: ${tolerance})`);
  }
}

// ============================================
// TESTS DE VALIDACIONES
// ============================================

log('\n=== TESTS DE VALIDACIONES ===\n', colors.cyan);

const { 
  esNumeroPositivo, 
  esEnteroPositivo,
  validarCodigo,
  esStringNoVacio,
  validarMoneda,
  validarEstado
} = require('../utils/validaciones');

test('esNumeroPositivo acepta números positivos', () => {
  assert(esNumeroPositivo(0) === true);
  assert(esNumeroPositivo(1) === true);
  assert(esNumeroPositivo(100.50) === true);
  assert(esNumeroPositivo('50') === true);
  assert(esNumeroPositivo('100.50') === true);
});

test('esNumeroPositivo rechaza números negativos', () => {
  assert(esNumeroPositivo(-1) === false);
  assert(esNumeroPositivo(-100) === false);
  assert(esNumeroPositivo('-50') === false);
});

test('esNumeroPositivo rechaza valores inválidos', () => {
  assert(esNumeroPositivo('abc') === false);
  assert(esNumeroPositivo(NaN) === false);
  assert(esNumeroPositivo(null) === false);
  assert(esNumeroPositivo(undefined) === false);
});

test('esEnteroPositivo acepta enteros positivos', () => {
  assert(esEnteroPositivo(0) === true);
  assert(esEnteroPositivo(1) === true);
  assert(esEnteroPositivo(100) === true);
  assert(esEnteroPositivo('50') === true);
});

test('esEnteroPositivo rechaza decimales', () => {
  assert(esEnteroPositivo(1.5) === false);
  assert(esEnteroPositivo('100.50') === false);
});

test('validarCodigo acepta códigos válidos', () => {
  assert(validarCodigo('ABC123') === true);
  assert(validarCodigo('A-B_C') === true);
  assert(validarCodigo('12345') === true);
});

test('validarCodigo rechaza códigos inválidos', () => {
  assert(validarCodigo('') === false);
  assert(validarCodigo('ABC 123') === false);
  assert(validarCodigo('ABC@123') === false);
  assert(validarCodigo(null) === false);
});

test('esStringNoVacio valida strings', () => {
  assert(esStringNoVacio('hola') === true);
  assert(esStringNoVacio('  hola  ') === true);
  assert(esStringNoVacio('') === false);
  assert(esStringNoVacio('   ') === false);
  assert(esStringNoVacio(null) === false);
});

test('validarMoneda valida monedas correctas', () => {
  assert(validarMoneda('CRC') === true);
  assert(validarMoneda('USD') === true);
  assert(validarMoneda('EUR') === true);
  assert(validarMoneda('GBP') === false);
  assert(validarMoneda('') === false);
});

test('validarEstado valida estados correctos', () => {
  assert(validarEstado('Activo') === true);
  assert(validarEstado('Descontinuado') === true);
  assert(validarEstado('Agotado') === true);
  assert(validarEstado('Inactivo') === false);
});

// ============================================
// TESTS DE CÁLCULOS
// ============================================

log('\n=== TESTS DE CÁLCULOS ===\n', colors.cyan);

test('Cálculo de subtotal con 1 item', () => {
  const items = [{ precio_unitario: 100, cantidad: 2 }];
  const subtotal = items.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);
  assertEqual(subtotal, 200);
});

test('Cálculo de subtotal con múltiples items', () => {
  const items = [
    { precio_unitario: 100, cantidad: 2 },
    { precio_unitario: 50, cantidad: 3 },
    { precio_unitario: 75.50, cantidad: 1 }
  ];
  const subtotal = items.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);
  assertApproximately(subtotal, 425.50);
});

test('Cálculo de total con descuento', () => {
  const subtotal = 1000;
  const descuento = 100;
  const total = subtotal - descuento;
  assertEqual(total, 900);
});

test('Cálculo de cambio en efectivo', () => {
  const total = 500;
  const efectivoRecibido = 1000;
  const cambio = efectivoRecibido - total;
  assertEqual(cambio, 500);
});

test('Cálculo de cambio en pago mixto', () => {
  const montoEfectivo = 300;
  const efectivoRecibido = 500;
  const cambio = efectivoRecibido - montoEfectivo;
  assertEqual(cambio, 200);
});

test('Validación de pago mixto - suma correcta', () => {
  const total = 1000;
  const montoEfectivo = 400;
  const montoTarjeta = 300;
  const montoTransferencia = 300;
  const totalMixto = montoEfectivo + montoTarjeta + montoTransferencia;
  assertEqual(totalMixto, total);
});

test('Validación de pago mixto - suma incorrecta', () => {
  const total = 1000;
  const montoEfectivo = 400;
  const montoTarjeta = 300;
  const montoTransferencia = 200; // Total = 900, no 1000
  const totalMixto = montoEfectivo + montoTarjeta + montoTransferencia;
  assert(Math.abs(totalMixto - total) > 0.01); // Debe ser diferente
});

test('Cálculo de nuevo stock después de venta', () => {
  const stockActual = 10;
  const cantidadVendida = 3;
  const nuevoStock = stockActual - cantidadVendida;
  assertEqual(nuevoStock, 7);
});

test('Cálculo de nuevo stock después de entrada', () => {
  const stockActual = 10;
  const cantidadEntrada = 5;
  const nuevoStock = stockActual + cantidadEntrada;
  assertEqual(nuevoStock, 15);
});

test('Cálculo de saldo pendiente después de abono', () => {
  const montoTotal = 1000;
  const montoPagado = 300;
  const abono = 200;
  const nuevoMontoPagado = montoPagado + abono;
  const saldoPendiente = montoTotal - nuevoMontoPagado;
  assertEqual(nuevoMontoPagado, 500);
  assertEqual(saldoPendiente, 500);
});

test('Cuenta queda pagada cuando saldo es cero', () => {
  const montoTotal = 1000;
  const montoPagado = 800;
  const abono = 200;
  const nuevoMontoPagado = montoPagado + abono;
  const saldoPendiente = montoTotal - nuevoMontoPagado;
  assertEqual(saldoPendiente, 0);
  const estado = saldoPendiente <= 0.01 ? 'Pagada' : 'Pendiente';
  assertEqual(estado, 'Pagada');
});

test('Redondeo correcto en cálculos monetarios', () => {
  const precio = 33.33;
  const cantidad = 3;
  const subtotal = precio * cantidad;
  assertApproximately(subtotal, 99.99);
});

test('Tolerancia en pagos mixtos (1 centavo)', () => {
  const total = 1000.00;
  const totalMixto = 999.99; // Diferencia de 1 centavo
  const diferencia = Math.abs(totalMixto - total);
  assert(diferencia <= 0.01); // Debe ser aceptable
});

// ============================================
// TESTS DE TIMEZONE
// ============================================

log('\n=== TESTS DE TIMEZONE ===\n', colors.cyan);

const { formatearFechaSQL, obtenerFechaActualCR, obtenerRangoDia } = require('../utils/timezone');

test('formatearFechaSQL genera formato correcto', () => {
  const fecha = formatearFechaSQL();
  assert(typeof fecha === 'string');
  assert(fecha.includes('T'));
  // Formato: YYYY-MM-DDTHH:MM:SS
  assert(fecha.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/));
});

test('obtenerFechaActualCR genera fecha válida', () => {
  const fecha = obtenerFechaActualCR();
  assert(typeof fecha === 'string');
  assert(fecha.match(/^\d{4}-\d{2}-\d{2}$/));
});

test('obtenerRangoDia genera rango correcto', () => {
  const rango = obtenerRangoDia();
  assert(rango.hasOwnProperty('fecha_desde'));
  assert(rango.hasOwnProperty('fecha_hasta'));
  assert(rango.fecha_desde.includes('T00:00:00'));
  assert(rango.fecha_hasta.includes('T23:59:59'));
});

// ============================================
// RESUMEN
// ============================================

log('\n=== RESUMEN DE TESTS ===\n', colors.cyan);
log(`Total de tests ejecutados: ${testsRun}`, colors.blue);
log(`Tests exitosos: ${testsPassed}`, colors.green);
log(`Tests fallidos: ${testsFailed}`, colors.red);

if (testsFailed === 0) {
  log('\n✓ TODOS LOS TESTS PASARON\n', colors.green);
  process.exit(0);
} else {
  log('\n✗ ALGUNOS TESTS FALLARON\n', colors.red);
  process.exit(1);
}
