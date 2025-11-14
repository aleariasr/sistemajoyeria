const express = require('express');
const router = express.Router();
const Joya = require('../models/Joya');
const MovimientoInventario = require('../models/MovimientoInventario');

// Validación de datos de joya
const validarJoya = (data) => {
  const errores = [];

  if (!data.codigo || data.codigo.trim() === '') {
    errores.push('El código es obligatorio');
  }

  if (!data.nombre || data.nombre.trim() === '') {
    errores.push('El nombre es obligatorio');
  }

  if (data.costo === undefined || data.costo === null || data.costo < 0) {
    errores.push('El costo es obligatorio y debe ser mayor o igual a 0');
  }

  if (data.precio_venta === undefined || data.precio_venta === null || data.precio_venta < 0) {
    errores.push('El precio de venta es obligatorio y debe ser mayor o igual a 0');
  }

  if (data.stock_actual === undefined || data.stock_actual === null || data.stock_actual < 0) {
    errores.push('El stock actual es obligatorio y debe ser mayor o igual a 0');
  }

  return errores;
};

// GET /api/joyas - Obtener todas las joyas con filtros
router.get('/', async (req, res) => {
  try {
    const filtros = {
      busqueda: req.query.busqueda,
      categoria: req.query.categoria,
      tipo_metal: req.query.tipo_metal,
      precio_min: req.query.precio_min,
      precio_max: req.query.precio_max,
      stock_bajo: req.query.stock_bajo,
      sin_stock: req.query.sin_stock,
      estado: req.query.estado,
      pagina: req.query.pagina || 1,
      por_pagina: req.query.por_pagina || 20
    };

    const resultado = await Joya.obtenerTodas(filtros);
    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener joyas:', error);
    res.status(500).json({ error: 'Error al obtener joyas' });
  }
});

// GET /api/joyas/categorias - Obtener categorías únicas
router.get('/categorias', async (req, res) => {
  try {
    const categorias = await Joya.obtenerCategorias();
    res.json(categorias);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// GET /api/joyas/tipos-metal - Obtener tipos de metal únicos
router.get('/tipos-metal', async (req, res) => {
  try {
    const tipos = await Joya.obtenerTiposMetal();
    res.json(tipos);
  } catch (error) {
    console.error('Error al obtener tipos de metal:', error);
    res.status(500).json({ error: 'Error al obtener tipos de metal' });
  }
});

// GET /api/joyas/stock-bajo - Obtener joyas con stock bajo
router.get('/stock-bajo', async (req, res) => {
  try {
    const joyas = await Joya.obtenerStockBajo();
    res.json(joyas);
  } catch (error) {
    console.error('Error al obtener joyas con stock bajo:', error);
    res.status(500).json({ error: 'Error al obtener joyas con stock bajo' });
  }
});

// GET /api/joyas/:id - Obtener una joya por ID
router.get('/:id', async (req, res) => {
  try {
    const joya = await Joya.obtenerPorId(req.params.id);
    
    if (!joya) {
      return res.status(404).json({ error: 'Joya no encontrada' });
    }

    // Obtener historial de movimientos
    const movimientos = await MovimientoInventario.obtenerPorJoya(req.params.id, 10);
    
    res.json({ ...joya, movimientos });
  } catch (error) {
    console.error('Error al obtener joya:', error);
    res.status(500).json({ error: 'Error al obtener joya' });
  }
});

// POST /api/joyas - Crear nueva joya
router.post('/', async (req, res) => {
  try {
    const errores = validarJoya(req.body);
    
    if (errores.length > 0) {
      return res.status(400).json({ errores });
    }

    // Verificar que el código no exista
    const joyaExistente = await Joya.obtenerPorCodigo(req.body.codigo);
    if (joyaExistente) {
      return res.status(400).json({ errores: ['El código ya existe'] });
    }

    const resultado = await Joya.crear(req.body);
    
    // Registrar movimiento inicial si hay stock
    if (req.body.stock_actual > 0) {
      await MovimientoInventario.crear({
        id_joya: resultado.id,
        tipo_movimiento: 'Entrada',
        cantidad: req.body.stock_actual,
        motivo: 'Inventario inicial',
        stock_antes: 0,
        stock_despues: req.body.stock_actual
      });
    }

    res.status(201).json({ mensaje: 'Joya creada correctamente', id: resultado.id });
  } catch (error) {
    console.error('Error al crear joya:', error);
    res.status(500).json({ error: 'Error al crear joya' });
  }
});

// PUT /api/joyas/:id - Actualizar joya
router.put('/:id', async (req, res) => {
  try {
    const errores = validarJoya(req.body);
    
    if (errores.length > 0) {
      return res.status(400).json({ errores });
    }

    const joyaExistente = await Joya.obtenerPorId(req.params.id);
    if (!joyaExistente) {
      return res.status(404).json({ error: 'Joya no encontrada' });
    }

    // Verificar que el código no esté duplicado (excepto para la misma joya)
    if (req.body.codigo !== joyaExistente.codigo) {
      const joyaConCodigo = await Joya.obtenerPorCodigo(req.body.codigo);
      if (joyaConCodigo) {
        return res.status(400).json({ errores: ['El código ya existe'] });
      }
    }

    await Joya.actualizar(req.params.id, req.body);
    res.json({ mensaje: 'Joya actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar joya:', error);
    res.status(500).json({ error: 'Error al actualizar joya' });
  }
});

// DELETE /api/joyas/:id - Eliminar joya (marcar como descontinuado)
router.delete('/:id', async (req, res) => {
  try {
    const joya = await Joya.obtenerPorId(req.params.id);
    if (!joya) {
      return res.status(404).json({ error: 'Joya no encontrada' });
    }

    await Joya.eliminar(req.params.id);
    res.json({ mensaje: 'Joya marcada como descontinuada' });
  } catch (error) {
    console.error('Error al eliminar joya:', error);
    res.status(500).json({ error: 'Error al eliminar joya' });
  }
});

module.exports = router;
