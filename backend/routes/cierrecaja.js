const express = require('express');
const router = express.Router();
const VentaDia = require('../models/VentaDia');
const ItemVentaDia = require('../models/ItemVentaDia');
const Venta = require('../models/Venta');
const ItemVenta = require('../models/ItemVenta');
const Abono = require('../models/Abono');
const { db } = require('../database');
const { obtenerFechaActualCR, obtenerRangoDia } = require('../utils/timezone');

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
    
    // Filtrar solo ventas de contado para la vista
    const ventasContado = ventas.filter(v => v.tipo_venta !== 'Credito');

    // Obtener abonos del día (pagos de cuentas por cobrar)
    const rangoHoy = obtenerRangoDia();
    const abonosDelDia = await Abono.obtenerTodos({
      fecha_desde: rangoHoy.fecha_desde,
      fecha_hasta: rangoHoy.fecha_hasta
    });

    // Calcular total de abonos del día
    const totalAbonos = abonosDelDia.abonos.reduce((sum, abono) => sum + abono.monto, 0);
    
    // Agrupar abonos por método de pago
    const abonosEfectivo = abonosDelDia.abonos.filter(a => a.metodo_pago === 'Efectivo');
    const abonosTransferencia = abonosDelDia.abonos.filter(a => a.metodo_pago === 'Transferencia');
    const abonosTarjeta = abonosDelDia.abonos.filter(a => a.metodo_pago === 'Tarjeta');

    const totalAbonosEfectivo = abonosEfectivo.reduce((sum, a) => sum + a.monto, 0);
    const totalAbonosTransferencia = abonosTransferencia.reduce((sum, a) => sum + a.monto, 0);
    const totalAbonosTarjeta = abonosTarjeta.reduce((sum, a) => sum + a.monto, 0);

    // Incluir abonos en el resumen
    const resumenCompleto = {
      ...resumen,
      total_abonos: abonosDelDia.total,
      monto_total_abonos: totalAbonos,
      abonos_efectivo: abonosEfectivo.length,
      monto_abonos_efectivo: totalAbonosEfectivo,
      abonos_transferencia: abonosTransferencia.length,
      monto_abonos_transferencia: totalAbonosTransferencia,
      abonos_tarjeta: abonosTarjeta.length,
      monto_abonos_tarjeta: totalAbonosTarjeta,
      // Totales combinados (ventas + abonos) - usar totales finales que ya incluyen mixtos
      total_efectivo_combinado: (resumen.total_efectivo_final || resumen.total_efectivo || 0) + totalAbonosEfectivo,
      total_transferencia_combinado: (resumen.total_transferencia_final || resumen.total_transferencia || 0) + totalAbonosTransferencia,
      total_tarjeta_combinado: (resumen.total_tarjeta_final || resumen.total_tarjeta || 0) + totalAbonosTarjeta,
      total_ingresos_combinado: (resumen.total_ingresos || 0) + totalAbonos
    };

    res.json({
      resumen: resumenCompleto,
      ventas: ventasContado,
      abonos: abonosDelDia.abonos
    });
  } catch (error) {
    console.error('Error al obtener resumen del día:', error);
    res.status(500).json({ error: 'Error al obtener resumen del día' });
  }
});

// Cerrar caja (transferir ventas de contado del día a la base de datos principal)
router.post('/cerrar-caja', requireAuth, async (req, res) => {
  try {
    // Obtener todas las ventas del día (solo ventas de contado)
    const ventasDia = await VentaDia.obtenerTodas();

    // Filtrar solo ventas de contado (excluir crédito aunque no deberían estar aquí)
    const ventasContado = ventasDia.filter(v => v.tipo_venta !== 'Credito');

    // Obtener abonos del día para validar si hay actividad
    const rangoHoy = obtenerRangoDia();
    const abonosDelDia = await Abono.obtenerTodos({
      fecha_desde: rangoHoy.fecha_desde,
      fecha_hasta: rangoHoy.fecha_hasta
    });

    // Validar que haya al menos ventas o abonos
    if (ventasContado.length === 0 && abonosDelDia.total === 0) {
      return res.status(400).json({ error: 'No hay ventas ni abonos para cerrar' });
    }

    // Transferir cada venta de contado a la base de datos principal
    const ventasTransferidas = [];
    
    for (const ventaDia of ventasContado) {
      // Crear venta en la base de datos principal con TODOS los campos
      const ventaData = {
        id_usuario: ventaDia.id_usuario,
        metodo_pago: ventaDia.metodo_pago,
        subtotal: ventaDia.subtotal,
        descuento: ventaDia.descuento,
        total: ventaDia.total,
        efectivo_recibido: ventaDia.efectivo_recibido,
        cambio: ventaDia.cambio,
        notas: ventaDia.notas,
        tipo_venta: ventaDia.tipo_venta || 'Contado',
        id_cliente: ventaDia.id_cliente,
        monto_efectivo: ventaDia.monto_efectivo || 0,
        monto_tarjeta: ventaDia.monto_tarjeta || 0,
        monto_transferencia: ventaDia.monto_transferencia || 0
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
        total: ventaDia.total,
        metodo_pago: ventaDia.metodo_pago
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
