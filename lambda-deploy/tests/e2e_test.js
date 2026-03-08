const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
let adminSession = null;
let dependienteSession = null;
let clienteId = null;
let joyaId = null;
let ventaCredito = null;
let cuentaPorCobrarId = null;

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
console.log('║                    🧪 PRUEBA E2E COMPLETA DEL SISTEMA                        ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

async function runTests() {
  let errors = [];
  
  // ============================================================================
  // 1. LOGIN - ADMINISTRADOR
  // ============================================================================
  console.log('📝 1. LOGIN - ADMINISTRADOR');
  console.log('─'.repeat(80));
  
  let result = await apiCall('POST', '/auth/login', {
    username: 'admin',
    password: 'admin123'
  });
  
  if (result.success) {
    adminSession = result.headers['set-cookie']?.[0] || null;
    console.log('✅ Login administrador exitoso');
    console.log('   Usuario:', result.data.user?.username);
    console.log('   Rol:', result.data.user?.role);
  } else {
    console.log('❌ Error en login administrador:', result.error);
    errors.push('Login administrador falló');
  }
  
  // ============================================================================
  // 2. LOGIN - DEPENDIENTE
  // ============================================================================
  console.log('\n📝 2. LOGIN - DEPENDIENTE');
  console.log('─'.repeat(80));
  
  result = await apiCall('POST', '/auth/login', {
    username: 'dependiente',
    password: 'dependiente123'
  });
  
  if (result.success) {
    dependienteSession = result.headers['set-cookie']?.[0] || null;
    console.log('✅ Login dependiente exitoso');
    console.log('   Usuario:', result.data.user?.username);
    console.log('   Rol:', result.data.user?.role);
  } else {
    console.log('❌ Error en login dependiente:', result.error);
    errors.push('Login dependiente falló');
  }
  
  // ============================================================================
  // 3. CREAR CLIENTE (como administrador)
  // ============================================================================
  console.log('\n📝 3. CREAR CLIENTE');
  console.log('─'.repeat(80));
  
  result = await apiCall('POST', '/clientes', {
    nombre: 'María González',
    telefono: '8888-9999',
    cedula: '1-2222-3333',
    direccion: 'San José, Centro',
    email: 'maria@example.com'
  }, adminSession);
  
  if (result.success) {
    clienteId = result.data.id;
    console.log('✅ Cliente creado exitosamente');
    console.log('   ID:', clienteId);
    console.log('   Nombre:', 'María González');
    console.log('   Cédula:', '1-2222-3333');
  } else {
    console.log('❌ Error al crear cliente:', result.error);
    errors.push('Crear cliente falló');
  }
  
  // ============================================================================
  // 4. CREAR JOYA (como administrador)
  // ============================================================================
  console.log('\n📝 4. CREAR JOYA');
  console.log('─'.repeat(80));
  
  result = await apiCall('POST', '/joyas', {
    codigo: 'AN-TEST-001',
    nombre: 'Anillo de Oro 18k',
    descripcion: 'Anillo de oro 18 kilates con circonia',
    categoria: 'Anillo',
    proveedor: 'Proveedor Test',
    costo: 80000,
    precio_venta: 150000,
    moneda: 'CRC',
    stock_actual: 10,
    stock_minimo: 2,
    ubicacion: 'Vitrina A',
    estado: 'Activo'
  }, adminSession);
  
  if (result.success) {
    joyaId = result.data.id;
    console.log('✅ Joya creada exitosamente');
    console.log('   ID:', joyaId);
    console.log('   Código:', 'AN-TEST-001');
    console.log('   Nombre:', 'Anillo de Oro 18k');
    console.log('   Precio:', '₡150,000');
    console.log('   Stock:', '10 unidades');
  } else {
    console.log('❌ Error al crear joya:', result.error);
    errors.push('Crear joya falló');
  }
  
  // ============================================================================
  // 5. VENTA DE CONTADO - EFECTIVO (como dependiente)
  // ============================================================================
  console.log('\n📝 5. VENTA DE CONTADO - EFECTIVO');
  console.log('─'.repeat(80));
  
  result = await apiCall('POST', '/ventas', {
    items: [{ id_joya: joyaId, cantidad: 1, precio_unitario: 150000 }],
    metodo_pago: 'Efectivo',
    descuento: 0,
    efectivo_recibido: 200000,
    tipo_venta: 'Contado'
  }, dependienteSession);
  
  if (result.success) {
    console.log('✅ Venta en efectivo creada exitosamente');
    console.log('   Total:', '₡150,000');
    console.log('   Efectivo recibido:', '₡200,000');
    console.log('   Cambio:', '₡50,000');
  } else {
    console.log('❌ Error en venta efectivo:', result.error);
    errors.push('Venta efectivo falló');
  }
  
  // ============================================================================
  // 6. VENTA DE CONTADO - TARJETA (como admin)
  // ============================================================================
  console.log('\n📝 6. VENTA DE CONTADO - TARJETA');
  console.log('─'.repeat(80));
  
  result = await apiCall('POST', '/ventas', {
    items: [{ id_joya: joyaId, cantidad: 1, precio_unitario: 150000 }],
    metodo_pago: 'Tarjeta',
    descuento: 0,
    tipo_venta: 'Contado'
  }, adminSession);
  
  if (result.success) {
    console.log('✅ Venta con tarjeta creada exitosamente');
    console.log('   Total:', '₡150,000');
  } else {
    console.log('❌ Error en venta tarjeta:', result.error);
    errors.push('Venta tarjeta falló');
  }
  
  // ============================================================================
  // 7. VENTA DE CONTADO - TRANSFERENCIA
  // ============================================================================
  console.log('\n📝 7. VENTA DE CONTADO - TRANSFERENCIA');
  console.log('─'.repeat(80));
  
  result = await apiCall('POST', '/ventas', {
    items: [{ id_joya: joyaId, cantidad: 1, precio_unitario: 150000 }],
    metodo_pago: 'Transferencia',
    descuento: 10000,
    tipo_venta: 'Contado'
  }, dependienteSession);
  
  if (result.success) {
    console.log('✅ Venta con transferencia creada exitosamente');
    console.log('   Subtotal:', '₡150,000');
    console.log('   Descuento:', '₡10,000');
    console.log('   Total:', '₡140,000');
  } else {
    console.log('❌ Error en venta transferencia:', result.error);
    errors.push('Venta transferencia falló');
  }
  
  // ============================================================================
  // 8. VENTA DE CONTADO - MIXTO (Efectivo + Tarjeta)
  // ============================================================================
  console.log('\n📝 8. VENTA DE CONTADO - MIXTO (Efectivo + Tarjeta)');
  console.log('─'.repeat(80));
  
  result = await apiCall('POST', '/ventas', {
    items: [{ id_joya: joyaId, cantidad: 1, precio_unitario: 150000 }],
    metodo_pago: 'Mixto',
    descuento: 0,
    efectivo_recibido: 100000,
    tipo_venta: 'Contado',
    monto_efectivo: 100000,
    monto_tarjeta: 50000,
    monto_transferencia: 0
  }, adminSession);
  
  if (result.success) {
    console.log('✅ Venta mixta creada exitosamente');
    console.log('   Total:', '₡150,000');
    console.log('   Efectivo:', '₡100,000');
    console.log('   Tarjeta:', '₡50,000');
  } else {
    console.log('❌ Error en venta mixta:', result.error);
    errors.push('Venta mixta falló');
  }
  
  // ============================================================================
  // 9. VENTA A CRÉDITO
  // ============================================================================
  console.log('\n📝 9. VENTA A CRÉDITO');
  console.log('─'.repeat(80));
  
  result = await apiCall('POST', '/ventas', {
    items: [{ id_joya: joyaId, cantidad: 2, precio_unitario: 150000 }],
    metodo_pago: 'Credito',
    descuento: 0,
    tipo_venta: 'Credito',
    id_cliente: clienteId,
    fecha_vencimiento: '2025-12-31'
  }, adminSession);
  
  if (result.success) {
    ventaCredito = result.data.id;
    cuentaPorCobrarId = result.data.id_cuenta_por_cobrar;
    console.log('✅ Venta a crédito creada exitosamente');
    console.log('   ID Venta:', ventaCredito);
    console.log('   ID Cuenta por Cobrar:', cuentaPorCobrarId);
    console.log('   Total:', '₡300,000');
    console.log('   Cliente:', 'María González');
  } else {
    console.log('❌ Error en venta a crédito:', result.error);
    errors.push('Venta a crédito falló');
  }
  
  // ============================================================================
  // 10. VERIFICAR STOCK DESPUÉS DE VENTAS
  // ============================================================================
  console.log('\n📝 10. VERIFICAR STOCK DESPUÉS DE VENTAS');
  console.log('─'.repeat(80));
  
  result = await apiCall('GET', `/joyas/${joyaId}`, null, adminSession);
  
  if (result.success) {
    const stockEsperado = 10 - 6; // 10 iniciales - 6 vendidas
    const stockActual = result.data.stock_actual;
    console.log('✅ Stock verificado');
    console.log('   Stock inicial:', '10');
    console.log('   Vendidas:', '6 (1+1+1+1+2)');
    console.log('   Stock actual:', stockActual);
    if (stockActual !== stockEsperado) {
      console.log('   ⚠️  ADVERTENCIA: Stock esperado:', stockEsperado);
      errors.push(`Stock incorrecto: esperado ${stockEsperado}, actual ${stockActual}`);
    }
  } else {
    console.log('❌ Error al verificar stock:', result.error);
    errors.push('Verificación de stock falló');
  }
  
  // ============================================================================
  // 11. ABONO EN EFECTIVO A CUENTA POR COBRAR
  // ============================================================================
  console.log('\n📝 11. ABONO EN EFECTIVO');
  console.log('─'.repeat(80));
  
  if (cuentaPorCobrarId) {
    result = await apiCall('POST', `/cuentas-por-cobrar/${cuentaPorCobrarId}/abonos`, {
      monto: 100000,
      metodo_pago: 'Efectivo',
      notas: 'Primer abono en efectivo'
    }, adminSession);
    
    if (result.success) {
      console.log('✅ Abono en efectivo registrado');
      console.log('   Monto:', '₡100,000');
      console.log('   Nuevo saldo:', `₡${result.data.nuevo_saldo?.toLocaleString()}`);
    } else {
      console.log('❌ Error en abono efectivo:', result.error);
      errors.push('Abono efectivo falló');
    }
  }
  
  // ============================================================================
  // 12. ABONO CON TARJETA
  // ============================================================================
  console.log('\n📝 12. ABONO CON TARJETA');
  console.log('─'.repeat(80));
  
  if (cuentaPorCobrarId) {
    result = await apiCall('POST', `/cuentas-por-cobrar/${cuentaPorCobrarId}/abonos`, {
      monto: 80000,
      metodo_pago: 'Tarjeta',
      notas: 'Segundo abono con tarjeta'
    }, adminSession);
    
    if (result.success) {
      console.log('✅ Abono con tarjeta registrado');
      console.log('   Monto:', '₡80,000');
      console.log('   Nuevo saldo:', `₡${result.data.nuevo_saldo?.toLocaleString()}`);
    } else {
      console.log('❌ Error en abono tarjeta:', result.error);
      errors.push('Abono tarjeta falló');
    }
  }
  
  // ============================================================================
  // 13. ABONO CON TRANSFERENCIA
  // ============================================================================
  console.log('\n📝 13. ABONO CON TRANSFERENCIA');
  console.log('─'.repeat(80));
  
  if (cuentaPorCobrarId) {
    result = await apiCall('POST', `/cuentas-por-cobrar/${cuentaPorCobrarId}/abonos`, {
      monto: 50000,
      metodo_pago: 'Transferencia',
      notas: 'Tercer abono con transferencia'
    }, adminSession);
    
    if (result.success) {
      console.log('✅ Abono con transferencia registrado');
      console.log('   Monto:', '₡50,000');
      console.log('   Nuevo saldo:', `₡${result.data.nuevo_saldo?.toLocaleString()}`);
      console.log('   Estado:', result.data.estado);
    } else {
      console.log('❌ Error en abono transferencia:', result.error);
      errors.push('Abono transferencia falló');
    }
  }
  
  // ============================================================================
  // 14. VERIFICAR CIERRE DE CAJA
  // ============================================================================
  console.log('\n📝 14. VERIFICAR CIERRE DE CAJA');
  console.log('─'.repeat(80));
  
  result = await apiCall('GET', '/cierrecaja/resumen-dia', null, adminSession);
  
  if (result.success) {
    const resumen = result.data.resumen;
    const ventas = result.data.ventas || [];
    const abonos = result.data.abonos || [];
    
    console.log('✅ Resumen de caja obtenido');
    console.log('\n   📊 VENTAS DEL DÍA:');
    console.log('   ─'.repeat(40));
    console.log('   Total ventas:', ventas.length);
    console.log('   Efectivo (ventas):', `₡${(resumen.total_efectivo_final || 0).toLocaleString()}`);
    console.log('   Tarjeta (ventas):', `₡${(resumen.total_tarjeta_final || 0).toLocaleString()}`);
    console.log('   Transferencia (ventas):', `₡${(resumen.total_transferencia_final || 0).toLocaleString()}`);
    console.log('   Total ventas:', `₡${(resumen.total_ingresos || 0).toLocaleString()}`);
    
    console.log('\n   💰 ABONOS DEL DÍA:');
    console.log('   ─'.repeat(40));
    console.log('   Total abonos:', abonos.length);
    console.log('   Efectivo (abonos):', `₡${(resumen.monto_abonos_efectivo || 0).toLocaleString()}`);
    console.log('   Tarjeta (abonos):', `₡${(resumen.monto_abonos_tarjeta || 0).toLocaleString()}`);
    console.log('   Transferencia (abonos):', `₡${(resumen.monto_abonos_transferencia || 0).toLocaleString()}`);
    console.log('   Total abonos:', `₡${(resumen.monto_total_abonos || 0).toLocaleString()}`);
    
    console.log('\n   📈 TOTALES COMBINADOS:');
    console.log('   ─'.repeat(40));
    console.log('   Efectivo total:', `₡${(resumen.total_efectivo_combinado || 0).toLocaleString()}`);
    console.log('   Tarjeta total:', `₡${(resumen.total_tarjeta_combinado || 0).toLocaleString()}`);
    console.log('   Transferencia total:', `₡${(resumen.total_transferencia_combinado || 0).toLocaleString()}`);
    console.log('   TOTAL INGRESOS:', `₡${(resumen.total_ingresos_combinado || 0).toLocaleString()}`);
    
    // Verificar cálculos
    const efectivoEsperado = 150000 + 100000; // Venta efectivo + parte efectivo mixto
    const efectivoReal = resumen.total_efectivo_final || 0;
    
    const abonosEfectivoEsperado = 100000;
    const abonosEfectivoReal = resumen.monto_abonos_efectivo || 0;
    
    const totalEfectivoEsperado = efectivoEsperado + abonosEfectivoEsperado;
    const totalEfectivoReal = resumen.total_efectivo_combinado || 0;
    
    if (abonosEfectivoReal !== abonosEfectivoEsperado) {
      console.log(`\n   ❌ ERROR: Abonos en efectivo esperados ₡${abonosEfectivoEsperado.toLocaleString()}, reales ₡${abonosEfectivoReal.toLocaleString()}`);
      errors.push('Abonos en efectivo no coinciden en cierre de caja');
    }
    
    if (Math.abs(totalEfectivoReal - totalEfectivoEsperado) > 1) {
      console.log(`\n   ❌ ERROR: Total efectivo esperado ₡${totalEfectivoEsperado.toLocaleString()}, real ₡${totalEfectivoReal.toLocaleString()}`);
      errors.push('Total efectivo no coincide');
    }
  } else {
    console.log('❌ Error al obtener resumen de caja:', result.error);
    errors.push('Resumen de caja falló');
  }
  
  // ============================================================================
  // 15. VERIFICAR MOVIMIENTOS DE INVENTARIO
  // ============================================================================
  console.log('\n📝 15. VERIFICAR MOVIMIENTOS DE INVENTARIO');
  console.log('─'.repeat(80));
  
  result = await apiCall('GET', '/movimientos?por_pagina=100', null, adminSession);
  
  if (result.success) {
    const movimientos = result.data.movimientos || [];
    const movimientosJoya = movimientos.filter(m => m.id_joya === joyaId);
    console.log('✅ Movimientos verificados');
    console.log('   Total movimientos sistema:', movimientos.length);
    console.log('   Movimientos de la joya test:', movimientosJoya.length);
    console.log('   Esperado: 6 salidas (por las ventas)');
    
    if (movimientosJoya.length !== 6) {
      console.log('   ❌ ERROR: Se esperaban 6 movimientos, se encontraron', movimientosJoya.length);
      errors.push(`Movimientos incorrectos: esperado 6, encontrados ${movimientosJoya.length}`);
    }
  } else {
    console.log('❌ Error al verificar movimientos:', result.error);
    errors.push('Verificación de movimientos falló');
  }
  
  // ============================================================================
  // 16. VERIFICAR REPORTE DE MOVIMIENTOS FINANCIEROS
  // ============================================================================
  console.log('\n📝 16. VERIFICAR REPORTE DE MOVIMIENTOS FINANCIEROS');
  console.log('─'.repeat(80));
  
  result = await apiCall('GET', '/reportes/movimientos-financieros', null, adminSession);
  
  if (result.success) {
    const reporte = result.data;
    console.log('✅ Reporte de movimientos financieros obtenido');
    console.log('\n   💰 VENTAS:');
    console.log('   Cantidad:', reporte.ventas?.cantidad || 0);
    console.log('   Total:', `₡${(reporte.ventas?.totales?.total || 0).toLocaleString()}`);
    
    console.log('\n   💵 ABONOS:');
    console.log('   Cantidad:', reporte.abonos?.cantidad || 0);
    console.log('   Total:', `₡${(reporte.abonos?.totales?.total || 0).toLocaleString()}`);
    
    console.log('\n   📊 TOTALES COMBINADOS:');
    console.log('   Efectivo:', `₡${(reporte.totales_combinados?.efectivo || 0).toLocaleString()}`);
    console.log('   Tarjeta:', `₡${(reporte.totales_combinados?.tarjeta || 0).toLocaleString()}`);
    console.log('   Transferencia:', `₡${(reporte.totales_combinados?.transferencia || 0).toLocaleString()}`);
    console.log('   Total:', `₡${(reporte.totales_combinados?.total || 0).toLocaleString()}`);
  } else {
    console.log('❌ Error al obtener reporte financiero:', result.error);
    errors.push('Reporte financiero falló');
  }
  
  // ============================================================================
  // 17. VERIFICAR HISTORIAL COMPLETO
  // ============================================================================
  console.log('\n📝 17. VERIFICAR HISTORIAL COMPLETO');
  console.log('─'.repeat(80));
  
  result = await apiCall('GET', '/reportes/historial-completo', null, adminSession);
  
  if (result.success) {
    const historial = result.data.historial || [];
    const ventas = historial.filter(h => h.tipo === 'venta');
    const abonos = historial.filter(h => h.tipo === 'abono');
    const movimientos = historial.filter(h => h.tipo === 'movimiento_inventario');
    
    console.log('✅ Historial completo obtenido');
    console.log('   Total eventos:', historial.length);
    console.log('   Ventas:', ventas.length);
    console.log('   Abonos:', abonos.length);
    console.log('   Movimientos inventario:', movimientos.length);
  } else {
    console.log('❌ Error al obtener historial:', result.error);
    errors.push('Historial completo falló');
  }
  
  // ============================================================================
  // RESUMEN FINAL
  // ============================================================================
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                           📊 RESUMEN FINAL                                   ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  if (errors.length === 0) {
    console.log('✅ ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!\n');
    console.log('   • Login de admin y dependiente: ✅');
    console.log('   • Creación de cliente: ✅');
    console.log('   • Creación de joya: ✅');
    console.log('   • Ventas en todos los métodos de pago: ✅');
    console.log('   • Venta a crédito: ✅');
    console.log('   • Abonos en todos los métodos: ✅');
    console.log('   • Actualización de stock: ✅');
    console.log('   • Cierre de caja: ✅');
    console.log('   • Movimientos de inventario: ✅');
    console.log('   • Reportes financieros: ✅');
    console.log('   • Historial completo: ✅\n');
    process.exit(0);
  } else {
    console.log('❌ SE ENCONTRARON ERRORES:\n');
    errors.forEach((err, idx) => {
      console.log(`   ${idx + 1}. ${err}`);
    });
    console.log('');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('\n❌ ERROR CRÍTICO:', err);
  process.exit(1);
});
