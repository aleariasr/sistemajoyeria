/**
 * Routes: Pedidos Online (Online Orders Management)
 * 
 * Handles both public routes (for storefront) and admin routes (for order management)
 * Implements full order lifecycle: creation, confirmation, shipping, delivery, cancellation
 */

const express = require('express');
const router = express.Router();
const PedidoOnline = require('../models/PedidoOnline');
const ItemPedidoOnline = require('../models/ItemPedidoOnline');
const Joya = require('../models/Joya');
const Venta = require('../models/Venta');
const ItemVenta = require('../models/ItemVenta');
const MovimientoInventario = require('../models/MovimientoInventario');
const { requireAuth } = require('../middleware/auth');
const {
  enviarConfirmacionPedido,
  notificarNuevoPedido,
  enviarConfirmacionPago,
  enviarNotificacionEnvio,
  enviarCancelacionPedido
} = require('../services/emailService');
const {
  enviarATodos,
  crearPayload
} = require('../services/pushNotificationService');
const {
  validarYPrepararItem,
  actualizarStockVenta,
  validarStockPedidoOnline
} = require('../services/productService');

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Sanitize string input to prevent XSS
 */
function sanitizeString(str, maxLength = 500) {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .substring(0, maxLength)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format (6-20 digits, allows +, parentheses, spaces, hyphens)
 */
function isValidPhone(phone) {
  const normalizedPhone = phone.replace(/[\s-]/g, '');
  const phoneRegex = /^[0-9+()]{6,20}$/;
  return phoneRegex.test(normalizedPhone);
}

/**
 * Rate limiting helper (simple in-memory implementation)
 * In production, use Redis-based rate limiting
 */
const orderAttempts = new Map();

function checkRateLimit(identifier, maxAttempts = 10, windowMs = 3600000) {
  const now = Date.now();
  const attempts = orderAttempts.get(identifier) || [];
  
  // Remove old attempts outside window
  const recentAttempts = attempts.filter(time => now - time < windowMs);
  
  if (recentAttempts.length >= maxAttempts) {
    return false; // Rate limit exceeded
  }
  
  recentAttempts.push(now);
  orderAttempts.set(identifier, recentAttempts);
  return true;
}

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * POST /api/public/orders
 * Create a new order from storefront
 * 
 * This endpoint handles the complete order creation flow:
 * 1. Validates customer and order data
 * 2. Checks product availability and stock
 * 3. Creates order and items records
 * 4. Sends confirmation emails to customer and admin
 */
router.post('/public/orders', async (req, res) => {
  try {
    const { customer, items, notes } = req.body;

    // ====== VALIDATIONS ======
    
    // Rate limiting by IP
    const clientIp = req.ip || req.connection.remoteAddress;
    if (!checkRateLimit(clientIp, 10, 3600000)) {
      return res.status(429).json({
        error: 'Demasiados pedidos. Por favor, intenta de nuevo más tarde.',
        field: 'rate_limit'
      });
    }

    // Validate customer data
    if (!customer || !customer.nombre || !customer.telefono || !customer.email) {
      return res.status(400).json({
        error: 'Nombre, teléfono y email del cliente son obligatorios',
        field: 'customer'
      });
    }

    // Validate customer fields
    if (customer.nombre.length > 100) {
      return res.status(400).json({
        error: 'El nombre no puede exceder 100 caracteres',
        field: 'nombre'
      });
    }

    if (!isValidEmail(customer.email)) {
      return res.status(400).json({
        error: 'Formato de email inválido',
        field: 'email'
      });
    }

    if (!isValidPhone(customer.telefono)) {
      return res.status(400).json({
        error: 'Formato de teléfono inválido (6-20 dígitos)',
        field: 'telefono'
      });
    }

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'El pedido debe tener al menos un producto',
        field: 'items'
      });
    }

    if (items.length > 100) {
      return res.status(400).json({
        error: 'Máximo 100 productos por pedido',
        field: 'items'
      });
    }

    // ====== SANITIZE INPUT ======
    
    const sanitizedCustomer = {
      nombre: sanitizeString(customer.nombre, 100),
      telefono: customer.telefono.replace(/[\s-]/g, ''),
      email: sanitizeString(customer.email, 255),
      direccion: customer.direccion ? sanitizeString(customer.direccion, 500) : ''
    };

    const sanitizedNotes = notes ? sanitizeString(notes, 1000) : null;

    // ====== VALIDATE PRODUCTS AND STOCK ======
    
    let subtotal = 0;
    const itemsValidados = [];

    for (const item of items) {
      // Validate item structure
      if (!item.product_id || !item.quantity) {
        return res.status(400).json({
          error: 'Cada producto debe tener product_id y quantity',
          field: 'items'
        });
      }

      if (typeof item.quantity !== 'number' || item.quantity <= 0 || item.quantity > 1000) {
        return res.status(400).json({
          error: 'Cantidad inválida para producto',
          field: 'quantity'
        });
      }

      // Validate product and stock (handles both regular and composite products)
      try {
        const joya = await validarStockPedidoOnline(item);

        const itemSubtotal = joya.precio_venta * item.quantity;
        subtotal += itemSubtotal;

        itemsValidados.push({
          id_joya: joya.id,
          nombre_producto: joya.nombre,
          precio_unitario: joya.precio_venta,
          cantidad: item.quantity,
          subtotal: itemSubtotal,
          imagen_url: joya.imagen_url,
          stock_actual: joya.stock_actual,
          es_producto_compuesto: joya.es_producto_compuesto
        });
      } catch (error) {
        return res.status(400).json({
          error: error.message,
          field: 'product_validation'
        });
      }
    }

    // ====== CREATE ORDER ======
    
    const pedidoData = {
      nombre_cliente: sanitizedCustomer.nombre,
      telefono: sanitizedCustomer.telefono,
      email: sanitizedCustomer.email,
      direccion_linea1: sanitizedCustomer.direccion || 'N/A',
      subtotal: subtotal,
      costo_envio: 0,
      total: subtotal,
      notas: sanitizedNotes,
      metodo_pago: 'pendiente'
    };

    const resultado = await PedidoOnline.crear(pedidoData);
    const idPedido = resultado.id;

    // ====== CREATE ORDER ITEMS ======
    
    await ItemPedidoOnline.crearItems(idPedido, itemsValidados);

    // ====== SEND EMAILS ======
    
    // Get complete order for emails
    const pedidoCompleto = await PedidoOnline.obtenerPorId(idPedido);
    const itemsCompletos = await ItemPedidoOnline.obtenerPorPedido(idPedido);

    // Send confirmation to customer (async, don't wait)
    enviarConfirmacionPedido(pedidoCompleto, itemsCompletos).catch(err => {
      console.error('Error sending customer confirmation:', err);
    });

    // Send notification to admin (async, don't wait)
    notificarNuevoPedido(pedidoCompleto, itemsCompletos).catch(err => {
      console.error('Error sending admin notification:', err);
    });

    // ====== SEND PUSH NOTIFICATIONS ======
    
    // Send push notification to all authenticated POS users
    const formatPrice = (price) => {
      return new Intl.NumberFormat('es-CR', {
        style: 'currency',
        currency: 'CRC',
        minimumFractionDigits: 0
      }).format(price);
    };

    const pushPayload = crearPayload({
      title: '🛍️ Nuevo Pedido Online',
      body: `${sanitizedCustomer.nombre} - Total: ${formatPrice(subtotal)}`,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: {
        url: '/pedidos-online',
        pedidoId: idPedido,
        tipo: 'nuevo_pedido'
      },
      requireInteraction: true,
      vibrate: [200, 100, 200],
      tag: 'pedido-online'
    });

    enviarATodos(pushPayload).catch(err => {
      console.error('Error sending push notification:', err);
      // Don't fail the order creation if notification fails
    });

    // ====== RESPONSE ======
    
    console.log(`✅ Pedido online creado: #${idPedido} - ${sanitizedCustomer.nombre}`);

    res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      order: {
        id: idPedido,
        total: subtotal,
        items_count: items.length,
        customer_name: sanitizedCustomer.nombre
      }
    });

  } catch (error) {
    console.error('Error creating online order:', error);
    res.status(500).json({
      error: 'Error al procesar la solicitud. Por favor, intenta de nuevo.'
    });
  }
});

