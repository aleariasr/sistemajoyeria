const express = require('express');
const router = express.Router();
const MovimientoInventario = require('../models/MovimientoInventario');
const Joya = require('../models/Joya');

// GET /api/movimientos - Obtener todos los movimientos con filtros
router.get('/', async (req, res) => {
  try {
    const filtros = {
      id_joya: req.query.id_joya,
      tipo_movimiento: req.query.tipo_movimiento,
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta,
      pagina: req.query.pagina || 1,
      por_pagina: req.query.por_pagina || 50
    };

    const resultado = await MovimientoInventario.obtenerTodos(filtros);
    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({ error: 'Error al obtener movimientos' });
  }
});

// POST /api/movimientos - Crear nuevo movimiento
router.post('/', async (req, res) => {
  try {
    const { id_joya, tipo_movimiento, cantidad, motivo, usuario } = req.body;

    // Validaciones
    if (!id_joya) {
      return res.status(400).json({ error: 'El ID de la joya es obligatorio' });
    }

    if (!tipo_movimiento || !['Entrada', 'Salida', 'Ajuste'].includes(tipo_movimiento)) {
      return res.status(400).json({ error: 'Tipo de movimiento inválido' });
    }

    if (!cantidad || cantidad <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
    }

    // Obtener la joya
    const joya = await Joya.obtenerPorId(id_joya);
    if (!joya) {
      return res.status(404).json({ error: 'Joya no encontrada' });
    }

    const stock_antes = joya.stock_actual;
    let stock_despues;

    // Calcular nuevo stock según tipo de movimiento
    switch (tipo_movimiento) {
      case 'Entrada':
        stock_despues = stock_antes + parseInt(cantidad);
        break;
      case 'Salida':
        stock_despues = stock_antes - parseInt(cantidad);
        break;
      case 'Ajuste':
        stock_despues = parseInt(cantidad);
        break;
    }

    // Validar que el stock no sea negativo
    if (stock_despues < 0) {
      return res.status(400).json({ 
        error: 'Stock insuficiente. El stock resultante no puede ser negativo.' 
      });
    }

    // Actualizar stock de la joya
    await Joya.actualizarStock(id_joya, stock_despues);

    // Registrar el movimiento
    const resultado = await MovimientoInventario.crear({
      id_joya,
      tipo_movimiento,
      cantidad,
      motivo: motivo || '',
      usuario,
      stock_antes,
      stock_despues
    });

    res.status(201).json({ 
      mensaje: 'Movimiento registrado correctamente',
      id: resultado.id,
      stock_antes,
      stock_despues
    });
  } catch (error) {
    console.error('Error al crear movimiento:', error);
    res.status(500).json({ error: 'Error al crear movimiento' });
  }
});

module.exports = router;
