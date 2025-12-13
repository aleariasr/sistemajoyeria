/**
 * Test específico para validar que los nombres de productos
 * aparecen correctamente en los emails
 */

// Mock para simular el módulo Resend sin necesitar configuración
const mockResend = {
  emails: {
    send: async () => ({ 
      data: { id: 'mock-id' },
      error: null 
    })
  }
};

// Cachear el require original
const Module = require('module');
const originalRequire = Module.prototype.require;

// Mock del módulo resend
Module.prototype.require = function (id) {
  if (id === 'resend') {
    return { Resend: function() { return mockResend; } };
  }
  return originalRequire.apply(this, arguments);
};

// Configurar variables de entorno necesarias
process.env.RESEND_API_KEY = 'test_key';
process.env.EMAIL_FROM = 'test@test.com';

const emailService = require('../services/emailService');

// Restaurar require original después de cargar el servicio
Module.prototype.require = originalRequire;

/**
 * Test de validación de nombres de productos
 */
async function testProductNames() {
  console.log('🧪 Test: Validación de nombres de productos en emails\n');

  // Test 1: Items con campo 'nombre' (campo correcto de ItemVenta/ItemVentaDia)
  console.log('✓ Test 1: Items con campo "nombre" (campo correcto)');
  const itemsConNombre = [
    {
      nombre: 'Collar de Plata',
      cantidad: 1,
      precio_unitario: 30000,
      subtotal: 30000
    },
    {
      nombre: 'Anillo de Oro',
      cantidad: 2,
      precio_unitario: 20000,
      subtotal: 40000
    }
  ];

  const ventaMock = {
    id: 123,
    fecha_venta: new Date().toISOString(),
    nombre_usuario: 'Test User',
    usuario: 'testuser',
    metodo_pago: 'Efectivo',
    subtotal: 70000,
    descuento: 0,
    total: 70000,
    efectivo_recibido: 70000,
    cambio: 0
  };

  try {
    const result = await emailService.enviarTicketVentaPOS(
      ventaMock, 
      itemsConNombre, 
      'test@example.com'
    );
    
    if (!result || !result.sent) {
      console.error('❌ FALLO: Email no fue enviado');
      return false;
    }
    
    console.log('  ✅ Email enviado correctamente con campo "nombre"');
  } catch (error) {
    console.error(`❌ FALLO: ${error.message}`);
    return false;
  }

  // Test 2: Items con campo 'nombre_producto' (compatibilidad)
  console.log('✓ Test 2: Items con campo "nombre_producto" (compatibilidad)');
  const itemsConNombreProducto = [
    {
      nombre_producto: 'Pulsera de Cuero',
      cantidad: 1,
      precio_unitario: 15000,
      subtotal: 15000
    }
  ];

  try {
    const result = await emailService.enviarTicketVentaPOS(
      ventaMock,
      itemsConNombreProducto,
      'test@example.com'
    );
    
    if (!result || !result.sent) {
      console.error('❌ FALLO: Email no fue enviado');
      return false;
    }
    
    console.log('  ✅ Email enviado correctamente con campo "nombre_producto"');
  } catch (error) {
    console.error(`❌ FALLO: ${error.message}`);
    return false;
  }

  // Test 3: Items con campo 'product_name' (compatibilidad storefront)
  console.log('✓ Test 3: Items con campo "product_name" (compatibilidad storefront)');
  const itemsConProductName = [
    {
      product_name: 'Aretes de Perla',
      quantity: 1,
      unit_price: 25000,
      subtotal: 25000
    }
  ];

  try {
    const result = await emailService.enviarTicketVentaPOS(
      ventaMock,
      itemsConProductName,
      'test@example.com'
    );
    
    if (!result || !result.sent) {
      console.error('❌ FALLO: Email no fue enviado');
      return false;
    }
    
    console.log('  ✅ Email enviado correctamente con campo "product_name"');
  } catch (error) {
    console.error(`❌ FALLO: ${error.message}`);
    return false;
  }

  // Test 4: Items sin nombre (debería usar fallback 'Producto')
  console.log('✓ Test 4: Items sin nombre (fallback a "Producto")');
  const itemsSinNombre = [
    {
      cantidad: 1,
      precio_unitario: 10000,
      subtotal: 10000
    }
  ];

  try {
    const result = await emailService.enviarTicketVentaPOS(
      ventaMock,
      itemsSinNombre,
      'test@example.com'
    );
    
    if (!result || !result.sent) {
      console.error('❌ FALLO: Email no fue enviado');
      return false;
    }
    
    console.log('  ✅ Email enviado correctamente con fallback "Producto"');
  } catch (error) {
    console.error(`❌ FALLO: ${error.message}`);
    return false;
  }

  // Test 5: Prioridad del campo 'nombre' sobre otros
  console.log('✓ Test 5: Prioridad de campo "nombre" sobre otros campos');
  const itemsConMultiplesCampos = [
    {
      nombre: 'Nombre Correcto',
      nombre_producto: 'Nombre Incorrecto',
      product_name: 'Wrong Name',
      cantidad: 1,
      precio_unitario: 5000,
      subtotal: 5000
    }
  ];

  try {
    const result = await emailService.enviarTicketVentaPOS(
      ventaMock,
      itemsConMultiplesCampos,
      'test@example.com'
    );
    
    if (!result || !result.sent) {
      console.error('❌ FALLO: Email no fue enviado');
      return false;
    }
    
    console.log('  ✅ Campo "nombre" tiene prioridad correctamente');
  } catch (error) {
    console.error(`❌ FALLO: ${error.message}`);
    return false;
  }

  console.log('\n✅ Todos los tests de nombres de productos pasaron!\n');
  return true;
}

// Ejecutar tests
testProductNames()
  .then(success => {
    if (success) {
      console.log('🎉 Validación de nombres de productos completada con éxito');
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
