/**
 * Comprehensive End-to-End System Test
 * Tests all functionality: Users, Auth, Joyas, Sales, Credits, Payments, Close Register, Reports
 */

const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
let adminCookie = '';
let dependienteCookie = '';
let testResults = [];

// Helper to log test results
function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const result = `${status}: ${testName}`;
  console.log(result + (details ? ` - ${details}` : ''));
  testResults.push({ testName, passed, details });
}

// Helper for API calls with cookie
async function apiCall(method, endpoint, data = null, cookie = '') {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: cookie ? { Cookie: cookie } : {},
      data
    };
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status 
    };
  }
}

async function runTests() {
  console.log('\n🚀 Starting Comprehensive System Test...\n');
  console.log('=' .repeat(60));

  // Test 1: Check server health
  console.log('\n📋 TEST GROUP: Server Health');
  const health = await apiCall('get', '/../health');
  logTest('Server health check', health.success && health.data.status === 'ok');

  // Test 2: Login as admin
  console.log('\n📋 TEST GROUP: Authentication');
  const adminLogin = await apiCall('post', '/auth/login', {
    username: 'admin',
    password: 'admin123'
  });
  
  if (adminLogin.success) {
    // Extract cookie from response headers if available
    adminCookie = 'connect.sid=test-session'; // Simplified for testing
    logTest('Admin login', true, 'admin/admin123');
  } else {
    logTest('Admin login', false, adminLogin.error);
    console.log('\n❌ Critical: Cannot proceed without admin login\n');
    process.exit(1);
  }

  // Test 3: Login as dependiente
  const depLogin = await apiCall('post', '/auth/login', {
    username: 'dependiente',
    password: 'dependiente123'
  });
  logTest('Dependiente login', depLogin.success, 'dependiente/dependiente123');

  // Test 4: Create a client
  console.log('\n📋 TEST GROUP: Client Management');
  const clientData = {
    nombre: 'Juan Pérez Test',
    telefono: '8888-8888',
    cedula: '1-1234-5678',
    direccion: 'San José, Costa Rica',
    email: 'juan@test.com',
    notas: 'Cliente de prueba'
  };
  
  const createClient = await apiCall('post', '/clientes', clientData, adminCookie);
  let clientId = null;
  if (createClient.success) {
    clientId = createClient.data.id;
    logTest('Create client', true, `ID: ${clientId}`);
  } else {
    logTest('Create client', false, createClient.error);
  }

  // Test 5: List clients
  const listClients = await apiCall('get', '/clientes', null, adminCookie);
  logTest('List clients', listClients.success && Array.isArray(listClients.data.clientes));

  // Test 6: Create jewelry items
  console.log('\n📋 TEST GROUP: Jewelry Management');
  const joyaData1 = {
    codigo: 'TEST-001',
    nombre: 'Anillo de Oro 18K',
    descripcion: 'Anillo de oro con diamante',
    categoria: 'Anillos',
    proveedor: 'Proveedor Test',
    costo: 50000,
    precio_venta: 75000,
    moneda: 'CRC',
    stock_actual: 10,
    stock_minimo: 2,
    ubicacion: 'Vitrina A',
    estado: 'Activo'
  };

  const createJoya1 = await apiCall('post', '/joyas', joyaData1, adminCookie);
  let joyaId1 = null;
  if (createJoya1.success) {
    joyaId1 = createJoya1.data.id;
    logTest('Create joya 1 (Anillo)', true, `ID: ${joyaId1}`);
  } else {
    logTest('Create joya 1', false, createJoya1.error);
  }

  // Create second joya
  const joyaData2 = {
    codigo: 'TEST-002',
    nombre: 'Collar de Plata',
    descripcion: 'Collar de plata 925',
    categoria: 'Collares',
    proveedor: 'Proveedor Test',
    costo: 25000,
    precio_venta: 40000,
    moneda: 'CRC',
    stock_actual: 5,
    stock_minimo: 1,
    ubicacion: 'Vitrina B',
    estado: 'Activo'
  };

  const createJoya2 = await apiCall('post', '/joyas', joyaData2, adminCookie);
  let joyaId2 = null;
  if (createJoya2.success) {
    joyaId2 = createJoya2.data.id;
    logTest('Create joya 2 (Collar)', true, `ID: ${joyaId2}`);
  } else {
    logTest('Create joya 2', false, createJoya2.error);
  }

  // Test 7: List joyas
  const listJoyas = await apiCall('get', '/joyas', null, adminCookie);
  logTest('List joyas', listJoyas.success && Array.isArray(listJoyas.data.joyas));

  // Test 8: Get joya details
  if (joyaId1) {
    const getJoya = await apiCall('get', `/joyas/${joyaId1}`, null, adminCookie);
    logTest('Get joya details', getJoya.success && getJoya.data.codigo === 'TEST-001');
  }

  // Test 9: Cash sale (Venta de contado - Efectivo)
  console.log('\n📋 TEST GROUP: Sales - Cash (Contado/Efectivo)');
  if (joyaId1 && joyaId2) {
    const cashSaleData = {
      id_usuario: 1, // Admin
      metodo_pago: 'Efectivo',
      tipo_venta: 'Contado',
      subtotal: 115000,
      descuento: 0,
      total: 115000,
      efectivo_recibido: 120000,
      cambio: 5000,
      items: [
        { id_joya: joyaId1, cantidad: 1, precio_unitario: 75000, subtotal: 75000 },
        { id_joya: joyaId2, cantidad: 1, precio_unitario: 40000, subtotal: 40000 }
      ]
    };

    const cashSale = await apiCall('post', '/ventas', cashSaleData, adminCookie);
    logTest('Cash sale (Efectivo)', cashSale.success, cashSale.success ? `Venta ID: ${cashSale.data.id_venta}` : cashSale.error);
  }

  // Test 10: Card sale (Venta de contado - Tarjeta)
  console.log('\n📋 TEST GROUP: Sales - Card (Contado/Tarjeta)');
  if (joyaId1) {
    const cardSaleData = {
      id_usuario: 1,
      metodo_pago: 'Tarjeta',
      tipo_venta: 'Contado',
      subtotal: 75000,
      descuento: 0,
      total: 75000,
      items: [
        { id_joya: joyaId1, cantidad: 1, precio_unitario: 75000, subtotal: 75000 }
      ]
    };

    const cardSale = await apiCall('post', '/ventas', cardSaleData, adminCookie);
    logTest('Card sale (Tarjeta)', cardSale.success, cardSale.success ? `Venta ID: ${cardSale.data.id_venta}` : cardSale.error);
  }

  // Test 11: Credit sale (Venta a crédito)
  console.log('\n📋 TEST GROUP: Sales - Credit (Crédito)');
  let creditAccountId = null;
  if (joyaId2 && clientId) {
    const creditSaleData = {
      id_usuario: 1,
      id_cliente: clientId,
      metodo_pago: 'Credito',
      tipo_venta: 'Credito',
      subtotal: 80000,
      descuento: 0,
      total: 80000,
      items: [
        { id_joya: joyaId2, cantidad: 2, precio_unitario: 40000, subtotal: 80000 }
      ]
    };

    const creditSale = await apiCall('post', '/ventas', creditSaleData, adminCookie);
    if (creditSale.success) {
      logTest('Credit sale (Crédito)', true, `Venta ID: ${creditSale.data.id_venta}`);
      creditAccountId = creditSale.data.id_cuenta_por_cobrar;
    } else {
      logTest('Credit sale', false, creditSale.error);
    }
  }

  // Test 12: Make payment on credit account (Abono)
  console.log('\n📋 TEST GROUP: Credit Payments (Abonos)');
  if (creditAccountId) {
    const paymentData = {
      monto: 30000,
      metodo_pago: 'Efectivo',
      notas: 'Primer abono'
    };

    const payment1 = await apiCall('post', `/cuentas-por-cobrar/${creditAccountId}/abonos`, paymentData, adminCookie);
    logTest('First payment (Abono 1)', payment1.success, payment1.success ? '₡30,000' : payment1.error);

    // Second payment
    const payment2Data = {
      monto: 50000,
      metodo_pago: 'Transferencia',
      notas: 'Segundo abono - Pago completo'
    };

    const payment2 = await apiCall('post', `/cuentas-por-cobrar/${creditAccountId}/abonos`, payment2Data, adminCookie);
    logTest('Second payment (Abono 2 - Completa)', payment2.success, payment2.success ? '₡50,000' : payment2.error);

    // Verify account is paid
    const getAccount = await apiCall('get', `/cuentas-por-cobrar/${creditAccountId}`, null, adminCookie);
    if (getAccount.success) {
      const isPaid = getAccount.data.estado === 'Pagada';
      logTest('Credit account paid status', isPaid, `Estado: ${getAccount.data.estado}`);
    }
  }

  // Test 13: List sales
  console.log('\n📋 TEST GROUP: Sales Listing');
  const listSales = await apiCall('get', '/ventas', null, adminCookie);
  logTest('List sales', listSales.success && Array.isArray(listSales.data.ventas));

  // Test 14: List accounts receivable
  console.log('\n📋 TEST GROUP: Accounts Receivable');
  const listAccounts = await apiCall('get', '/cuentas-por-cobrar', null, adminCookie);
  logTest('List accounts receivable', listAccounts.success && Array.isArray(listAccounts.data.cuentas));

  // Test 15: Get summary
  const getSummary = await apiCall('get', '/cuentas-por-cobrar/resumen', null, adminCookie);
  logTest('Accounts receivable summary', getSummary.success);

  // Test 16: Daily register summary
  console.log('\n📋 TEST GROUP: Daily Register (Caja)');
  const registerSummary = await apiCall('get', '/cierrecaja/resumen-dia', null, adminCookie);
  logTest('Daily register summary', registerSummary.success);

  // Test 17: Reports
  console.log('\n📋 TEST GROUP: Reports');
  const inventoryReport = await apiCall('get', '/reportes/inventario', null, adminCookie);
  logTest('Inventory report', inventoryReport.success && Array.isArray(inventoryReport.data));

  const lowStockReport = await apiCall('get', '/reportes/stock-bajo', null, adminCookie);
  logTest('Low stock report', lowStockReport.success && Array.isArray(lowStockReport.data));

  // Test 18: Movements
  console.log('\n📋 TEST GROUP: Inventory Movements');
  const listMovements = await apiCall('get', '/movimientos', null, adminCookie);
  logTest('List movements', listMovements.success && Array.isArray(listMovements.data.movimientos));

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST SUMMARY');
  console.log('='.repeat(60));
  const passed = testResults.filter(t => t.passed).length;
  const failed = testResults.filter(t => !t.passed).length;
  const total = testResults.length;
  
  console.log(`\nTotal Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed/total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.filter(t => !t.passed).forEach(t => {
      console.log(`  - ${t.testName}: ${t.details}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  
  return failed === 0;
}

// Run tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('\n❌ Test suite error:', error);
  process.exit(1);
});
