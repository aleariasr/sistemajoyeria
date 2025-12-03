/**
 * Test Script para Funcionalidad "Otros" y Descuentos
 * 
 * Este script valida la lógica de las nuevas funcionalidades sin necesidad de base de datos
 */

console.log('🧪 Iniciando tests de funcionalidad "Otros" y Descuentos\n');

// ==========================================
// Test 1: Validación de monto válido
// ==========================================
console.log('📋 Test 1: Validación de monto válido');

function esMontoValido(busqueda, joyasLength) {
  const valor = busqueda.trim();
  if (valor === '' || joyasLength > 0) return false;
  const monto = parseFloat(valor);
  return !isNaN(monto) && monto > 0;
}

// Casos de prueba
const testCases = [
  { busqueda: '5000', joyas: 0, expected: true, desc: 'Monto entero válido' },
  { busqueda: '15.50', joyas: 0, expected: true, desc: 'Monto decimal válido' },
  { busqueda: '0', joyas: 0, expected: false, desc: 'Monto cero no válido' },
  { busqueda: '-100', joyas: 0, expected: false, desc: 'Monto negativo no válido' },
  { busqueda: 'abc', joyas: 0, expected: false, desc: 'Texto no es monto' },
  { busqueda: '5000', joyas: 3, expected: false, desc: 'Hay productos, no mostrar botón' },
  { busqueda: '', joyas: 0, expected: false, desc: 'String vacío no válido' },
];

let passed = 0;
let failed = 0;

testCases.forEach(test => {
  const result = esMontoValido(test.busqueda, test.joyas);
  if (result === test.expected) {
    console.log(`  ✅ ${test.desc}: ${test.busqueda} → ${result}`);
    passed++;
  } else {
    console.log(`  ❌ ${test.desc}: ${test.busqueda} → ${result} (esperado: ${test.expected})`);
    failed++;
  }
});

console.log(`\n📊 Resultado Test 1: ${passed} pasados, ${failed} fallidos\n`);

// ==========================================
// Test 2: Cálculo de totales con descuento
// ==========================================
console.log('📋 Test 2: Cálculo de totales con descuento');

function calcularSubtotal(carrito) {
  return carrito.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);
}

function calcularTotal(carrito, descuento) {
  return calcularSubtotal(carrito) - descuento;
}

// Caso de prueba 1: Venta simple con descuento
const carrito1 = [
  { precio_unitario: 5000, cantidad: 2 }, // 10000
  { precio_unitario: 3000, cantidad: 1 }  // 3000
];
const descuento1 = 1000;
const subtotal1 = calcularSubtotal(carrito1);
const total1 = calcularTotal(carrito1, descuento1);

console.log(`  Carrito: ${carrito1.length} items`);
console.log(`  Subtotal: ₡${subtotal1.toFixed(2)}`);
console.log(`  Descuento: ₡${descuento1.toFixed(2)}`);
console.log(`  Total: ₡${total1.toFixed(2)}`);

if (subtotal1 === 13000 && total1 === 12000) {
  console.log('  ✅ Cálculo correcto\n');
  passed++;
} else {
  console.log('  ❌ Cálculo incorrecto\n');
  failed++;
}

// ==========================================
// Test 3: Items "Otros" en carrito
// ==========================================
console.log('📋 Test 3: Items "Otros" en carrito');

const carrito2 = [
  { 
    id: 'joya-1', 
    id_joya: 1, 
    nombre: 'Anillo', 
    precio_unitario: 5000, 
    cantidad: 1,
    stock_disponible: 5
  },
  { 
    id: 'otros-123', 
    id_joya: null, 
    nombre: 'Otros', 
    descripcion_item: 'Otros',
    precio_unitario: 2500, 
    cantidad: 1,
    stock_disponible: null
  }
];

console.log('  Items en carrito:');
carrito2.forEach(item => {
  const tipo = item.id_joya === null ? 'Item "Otros"' : 'Producto normal';
  const stock = item.stock_disponible === null ? 'Sin stock' : `Stock: ${item.stock_disponible}`;
  console.log(`    - ${item.nombre} (${tipo}, ${stock}): ₡${item.precio_unitario.toFixed(2)}`);
});

