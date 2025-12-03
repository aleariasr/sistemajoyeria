const express = require('express');
const router = express.Router();
const Venta = require('../models/Venta');
const ItemVenta = require('../models/ItemVenta');
const VentaDia = require('../models/VentaDia');
const ItemVentaDia = require('../models/ItemVentaDia');
const Joya = require('../models/Joya');
const MovimientoInventario = require('../models/MovimientoInventario');
const CuentaPorCobrar = require('../models/CuentaPorCobrar');
const Cliente = require('../models/Cliente');

// Middleware para verificar autenticación
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  next();
};

// Crear nueva venta
router.post('/', requireAuth, async (req, res) => {
  try {
    const { items, metodo_pago, descuento, efectivo_recibido, notas, tipo_venta, id_cliente, fecha_vencimiento,
            monto_efectivo, monto_tarjeta, monto_transferencia } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'La venta debe tener al menos un producto' });
    }

    if (!metodo_pago) {
      return res.status(400).json({ error: 'El método de pago es requerido' });
    }

    // Validar venta a crédito
    if (tipo_venta === 'Credito') {
      if (!id_cliente) {
        return res.status(400).json({ error: 'Para venta a crédito debe seleccionar un cliente' });
      }
      
      // Verificar que el cliente existe
      const cliente = await Cliente.obtenerPorId(id_cliente);
      if (!cliente) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }
    }

    // Calcular subtotal y total
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.precio_unitario * item.cantidad;
    }

    const descuentoAplicado = descuento || 0;
    const total = subtotal - descuentoAplicado;

    // Validar pago mixto
    if (metodo_pago === 'Mixto') {
      const totalMixto = (monto_efectivo || 0) + (monto_tarjeta || 0) + (monto_transferencia || 0);
      if (Math.abs(totalMixto - total) > 0.01) { // Tolerancia de 1 centavo por redondeo
        return res.status(400).json({ 
          error: `El total de los montos del pago mixto (${totalMixto.toFixed(2)}) no coincide con el total de la venta (${total.toFixed(2)})` 
        });
      }
    }

    // Calcular cambio si es pago en efectivo (simple)
    let cambio = null;
    if (metodo_pago === 'Efectivo' && efectivo_recibido) {
      cambio = efectivo_recibido - total;
      if (cambio < 0) {
        return res.status(400).json({ error: 'El efectivo recibido es insuficiente' });
      }
    }
    
    // Calcular cambio si es pago mixto con efectivo
    if (metodo_pago === 'Mixto' && efectivo_recibido && monto_efectivo) {
      cambio = efectivo_recibido - monto_efectivo;
      if (cambio < 0) {
        return res.status(400).json({ error: 'El efectivo recibido es insuficiente para el monto en efectivo' });
      }
    }

    // Preparar datos de la venta
    const ventaData = {
      id_usuario: req.session.userId,
      metodo_pago,
      subtotal,
      descuento: descuentoAplicado,
      total,
      efectivo_recibido: efectivo_recibido || null,
      cambio,
      notas,
      tipo_venta: tipo_venta || 'Contado',
      id_cliente: id_cliente || null,
      monto_efectivo: monto_efectivo || 0,
      monto_tarjeta: monto_tarjeta || 0,
      monto_transferencia: monto_transferencia || 0
    };

    // IMPORTANT: Validate stock BEFORE creating the sale to prevent race conditions
    // Get all items and validate stock first
    const itemsConJoya = [];
    for (const item of items) {
      // Si es un item tipo "Otros" (sin id_joya), agregarlo directamente
      if (!item.id_joya) {
        itemsConJoya.push({
          ...item,
          joya: null, // No tiene joya asociada
          descripcion_item: item.nombre || item.descripcion_item || 'Otros'
        });
        continue;
      }

      const joya = await Joya.obtenerPorId(item.id_joya);
      
      if (!joya) {
        return res.status(404).json({ error: `Joya con ID ${item.id_joya} no encontrada` });
      }

      // Verify there is enough stock
      if (joya.stock_actual < item.cantidad) {
        return res.status(400).json({ 
          error: `Stock insuficiente para ${joya.nombre}. Stock disponible: ${joya.stock_actual}` 
        });
      }

      itemsConJoya.push({
        ...item,
        joya
      });
    }

    // Si es venta a crédito, guardar directamente en la base de datos principal
    // Si es venta de contado, guardar en la base de datos del día
    let resultadoVenta;
    let idVenta;
    let esVentaCredito = tipo_venta === 'Credito';

    if (esVentaCredito) {
      // Ventas a crédito van directamente a la DB principal
      resultadoVenta = await Venta.crear(ventaData);
      idVenta = resultadoVenta.id;
    } else {
      // Ventas de contado van a la DB del día
      resultadoVenta = await VentaDia.crear(ventaData);
      idVenta = resultadoVenta.id;
    }

    // Crear items de venta y actualizar stock
    for (const itemConJoya of itemsConJoya) {
      const { joya, ...item } = itemConJoya;

      // Crear item de venta en la base de datos correspondiente
      if (esVentaCredito) {
        await ItemVenta.crear({
          id_venta: idVenta,
          id_joya: item.id_joya || null,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: item.precio_unitario * item.cantidad,
          descripcion_item: item.descripcion_item || null
        });
      } else {
        await ItemVentaDia.crear({
          id_venta_dia: idVenta,
          id_joya: item.id_joya || null,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: item.precio_unitario * item.cantidad,
          descripcion_item: item.descripcion_item || null
        });
      }

      // Actualizar stock y registrar movimiento solo si hay joya asociada
      if (joya) {
        // Actualizar stock (joya was already validated above)
        const nuevoStock = joya.stock_actual - item.cantidad;
        await Joya.actualizarStock(item.id_joya, nuevoStock);

        // Registrar movimiento de inventario
        const motivoVenta = esVentaCredito ? `Venta a crédito #${idVenta}` : `Venta del día #${idVenta}`;
        await MovimientoInventario.crear({
          id_joya: item.id_joya,
          tipo_movimiento: 'Salida',
          cantidad: item.cantidad,
          motivo: motivoVenta,
          usuario: req.session.username,
          stock_antes: joya.stock_actual,
          stock_despues: nuevoStock
        });
      }
    }

    // Si es venta a crédito, crear cuenta por cobrar
    let idCuentaPorCobrar = null;
    if (esVentaCredito) {
      const cuentaData = {
        id_venta: idVenta,
        id_cliente: id_cliente,
        monto_total: total,
        monto_pagado: 0,
        saldo_pendiente: total,
        estado: 'Pendiente',
        fecha_vencimiento: fecha_vencimiento || null
      };
      
      const resultadoCuenta = await CuentaPorCobrar.crear(cuentaData);
      idCuentaPorCobrar = resultadoCuenta.id;
    }

    res.status(201).json({
      mensaje: 'Venta creada exitosamente',
      id: idVenta,
      total,
      cambio,
      tipo_venta: tipo_venta || 'Contado',
      id_cuenta_por_cobrar: idCuentaPorCobrar
    });
  } catch (error) {
    console.error('Error al crear venta:', error);
    res.status(500).json({ error: 'Error al crear venta' });
  }
});

