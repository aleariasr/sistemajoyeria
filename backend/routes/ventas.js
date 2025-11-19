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
    const { items, metodo_pago, descuento, efectivo_recibido, notas, tipo_venta, id_cliente, fecha_vencimiento } = req.body;

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

    // Calcular cambio si es pago en efectivo
    let cambio = null;
    if (metodo_pago === 'Efectivo' && efectivo_recibido) {
      cambio = efectivo_recibido - total;
      if (cambio < 0) {
        return res.status(400).json({ error: 'El efectivo recibido es insuficiente' });
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
      id_cliente: id_cliente || null
    };

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
    for (const item of items) {
      // Crear item de venta en la base de datos correspondiente
      if (esVentaCredito) {
        await ItemVenta.crear({
          id_venta: idVenta,
          id_joya: item.id_joya,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: item.precio_unitario * item.cantidad
        });
      } else {
        await ItemVentaDia.crear({
          id_venta_dia: idVenta,
          id_joya: item.id_joya,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: item.precio_unitario * item.cantidad
        });
      }

      // Obtener joya actual
      const joya = await Joya.obtenerPorId(item.id_joya);
      
      if (!joya) {
        return res.status(404).json({ error: `Joya con ID ${item.id_joya} no encontrada` });
      }

      // Verificar que hay suficiente stock
      if (joya.stock_actual < item.cantidad) {
        return res.status(400).json({ 
          error: `Stock insuficiente para ${joya.nombre}. Stock disponible: ${joya.stock_actual}` 
        });
      }

      // Actualizar stock
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

// Obtener todas las ventas con filtros
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

    const resultado = await Venta.obtenerTodas(filtros);
    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
});

// Obtener una venta específica con sus items
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const venta = await Venta.obtenerPorId(id);
    
    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    const items = await ItemVenta.obtenerPorVenta(id);

    res.json({
      ...venta,
      items
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