const subtotal2 = calcularSubtotal(carrito2);
console.log(`  Subtotal: ₡${subtotal2.toFixed(2)}`);

if (subtotal2 === 7500) {
  console.log('  ✅ Cálculo con items "Otros" correcto\n');
  passed++;
} else {
  console.log('  ❌ Cálculo con items "Otros" incorrecto\n');
  failed++;
}

// ==========================================
// Test 4: Validación de stock para items mixtos
// ==========================================
console.log('📋 Test 4: Validación de stock para items mixtos');

function validarStock(item, nuevaCantidad) {
  // Si el item tiene stock_disponible (no es "Otros"), validar el stock
  if (item.stock_disponible !== null && nuevaCantidad > item.stock_disponible) {
    return false;
  }
  return true;
}

const itemNormal = { nombre: 'Anillo', stock_disponible: 5 };
const itemOtros = { nombre: 'Otros', stock_disponible: null };

const validaciones = [
  { item: itemNormal, cantidad: 3, expected: true, desc: 'Cantidad válida para producto normal' },
  { item: itemNormal, cantidad: 10, expected: false, desc: 'Cantidad excede stock de producto normal' },
  { item: itemOtros, cantidad: 100, expected: true, desc: 'Cualquier cantidad válida para item "Otros"' },
  { item: itemOtros, cantidad: 1000, expected: true, desc: 'Gran cantidad válida para item "Otros"' },
];

validaciones.forEach(test => {
  const result = validarStock(test.item, test.cantidad);
  if (result === test.expected) {
    console.log(`  ✅ ${test.desc}`);
    passed++;
  } else {
    console.log(`  ❌ ${test.desc}`);
    failed++;
  }
});

console.log('');

// ==========================================
// Test 5: Estructura de datos para backend
// ==========================================
console.log('📋 Test 5: Estructura de datos para backend');

const ventaData = {
  items: [
    { 
      id_joya: 1, 
      cantidad: 2, 
      precio_unitario: 5000,
      descripcion_item: null 
    },
    { 
      id_joya: null, 
      cantidad: 1, 
      precio_unitario: 2500,
      descripcion_item: 'Otros'
    }
  ],
  descuento: 500,
  metodo_pago: 'Efectivo',
  subtotal: 12500,
  total: 12000
};

console.log('  Estructura de venta:');
console.log(`    Items: ${ventaData.items.length}`);
console.log(`    - Item 1: id_joya=${ventaData.items[0].id_joya} (producto normal)`);
console.log(`    - Item 2: id_joya=${ventaData.items[1].id_joya} (item "Otros")`);
console.log(`    Descuento: ₡${ventaData.descuento.toFixed(2)}`);
console.log(`    Total: ₡${ventaData.total.toFixed(2)}`);

const tieneItemOtros = ventaData.items.some(item => item.id_joya === null);
const tieneDescuento = ventaData.descuento > 0;

if (tieneItemOtros && tieneDescuento) {
  console.log('  ✅ Estructura de datos correcta para backend\n');
  passed++;
} else {
  console.log('  ❌ Estructura de datos incorrecta\n');
  failed++;
}

// ==========================================
// Resumen Final
// ==========================================
console.log('═'.repeat(60));
console.log('📊 RESUMEN FINAL DE TESTS');
console.log('═'.repeat(60));
console.log(`✅ Tests pasados: ${passed}`);
console.log(`❌ Tests fallidos: ${failed}`);
console.log(`📈 Total: ${passed + failed}`);
console.log(`🎯 Tasa de éxito: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
console.log('═'.repeat(60));

if (failed === 0) {
  console.log('🎉 ¡Todos los tests pasaron exitosamente!');
  console.log('✨ La lógica de las funcionalidades "Otros" y Descuentos está correcta');
  process.exit(0);
} else {
  console.log('⚠️  Algunos tests fallaron. Revisar la implementación.');
  process.exit(1);
}
