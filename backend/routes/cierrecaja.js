const express = require('express');
const router = express.Router();
const VentaDia = require('../models/VentaDia');
const ItemVentaDia = require('../models/ItemVentaDia');
const Venta = require('../models/Venta');
const ItemVenta = require('../models/ItemVenta');
const { db } = require('../database');

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

// Obtener todas las ventas del día
router.get('/ventas-dia', requireAuth, async (req, res) => {
  try {
    const ventas = await VentaDia.obtenerTodas();
    
    // Obtener items de cada venta
    const ventasConItems = await Promise.all(
      ventas.map(async (venta) => {
        const items = await ItemVentaDia.obtenerPorVenta(venta.id);
        return {
          ...venta,
          items
        };
      })
    );

    res.json(ventasConItems);
  } catch (error) {
    console.error('Error al obtener ventas del día:', error);
    res.status(500).json({ error: 'Error al obtener ventas del día' });
  }
});

// Obtener resumen de ventas del día
router.get('/resumen-dia', requireAuth, async (req, res) => {
  try {
    const resumen = await VentaDia.obtenerResumen();
    const ventas = await VentaDia.obtenerTodas();

    res.json({
      resumen,
      ventas
    });
  } catch (error) {
    console.error('Error al obtener resumen del día:', error);
    res.status(500).json({ error: 'Error al obtener resumen del día' });
  }
});

// Cerrar caja (transferir ventas del día a la base de datos principal)
router.post('/cerrar-caja', requireAuth, async (req, res) => {
  try {
    // Obtener todas las ventas del día
    const ventasDia = await VentaDia.obtenerTodas();

    if (ventasDia.length === 0) {
      return res.status(400).json({ error: 'No hay ventas para cerrar' });
    }

    // Transferir cada venta a la base de datos principal
    const ventasTransferidas = [];
    
    for (const ventaDia of ventasDia) {
      // Crear venta en la base de datos principal
      const ventaData = {
        id_usuario: ventaDia.id_usuario,
        metodo_pago: ventaDia.metodo_pago,
        subtotal: ventaDia.subtotal,
        descuento: ventaDia.descuento,
        total: ventaDia.total,
        efectivo_recibido: ventaDia.efectivo_recibido,
        cambio: ventaDia.cambio,
        notas: ventaDia.notas
      };

      const resultadoVenta = await Venta.crear(ventaData);
      const idVentaPrincipal = resultadoVenta.id;

      // Obtener items de la venta del día
      const itemsDia = await ItemVentaDia.obtenerPorVenta(ventaDia.id);

      // Transferir items a la base de datos principal
      for (const itemDia of itemsDia) {
        await ItemVenta.crear({
          id_venta: idVentaPrincipal,
          id_joya: itemDia.id_joya,
          cantidad: itemDia.cantidad,
          precio_unitario: itemDia.precio_unitario,
          subtotal: itemDia.subtotal
        });
      }

      // Actualizar fecha de venta para mantener la fecha original
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE ventas SET fecha_venta = ? WHERE id = ?',
          [ventaDia.fecha_venta, idVentaPrincipal],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      ventasTransferidas.push({
        id_original: ventaDia.id,
        id_nueva: idVentaPrincipal,
        total: ventaDia.total
      });
    }

    // Limpiar la base de datos del día
    await VentaDia.limpiar();

    const resumen = {
      total_ventas: ventasTransferidas.length,
      total_ingresos: ventasTransferidas.reduce((sum, v) => sum + v.total, 0),
      ventas_transferidas: ventasTransferidas
    };

    res.json({
      mensaje: 'Cierre de caja realizado exitosamente',
      resumen
    });
  } catch (error) {
    console.error('Error al cerrar caja:', error);
    res.status(500).json({ error: 'Error al cerrar caja' });
  }
});

module.exports = router;
