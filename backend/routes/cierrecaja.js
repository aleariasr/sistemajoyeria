const express = require('express');
const router = express.Router();
const VentaDia = require('../models/VentaDia');
const ItemVentaDia = require('../models/ItemVentaDia');
const Venta = require('../models/Venta');
const ItemVenta = require('../models/ItemVenta');
const Abono = require('../models/Abono');
const IngresoExtra = require('../models/IngresoExtra');
const { supabase } = require('../supabase-db');
const { obtenerFechaActualCR, obtenerRangoDia } = require('../utils/timezone');
const CierreCaja = require('../models/CierreCaja');

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

// Helper para construir resumen del día con totales combinados
async function construirResumenDelDia(fecha = null) {
  const resumen = await VentaDia.obtenerResumen(fecha);
  const ventas = await VentaDia.obtenerTodas(fecha);
  const ventasContado = ventas.filter(v => v.tipo_venta !== 'Credito');

  const rangoDia = obtenerRangoDia(fecha);
  const { data: abonosData, error: abonosError } = await supabase
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
    .gte('fecha_abono', rangoDia.fecha_desde)
    .lte('fecha_abono', rangoDia.fecha_hasta)
    .order('fecha_abono', { ascending: false });

  if (abonosError) {
    throw abonosError;
  }

  const abonosDelDia = (abonosData || []).map(abono => ({
    ...abono,
    id_cliente: abono.cuentas_por_cobrar?.id_cliente,
    monto_cuenta: abono.cuentas_por_cobrar?.monto_total,
    saldo_pendiente: abono.cuentas_por_cobrar?.saldo_pendiente,
    id_venta: abono.cuentas_por_cobrar?.id_venta,
    nombre_cliente: abono.cuentas_por_cobrar?.clientes?.nombre,
    cedula_cliente: abono.cuentas_por_cobrar?.clientes?.cedula
  }));

  const ingresosExtras = await IngresoExtra.obtenerDelDia({
    fecha_desde: rangoDia.fecha_desde,
    fecha_hasta: rangoDia.fecha_hasta
  });

  const totalAbonos = abonosDelDia.reduce((sum, abono) => sum + abono.monto, 0);

  const abonosEfectivo = abonosDelDia.filter(a => a.metodo_pago === 'Efectivo');
  const abonosTransferencia = abonosDelDia.filter(a => a.metodo_pago === 'Transferencia');
  const abonosTarjeta = abonosDelDia.filter(a => a.metodo_pago === 'Tarjeta');

  const totalAbonosEfectivo = abonosEfectivo.reduce((sum, a) => sum + a.monto, 0);
  const totalAbonosTransferencia = abonosTransferencia.reduce((sum, a) => sum + a.monto, 0);
  const totalAbonosTarjeta = abonosTarjeta.reduce((sum, a) => sum + a.monto, 0);

  const totalIngresosExtras = ingresosExtras.reduce((sum, ing) => sum + parseFloat(ing.monto || 0), 0);

  const ingresosEfectivo = ingresosExtras.filter(ing => ing.metodo_pago === 'Efectivo');
  const ingresosTransferencia = ingresosExtras.filter(ing => ing.metodo_pago === 'Transferencia');
  const ingresosTarjeta = ingresosExtras.filter(ing => ing.metodo_pago === 'Tarjeta');

  const totalIngresosEfectivo = ingresosEfectivo.reduce((sum, ing) => sum + parseFloat(ing.monto || 0), 0);
  const totalIngresosTransferencia = ingresosTransferencia.reduce((sum, ing) => sum + parseFloat(ing.monto || 0), 0);
  const totalIngresosTarjeta = ingresosTarjeta.reduce((sum, ing) => sum + parseFloat(ing.monto || 0), 0);

  const totalVentasEfectivo = resumen.total_efectivo_final || 0;
  const totalVentasTransferencia = resumen.total_transferencia_final || 0;
  const totalVentasTarjeta = resumen.total_tarjeta_final || 0;
  const totalVentas = resumen.total_ingresos || 0;

  const resumenCompleto = {
    ...resumen,
    total_abonos: abonosDelDia.length,
    monto_total_abonos: totalAbonos,
    abonos_efectivo: abonosEfectivo.length,
    monto_abonos_efectivo: totalAbonosEfectivo,
    abonos_transferencia: abonosTransferencia.length,
    monto_abonos_transferencia: totalAbonosTransferencia,
    abonos_tarjeta: abonosTarjeta.length,
    monto_abonos_tarjeta: totalAbonosTarjeta,
    total_ingresos_extras: ingresosExtras.length,
    monto_total_ingresos_extras: totalIngresosExtras,
    ingresos_extras_efectivo: ingresosEfectivo.length,
    monto_ingresos_extras_efectivo: totalIngresosEfectivo,
    ingresos_extras_transferencia: ingresosTransferencia.length,
    monto_ingresos_extras_transferencia: totalIngresosTransferencia,
    ingresos_extras_tarjeta: ingresosTarjeta.length,
    monto_ingresos_extras_tarjeta: totalIngresosTarjeta,
    total_efectivo_combinado: totalVentasEfectivo + totalAbonosEfectivo + totalIngresosEfectivo,
    total_transferencia_combinado: totalVentasTransferencia + totalAbonosTransferencia + totalIngresosTransferencia,
    total_tarjeta_combinado: totalVentasTarjeta + totalAbonosTarjeta + totalIngresosTarjeta,
    total_ingresos_combinado: totalVentas + totalAbonos + totalIngresosExtras
  };

  return {
    resumen: resumenCompleto,
    ventas: ventasContado,
    abonos: abonosDelDia,
    ingresos_extras: ingresosExtras
  };
}

