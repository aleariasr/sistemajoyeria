const express = require('express');
const router = express.Router();
const CuentaPorCobrar = require('../models/CuentaPorCobrar');
const Abono = require('../models/Abono');
const Cliente = require('../models/Cliente');
const MovimientoCuenta = require('../models/MovimientoCuenta');

// Middleware para verificar autenticación
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  next();
};

// Obtener todas las cuentas por cobrar con filtros
router.get('/', requireAuth, async (req, res) => {
  try {
    const filtros = {
      estado: req.query.estado,
      id_cliente: req.query.id_cliente,
      pagina: req.query.pagina,
      por_pagina: req.query.por_pagina
    };

    const resultado = await CuentaPorCobrar.obtenerTodas(filtros);
    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener cuentas por cobrar:', error);
    res.status(500).json({ error: 'Error al obtener cuentas por cobrar' });
  }
});

// Obtener resumen de cuentas por cobrar
router.get('/resumen', requireAuth, async (req, res) => {
  try {
    const resumen = await CuentaPorCobrar.obtenerResumen();
    res.json(resumen);
  } catch (error) {
    console.error('Error al obtener resumen de cuentas por cobrar:', error);
    res.status(500).json({ error: 'Error al obtener resumen de cuentas por cobrar' });
  }
});

// Obtener una cuenta por cobrar específica con sus abonos y movimientos
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const cuenta = await CuentaPorCobrar.obtenerPorId(id);
    
    if (!cuenta) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }

    // Obtener los abonos de esta cuenta
    const abonos = await Abono.obtenerPorCuenta(id);

    // Obtener los movimientos (historial de ventas a crédito)
    const movimientos = await MovimientoCuenta.obtenerPorCuenta(id);

    res.json({
      ...cuenta,
      abonos,
      movimientos
    });
  } catch (error) {
    console.error('Error al obtener cuenta por cobrar:', error);
    res.status(500).json({ error: 'Error al obtener cuenta por cobrar' });
  }
});

// Obtener cuentas de un cliente específico
router.get('/cliente/:id_cliente', requireAuth, async (req, res) => {
  try {
    const { id_cliente } = req.params;

    // Verificar que el cliente existe
    const cliente = await Cliente.obtenerPorId(id_cliente);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const cuentas = await CuentaPorCobrar.obtenerPorCliente(id_cliente);
    res.json(cuentas);
  } catch (error) {
    console.error('Error al obtener cuentas del cliente:', error);
    res.status(500).json({ error: 'Error al obtener cuentas del cliente' });
  }
});

// Registrar un abono a una cuenta
router.post('/:id/abonos', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { monto, metodo_pago, notas } = req.body;

    // Validaciones
    if (!monto || monto <= 0) {
      return res.status(400).json({ error: 'El monto del abono debe ser mayor a 0' });
    }

    if (!metodo_pago) {
      return res.status(400).json({ error: 'El método de pago es requerido' });
    }

    // Verificar que la cuenta existe
    const cuenta = await CuentaPorCobrar.obtenerPorId(id);
    if (!cuenta) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }

    // Verificar que el abono no sea mayor al saldo pendiente
    if (parseFloat(monto) > parseFloat(cuenta.saldo_pendiente)) {
      return res.status(400).json({ 
        error: `El abono no puede ser mayor al saldo pendiente (₡${cuenta.saldo_pendiente})` 
      });
    }

    // Crear el abono
    const resultadoAbono = await Abono.crear({
      id_cuenta_por_cobrar: id,
      monto,
      metodo_pago,
      notas,
      usuario: req.session.username
    });

    // Actualizar la cuenta por cobrar
    const resultadoActualizacion = await CuentaPorCobrar.actualizarPago(id, monto);

    res.status(201).json({
      mensaje: 'Abono registrado exitosamente',
      id_abono: resultadoAbono.id,
      nuevo_saldo: resultadoActualizacion.saldo_pendiente,
      estado: resultadoActualizacion.estado
    });
  } catch (error) {
    console.error('Error al registrar abono:', error);
    res.status(500).json({ error: 'Error al registrar abono' });
  }
});

module.exports = router;
