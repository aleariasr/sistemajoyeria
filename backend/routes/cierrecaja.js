const express = require('express');
const router = express.Router();
const VentaDia = require('../models/VentaDia');
const ItemVentaDia = require('../models/ItemVentaDia');
const Venta = require('../models/Venta');
const ItemVenta = require('../models/ItemVenta');
const Abono = require('../models/Abono');
const { supabase } = require('../supabase-db');
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

    // Obtener abonos del día (pagos de cuentas por cobrar) que NO han sido cerrados
    const rangoHoy = obtenerRangoDia();
    const { data: abonosData, error: abonosError } = await require('../supabase-db').supabase
      .from('abonos')
      .select(`
        *,
        cuentas_por_cobrar!abonos_id_cuenta_por_cobrar_fkey (
          id_cliente,
          monto_total,
          saldo_pendiente,
          id_venta,
          clientes!cuentas_por_cobrar_id_cliente_fkey (nombre, cedula)
        )
      `)
      .eq('cerrado', false)
      .gte('fecha_abono', rangoHoy.fecha_desde)
      .lte('fecha_abono', rangoHoy.fecha_hasta)
      .order('fecha_abono', { ascending: false });

    if (abonosError) {
      throw abonosError;
    }

    // Formatear abonos
    const abonosDelDia = (abonosData || []).map(abono => ({
      ...abono,
      id_cliente: abono.cuentas_por_cobrar?.id_cliente,
      monto_cuenta: abono.cuentas_por_cobrar?.monto_total,
      saldo_pendiente: abono.cuentas_por_cobrar?.saldo_pendiente,
      id_venta: abono.cuentas_por_cobrar?.id_venta,
      nombre_cliente: abono.cuentas_por_cobrar?.clientes?.nombre,
      cedula_cliente: abono.cuentas_por_cobrar?.clientes?.cedula
    }));

    // Calcular total de abonos del día
    const totalAbonos = abonosDelDia.reduce((sum, abono) => sum + abono.monto, 0);
    
    // Agrupar abonos por método de pago
    const abonosEfectivo = abonosDelDia.filter(a => a.metodo_pago === 'Efectivo');
    const abonosTransferencia = abonosDelDia.filter(a => a.metodo_pago === 'Transferencia');
    const abonosTarjeta = abonosDelDia.filter(a => a.metodo_pago === 'Tarjeta');

    const totalAbonosEfectivo = abonosEfectivo.reduce((sum, a) => sum + a.monto, 0);
    const totalAbonosTransferencia = abonosTransferencia.reduce((sum, a) => sum + a.monto, 0);
    const totalAbonosTarjeta = abonosTarjeta.reduce((sum, a) => sum + a.monto, 0);

    // Calcular totales de ventas (usando los totales finales que ya incluyen pagos mixtos)
    const totalVentasEfectivo = resumen.total_efectivo_final || 0;
    const totalVentasTransferencia = resumen.total_transferencia_final || 0;
    const totalVentasTarjeta = resumen.total_tarjeta_final || 0;
    const totalVentas = resumen.total_ingresos || 0;

    // Incluir abonos en el resumen
    const resumenCompleto = {
      ...resumen,
      // Abonos
      total_abonos: abonosDelDia.length,
      monto_total_abonos: totalAbonos,
      abonos_efectivo: abonosEfectivo.length,
      monto_abonos_efectivo: totalAbonosEfectivo,
      abonos_transferencia: abonosTransferencia.length,
      monto_abonos_transferencia: totalAbonosTransferencia,
      abonos_tarjeta: abonosTarjeta.length,
      monto_abonos_tarjeta: totalAbonosTarjeta,
      // Totales combinados (ventas + abonos)
      total_efectivo_combinado: totalVentasEfectivo + totalAbonosEfectivo,
      total_transferencia_combinado: totalVentasTransferencia + totalAbonosTransferencia,
      total_tarjeta_combinado: totalVentasTarjeta + totalAbonosTarjeta,
      total_ingresos_combinado: totalVentas + totalAbonos
    };

    res.json({
      resumen: resumenCompleto,
      ventas: ventasContado,
      abonos: abonosDelDia
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

    // Obtener abonos del día que NO han sido cerrados
    const rangoHoy = obtenerRangoDia();
    const { data: abonosDelDia, error: abonosError } = await supabase
      .from('abonos')
      .select('*')
      .eq('cerrado', false)
      .gte('fecha_abono', rangoHoy.fecha_desde)
      .lte('fecha_abono', rangoHoy.fecha_hasta);

    if (abonosError) {
      throw abonosError;
    }

    const totalAbonos = abonosDelDia?.length || 0;

    // Validar que haya al menos ventas o abonos
    if (ventasContado.length === 0 && totalAbonos === 0) {
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
      const { error: updateError } = await supabase
        .from('ventas')
        .update({ fecha_venta: ventaDia.fecha_venta })
        .eq('id', idVentaPrincipal);
      
      if (updateError) {
        throw updateError;
      }

      ventasTransferidas.push({
        id_original: ventaDia.id,
        id_nueva: idVentaPrincipal,
        total: ventaDia.total,
        metodo_pago: ventaDia.metodo_pago
      });
    }

    // Marcar abonos del día como cerrados
    const resultadoAbonos = await Abono.marcarComoCerrados({
      fecha_desde: rangoHoy.fecha_desde,
      fecha_hasta: rangoHoy.fecha_hasta
    });

    // Limpiar la base de datos del día
    await VentaDia.limpiar();

    const resumen = {
      total_ventas: ventasTransferidas.length,
      total_ingresos: ventasTransferidas.reduce((sum, v) => sum + v.total, 0),
      ventas_transferidas: ventasTransferidas,
      total_abonos_cerrados: resultadoAbonos.count,
      monto_abonos_cerrados: resultadoAbonos.abonos?.reduce((sum, a) => sum + (parseFloat(a.monto) || 0), 0) || 0
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
