const express = require('express');
const router = express.Router();
const Devolucion = require('../models/Devolucion');
const Venta = require('../models/Venta');
const ItemVenta = require('../models/ItemVenta');
const Joya = require('../models/Joya');
const MovimientoInventario = require('../models/MovimientoInventario');

// Middleware para verificar autenticación
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  next();
};

// Middleware para verificar que el usuario es administrador
const requireAdmin = (req, res, next) => {
  if (!req.session || !req.session.userId || req.session.role !== 'administrador') {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
  }
  next();
};

// Obtener todas las devoluciones
router.get('/', requireAuth, async (req, res) => {
  try {
    const filtros = {
      id_venta: req.query.id_venta,
      estado: req.query.estado,
      tipo_devolucion: req.query.tipo_devolucion,
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta,
      pagina: req.query.pagina,
      por_pagina: req.query.por_pagina
    };

    const resultado = await Devolucion.obtenerTodas(filtros);
    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener devoluciones:', error);
    res.status(500).json({ error: 'Error al obtener devoluciones' });
  }
});

// Obtener resumen de devoluciones
router.get('/resumen', requireAuth, async (req, res) => {
  try {
    const filtros = {
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta
    };

    const resumen = await Devolucion.obtenerResumen(filtros);
    res.json(resumen);
  } catch (error) {
    console.error('Error al obtener resumen de devoluciones:', error);
    res.status(500).json({ error: 'Error al obtener resumen de devoluciones' });
  }
});

// Obtener una devolución por ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const devolucion = await Devolucion.obtenerPorId(id);
    
    if (!devolucion) {
      return res.status(404).json({ error: 'Devolución no encontrada' });
    }

    res.json(devolucion);
  } catch (error) {
    console.error('Error al obtener devolución:', error);
    res.status(500).json({ error: 'Error al obtener devolución' });
  }
});

// Obtener devoluciones de una venta específica
router.get('/venta/:id_venta', requireAuth, async (req, res) => {
  try {
    const { id_venta } = req.params;

    const devoluciones = await Devolucion.obtenerPorVenta(id_venta);
    res.json(devoluciones);
  } catch (error) {
    console.error('Error al obtener devoluciones de la venta:', error);
    res.status(500).json({ error: 'Error al obtener devoluciones de la venta' });
  }
});

// Crear nueva devolución
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      id_venta, id_joya, cantidad, motivo, tipo_devolucion,
      metodo_reembolso, notas
    } = req.body;

    // Validaciones básicas
    if (!id_venta) {
      return res.status(400).json({ error: 'El ID de venta es requerido' });
    }

    if (!id_joya) {
      return res.status(400).json({ error: 'El ID de la joya es requerido' });
    }

    if (!cantidad || cantidad <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
    }

    if (!motivo) {
      return res.status(400).json({ error: 'El motivo es requerido' });
    }

    if (!tipo_devolucion) {
      return res.status(400).json({ error: 'El tipo de devolución es requerido' });
    }

    // Validar tipo de devolución
    const tiposValidos = ['Reembolso', 'Cambio', 'Nota de Credito'];
    if (!tiposValidos.includes(tipo_devolucion)) {
      return res.status(400).json({ error: 'Tipo de devolución inválido' });
    }

    // Si es reembolso, validar método
    if (tipo_devolucion === 'Reembolso' && !metodo_reembolso) {
      return res.status(400).json({ error: 'El método de reembolso es requerido para reembolsos' });
    }

    // Verificar que la venta existe
    const venta = await Venta.obtenerPorId(id_venta);
    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    // Verificar que la joya existe
    const joya = await Joya.obtenerPorId(id_joya);
    if (!joya) {
      return res.status(404).json({ error: 'Joya no encontrada' });
    }

    // Obtener el item de venta para validar y obtener el precio
    const itemsVenta = await ItemVenta.obtenerPorVenta(id_venta);
    const itemVenta = itemsVenta.find(item => item.id_joya === parseInt(id_joya));
    
    if (!itemVenta) {
      return res.status(404).json({ error: 'El producto no está en esta venta' });
    }

    // Validar que no se devuelva más de lo vendido
    if (cantidad > itemVenta.cantidad) {
      return res.status(400).json({ 
        error: `No se puede devolver más de lo vendido (vendido: ${itemVenta.cantidad})` 
      });
    }

    // Calcular subtotal de la devolución
    const precio_unitario = itemVenta.precio_unitario;
    const subtotal = precio_unitario * cantidad;

    const devolucionData = {
      id_venta,
      id_joya,
      cantidad,
      precio_unitario,
      subtotal,
      motivo,
      tipo_devolucion,
      monto_reembolsado: tipo_devolucion === 'Reembolso' ? subtotal : 0,
      metodo_reembolso: tipo_devolucion === 'Reembolso' ? metodo_reembolso : null,
      id_usuario: req.session.userId,
      usuario: req.session.username,
      notas
    };

    const resultado = await Devolucion.crear(devolucionData);

    res.status(201).json({
      mensaje: 'Devolución registrada exitosamente',
      id: resultado.id,
      subtotal
    });
  } catch (error) {
    console.error('Error al crear devolución:', error);
    res.status(500).json({ error: 'Error al crear devolución' });
  }
});

// Procesar devolución (aprobar y ajustar inventario)
router.post('/:id/procesar', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { aprobar } = req.body; // true = aprobar, false = rechazar

    // Obtener devolución
    const devolucion = await Devolucion.obtenerPorId(id);
    
    if (!devolucion) {
      return res.status(404).json({ error: 'Devolución no encontrada' });
    }

    if (devolucion.estado !== 'Pendiente') {
      return res.status(400).json({ error: 'Esta devolución ya fue procesada' });
    }

    if (aprobar) {
      // Aprobar devolución y devolver al inventario
      const joya = await Joya.obtenerPorId(devolucion.id_joya);
      const nuevoStock = joya.stock_actual + devolucion.cantidad;
      
      // Actualizar stock
      await Joya.actualizarStock(devolucion.id_joya, nuevoStock);

      // Registrar movimiento de inventario
      await MovimientoInventario.crear({
        id_joya: devolucion.id_joya,
        tipo_movimiento: 'Entrada',
        cantidad: devolucion.cantidad,
        motivo: `Devolución #${id} - Venta #${devolucion.id_venta} - ${devolucion.motivo}`,
        usuario: req.session.username,
        stock_antes: joya.stock_actual,
        stock_despues: nuevoStock
      });

      // Marcar como procesada
      await Devolucion.actualizarEstado(id, 'Procesada');

      res.json({
        mensaje: 'Devolución aprobada y procesada exitosamente',
        nuevo_stock: nuevoStock
      });
    } else {
      // Rechazar devolución
      await Devolucion.actualizarEstado(id, 'Rechazada');

      res.json({
        mensaje: 'Devolución rechazada'
      });
    }
  } catch (error) {
    console.error('Error al procesar devolución:', error);
    res.status(500).json({ error: 'Error al procesar devolución' });
  }
});

module.exports = router;
