// Test for consolidated accounts per client functionality
const axios = require('axios');
const BASE_URL = 'http://localhost:3001/api';

let sessionCookie = '';
let testClientId = null;
let testJoyaId = null;
let testCuentaId = null;

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true
});

// Helper to set cookie
api.interceptors.response.use(response => {
  if (response.headers['set-cookie']) {
    sessionCookie = response.headers['set-cookie'][0];
  }
  return response;
});

api.interceptors.request.use(config => {
  if (sessionCookie) {
    config.headers['Cookie'] = sessionCookie;
  }
  return config;
});

async function runTests() {
  console.log('🧪 Testing Consolidated Accounts Per Client\n');
  console.log('=' . repeat(60));
  
  try {
    // 1. Login
    console.log('\n1️⃣ Logging in as admin...');
    await api.post('/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    console.log('✅ Logged in successfully');

    // 2. Create test client
    console.log('\n2️⃣ Creating test client...');
    const clientResponse = await api.post('/clientes', {
      nombre: 'Test Client Consolidated',
      cedula: 'TEST-' + Date.now(),
      telefono: '8888-8888',
      email: 'test@example.com'
    });
    testClientId = clientResponse.data.id;
    console.log(`✅ Test client created: ID ${testClientId}`);

    // 3. Create test product
    console.log('\n3️⃣ Creating test product...');
    const joyaResponse = await api.post('/joyas', {
      codigo: 'TEST-CONS-' + Date.now(),
      nombre: 'Test Product for Consolidated Accounts',
      descripcion: 'Test product',
      categoria: 'Anillo',
      proveedor: 'Test Provider',
      costo: 100,
      precio_venta: 200,
      stock_actual: 50,
      stock_minimo: 2
    });
    testJoyaId = joyaResponse.data.id;
    console.log(`✅ Test product created: ID ${testJoyaId}`);

    // 4. Make first credit sale
    console.log('\n4️⃣ Making first credit sale...');
    const venta1Response = await api.post('/ventas', {
      items: [{
        id_joya: testJoyaId,
        cantidad: 2,
        precio_unitario: 200
      }],
      metodo_pago: 'Efectivo',
      descuento: 0,
      tipo_venta: 'Credito',
      id_cliente: testClientId,
      fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    const venta1Id = venta1Response.data.id;
    testCuentaId = venta1Response.data.id_cuenta_por_cobrar;
    console.log(`✅ First credit sale created: Venta ID ${venta1Id}, Cuenta ID ${testCuentaId}`);
    console.log(`   Total: ₡400`);

    // 5. Check that account was created
    console.log('\n5️⃣ Checking account was created...');
    const cuentaResponse = await api.get(`/cuentas-por-cobrar/${testCuentaId}`);
    const cuenta1 = cuentaResponse.data;
    console.log(`✅ Account found:`);
    console.log(`   Monto Total: ₡${cuenta1.monto_total}`);
    console.log(`   Saldo Pendiente: ₡${cuenta1.saldo_pendiente}`);
    console.log(`   Movimientos: ${cuenta1.movimientos?.length || 0}`);
    
    if (cuenta1.monto_total !== 400) {
      throw new Error(`Expected monto_total to be 400, got ${cuenta1.monto_total}`);
    }

    // 6. Make second credit sale to same client
    console.log('\n6️⃣ Making second credit sale to same client...');
    const venta2Response = await api.post('/ventas', {
      items: [{
        id_joya: testJoyaId,
        cantidad: 3,
        precio_unitario: 200
      }],
      metodo_pago: 'Efectivo',
      descuento: 0,
      tipo_venta: 'Credito',
      id_cliente: testClientId,
      fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    const venta2Id = venta2Response.data.id;
    const cuenta2Id = venta2Response.data.id_cuenta_por_cobrar;
    console.log(`✅ Second credit sale created: Venta ID ${venta2Id}, Cuenta ID ${cuenta2Id}`);
    console.log(`   Total: ₡600`);

    // 7. CRITICAL TEST: Verify same account was used (not a new one)
    console.log('\n7️⃣ CRITICAL: Verifying same account was used...');
    if (testCuentaId !== cuenta2Id) {
      throw new Error(`❌ FAILED: Different account IDs! First: ${testCuentaId}, Second: ${cuenta2Id}`);
    }
    console.log(`✅ PASSED: Same account ID used (${testCuentaId})`);

    // 8. Verify account was updated with new total
    console.log('\n8️⃣ Verifying account totals were updated...');
    const cuentaUpdatedResponse = await api.get(`/cuentas-por-cobrar/${testCuentaId}`);
    const cuentaUpdated = cuentaUpdatedResponse.data;
    console.log(`   Previous Total: ₡400`);
    console.log(`   New Total: ₡${cuentaUpdated.monto_total}`);
    console.log(`   Expected Total: ₡1000`);
    console.log(`   Movimientos: ${cuentaUpdated.movimientos?.length || 0}`);
    
    if (Math.abs(cuentaUpdated.monto_total - 1000) > 0.01) {
      throw new Error(`Expected monto_total to be 1000, got ${cuentaUpdated.monto_total}`);
    }
    console.log(`✅ PASSED: Account total correctly updated to ₡1000`);

    // 9. Verify movimientos history
    console.log('\n9️⃣ Verifying movimientos history...');
    if (!cuentaUpdated.movimientos || cuentaUpdated.movimientos.length < 2) {
      throw new Error(`Expected at least 2 movimientos, got ${cuentaUpdated.movimientos?.length || 0}`);
    }
    console.log(`✅ PASSED: ${cuentaUpdated.movimientos.length} movimientos recorded`);
    cuentaUpdated.movimientos.forEach((mov, idx) => {
      console.log(`   ${idx + 1}. ${mov.tipo} - ₡${mov.monto} - ${mov.descripcion}`);
    });

    // 10. Verify only one active account exists for client
    console.log('\n🔟 Verifying only one active account per client...');
    const clientCuentasResponse = await api.get(`/cuentas-por-cobrar?id_cliente=${testClientId}&estado=Pendiente`);
    const activeCuentas = clientCuentasResponse.data.cuentas;
    console.log(`   Active accounts found: ${activeCuentas.length}`);
    
    if (activeCuentas.length !== 1) {
      throw new Error(`Expected 1 active account, got ${activeCuentas.length}`);
    }
    console.log(`✅ PASSED: Only one active account for client`);

    // 11. Register an abono
    console.log('\n1️⃣1️⃣ Registering abono...');
    await api.post(`/cuentas-por-cobrar/${testCuentaId}/abonos`, {
      monto: 300,
      metodo_pago: 'Efectivo',
      notas: 'Test payment'
    });
    console.log(`✅ Abono registered: ₡300`);

    // 12. Verify balance after abono
    console.log('\n1️⃣2️⃣ Verifying balance after abono...');
    const cuentaAfterAbonoResponse = await api.get(`/cuentas-por-cobrar/${testCuentaId}`);
    const cuentaAfterAbono = cuentaAfterAbonoResponse.data;
    console.log(`   Monto Pagado: ₡${cuentaAfterAbono.monto_pagado}`);
    console.log(`   Saldo Pendiente: ₡${cuentaAfterAbono.saldo_pendiente}`);
    
    if (Math.abs(cuentaAfterAbono.monto_pagado - 300) > 0.01) {
      throw new Error(`Expected monto_pagado to be 300, got ${cuentaAfterAbono.monto_pagado}`);
    }
    if (Math.abs(cuentaAfterAbono.saldo_pendiente - 700) > 0.01) {
      throw new Error(`Expected saldo_pendiente to be 700, got ${cuentaAfterAbono.saldo_pendiente}`);
    }
    console.log(`✅ PASSED: Balance correctly updated`);

    // 13. Make third credit sale after abono
    console.log('\n1️⃣3️⃣ Making third credit sale after abono...');
    const venta3Response = await api.post('/ventas', {
      items: [{
        id_joya: testJoyaId,
        cantidad: 1,
        precio_unitario: 200
      }],
      metodo_pago: 'Efectivo',
      descuento: 0,
      tipo_venta: 'Credito',
      id_cliente: testClientId
    });
    const venta3Id = venta3Response.data.id;
    const cuenta3Id = venta3Response.data.id_cuenta_por_cobrar;
    console.log(`✅ Third credit sale created: Venta ID ${venta3Id}`);
    
    if (testCuentaId !== cuenta3Id) {
      throw new Error(`❌ FAILED: Different account after abono! Expected: ${testCuentaId}, Got: ${cuenta3Id}`);
    }
    console.log(`✅ PASSED: Same account still used after abono`);

    // 14. Verify final totals
    console.log('\n1️⃣4️⃣ Verifying final totals...');
    const cuentaFinalResponse = await api.get(`/cuentas-por-cobrar/${testCuentaId}`);
    const cuentaFinal = cuentaFinalResponse.data;
    console.log(`   Total sales: ₡1200 (400 + 600 + 200)`);
    console.log(`   Total paid: ₡300`);
    console.log(`   Expected balance: ₡900`);
    console.log(`   Actual monto_total: ₡${cuentaFinal.monto_total}`);
    console.log(`   Actual monto_pagado: ₡${cuentaFinal.monto_pagado}`);
    console.log(`   Actual saldo_pendiente: ₡${cuentaFinal.saldo_pendiente}`);
    console.log(`   Total movimientos: ${cuentaFinal.movimientos?.length || 0}`);
    
    if (Math.abs(cuentaFinal.monto_total - 1200) > 0.01) {
      throw new Error(`Expected final monto_total 1200, got ${cuentaFinal.monto_total}`);
    }
    if (Math.abs(cuentaFinal.saldo_pendiente - 900) > 0.01) {
      throw new Error(`Expected final saldo_pendiente 900, got ${cuentaFinal.saldo_pendiente}`);
    }
    console.log(`✅ PASSED: Final totals correct`);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\n✅ Consolidated accounts per client working correctly');
    console.log('✅ Multiple credit sales update same account');
    console.log('✅ Movimientos history tracked correctly');
    console.log('✅ Abonos work with consolidated accounts');
    console.log('✅ No duplicate accounts created');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    process.exit(1);
  }
}

// Run tests
runTests();
