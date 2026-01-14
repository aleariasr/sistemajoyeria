const express = require('express');
const router = express.Router();
const Joya = require('../models/Joya');
const Venta = require('../models/Venta');
const Abono = require('../models/Abono');
const MovimientoInventario = require('../models/MovimientoInventario');
const CierreCaja = require('../models/CierreCaja');

// Middleware para verificar autenticación
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  next();
};

// GET /api/reportes/inventario - Reporte de inventario actual
router.get('/inventario', requireAuth, async (req, res) => {
  try {
    const resultado = await Joya.obtenerTodas({ por_pagina: 10000 });
    
    const reporte = resultado.joyas.map(joya => ({
      codigo: joya.codigo,
      nombre: joya.nombre,
      categoria: joya.categoria,
      stock_actual: joya.stock_actual,
      costo: joya.costo,
      precio_venta: joya.precio_venta,
      moneda: joya.moneda,
      valor_total_costo: joya.stock_actual * joya.costo,
      valor_total_venta: joya.stock_actual * joya.precio_venta,
      estado: joya.estado
    }));

    res.json(reporte);
  } catch (error) {
    console.error('Error al generar reporte de inventario:', error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

// GET /api/reportes/stock-bajo - Reporte de stock bajo
router.get('/stock-bajo', requireAuth, async (req, res) => {
  try {
    const joyas = await Joya.obtenerStockBajo();
    
    const reporte = joyas.map(joya => ({
      codigo: joya.codigo,
      nombre: joya.nombre,
      categoria: joya.categoria,
      stock_actual: joya.stock_actual,
      stock_minimo: joya.stock_minimo,
      diferencia: joya.stock_minimo - joya.stock_actual,
      precio_venta: joya.precio_venta,
      moneda: joya.moneda
    }));

    res.json(reporte);
  } catch (error) {
    console.error('Error al generar reporte de stock bajo:', error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

// GET /api/reportes/movimientos-financieros - Reporte completo de movimientos financieros
router.get('/movimientos-financieros', requireAuth, async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta } = req.query;
    
    // Obtener ventas del periodo
    const resultadoVentas = await Venta.obtenerTodas({ fecha_desde, fecha_hasta, por_pagina: 10000 });
    
    // Obtener abonos del periodo
    const resultadoAbonos = await Abono.obtenerTodos({ fecha_desde, fecha_hasta, por_pagina: 10000 });
    
    // Calcular totales de ventas por método de pago
    const totalesVentas = {
      efectivo: 0,
      tarjeta: 0,
      transferencia: 0,
      mixto_efectivo: 0,
      mixto_tarjeta: 0,
      mixto_transferencia: 0,
      total: 0
    };
    
    resultadoVentas.ventas.forEach(venta => {
      if (venta.metodo_pago === 'Efectivo') {
        totalesVentas.efectivo += venta.total;
      } else if (venta.metodo_pago === 'Tarjeta') {
        totalesVentas.tarjeta += venta.total;
      } else if (venta.metodo_pago === 'Transferencia') {
        totalesVentas.transferencia += venta.total;
      } else if (venta.metodo_pago === 'Mixto') {
        totalesVentas.mixto_efectivo += (venta.monto_efectivo || 0);
        totalesVentas.mixto_tarjeta += (venta.monto_tarjeta || 0);
        totalesVentas.mixto_transferencia += (venta.monto_transferencia || 0);
      }
      totalesVentas.total += venta.total;
    });
    
    // Calcular totales de abonos por método de pago
    const totalesAbonos = {
      efectivo: 0,
      tarjeta: 0,
      transferencia: 0,
      total: 0
    };
    
    resultadoAbonos.abonos.forEach(abono => {
      if (abono.metodo_pago === 'Efectivo') {
        totalesAbonos.efectivo += abono.monto;
      } else if (abono.metodo_pago === 'Tarjeta') {
        totalesAbonos.tarjeta += abono.monto;
      } else if (abono.metodo_pago === 'Transferencia') {
        totalesAbonos.transferencia += abono.monto;
      }
      totalesAbonos.total += abono.monto;
    });
    
    // Calcular totales combinados
    const totalesCombinados = {
      efectivo: totalesVentas.efectivo + totalesVentas.mixto_efectivo + totalesAbonos.efectivo,
      tarjeta: totalesVentas.tarjeta + totalesVentas.mixto_tarjeta + totalesAbonos.tarjeta,
      transferencia: totalesVentas.transferencia + totalesVentas.mixto_transferencia + totalesAbonos.transferencia,
      total: totalesVentas.total + totalesAbonos.total
    };
    
    res.json({
      periodo: {
        fecha_desde: fecha_desde || 'Inicio',
        fecha_hasta: fecha_hasta || 'Hoy'
      },
      ventas: {
        cantidad: resultadoVentas.ventas.length,
        totales: totalesVentas,
        detalle: resultadoVentas.ventas
      },
      abonos: {
        cantidad: resultadoAbonos.abonos.length,
        totales: totalesAbonos,
        detalle: resultadoAbonos.abonos
      },
      totales_combinados: totalesCombinados
    });
  } catch (error) {
    console.error('Error al generar reporte de movimientos financieros:', error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

// GET /api/reportes/historial-completo - Historial completo de todas las transacciones
router.get('/historial-completo', requireAuth, async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, tipo } = req.query;
    
    const historial = [];
    
    // Agregar ventas si no hay filtro o si el filtro es 'ventas'
    if (!tipo || tipo === 'ventas') {
      const resultadoVentas = await Venta.obtenerTodas({ fecha_desde, fecha_hasta, por_pagina: 10000 });
      resultadoVentas.ventas.forEach(venta => {
        historial.push({
          tipo: 'venta',
          fecha: venta.fecha_venta,
          descripcion: `Venta #${venta.id} - ${venta.tipo_venta}`,
          metodo_pago: venta.metodo_pago,
          monto: venta.total,
          usuario: venta.nombre_usuario || venta.usuario,
          detalles: venta
        });
      });
    }
    
    // Agregar abonos si no hay filtro o si el filtro es 'abonos'
    if (!tipo || tipo === 'abonos') {
      const resultadoAbonos = await Abono.obtenerTodos({ fecha_desde, fecha_hasta, por_pagina: 10000 });
      resultadoAbonos.abonos.forEach(abono => {
        historial.push({
          tipo: 'abono',
          fecha: abono.fecha_abono,
          descripcion: `Abono a cuenta #${abono.id_cuenta_por_cobrar} - ${abono.nombre_cliente || 'Cliente'}`,
          metodo_pago: abono.metodo_pago,
          monto: abono.monto,
          usuario: abono.usuario,
          detalles: abono
        });
      });
    }
    
    // Agregar movimientos de inventario si no hay filtro o si el filtro es 'inventario'
    if (!tipo || tipo === 'inventario') {
      const resultadoMovimientos = await MovimientoInventario.obtenerTodos({ fecha_desde, fecha_hasta, por_pagina: 10000 });
      resultadoMovimientos.movimientos.forEach(mov => {
        historial.push({
          tipo: 'movimiento_inventario',
          fecha: mov.fecha_movimiento,
          descripcion: `${mov.tipo_movimiento} - ${mov.nombre} (${mov.codigo})`,
          cantidad: mov.cantidad,
          motivo: mov.motivo,
          usuario: mov.usuario,
          detalles: mov
        });
      });
    }
    
    // Ordenar por fecha descendente
    historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    res.json({
      total: historial.length,
      historial
    });
  } catch (error) {
    console.error('Error al generar historial completo:', error);
    res.status(500).json({ error: 'Error al generar historial completo' });
  }
});

// GET /api/reportes/ventas - Reporte de ventas individuales
router.get('/ventas', requireAuth, async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta } = req.query;
    
    const resultadoVentas = await Venta.obtenerTodas({ 
      fecha_desde, 
      fecha_hasta, 
      por_pagina: 10000 
    });
    
    const reporte = resultadoVentas.ventas.map(venta => ({
      id: venta.id,
      fecha: venta.fecha_venta,
      tipo_venta: venta.tipo_venta,
      metodo_pago: venta.metodo_pago,
      subtotal: venta.subtotal,
      descuento: venta.descuento,
      total: venta.total,
      efectivo_recibido: venta.efectivo_recibido,
      cambio: venta.cambio,
      monto_efectivo: venta.monto_efectivo,
      monto_tarjeta: venta.monto_tarjeta,
      monto_transferencia: venta.monto_transferencia,
      usuario: venta.nombre_usuario || venta.usuario,
      notas: venta.notas
    }));

    res.json(reporte);
  } catch (error) {
    console.error('Error al generar reporte de ventas:', error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

// GET /api/reportes/cierres-caja - Reporte de cierres de caja
router.get('/cierres-caja', requireAuth, async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, pagina = 1, por_pagina = 1000 } = req.query;
    
    const filtros = { pagina, por_pagina };
    
    // Si hay filtros de fecha, agregarlos
    // Para fecha específica, usar la función de CierreCaja con fecha única
    const resultadoCierres = await CierreCaja.obtenerHistorico(filtros);
    
    // Filtrar por rango de fechas si se especifica
    let cierresFiltrados = resultadoCierres.cierres;
    if (fecha_desde || fecha_hasta) {
      cierresFiltrados = resultadoCierres.cierres.filter(cierre => {
        const fechaCierre = new Date(cierre.fecha_cierre);
        const cumpleFechaDesde = !fecha_desde || fechaCierre >= new Date(fecha_desde);
        const cumpleFechaHasta = !fecha_hasta || fechaCierre <= new Date(fecha_hasta);
        return cumpleFechaDesde && cumpleFechaHasta;
      });
    }
    
    const reporte = cierresFiltrados.map(cierre => ({
      id: cierre.id,
      fecha_cierre: cierre.fecha_cierre,
      usuario: cierre.usuario,
      total_ventas: cierre.total_ventas,
      total_ingresos: cierre.total_ingresos,
      total_general: cierre.total_general,
      total_efectivo: cierre.total_efectivo_combinado,
      total_tarjeta: cierre.total_tarjeta_combinado,
      total_transferencia: cierre.total_transferencia_combinado,
      monto_abonos: cierre.monto_total_abonos,
      monto_ingresos_extras: cierre.monto_total_ingresos_extras,
      notas: cierre.notas
    }));

    res.json(reporte);
  } catch (error) {
    console.error('Error al generar reporte de cierres de caja:', error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

module.exports = router;