// Obtener todas las ventas con filtros (incluye ventas del día y del historial)
router.get('/', requireAuth, async (req, res) => {
  try {
    const filtros = {
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta,
      metodo_pago: req.query.metodo_pago,
      id_usuario: req.query.id_usuario,
      pagina: req.query.pagina,
      por_pagina: req.query.por_pagina
    };

    // Obtener ventas del historial (ya cerradas)
    const resultadoHistorial = await Venta.obtenerTodas(filtros);

    // Obtener ventas del día (aún no cerradas)
    const ventasDia = await VentaDia.obtenerTodas();

    // Marcar las ventas del día para distinguirlas
    const ventasDiaMarcadas = ventasDia.map(venta => ({
      ...venta,
      es_venta_dia: true,  // Marca para distinguir en el frontend
      fecha_venta: venta.fecha_venta
    }));

    // Combinar ambas listas
    const todasLasVentas = [
      ...ventasDiaMarcadas,
      ...resultadoHistorial.ventas
    ];

    // Ordenar por fecha (más recientes primero)
    todasLasVentas.sort((a, b) => new Date(b.fecha_venta) - new Date(a.fecha_venta));

    res.json({
      ventas: todasLasVentas,
      total: resultadoHistorial.total + ventasDia.length,
      ventas_dia_count: ventasDia.length,
      ventas_historial_count: resultadoHistorial.total
    });
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
});

// Obtener una venta específica con sus items
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar primero en ventas del historial
    let venta = await Venta.obtenerPorId(id);
    let items = null;
    let esVentaDia = false;

    if (venta) {
      // Encontrada en historial
      items = await ItemVenta.obtenerPorVenta(id);
    } else {
      // Buscar en ventas del día
      venta = await VentaDia.obtenerPorId(id);
      if (venta) {
        esVentaDia = true;
        items = await ItemVentaDia.obtenerPorVenta(id);
      }
    }
    
    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    res.json({
      ...venta,
      items,
      es_venta_dia: esVentaDia
    });
  } catch (error) {
    console.error('Error al obtener venta:', error);
    res.status(500).json({ error: 'Error al obtener venta' });
  }
});

// Obtener ventas del día
router.get('/resumen/dia', requireAuth, async (req, res) => {
  try {
    const fecha = req.query.fecha;
    const ventas = await Venta.obtenerVentasDelDia(fecha);

    // Calcular resumen
    const totalVentas = ventas.length;
    const totalIngresos = ventas.reduce((sum, venta) => sum + venta.total, 0);
    const promedioVenta = totalVentas > 0 ? totalIngresos / totalVentas : 0;

    res.json({
      ventas,
      resumen: {
        total_ventas: totalVentas,
        total_ingresos: totalIngresos,
        promedio_venta: promedioVenta
      }
    });
  } catch (error) {
    console.error('Error al obtener ventas del día:', error);
    res.status(500).json({ error: 'Error al obtener ventas del día' });
  }
});

// Obtener resumen de ventas por periodo
router.get('/resumen/periodo', requireAuth, async (req, res) => {
  try {
    const filtros = {
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta
    };

    const resumen = await Venta.obtenerResumen(filtros);
    res.json(resumen);
  } catch (error) {
    console.error('Error al obtener resumen de ventas:', error);
    res.status(500).json({ error: 'Error al obtener resumen de ventas' });
  }
});

module.exports = router;
