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
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      id_venta, items, tipo_devolucion,
      metodo_reembolso, notas
    } = req.body;

    // Validaciones básicas
    if (!id_venta) {
      return res.status(400).json({ error: 'El ID de venta es requerido' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Los items a devolver son requeridos' });
    }

    if (!tipo_devolucion) {
      return res.status(400).json({ error: 'El tipo de devolución es requerido' });
    }

    // Validar tipo de devolución
    const tiposValidos = ['Reembolso', 'Cambio', 'Nota de Credito', 'Parcial', 'Completa'];
    if (!tiposValidos.includes(tipo_devolucion)) {
      return res.status(400).json({ error: 'Tipo de devolución inválido' });
    }

    // Si es reembolso, validar método
    if ((tipo_devolucion === 'Reembolso' || tipo_devolucion === 'Parcial' || tipo_devolucion === 'Completa') && !metodo_reembolso) {
      return res.status(400).json({ error: 'El método de reembolso es requerido para reembolsos' });
    }

    // Verificar que la venta existe
    const venta = await Venta.obtenerPorId(id_venta);
    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    // Obtener los items de venta para validar
    const itemsVenta = await ItemVenta.obtenerPorVenta(id_venta);
    
    let totalDevolucion = 0;
    const devolucionesCreadas = [];

    // Procesar cada item de devolución
    for (const item of items) {
      const { id_item_venta, cantidad, motivo } = item;

      if (!cantidad || cantidad <= 0) {
        return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
      }

      if (!motivo) {
        return res.status(400).json({ error: 'El motivo es requerido para cada item' });
      }

      // Buscar el item de venta
      const itemVenta = itemsVenta.find(iv => iv.id === parseInt(id_item_venta));
      
      if (!itemVenta) {
        return res.status(404).json({ error: `Item de venta ${id_item_venta} no encontrado` });
      }

      // Validar que no se devuelva más de lo vendido
      if (cantidad > itemVenta.cantidad) {
        return res.status(400).json({ 
          error: `No se puede devolver más de lo vendido para el item ${id_item_venta} (vendido: ${itemVenta.cantidad})` 
        });
      }

      // Calcular subtotal de la devolución
      const precio_unitario = itemVenta.precio_unitario;
      const subtotal = precio_unitario * cantidad;
      totalDevolucion += subtotal;

      const devolucionData = {
        id_venta,
        id_joya: itemVenta.id_joya,
        cantidad,
        precio_unitario,
        subtotal,
        motivo,
        tipo_devolucion,
        monto_reembolsado: (tipo_devolucion === 'Reembolso' || tipo_devolucion === 'Parcial' || tipo_devolucion === 'Completa') ? subtotal : 0,
        metodo_reembolso: (tipo_devolucion === 'Reembolso' || tipo_devolucion === 'Parcial' || tipo_devolucion === 'Completa') ? metodo_reembolso : null,
        id_usuario: req.session.userId,
        usuario: req.session.username,
        notas
      };

      const resultado = await Devolucion.crear(devolucionData);

      // Devolver stock inmediatamente (auto-aprobar)
      const joya = await Joya.obtenerPorId(itemVenta.id_joya);
      const nuevoStock = joya.stock_actual + cantidad;
      
      // Actualizar stock
      await Joya.actualizarStock(itemVenta.id_joya, nuevoStock);

      // Registrar movimiento de inventario
      await MovimientoInventario.crear({
        id_joya: itemVenta.id_joya,
        tipo_movimiento: 'Entrada',
        cantidad: cantidad,
        motivo: `Devolución - Venta #${id_venta} - ${motivo}`,
        usuario: req.session.username,
        stock_antes: joya.stock_actual,
        stock_despues: nuevoStock
      });

      devolucionesCreadas.push({
        id: resultado.id,
        id_joya: itemVenta.id_joya,
        cantidad,
        subtotal
      });
    }

    res.status(201).json({
      success: true,
      mensaje: 'Devolución registrada exitosamente',
      devolucion: {
        id_venta,
        tipo_devolucion,
        estado: 'Completada',
        total_devuelto: totalDevolucion,
        items: devolucionesCreadas
      }
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
