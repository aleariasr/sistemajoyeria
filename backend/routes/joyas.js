const express = require('express');
const router = express.Router();
const Joya = require('../models/Joya');
const MovimientoInventario = require('../models/MovimientoInventario');
const {
  esNumeroPositivo,
  esEnteroPositivo,
  validarCodigo,
  esStringNoVacio,
  validarMoneda,
  validarEstado
} = require('../utils/validaciones');

// Validación de datos de joya
const validarJoya = (data) => {
  const errores = [];

  if (!esStringNoVacio(data.codigo)) {
    errores.push('El código es obligatorio');
  } else if (!validarCodigo(data.codigo)) {
    errores.push('El código solo puede contener letras, números, guiones y guiones bajos');
  }

  if (!esStringNoVacio(data.nombre)) {
    errores.push('El nombre es obligatorio');
  }

  if (!esNumeroPositivo(data.costo)) {
    errores.push('El costo es obligatorio y debe ser mayor o igual a 0');
  }

  if (!esNumeroPositivo(data.precio_venta)) {
    errores.push('El precio de venta es obligatorio y debe ser mayor o igual a 0');
  }

  if (!esEnteroPositivo(data.stock_actual)) {
    errores.push('El stock actual es obligatorio y debe ser un número entero mayor o igual a 0');
  }

  if (data.moneda && !validarMoneda(data.moneda)) {
    errores.push('La moneda debe ser CRC, USD o EUR');
  }

  if (data.estado && !validarEstado(data.estado)) {
    errores.push('El estado debe ser Activo, Descontinuado o Agotado');
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
    // Convert numeric fields from strings to numbers
    const joyaData = {
      ...req.body,
      costo: req.body.costo !== undefined ? parseFloat(req.body.costo) : undefined,
      precio_venta: req.body.precio_venta !== undefined ? parseFloat(req.body.precio_venta) : undefined,
      stock_actual: req.body.stock_actual !== undefined ? parseInt(req.body.stock_actual, 10) : undefined,
      stock_minimo: req.body.stock_minimo !== undefined ? parseInt(req.body.stock_minimo, 10) : undefined,
      peso_gramos: req.body.peso_gramos !== undefined && req.body.peso_gramos !== '' ? parseFloat(req.body.peso_gramos) : undefined
    };

    const errores = validarJoya(joyaData);
    
    if (errores.length > 0) {
      return res.status(400).json({ errores });
    }

    // Verificar que el código no exista
    const joyaExistente = await Joya.obtenerPorCodigo(joyaData.codigo);
    if (joyaExistente) {
      return res.status(400).json({ errores: ['El código ya existe'] });
    }

    const resultado = await Joya.crear(joyaData);
    
    // Registrar movimiento inicial si hay stock
    if (joyaData.stock_actual > 0) {
      await MovimientoInventario.crear({
        id_joya: resultado.id,
        tipo_movimiento: 'Entrada',
        cantidad: joyaData.stock_actual,
        motivo: 'Inventario inicial',
        stock_antes: 0,
        stock_despues: joyaData.stock_actual
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
    // Convert numeric fields from strings to numbers
    const joyaData = {
      ...req.body,
      costo: req.body.costo !== undefined ? parseFloat(req.body.costo) : undefined,
      precio_venta: req.body.precio_venta !== undefined ? parseFloat(req.body.precio_venta) : undefined,
      stock_actual: req.body.stock_actual !== undefined ? parseInt(req.body.stock_actual, 10) : undefined,
      stock_minimo: req.body.stock_minimo !== undefined ? parseInt(req.body.stock_minimo, 10) : undefined,
      peso_gramos: req.body.peso_gramos !== undefined && req.body.peso_gramos !== '' ? parseFloat(req.body.peso_gramos) : undefined
    };

    const errores = validarJoya(joyaData);
    
    if (errores.length > 0) {
      return res.status(400).json({ errores });
    }

    const joyaExistente = await Joya.obtenerPorId(req.params.id);
    if (!joyaExistente) {
      return res.status(404).json({ error: 'Joya no encontrada' });
    }

    // Verificar que el código no esté duplicado (excepto para la misma joya)
    if (joyaData.codigo !== joyaExistente.codigo) {
      const joyaConCodigo = await Joya.obtenerPorCodigo(joyaData.codigo);
      if (joyaConCodigo) {
        return res.status(400).json({ errores: ['El código ya existe'] });
      }
    }

    await Joya.actualizar(req.params.id, joyaData);
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
