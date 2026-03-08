const express = require('express');
const router = express.Router();
const IngresoExtra = require('../models/IngresoExtra');

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

// Obtener todos los ingresos extras
router.get('/', requireAuth, async (req, res) => {
  try {
    const filtros = {
      tipo: req.query.tipo,
      cerrado: req.query.cerrado === 'true' ? true : req.query.cerrado === 'false' ? false : undefined,
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta,
      pagina: req.query.pagina,
      por_pagina: req.query.por_pagina
    };

    const resultado = await IngresoExtra.obtenerTodos(filtros);
    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener ingresos extras:', error);
    res.status(500).json({ error: 'Error al obtener ingresos extras' });
  }
});

// Obtener resumen de ingresos extras
router.get('/resumen', requireAuth, async (req, res) => {
  try {
    const filtros = {
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta
    };

    const resumen = await IngresoExtra.obtenerResumen(filtros);
    res.json(resumen);
  } catch (error) {
    console.error('Error al obtener resumen de ingresos extras:', error);
    res.status(500).json({ error: 'Error al obtener resumen de ingresos extras' });
  }
});

// Obtener un ingreso extra por ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const ingreso = await IngresoExtra.obtenerPorId(id);
    
    if (!ingreso) {
      return res.status(404).json({ error: 'Ingreso extra no encontrado' });
    }

    res.json(ingreso);
  } catch (error) {
    console.error('Error al obtener ingreso extra:', error);
    res.status(500).json({ error: 'Error al obtener ingreso extra' });
  }
});

// Crear nuevo ingreso extra
router.post('/', requireAuth, async (req, res) => {
  try {
    const { tipo, monto, metodo_pago, descripcion, notas } = req.body;

    // Validaciones
    if (!tipo) {
      return res.status(400).json({ error: 'El tipo de ingreso es requerido' });
    }

    if (!monto || parseFloat(monto) <= 0) {
      return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
    }

    if (!metodo_pago) {
      return res.status(400).json({ error: 'El método de pago es requerido' });
    }

    if (!descripcion || descripcion.trim() === '') {
      return res.status(400).json({ error: 'La descripción es requerida' });
    }

    // Validar tipo
    const tiposValidos = ['Fondo de Caja', 'Prestamo', 'Devolucion', 'Otros'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ error: 'Tipo de ingreso inválido' });
    }

    // Validar método de pago
    const metodosValidos = ['Efectivo', 'Tarjeta', 'Transferencia'];
    if (!metodosValidos.includes(metodo_pago)) {
      return res.status(400).json({ error: 'Método de pago inválido' });
    }

    const ingresoData = {
      tipo,
      monto: parseFloat(monto),
      metodo_pago,
      descripcion,
      notas,
      id_usuario: req.session.userId,
      usuario: req.session.username
    };

    const resultado = await IngresoExtra.crear(ingresoData);

    res.status(201).json({
      mensaje: 'Ingreso extra registrado exitosamente',
      id: resultado.id
    });
  } catch (error) {
    console.error('Error al crear ingreso extra:', error);
    res.status(500).json({ error: 'Error al crear ingreso extra' });
  }
});

module.exports = router;
