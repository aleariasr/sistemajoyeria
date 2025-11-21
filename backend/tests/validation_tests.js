const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

// Helper to make authenticated requests
const apiCall = async (method, url, data = null, sessionCookie = null) => {
  try {
    const config = {
      method,
      url: `${API_URL}${url}`,
      headers: sessionCookie ? { Cookie: sessionCookie } : {}
    };
    if (data) config.data = data;
    
    const response = await axios(config);
    return { success: true, data: response.data, headers: response.headers };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status 
    };
  }
};

console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║               🧪 PRUEBAS ADICIONALES - CASOS BORDE Y VALIDACIONES            ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

async function runAdditionalTests() {
  let errors = [];
  let warnings = [];
  
  // Get admin session
  let result = await apiCall('POST', '/auth/login', {
    username: 'admin',
    password: 'admin123'
  });
  
  if (!result.success) {
    console.log('❌ No se pudo obtener sesión de admin');
    process.exit(1);
  }
  
  const adminSession = result.headers['set-cookie']?.[0];
  
  // ============================================================================
  // 1. VALIDACIÓN: Venta con stock insuficiente
  // ============================================================================
  console.log('📝 1. VALIDACIÓN: Venta con stock insuficiente');
  console.log('─'.repeat(80));
  
  // Primero crear una joya con poco stock
  result = await apiCall('POST', '/joyas', {
    codigo: 'TEST-STOCK',
    nombre: 'Joya para test de stock',
    descripcion: 'Test',
    categoria: 'Anillo',
    proveedor: 'Test',
    costo: 10000,
    precio_venta: 20000,
    moneda: 'CRC',
    stock_actual: 2,
    stock_minimo: 1
  }, adminSession);
  
  if (!result.success) {
    console.log('❌ Error creando joya de prueba:', result.error);
    errors.push('No se pudo crear joya de prueba');
  } else {
    const joyaId = result.data.id;
    
    // Intentar vender más del stock disponible
    result = await apiCall('POST', '/ventas', {
      items: [{ id_joya: joyaId, cantidad: 10, precio_unitario: 20000 }],
      metodo_pago: 'Efectivo',
      descuento: 0,
      efectivo_recibido: 200000,
      tipo_venta: 'Contado'
    }, adminSession);
    
    if (result.success) {
      console.log('⚠️  ADVERTENCIA: Se permitió venta con stock insuficiente');
      warnings.push('Validación de stock insuficiente no funciona correctamente');
    } else if (result.error.error && result.error.error.includes('insuficiente')) {
      console.log('✅ Validación correcta: rechaza venta con stock insuficiente');
      console.log('   Error recibido:', result.error.error);
    } else {
      console.log('❓ Error inesperado:', result.error);
    }
  }
  
  // ============================================================================
  // 2. VALIDACIÓN: Abono mayor al saldo pendiente
  // ============================================================================
  console.log('\n📝 2. VALIDACIÓN: Abono mayor al saldo pendiente');
  console.log('─'.repeat(80));
  
  // Crear cliente y venta a crédito
  result = await apiCall('POST', '/clientes', {
    nombre: 'Cliente Test Validación',
    telefono: '9999-9999',
    cedula: '9-9999-9999',
    direccion: 'Test'
  }, adminSession);
  
  if (result.success) {
    const clienteId = result.data.id;
    
    // Crear venta a crédito pequeña
    result = await apiCall('POST', '/ventas', {
      items: [{ id_joya: 1, cantidad: 1, precio_unitario: 50000 }],
      metodo_pago: 'Credito',
      descuento: 0,
      tipo_venta: 'Credito',
      id_cliente: clienteId
    }, adminSession);
    
    if (result.success) {
      const cuentaId = result.data.id_cuenta_por_cobrar;
      
      // Intentar abonar más del saldo
      result = await apiCall('POST', `/cuentas-por-cobrar/${cuentaId}/abonos`, {
        monto: 100000,
        metodo_pago: 'Efectivo',
        notas: 'Abono mayor al saldo'
      }, adminSession);
      
      if (result.success) {
        console.log('⚠️  ADVERTENCIA: Se permitió abono mayor al saldo pendiente');
        warnings.push('Validación de abono excesivo no funciona correctamente');
      } else if (result.error.error && result.error.error.includes('mayor')) {
        console.log('✅ Validación correcta: rechaza abono mayor al saldo');
        console.log('   Error recibido:', result.error.error);
      } else {
        console.log('❓ Error inesperado:', result.error);
      }
    }
  }
  
  // ============================================================================
  // 3. VALIDACIÓN: Abono que completa el pago (estado → Pagada)
  // ============================================================================
  console.log('\n📝 3. VALIDACIÓN: Abono que completa el pago');
  console.log('─'.repeat(80));
  
  // Crear otra venta a crédito
  result = await apiCall('POST', '/ventas', {
    items: [{ id_joya: 1, cantidad: 1, precio_unitario: 30000 }],
    metodo_pago: 'Credito',
    descuento: 0,
    tipo_venta: 'Credito',
    id_cliente: 1
  }, adminSession);
  
  if (result.success) {
    const cuentaId = result.data.id_cuenta_por_cobrar;
    
    // Abonar el monto completo
    result = await apiCall('POST', `/cuentas-por-cobrar/${cuentaId}/abonos`, {
      monto: 30000,
      metodo_pago: 'Efectivo',
      notas: 'Pago completo'
    }, adminSession);
    
    if (result.success) {
      if (result.data.estado === 'Pagada') {
        console.log('✅ Estado actualizado correctamente a "Pagada"');
        console.log('   Nuevo saldo:', result.data.nuevo_saldo);
        console.log('   Estado:', result.data.estado);
      } else {
        console.log('⚠️  ADVERTENCIA: Estado no cambió a "Pagada" tras pago completo');
        console.log('   Estado actual:', result.data.estado);
        warnings.push('Estado de cuenta no se actualiza a Pagada correctamente');
      }
    } else {
      console.log('❌ Error al registrar abono completo:', result.error);
    }
  }
  
  // ============================================================================
  // 4. VALIDACIÓN: Cierre de caja vacío
  // ============================================================================
  console.log('\n📝 4. VALIDACIÓN: Cierre de caja vacío');
  console.log('─'.repeat(80));
  
  // Primero hacer un cierre para limpiar todo
  await apiCall('POST', '/cierrecaja/cerrar-caja', {}, adminSession);
  
  // Intentar cerrar caja vacía
  result = await apiCall('POST', '/cierrecaja/cerrar-caja', {}, adminSession);
  
  if (result.success) {
    console.log('⚠️  ADVERTENCIA: Se permitió cierre de caja vacía');
    warnings.push('Se permite cierre de caja sin ventas ni abonos');
  } else if (result.error.error && (result.error.error.includes('no hay') || result.error.error.includes('No hay'))) {
    console.log('✅ Validación correcta: rechaza cierre de caja vacía');
    console.log('   Error recibido:', result.error.error);
  } else {
    console.log('❓ Error inesperado:', result.error);
  }
  
  // ============================================================================
  // 5. VALIDACIÓN: Acceso sin autenticación
  // ============================================================================
  console.log('\n📝 5. VALIDACIÓN: Acceso sin autenticación');
  console.log('─'.repeat(80));
  
  result = await apiCall('GET', '/ventas', null, null);
  
  if (result.success) {
    console.log('⚠️  ADVERTENCIA: Se permitió acceso sin autenticación');
    errors.push('Endpoints no protegidos correctamente');
  } else if (result.status === 401) {
    console.log('✅ Validación correcta: rechaza acceso sin autenticación');
    console.log('   Status:', result.status);
  } else {
    console.log('❓ Respuesta inesperada:', result.status);
  }
  
  // ============================================================================
  // 6. VALIDACIÓN: Pago mixto con montos incorrectos
  // ============================================================================
  console.log('\n📝 6. VALIDACIÓN: Pago mixto con montos incorrectos');
  console.log('─'.repeat(80));
  
  result = await apiCall('POST', '/ventas', {
    items: [{ id_joya: 1, cantidad: 1, precio_unitario: 100000 }],
    metodo_pago: 'Mixto',
    descuento: 0,
    tipo_venta: 'Contado',
    monto_efectivo: 50000,
    monto_tarjeta: 30000,  // Total: 80000, pero venta es 100000
    monto_transferencia: 0
  }, adminSession);
  
  if (result.success) {
    console.log('⚠️  ADVERTENCIA: Se permitió pago mixto con montos que no suman el total');
    warnings.push('Validación de pago mixto no funciona correctamente');
  } else if (result.error.error && result.error.error.includes('coincide')) {
    console.log('✅ Validación correcta: rechaza pago mixto con montos incorrectos');
    console.log('   Error recibido:', result.error.error);
  } else {
    console.log('❓ Error inesperado:', result.error);
  }
  
  // ============================================================================
  // 7. VALIDACIÓN: Reportes con rango de fechas
  // ============================================================================
  console.log('\n📝 7. VALIDACIÓN: Reportes con filtros de fecha');
  console.log('─'.repeat(80));
  
  result = await apiCall('GET', '/reportes/movimientos-financieros?fecha_desde=2025-11-01&fecha_hasta=2025-11-30', null, adminSession);
  
  if (result.success) {
    console.log('✅ Reporte con filtros funciona correctamente');
    console.log('   Ventas en periodo:', result.data.ventas?.cantidad || 0);
    console.log('   Abonos en periodo:', result.data.abonos?.cantidad || 0);
  } else {
    console.log('❌ Error al obtener reporte con filtros:', result.error);
    errors.push('Reportes con filtros no funcionan');
  }
  
  // ============================================================================
  // 8. VALIDACIÓN: Descuento mayor al subtotal
  // ============================================================================
  console.log('\n📝 8. VALIDACIÓN: Descuento mayor al subtotal');
  console.log('─'.repeat(80));
  
  result = await apiCall('POST', '/ventas', {
    items: [{ id_joya: 1, cantidad: 1, precio_unitario: 50000 }],
    metodo_pago: 'Efectivo',
    descuento: 100000,  // Mayor al subtotal
    efectivo_recibido: 50000,
    tipo_venta: 'Contado'
  }, adminSession);
  
  if (result.success && result.data.total < 0) {
    console.log('⚠️  ADVERTENCIA: Se permitió venta con total negativo');
    warnings.push('No hay validación de descuento excesivo');
  } else if (!result.success) {
    console.log('✅ Validación: rechaza o maneja descuento excesivo');
  } else if (result.data.total >= 0) {
    console.log('✅ Venta procesada con total válido:', result.data.total);
  }
  
  // ============================================================================
  // RESUMEN FINAL
  // ============================================================================
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                         📊 RESUMEN DE VALIDACIONES                           ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  console.log('Pruebas realizadas: 8\n');
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ ¡TODAS LAS VALIDACIONES PASARON!\n');
    console.log('El sistema tiene validaciones robustas para casos borde.\n');
    process.exit(0);
  } else {
    if (errors.length > 0) {
      console.log('❌ ERRORES CRÍTICOS:\n');
      errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err}`);
      });
      console.log('');
    }
    
    if (warnings.length > 0) {
      console.log('⚠️  ADVERTENCIAS (comportamientos inesperados):\n');
      warnings.forEach((warn, idx) => {
        console.log(`   ${idx + 1}. ${warn}`);
      });
      console.log('');
    }
    
    if (errors.length > 0) {
      process.exit(1);
    } else {
      console.log('ℹ️  Sistema funcional pero con comportamientos a revisar.\n');
      process.exit(0);
    }
  }
}

runAdditionalTests().catch(err => {
  console.error('\n❌ ERROR CRÍTICO:', err);
  process.exit(1);
});
