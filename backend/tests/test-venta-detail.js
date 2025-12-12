/**
 * Test para verificar el fix de datos de factura antes del cierre de caja
 * Prueba que los items de una venta se muestren correctamente ANTES del cierre
 */

const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
let testCookie = '';

// Helper para llamadas API
async function apiCall(method, endpoint, data = null, cookie = '') {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: cookie ? { Cookie: cookie } : {},
      data
    };
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status, headers: response.headers };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status 
    };
  }
}

async function runTest() {
  console.log('\n🧪 Test: Datos de factura antes del cierre de caja\n');
  console.log('='.repeat(60));

  // 1. Login como admin
  console.log('\n📝 Step 1: Login...');
  const login = await apiCall('post', '/auth/login', {
    username: 'admin',
    password: 'admin123'
  });
  
  if (!login.success) {
    console.log('❌ FAIL: No se pudo hacer login');
    console.log('Error:', login.error);
    process.exit(1);
  }
  
  // Extraer cookie de sesión
  testCookie = login.headers['set-cookie']?.[0] || '';
  console.log('✅ Login exitoso');

  // 2. Crear una joya de prueba
  console.log('\n📝 Step 2: Crear joya de prueba...');
  const joyaData = {
    codigo: `TEST-${Date.now()}`,
    nombre: 'Anillo Test',
    categoria: 'Anillos',
    precio_venta: 50000,
    stock: 10,
    moneda: 'CRC'
  };
  
  const createJoya = await apiCall('post', '/joyas', joyaData, testCookie);
  if (!createJoya.success) {
    console.log('❌ FAIL: No se pudo crear joya');
    console.log('Error:', createJoya.error);
    process.exit(1);
  }
  const joyaId = createJoya.data.id;
  console.log(`✅ Joya creada con ID: ${joyaId}`);

  // 3. Crear una venta con esa joya
  console.log('\n📝 Step 3: Crear venta...');
  const ventaData = {
    id_usuario: 1,
    metodo_pago: 'Efectivo',
    tipo_venta: 'Contado',
    subtotal: 50000,
    descuento: 0,
    total: 50000,
    efectivo_recibido: 50000,
    cambio: 0,
    items: [
      { id_joya: joyaId, cantidad: 1, precio_unitario: 50000, subtotal: 50000 }
    ]
  };
  
  const createVenta = await apiCall('post', '/ventas', ventaData, testCookie);
  if (!createVenta.success) {
    console.log('❌ FAIL: No se pudo crear venta');
    console.log('Error:', createVenta.error);
    process.exit(1);
  }
  const ventaId = createVenta.data.id_venta;
  console.log(`✅ Venta creada con ID: ${ventaId}`);

  // 4. INMEDIATAMENTE consultar el detalle de la venta (ANTES del cierre)
  console.log('\n📝 Step 4: Consultar detalle de venta (ANTES del cierre)...');
  const getVenta = await apiCall('get', `/ventas/${ventaId}`, null, testCookie);
  
  if (!getVenta.success) {
    console.log('❌ FAIL: No se pudo obtener detalle de venta');
    console.log('Error:', getVenta.error);
    process.exit(1);
  }

  console.log('\n📊 Datos de la venta:');
  console.log('ID:', getVenta.data.id);
  console.log('Total:', getVenta.data.total);
  console.log('Es venta del día:', getVenta.data.es_venta_dia);
  console.log('Items:', JSON.stringify(getVenta.data.items, null, 2));

  // 5. Verificar que los items estén presentes y correctos
  console.log('\n🔍 Verificaciones:');
  
  let allPassed = true;

  // Verificación 1: Items no debe ser null
  if (getVenta.data.items === null) {
    console.log('❌ FAIL: items es null (debería ser un array)');
    allPassed = false;
  } else {
    console.log('✅ PASS: items no es null');
  }

  // Verificación 2: Items debe ser un array
  if (!Array.isArray(getVenta.data.items)) {
    console.log('❌ FAIL: items no es un array');
    allPassed = false;
  } else {
    console.log('✅ PASS: items es un array');
  }

  // Verificación 3: Debe haber exactamente 1 item
  if (getVenta.data.items.length !== 1) {
    console.log(`❌ FAIL: Se esperaba 1 item, se encontraron ${getVenta.data.items.length}`);
    allPassed = false;
  } else {
    console.log('✅ PASS: Se encontró 1 item');
  }

  // Verificación 4: El item debe tener los datos correctos
  if (getVenta.data.items.length > 0) {
    const item = getVenta.data.items[0];
    
    if (!item.nombre) {
      console.log('❌ FAIL: El item no tiene nombre');
      allPassed = false;
    } else {
      console.log(`✅ PASS: El item tiene nombre: "${item.nombre}"`);
    }

    if (item.precio_unitario !== 50000) {
      console.log(`❌ FAIL: Precio unitario incorrecto (esperado: 50000, encontrado: ${item.precio_unitario})`);
      allPassed = false;
    } else {
      console.log('✅ PASS: Precio unitario correcto (50000)');
    }

    if (item.subtotal !== 50000) {
      console.log(`❌ FAIL: Subtotal incorrecto (esperado: 50000, encontrado: ${item.subtotal})`);
      allPassed = false;
    } else {
      console.log('✅ PASS: Subtotal correcto (50000)');
    }
  }

  // 6. Crear una venta con item "Otros" (sin id_joya)
  console.log('\n📝 Step 5: Crear venta con item "Otros" (sin joya)...');
  const ventaOtrosData = {
    id_usuario: 1,
    metodo_pago: 'Efectivo',
    tipo_venta: 'Contado',
    subtotal: 5000,
    descuento: 0,
    total: 5000,
    efectivo_recibido: 5000,
    cambio: 0,
    items: [
      { 
        descripcion_item: 'Servicio de reparación', 
        cantidad: 1, 
        precio_unitario: 5000, 
        subtotal: 5000 
      }
    ]
  };
  
  const createVentaOtros = await apiCall('post', '/ventas', ventaOtrosData, testCookie);
  if (!createVentaOtros.success) {
    console.log('⚠️  WARNING: No se pudo crear venta con item "Otros"');
    console.log('Error:', createVentaOtros.error);
  } else {
    const ventaOtrosId = createVentaOtros.data.id_venta;
    console.log(`✅ Venta "Otros" creada con ID: ${ventaOtrosId}`);

    // Consultar detalle
    const getVentaOtros = await apiCall('get', `/ventas/${ventaOtrosId}`, null, testCookie);
    
    if (getVentaOtros.success && getVentaOtros.data.items.length > 0) {
      const itemOtros = getVentaOtros.data.items[0];
      
      if (itemOtros.nombre === 'Servicio de reparación' || itemOtros.nombre === 'Otros') {
        console.log(`✅ PASS: Item "Otros" tiene nombre correcto: "${itemOtros.nombre}"`);
      } else {
        console.log(`❌ FAIL: Item "Otros" tiene nombre incorrecto: "${itemOtros.nombre}"`);
        allPassed = false;
      }
    } else {
      console.log('⚠️  WARNING: No se pudo verificar venta "Otros"');
    }
  }

  // Resultado final
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ ¡TODOS LOS TESTS PASARON!');
    console.log('El bug está CORREGIDO: Los items se muestran correctamente antes del cierre.');
    process.exit(0);
  } else {
    console.log('❌ ALGUNOS TESTS FALLARON');
    console.log('El bug aún persiste. Revisar la implementación.');
    process.exit(1);
  }
}

// Ejecutar test
runTest().catch(error => {
  console.error('\n💥 Error crítico en el test:', error.message);
  process.exit(1);
});