// Obtener todas las ventas del día
router.get('/ventas-dia', requireAuth, async (req, res) => {
  try {
    const fecha = req.query.fecha || null;
    const ventas = await VentaDia.obtenerTodas(fecha);
    
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
    const data = await construirResumenDelDia();
    res.json(data);
  } catch (error) {
    console.error('Error al obtener resumen del día:', error);
    res.status(500).json({ error: 'Error al obtener resumen del día' });
  }
});

// Cerrar caja (transferir ventas de contado del día a la base de datos principal)
router.post('/cerrar-caja', requireAuth, async (req, res) => {
  try {
    const resumenDetallado = await construirResumenDelDia();
    // Obtener todas las ventas del día (solo ventas de contado) - filtradas por fecha actual
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

    // Validar que haya al menos ventas, abonos o ingresos extras
    // Obtener ingresos extras del día
    const ingresosExtrasDelDia = await IngresoExtra.obtenerDelDia({
      fecha_desde: rangoHoy.fecha_desde,
      fecha_hasta: rangoHoy.fecha_hasta
    });

    const totalIngresosExtras = ingresosExtrasDelDia?.length || 0;

    if (ventasContado.length === 0 && totalAbonos === 0 && totalIngresosExtras === 0) {
      return res.status(400).json({ error: 'No hay ventas, abonos ni ingresos extras para cerrar' });
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

    // Marcar ingresos extras del día como cerrados
    const resultadoIngresosExtras = await IngresoExtra.marcarComoCerrados({
      fecha_desde: rangoHoy.fecha_desde,
      fecha_hasta: rangoHoy.fecha_hasta
    });

    // Limpiar la base de datos del día
    await VentaDia.limpiar();

    await CierreCaja.registrar({
      resumen: resumenDetallado.resumen,
      id_usuario: req.session?.userId || null,
      usuario: req.session?.fullName || req.session?.username || null
    });

    const resumen = {
      total_ventas: ventasTransferidas.length,
      total_ingresos: ventasTransferidas.reduce((sum, v) => sum + v.total, 0),
      ventas_transferidas: ventasTransferidas,
      total_abonos_cerrados: resultadoAbonos.count,
      monto_abonos_cerrados: resultadoAbonos.abonos?.reduce((sum, a) => sum + (parseFloat(a.monto) || 0), 0) || 0,
      total_ingresos_extras_cerrados: resultadoIngresosExtras.count,
      monto_ingresos_extras_cerrados: resultadoIngresosExtras.ingresos?.reduce((sum, ing) => sum + (parseFloat(ing.monto) || 0), 0) || 0,
      total_general: ventasTransferidas.reduce((sum, v) => sum + v.total, 0) + 
                     (resultadoAbonos.abonos?.reduce((sum, a) => sum + (parseFloat(a.monto) || 0), 0) || 0) +
                     (resultadoIngresosExtras.ingresos?.reduce((sum, ing) => sum + (parseFloat(ing.monto) || 0), 0) || 0)
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

// Histórico de cierres de caja (accesible para todos los usuarios autenticados)
router.get('/historico', requireAuth, async (req, res) => {
  try {
    const {
      pagina = 1,
      por_pagina = 20,
      fecha = null,
      usuario = null
    } = req.query;

    const filtros = {
      pagina: parseInt(pagina, 10) || 1,
      por_pagina: parseInt(por_pagina, 10) || 20,
      fecha: fecha || null,
      usuario: usuario || null
    };

    const resultado = await CierreCaja.obtenerHistorico(filtros);
    const cierresNormalizados = (resultado.cierres || []).map((cierre) => {
      const resumen = cierre.resumen || {};
      const totalEfectivo = cierre.total_efectivo_combinado ?? resumen.total_efectivo_combinado ?? 0;
      const totalTransferencia = cierre.total_transferencia_combinado ?? resumen.total_transferencia_combinado ?? 0;
      const totalTarjeta = cierre.total_tarjeta_combinado ?? resumen.total_tarjeta_combinado ?? 0;
      const totalIngresosExtras = cierre.monto_total_ingresos_extras ?? resumen.monto_total_ingresos_extras ?? 0;
      const totalDia = cierre.total_ingresos_combinado ?? cierre.total_general ?? resumen.total_ingresos_combinado ?? resumen.total_general ?? 0;

      return {
        ...cierre,
        total_efectivo_combinado: totalEfectivo,
        total_transferencia_combinado: totalTransferencia,
        total_tarjeta_combinado: totalTarjeta,
        monto_total_ingresos_extras: totalIngresosExtras,
        total_ingresos_combinado: totalDia
      };
    });

    res.json({
      ...resultado,
      cierres: cierresNormalizados
    });
  } catch (error) {
    console.error('Error al obtener histórico de cierres:', error);
    res.status(500).json({ error: 'Error al obtener histórico de cierres' });
  }
});

module.exports = router;
