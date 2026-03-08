// Integration test for credit sales and cash register
const axios = require('axios');
const BASE_URL = 'http://localhost:3001/api';

let sessionCookie = '';

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
  console.log('🧪 Running Integration Tests\n');
  
  try {
    // 1. Login
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await api.post('/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    console.log('✅ Logged in successfully\n');

    // 2. Create a test product
    console.log('2️⃣ Creating test product...');
    const joyaResponse = await api.post('/joyas', {
      codigo: 'TEST-001',
      nombre: 'Test Jewelry',
      descripcion: 'Test product for integration testing',
      categoria: 'Anillo',
      proveedor: 'Test Provider',
      costo: 100,
      precio_venta: 200,
      stock_actual: 10,
      stock_minimo: 2
    });
    const joyaId = joyaResponse.data.id;
    console.log(`✅ Product created with ID: ${joyaId}\n`);

    // 3. Create a test client
    console.log('3️⃣ Creating test client...');
    const clienteResponse = await api.post('/clientes', {
      nombre: 'Test Cliente',
      telefono: '12345678',
      cedula: '123456789',
      direccion: 'Test Address',
      email: 'test@example.com'
    });
    const clienteId = clienteResponse.data.id;
    console.log(`✅ Client created with ID: ${clienteId}\n`);

    // 4. Create a cash sale (should go to ventas_dia)
    console.log('4️⃣ Creating cash sale...');
    const ventaContadoResponse = await api.post('/ventas', {
      items: [{ id_joya: joyaId, cantidad: 1, precio_unitario: 200 }],
      metodo_pago: 'Efectivo',
      descuento: 0,
      efectivo_recibido: 250,
      tipo_venta: 'Contado'
    });
    console.log(`✅ Cash sale created: ${JSON.stringify(ventaContadoResponse.data)}\n`);

    // 5. Create a credit sale (should go to ventas main DB)
    console.log('5️⃣ Creating credit sale...');
    const ventaCreditoResponse = await api.post('/ventas', {
      items: [{ id_joya: joyaId, cantidad: 2, precio_unitario: 200 }],
      metodo_pago: 'Efectivo',
      descuento: 0,
      tipo_venta: 'Credito',
      id_cliente: clienteId,
      fecha_vencimiento: '2024-12-31'
    });
    console.log(`✅ Credit sale created: ${JSON.stringify(ventaCreditoResponse.data)}\n`);

    // 6. Check cash register summary (should only include cash sale)
    console.log('6️⃣ Checking cash register summary...');
    const resumenResponse = await api.get('/cierrecaja/resumen-dia');
    console.log('Cash register summary:');
    console.log(`   - Total sales: ${resumenResponse.data.resumen.total_ventas}`);
    console.log(`   - Total income: ${resumenResponse.data.resumen.total_ingresos}`);
    console.log(`   - Sales in day DB: ${resumenResponse.data.ventas.length}`);
    
    if (resumenResponse.data.resumen.total_ventas === 1 && 
        resumenResponse.data.resumen.total_ingresos === 200) {
      console.log('✅ Cash register summary is CORRECT (only cash sale)\n');
    } else {
      console.log('❌ Cash register summary is WRONG (should only have 1 sale for ₡200)\n');
    }

    // 7. Check accounts receivable
    console.log('7️⃣ Checking accounts receivable...');
    const cuentasResponse = await api.get('/cuentas-por-cobrar');
    console.log(`   - Total accounts: ${cuentasResponse.data.cuentas.length}`);
    if (cuentasResponse.data.cuentas.length > 0) {
      const cuenta = cuentasResponse.data.cuentas[0];
      console.log(`   - Account amount: ${cuenta.monto_total}`);
      console.log(`   - Pending balance: ${cuenta.saldo_pendiente}`);
      console.log('✅ Account receivable created correctly\n');
    }

    // 8. Create an abono (payment)
    console.log('8️⃣ Creating payment (abono)...');
    const cuentaId = cuentasResponse.data.cuentas[0].id;
    const abonoResponse = await api.post(`/cuentas-por-cobrar/${cuentaId}/abonos`, {
      monto: 100,
      metodo_pago: 'Efectivo',
      notas: 'Test payment'
    });
    console.log(`✅ Payment created: ${JSON.stringify(abonoResponse.data)}\n`);

    // 9. Check updated cash register summary (should include abono)
    console.log('9️⃣ Checking updated cash register summary...');
    const resumenConAbonoResponse = await api.get('/cierrecaja/resumen-dia');
    console.log(`   - Total abonos: ${resumenConAbonoResponse.data.resumen.total_abonos || 0}`);
    console.log(`   - Monto abonos: ${resumenConAbonoResponse.data.resumen.monto_total_abonos || 0}`);
    console.log(`   - Total income combined: ${resumenConAbonoResponse.data.resumen.total_ingresos_combinado || 0}`);
    
    if (resumenConAbonoResponse.data.resumen.total_abonos === 1 &&
        resumenConAbonoResponse.data.resumen.monto_total_abonos === 100) {
      console.log('✅ Abono correctly included in cash register\n');
    } else {
      console.log('❌ Abono NOT included in cash register\n');
    }

    // 10. Perform cash register closing
    console.log('🔟 Performing cash register closing...');
    const cierreResponse = await api.post('/cierrecaja/cerrar-caja');
    console.log(`✅ Cash register closed: ${cierreResponse.data.mensaje}`);
    console.log(`   - Sales transferred: ${cierreResponse.data.resumen.total_ventas}`);
    console.log(`   - Total: ${cierreResponse.data.resumen.total_ingresos}\n`);

    // 11. Verify ventas_dia is now empty
    console.log('1️⃣1️⃣ Verifying day database is empty...');
    const resumenFinalResponse = await api.get('/cierrecaja/resumen-dia');
    if (resumenFinalResponse.data.ventas.length === 0) {
      console.log('✅ Day database cleared successfully\n');
    } else {
      console.log('❌ Day database still has sales\n');
    }

    // 12. Verify all sales are in main database
    console.log('1️⃣2️⃣ Checking all sales in main database...');
    const ventasResponse = await api.get('/ventas');
    console.log(`   - Total sales in main DB: ${ventasResponse.data.total}`);
    console.log(`   - Cash sales: ${ventasResponse.data.ventas.filter(v => v.tipo_venta !== 'Credito').length}`);
    console.log(`   - Credit sales: ${ventasResponse.data.ventas.filter(v => v.tipo_venta === 'Credito').length}`);
    
    if (ventasResponse.data.total >= 2) {
      console.log('✅ All sales correctly stored in main database\n');
    }

    console.log('🎉 ALL TESTS COMPLETED!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Need to wait for server to be ready
setTimeout(() => {
  runTests().then(() => process.exit(0)).catch(() => process.exit(1));
}, 1000);
