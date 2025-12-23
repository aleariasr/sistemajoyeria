/**
 * Test: Cliente Optional Fields
 * 
 * Valida que solo el campo 'nombre' sea obligatorio
 * y que telefono y cedula sean opcionales
 */

const axios = require('axios');

// Configuración
const API_URL = process.env.API_URL || 'http://localhost:3001';
const BASE_URL = `${API_URL}/api`;

console.log('🧪 Testing Cliente Optional Fields...\n');
console.log(`🔗 API URL: ${BASE_URL}\n`);

// Variables de prueba
let authToken = null;
let clienteId = null;

/**
 * Función para iniciar sesión
 */
async function login() {
  try {
    console.log('1️⃣  Iniciando sesión...');
    const response = await axios.post(
      `${BASE_URL}/auth/login`,
      {
        username: 'admin',
        password: 'admin123'
      },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Guardar cookies para futuras peticiones
    authToken = response.headers['set-cookie'];
    
    console.log('✅ Sesión iniciada correctamente\n');
    return true;
  } catch (error) {
    console.error('❌ Error al iniciar sesión:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 1: Crear cliente solo con nombre (sin telefono ni cedula)
 */
async function testCrearClienteSoloNombre() {
  try {
    console.log('2️⃣  Test: Crear cliente solo con nombre...');
    
    const response = await axios.post(
      `${BASE_URL}/clientes`,
      {
        nombre: 'Cliente de Prueba - Solo Nombre',
        direccion: 'Dirección de prueba',
        email: 'prueba@example.com',
        notas: 'Cliente creado solo con nombre'
      },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authToken
        }
      }
    );

    clienteId = response.data.id;
    console.log('✅ Cliente creado exitosamente (ID:', clienteId, ')\n');
    return true;
  } catch (error) {
    console.error('❌ Error al crear cliente:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 2: Crear cliente sin nombre (debe fallar)
 */
async function testCrearClienteSinNombre() {
  try {
    console.log('3️⃣  Test: Crear cliente sin nombre (debe fallar)...');
    
    await axios.post(
      `${BASE_URL}/clientes`,
      {
        telefono: '1234567890',
        cedula: '123456789',
        direccion: 'Dirección de prueba'
      },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authToken
        }
      }
    );

    console.error('❌ El cliente se creó sin nombre (no debería permitirlo)\n');
    return false;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error?.includes('nombre')) {
      console.log('✅ Validación correcta: No se permite crear cliente sin nombre\n');
      return true;
    }
    console.error('❌ Error inesperado:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 3: Crear cliente con nombre y telefono (sin cedula)
 */
async function testCrearClienteConTelefono() {
  try {
    console.log('4️⃣  Test: Crear cliente con nombre y teléfono...');
    
    const response = await axios.post(
      `${BASE_URL}/clientes`,
      {
        nombre: 'Cliente de Prueba - Con Teléfono',
        telefono: '8888-8888'
      },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authToken
        }
      }
    );

    console.log('✅ Cliente creado exitosamente (ID:', response.data.id, ')\n');
    return true;
  } catch (error) {
    console.error('❌ Error al crear cliente:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 4: Crear cliente con nombre y cedula (sin telefono)
 */
async function testCrearClienteConCedula() {
  try {
    console.log('5️⃣  Test: Crear cliente con nombre y cédula...');
    
    const response = await axios.post(
      `${BASE_URL}/clientes`,
      {
        nombre: 'Cliente de Prueba - Con Cédula',
        cedula: '987654321'
      },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authToken
        }
      }
    );

    console.log('✅ Cliente creado exitosamente (ID:', response.data.id, ')\n');
    return true;
  } catch (error) {
    console.error('❌ Error al crear cliente:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 5: Actualizar cliente eliminando telefono y cedula
 */
async function testActualizarClienteEliminarDatos() {
  try {
    console.log('6️⃣  Test: Actualizar cliente eliminando teléfono y cédula...');
    
    if (!clienteId) {
      console.log('⚠️  No hay cliente para actualizar\n');
      return false;
    }

    await axios.put(
      `${BASE_URL}/clientes/${clienteId}`,
      {
        nombre: 'Cliente Actualizado - Sin Tel/Ced',
        telefono: '',
        cedula: '',
        direccion: 'Nueva dirección'
      },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authToken
        }
      }
    );

    console.log('✅ Cliente actualizado exitosamente\n');
    return true;
  } catch (error) {
    console.error('❌ Error al actualizar cliente:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 6: Verificar que backend previene cedulas duplicadas
 */
async function testCedulasDuplicadas() {
  try {
    console.log('7️⃣  Test: Verificar que backend previene cédulas duplicadas...');
    
    const cedulaDuplicada = '111222333';
    
    // Crear primer cliente
    await axios.post(
      `${BASE_URL}/clientes`,
      {
        nombre: 'Cliente 1 - Cédula Duplicada',
        cedula: cedulaDuplicada
      },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authToken
        }
      }
    );

    // Intentar crear segundo cliente con misma cédula (debe fallar)
    await axios.post(
      `${BASE_URL}/clientes`,
      {
        nombre: 'Cliente 2 - Cédula Duplicada',
        cedula: cedulaDuplicada
      },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authToken
        }
      }
    );

    console.error('❌ Se permitió crear dos clientes con la misma cédula\n');
    return false;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error?.includes('cédula')) {
      console.log('✅ Validación correcta: Backend previene cédulas duplicadas\n');
      return true;
    }
    console.error('❌ Error inesperado:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Función principal
 */
async function runTests() {
  console.log('════════════════════════════════════════');
  console.log('  TEST: CLIENTE OPTIONAL FIELDS');
  console.log('════════════════════════════════════════\n');

  const results = [];

  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ No se pudo iniciar sesión. Tests abortados.\n');
    process.exit(1);
  }

  // Ejecutar tests
  results.push({ name: 'Crear cliente solo con nombre', result: await testCrearClienteSoloNombre() });
  results.push({ name: 'Crear cliente sin nombre (debe fallar)', result: await testCrearClienteSinNombre() });
  results.push({ name: 'Crear cliente con teléfono', result: await testCrearClienteConTelefono() });
  results.push({ name: 'Crear cliente con cédula', result: await testCrearClienteConCedula() });
  results.push({ name: 'Actualizar cliente eliminando datos', result: await testActualizarClienteEliminarDatos() });
  results.push({ name: 'Verificar cédulas duplicadas', result: await testCedulasDuplicadas() });

  // Resumen
  console.log('\n════════════════════════════════════════');
  console.log('  RESUMEN DE TESTS');
  console.log('════════════════════════════════════════\n');

  const passed = results.filter(r => r.result).length;
  const total = results.length;

  results.forEach(r => {
    console.log(`${r.result ? '✅' : '❌'} ${r.name}`);
  });

  console.log(`\n📊 Resultado: ${passed}/${total} tests pasados\n`);

  if (passed === total) {
    console.log('✅ Todos los tests pasaron exitosamente!\n');
    process.exit(0);
  } else {
    console.log('❌ Algunos tests fallaron\n');
    process.exit(1);
  }
}

// Ejecutar tests
runTests().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});
