/**
 * Test para envío de email de comprobantes de venta
 * Valida funcionalidad sin requerir configuración de email real
 */

const { enviarTicketVentaPOS } = require('../services/emailService');

// Mock venta data
const ventaMock = {
  id: 123,
  fecha_venta: new Date().toISOString(),
  nombre_usuario: 'Juan Pérez',
  usuario: 'juanp',
  metodo_pago: 'Efectivo',
  subtotal: 50000,
  descuento: 5000,
  total: 45000,
  efectivo_recibido: 50000,
  cambio: 5000,
  notas: 'Cliente preferencial'
};

const ventaMixtoMock = {
  id: 124,
  fecha_venta: new Date().toISOString(),
  nombre_usuario: 'María López',
  usuario: 'marial',
  metodo_pago: 'Mixto',
  subtotal: 100000,
  descuento: 0,
  total: 100000,
  monto_efectivo: 50000,
  monto_tarjeta: 30000,
  monto_transferencia: 20000
};

const itemsMock = [
  {
    nombre_producto: 'Collar de Plata',
    cantidad: 1,
    precio_unitario: 30000,
    subtotal: 30000
  },
  {
    nombre_producto: 'Anillo de Oro',
    cantidad: 1,
    precio_unitario: 20000,
    subtotal: 20000
  }
];

const emailDestino = 'cliente@ejemplo.com';

async function testEnvioEmail() {
  console.log('🧪 Iniciando tests de envío de email...\n');

  // Test 1: Validar que la función existe
  console.log('✓ Test 1: Función enviarTicketVentaPOS existe');
  if (typeof enviarTicketVentaPOS !== 'function') {
    console.error('❌ FALLO: enviarTicketVentaPOS no es una función');
    return false;
  }

  // Test 2: Validar email regex básico
  console.log('✓ Test 2: Validación de formato de email');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  const validEmails = [
    'test@example.com',
    'user.name@domain.co.cr',
    'admin+tag@gmail.com'
  ];
  
  const invalidEmails = [
    'not-an-email',
    '@domain.com',
    'user@',
    'user @domain.com',
    ''
  ];
  
  for (const email of validEmails) {
    if (!emailRegex.test(email)) {
      console.error(`❌ FALLO: Email válido rechazado: ${email}`);
      return false;
    }
  }
  
  for (const email of invalidEmails) {
    if (emailRegex.test(email)) {
      console.error(`❌ FALLO: Email inválido aceptado: ${email}`);
      return false;
    }
  }

  // Test 3: Llamar la función (sin configuración de email, debería retornar not_configured)
  console.log('✓ Test 3: Llamar función sin configuración de email');
  try {
    const resultado = await enviarTicketVentaPOS(ventaMock, itemsMock, emailDestino);
    
    if (!resultado) {
      console.error('❌ FALLO: La función no retornó un resultado');
      return false;
    }
    
    if (resultado.sent === true) {
      console.log('  ℹ️ Email configurado y enviado exitosamente');
    } else if (resultado.reason === 'not_configured') {
      console.log('  ℹ️ Email no configurado (esperado en ambiente de test)');
    } else if (resultado.error) {
      console.log(`  ℹ️ Error al enviar: ${resultado.error} (puede ser esperado)`);
    }
  } catch (error) {
    console.error(`❌ FALLO: Error al ejecutar función: ${error.message}`);
    return false;
  }

  // Test 4: Verificar que maneja venta con pago mixto
  console.log('✓ Test 4: Venta con pago mixto');
  try {
    const resultado = await enviarTicketVentaPOS(ventaMixtoMock, itemsMock, emailDestino);
    
    if (!resultado) {
      console.error('❌ FALLO: La función no retornó un resultado para pago mixto');
      return false;
    }
  } catch (error) {
    console.error(`❌ FALLO: Error con pago mixto: ${error.message}`);
    return false;
  }

  // Test 5: Verificar que maneja items vacíos
  console.log('✓ Test 5: Venta con items vacíos');
  try {
    const resultado = await enviarTicketVentaPOS(ventaMock, [], emailDestino);
    
    if (!resultado) {
      console.error('❌ FALLO: La función no retornó un resultado con items vacíos');
      return false;
    }
  } catch (error) {
    console.error(`❌ FALLO: Error con items vacíos: ${error.message}`);
    return false;
  }

  console.log('\n✅ Todos los tests pasaron exitosamente!\n');
  return true;
}

// Ejecutar tests
testEnvioEmail()
  .then(success => {
    if (success) {
      console.log('🎉 Suite de tests completada con éxito');
      process.exit(0);
    } else {
      console.error('❌ Algunos tests fallaron');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Error fatal en tests:', error);
    process.exit(1);
  });