/**
 * GET /api/public/orders/:id
 * Get order confirmation details (public view)
 * Shows basic order info for customer confirmation page
 */
router.get('/public/orders/:id', async (req, res) => {
  try {
    const pedido = await PedidoOnline.obtenerPorId(req.params.id);

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const items = await ItemPedidoOnline.obtenerPorPedido(req.params.id);

    // Return only customer-safe information
    res.json({
      id: pedido.id,
      date: pedido.fecha_creacion,
      total: pedido.total,
      subtotal: pedido.subtotal,
      estado: pedido.estado,
      items: items.map(item => ({
        nombre: item.nombre_producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
        imagen_url: item.imagen_url
      }))
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Error al obtener el pedido' });
  }
});

// ============================================
// ADMIN ROUTES (Authentication required)
// ============================================

/**
 * GET /api/pedidos-online
 * List all orders with filters and pagination (ADMIN)
 */
router.get('/pedidos-online', requireAuth, async (req, res) => {
  try {
    const filtros = {
      estado: req.query.estado,
      estado_pago: req.query.estado_pago,
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta,
      busqueda: req.query.busqueda,
      pagina: parseInt(req.query.pagina) || 1,
      por_pagina: parseInt(req.query.por_pagina) || 20
    };

    const resultado = await PedidoOnline.listar(filtros);

    res.json(resultado);

  } catch (error) {
    console.error('Error listing orders:', error);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

/**
 * GET /api/pedidos-online/:id
 * Get complete order details with items (ADMIN)
 */
router.get('/pedidos-online/:id', requireAuth, async (req, res) => {
  try {
    const pedido = await PedidoOnline.obtenerPorId(req.params.id);

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const items = await ItemPedidoOnline.obtenerConDetalles(req.params.id);

    res.json({
      ...pedido,
      items: items
    });

  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Error al obtener detalles del pedido' });
  }
});

/**
 * PATCH /api/pedidos-online/:id/estado
 * Update order status (ADMIN)
 * 
 * Handles state transitions and associated actions:
 * - Pendiente -> Confirmado: Check stock, create sale, update inventory
 * - Confirmado -> Enviado: Send shipping notification
 * - Enviado -> Entregado: Mark as delivered
 * - Any -> Cancelado: Restore stock if was confirmed
 */
router.patch('/pedidos-online/:id/estado', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, motivo } = req.body;

    // Validate new status
    const estadosValidos = ['pendiente', 'pago_verificado', 'en_proceso', 'enviado', 'entregado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        error: 'Estado inválido',
        field: 'estado'
      });
    }

    // Get current order
    const pedido = await PedidoOnline.obtenerPorId(id);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const estadoActual = pedido.estado;

    // Validate state transitions
    if (estadoActual === 'entregado' || estadoActual === 'cancelado') {
      return res.status(400).json({
        error: 'No se puede cambiar el estado de un pedido entregado o cancelado',
        field: 'estado'
      });
    }

    // Get order items
    const items = await ItemPedidoOnline.obtenerConDetalles(id);

    // ====== HANDLE STATE TRANSITIONS ======

    if (estado === 'Confirmado' && estadoActual === 'pendiente') {
      // CONFIRMING ORDER: Verify stock, create sale, update inventory
      
      // 1. Prepare items and verify stock availability (handles sets)
      const itemsPreparados = [];
      for (const item of items) {
        try {
          const joya = await Joya.obtenerPorId(item.id_joya);
          if (!joya) {
            return res.status(404).json({
              error: `Producto con ID ${item.id_joya} no encontrado`,
              field: 'product_id'
            });
          }
          
          const itemPreparado = await validarYPrepararItem(
            {
              id_joya: item.id_joya,
              cantidad: item.cantidad,
              precio_unitario: item.precio_unitario
            },
            req.session.username || 'Admin'
          );
          itemsPreparados.push({
            ...item,
            ...itemPreparado
          });
        } catch (error) {
          return res.status(400).json({
            error: error.message,
            field: 'stock'
          });
        }
      }

      // 2. Create sale record
      const ventaData = {
        id_usuario: req.session.userId,
        metodo_pago: 'Transferencia',
        subtotal: pedido.subtotal,
        descuento: 0,
        total: pedido.total,
        notas: `Pedido online #${id}`,
        tipo_venta: 'Contado',
        monto_transferencia: pedido.total
      };

      const resultadoVenta = await Venta.crear(ventaData);
      const idVenta = resultadoVenta.id;

      // 3. Create sale items and update stock (handles sets)
      for (const item of itemsPreparados) {
        // Create sale item
        await ItemVenta.crear({
          id_venta: idVenta,
          id_joya: item.id_joya,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: item.subtotal
        });

        // Update stock (handles both regular and composite products)
        await actualizarStockVenta(item, `Pedido online #${id} confirmado`, req.session.username || 'Admin');
      }

      // 4. Link order to sale
      await PedidoOnline.vincularVenta(id, idVenta);

      // 5. Update order status
      await PedidoOnline.actualizarEstado(id, estado);

      // 6. Send confirmation email to customer
      const pedidoActualizado = await PedidoOnline.obtenerPorId(id);
      enviarConfirmacionPago(pedidoActualizado, items).catch(err => {
        console.error('Error sending payment confirmation:', err);
      });

      console.log(`✅ Pedido #${id} confirmado - Venta #${idVenta} creada`);

    } else if (estado === 'Enviado') {
      // SHIPPING ORDER: Send notification
      
      await PedidoOnline.actualizarEstado(id, estado);

      // Send shipping notification
      enviarNotificacionEnvio(pedido, items).catch(err => {
        console.error('Error sending shipping notification:', err);
      });

      console.log(`📦 Pedido #${id} marcado como enviado`);

    } else if (estado === 'Entregado') {
      // DELIVERED: Just update status
      
      await PedidoOnline.actualizarEstado(id, estado);
      console.log(`✅ Pedido #${id} entregado`);

    } else if (estado === 'Cancelado') {
      // CANCELLING ORDER: Restore stock if was confirmed
      
      if (pedido.id_venta) {
        // Order was confirmed, need to restore stock
        for (const item of items) {
          const joya = await Joya.obtenerPorId(item.id_joya);
          const nuevoStock = joya.stock_actual + item.cantidad;
          await Joya.actualizarStock(item.id_joya, nuevoStock);

          // Record inventory movement
          await MovimientoInventario.crear({
            id_joya: item.id_joya,
            tipo_movimiento: 'Entrada',
            cantidad: item.cantidad,
            motivo: `Pedido online #${id} cancelado`,
            usuario: req.session.username || 'Admin',
            stock_antes: joya.stock_actual,
            stock_despues: nuevoStock
          });
        }
      }

      await PedidoOnline.actualizarEstado(id, estado);

      // Send cancellation email
      enviarCancelacionPedido(pedido, motivo || 'Pedido cancelado por el administrador').catch(err => {
        console.error('Error sending cancellation email:', err);
      });

      console.log(`❌ Pedido #${id} cancelado`);

    } else {
      // Simple status update
      await PedidoOnline.actualizarEstado(id, estado);
    }

    res.json({
      success: true,
      message: 'Estado actualizado correctamente'
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Error al actualizar estado del pedido' });
  }
});

/**
 * PATCH /api/pedidos-online/:id
 * Update order internal notes (ADMIN)
 */
router.patch('/pedidos-online/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { notas_internas } = req.body;

    if (typeof notas_internas !== 'string') {
      return res.status(400).json({
        error: 'Las notas deben ser texto',
        field: 'notas_internas'
      });
    }

    const notasSanitizadas = sanitizeString(notas_internas, 2000);

    await PedidoOnline.actualizarNotasInternas(id, notasSanitizadas);

    res.json({
      success: true,
      message: 'Notas actualizadas correctamente'
    });

  } catch (error) {
    console.error('Error updating order notes:', error);
    res.status(500).json({ error: 'Error al actualizar notas' });
  }
});

/**
 * GET /api/pedidos-online/resumen/stats
 * Get order statistics summary (ADMIN)
 */
router.get('/pedidos-online/resumen/stats', requireAuth, async (req, res) => {
  try {
    const resumen = await PedidoOnline.obtenerResumen();
    res.json(resumen);
  } catch (error) {
    console.error('Error getting order summary:', error);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
});

module.exports = router;
