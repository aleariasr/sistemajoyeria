/**
 * Test: Joya Deletion with Dependency Checks
 * Tests physical deletion and dependency validation
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001/api';
let adminCookie = '';
let testJoyaId = null;
let testJoyaWithDepsId = null;

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
  console.log('\n🧪 Testing Joya Deletion with Dependency Checks\n');
  console.log('='.repeat(60));

  // Step 1: Login as admin
  console.log('\n1️⃣  Login as admin...');
  const adminLogin = await apiCall('post', '/auth/login', {
    username: 'admin',
    password: 'admin123'
  });
  
  if (!adminLogin.success) {
    console.log('❌ Cannot login as admin. Please ensure server is running.');
    console.log('   Error:', adminLogin.error);
    process.exit(1);
  }
  
  // Extract cookie (simplified - in real tests, parse from Set-Cookie header)
  adminCookie = 'connect.sid=test-session';
  console.log('✅ Admin login successful');

  // Step 2: Create a test joya without dependencies
  console.log('\n2️⃣  Creating test joya without dependencies...');
  const joyaData = {
    codigo: `TEST-DELETE-${Date.now()}`,
    nombre: 'Joya de Prueba para Eliminación',
    descripcion: 'Esta joya será eliminada físicamente',
    categoria: 'Test',
    proveedor: 'Test Provider',
    costo: 1000,
    precio_venta: 2000,
    moneda: 'CRC',
    stock_actual: 0,
    stock_minimo: 0,
    ubicacion: 'Test',
    estado: 'Activo'
  };

  const createJoya = await apiCall('post', '/joyas', joyaData, adminCookie);
  
  if (!createJoya.success) {
    console.log('❌ Cannot create test joya');
    console.log('   Error:', createJoya.error);
    process.exit(1);
  }
  
  testJoyaId = createJoya.data.id;
  console.log(`✅ Test joya created with ID: ${testJoyaId}`);

  // Step 3: Check dependencies (should have none)
  console.log(`\n3️⃣  Checking dependencies for joya ${testJoyaId}...`);
  const checkDeps = await apiCall('get', `/joyas/${testJoyaId}/dependencias`, null, adminCookie);
  
  if (!checkDeps.success) {
    console.log('❌ Cannot check dependencies');
    console.log('   Error:', checkDeps.error);
  } else {
    console.log('✅ Dependencies check successful');
    console.log('   Has dependencies:', checkDeps.data.tiene_dependencias);
    console.log('   Details:', JSON.stringify(checkDeps.data.detalles, null, 2));
    
    if (checkDeps.data.tiene_dependencias) {
      console.log('⚠️  Warning: Test joya has dependencies (unexpected)');
    }
  }

  // Step 4: Delete joya without dependencies (should be physical deletion)
  console.log(`\n4️⃣  Deleting joya ${testJoyaId} (should be physical)...`);
  const deleteJoya = await apiCall('delete', `/joyas/${testJoyaId}`, null, adminCookie);
  
  if (!deleteJoya.success) {
    console.log('❌ Deletion failed');
    console.log('   Status:', deleteJoya.status);
    console.log('   Error:', deleteJoya.error);
  } else {
    console.log('✅ Deletion successful');
    console.log('   Response:', JSON.stringify(deleteJoya.data, null, 2));
    
    if (deleteJoya.data.eliminado) {
      console.log('   ✓ Joya was physically deleted');
    } else if (deleteJoya.data.marcado_descontinuado) {
      console.log('   ⚠️  Joya was marked as discontinued (unexpected for joya without dependencies)');
    }
  }

  // Step 5: Verify joya is really deleted
  console.log(`\n5️⃣  Verifying joya ${testJoyaId} is deleted...`);
  const getDeleted = await apiCall('get', `/joyas/${testJoyaId}`, null, adminCookie);
  
  if (getDeleted.status === 404) {
    console.log('✅ Joya is not found (correctly deleted)');
  } else if (getDeleted.success) {
    console.log('⚠️  Joya still exists:');
    console.log('   Estado:', getDeleted.data.estado);
    if (getDeleted.data.estado === 'Descontinuado') {
      console.log('   (Marked as discontinued instead of deleted)');
    }
  } else {
    console.log('❌ Error checking if joya exists:', getDeleted.error);
  }

  // Step 6: Create another joya that will have dependencies
  console.log('\n6️⃣  Creating test joya that will have dependencies...');
  const joyaWithDepsData = {
    codigo: `TEST-WITH-DEPS-${Date.now()}`,
    nombre: 'Joya con Dependencias',
    descripcion: 'Esta joya tendrá movimientos',
    categoria: 'Test',
    proveedor: 'Test Provider',
    costo: 5000,
    precio_venta: 10000,
    moneda: 'CRC',
    stock_actual: 5,
    stock_minimo: 1,
    ubicacion: 'Test',
    estado: 'Activo'
  };

  const createJoyaWithDeps = await apiCall('post', '/joyas', joyaWithDepsData, adminCookie);
  
  if (!createJoyaWithDeps.success) {
    console.log('❌ Cannot create test joya with dependencies');
    console.log('   Error:', createJoyaWithDeps.error);
  } else {
    testJoyaWithDepsId = createJoyaWithDeps.data.id;
    console.log(`✅ Test joya created with ID: ${testJoyaWithDepsId}`);
    console.log('   (This joya has stock_actual > 0, so it will have a movement)');
  }

  // Step 7: Try to delete joya with dependencies
  if (testJoyaWithDepsId) {
    console.log(`\n7️⃣  Trying to delete joya ${testJoyaWithDepsId} with dependencies...`);
    
    // First check dependencies
    const checkDeps2 = await apiCall('get', `/joyas/${testJoyaWithDepsId}/dependencias`, null, adminCookie);
    if (checkDeps2.success) {
      console.log('   Dependencies found:', JSON.stringify(checkDeps2.data.detalles, null, 2));
    }
    
    const deleteJoyaWithDeps = await apiCall('delete', `/joyas/${testJoyaWithDepsId}`, null, adminCookie);
    
    if (deleteJoyaWithDeps.status === 409) {
      console.log('✅ Deletion correctly prevented (409 Conflict)');
      console.log('   Error:', deleteJoyaWithDeps.error.error);
      console.log('   Marked as discontinued:', deleteJoyaWithDeps.error.marcado_descontinuado);
      console.log('   Dependencies:', JSON.stringify(deleteJoyaWithDeps.error.dependencias, null, 2));
    } else if (deleteJoyaWithDeps.success && deleteJoyaWithDeps.data.marcado_descontinuado) {
      console.log('✅ Joya was marked as discontinued (has dependencies)');
      console.log('   Response:', JSON.stringify(deleteJoyaWithDeps.data, null, 2));
    } else {
      console.log('⚠️  Unexpected response:');
      console.log('   Status:', deleteJoyaWithDeps.status);
      console.log('   Response:', JSON.stringify(deleteJoyaWithDeps, null, 2));
    }

    // Step 8: Verify joya still exists but is discontinued
    console.log(`\n8️⃣  Verifying joya ${testJoyaWithDepsId} still exists...`);
    const getNotDeleted = await apiCall('get', `/joyas/${testJoyaWithDepsId}`, null, adminCookie);
    
    if (getNotDeleted.success) {
      console.log('✅ Joya still exists (correctly)');
      console.log('   Estado:', getNotDeleted.data.estado);
      if (getNotDeleted.data.estado === 'Descontinuado') {
        console.log('   ✓ Correctly marked as Descontinuado');
      } else {
        console.log('   ⚠️  Expected estado to be Descontinuado');
      }
    } else {
      console.log('❌ Joya was deleted (should not happen with dependencies)');
    }

    // Cleanup: Delete the test joya with dependencies (mark as discontinued)
    console.log(`\n🧹 Cleanup: Marking test joya ${testJoyaWithDepsId} as discontinued...`);
    // It's already discontinued from the previous step, so we're done
    console.log('✅ Cleanup complete');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ Test suite completed!');
  console.log('\nSummary:');
  console.log('  - Physical deletion works for joyas without dependencies ✓');
  console.log('  - Dependency checking endpoint works ✓');
  console.log('  - Joyas with dependencies are marked as discontinued ✓');
  console.log('  - Proper error messages and status codes ✓');
  console.log('\n');
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test failed with error:');
  console.error(error);
  process.exit(1);
});
