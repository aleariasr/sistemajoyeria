const express = require('express');
const router = express.Router();
const Joya = require('../models/Joya');
const MovimientoInventario = require('../models/MovimientoInventario');
const { requireAuth } = require('../middleware/auth');
const { uploadMiddleware, cleanupTempFile } = require('../middleware/upload');
const { uploadImage, deleteImage } = require('../cloudinary-config');
const {
  esNumeroPositivo,
  esEnteroPositivo,
  validarCodigo,
  esStringNoVacio,
  validarMoneda,
  validarEstado,
  convertirCamposNumericos
} = require('../utils/validaciones');

// All routes require authentication
router.use(requireAuth);

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

// GET /api/joyas/verificar-codigo - Verificar si un código existe o buscar similares
router.get('/verificar-codigo', async (req, res) => {
  try {
    const { codigo, excluir_id } = req.query;
    
    if (!codigo) {
      return res.status(400).json({ error: 'El código es requerido' });
    }

    // Buscar códigos similares (case-insensitive)
    const codigosSimilares = await Joya.buscarCodigosSimilares(codigo);
    
    // Filtrar el ID a excluir (útil en edición)
    const codigosFiltrados = excluir_id 
      ? codigosSimilares.filter(j => j.id.toString() !== excluir_id.toString())
      : codigosSimilares;
    
    // Verificar si existe código exacto (case-insensitive)
    const codigoExacto = codigosFiltrados.find(
      j => j.codigo.toLowerCase() === codigo.toLowerCase()
    );

    res.json({
      existe: !!codigoExacto,
      codigo_existente: codigoExacto || null,
      similares: codigosFiltrados
    });
  } catch (error) {
    console.error('Error al verificar código:', error);
    res.status(500).json({ error: 'Error al verificar código' });
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

// GET /api/joyas/:id/dependencias - Verificar dependencias de una joya
router.get('/:id/dependencias', async (req, res) => {
  try {
    const joya = await Joya.obtenerPorId(req.params.id);
    
    if (!joya) {
      return res.status(404).json({ error: 'Joya no encontrada' });
    }

    const dependencias = await Joya.verificarDependencias(req.params.id);
    res.json(dependencias);
  } catch (error) {
    console.error('Error al verificar dependencias:', error);
    res.status(500).json({ error: 'Error al verificar dependencias' });
  }
});

// POST /api/joyas - Crear nueva joya
router.post('/', uploadMiddleware, async (req, res) => {
  try {
    // Convert numeric fields from strings to numbers
    const joyaData = convertirCamposNumericos(req.body);

    const errores = validarJoya(joyaData);
    
    if (errores.length > 0) {
      // Limpiar archivo temporal si existe
      if (req.file) {
        cleanupTempFile(req.file.path);
      }
      return res.status(400).json({ errores });
    }

    // Verificar que el código no exista
    const joyaExistente = await Joya.obtenerPorCodigo(joyaData.codigo);
    if (joyaExistente) {
      // Limpiar archivo temporal si existe
      if (req.file) {
        cleanupTempFile(req.file.path);
      }
      return res.status(400).json({ errores: ['El código ya existe'] });
    }

    // Subir imagen a Cloudinary si se proporcionó
    if (req.file) {
      try {
        const resultadoImagen = await uploadImage(req.file.path, 'joyas');
        joyaData.imagen_url = resultadoImagen.url;
        joyaData.imagen_public_id = resultadoImagen.publicId;
        
        // Limpiar archivo temporal
        cleanupTempFile(req.file.path);
      } catch (error) {
        console.error('Error al subir imagen:', error);
        // Continuar sin imagen si falla la subida
        cleanupTempFile(req.file.path);
      }
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
    // Limpiar archivo temporal si existe
    if (req.file) {
      cleanupTempFile(req.file.path);
    }
    res.status(500).json({ error: 'Error al crear joya' });
  }
});

// PUT /api/joyas/:id - Actualizar joya
router.put('/:id', uploadMiddleware, async (req, res) => {
  try {
    // Convert numeric fields from strings to numbers
    const joyaData = convertirCamposNumericos(req.body);

    const errores = validarJoya(joyaData);
    
    if (errores.length > 0) {
      // Limpiar archivo temporal si existe
      if (req.file) {
        cleanupTempFile(req.file.path);
      }
      return res.status(400).json({ errores });
    }

    const joyaExistente = await Joya.obtenerPorId(req.params.id);
    if (!joyaExistente) {
      // Limpiar archivo temporal si existe
      if (req.file) {
        cleanupTempFile(req.file.path);
      }
      return res.status(404).json({ error: 'Joya no encontrada' });
    }

    // Verificar que el código no esté duplicado en otra joya (case-insensitive)
    const joyaConCodigo = await Joya.obtenerPorCodigo(joyaData.codigo);
    if (joyaConCodigo && joyaConCodigo.id.toString() !== req.params.id) {
      // Limpiar archivo temporal si existe
      if (req.file) {
        cleanupTempFile(req.file.path);
      }
      return res.status(400).json({ errores: ['El código ya existe en otra joya'] });
    }

    // Subir nueva imagen a Cloudinary si se proporcionó
    if (req.file) {
      try {
        const resultadoImagen = await uploadImage(req.file.path, 'joyas');
        joyaData.imagen_url = resultadoImagen.url;
        joyaData.imagen_public_id = resultadoImagen.publicId;
        
        // Eliminar imagen anterior de Cloudinary si existe
        if (joyaExistente.imagen_public_id) {
          try {
            await deleteImage(joyaExistente.imagen_public_id);
          } catch (err) {
            console.error('Error al eliminar imagen anterior:', err);
          }
        }
        
        // Limpiar archivo temporal
        cleanupTempFile(req.file.path);
      } catch (error) {
        console.error('Error al subir imagen:', error);
        // Continuar sin actualizar imagen si falla la subida
        cleanupTempFile(req.file.path);
      }
    }

    // Registrar movimiento de inventario si el stock cambió
    const stockAnterior = joyaExistente.stock_actual;
    const stockNuevo = joyaData.stock_actual;
    
    if (stockNuevo !== stockAnterior) {
      const diferencia = stockNuevo - stockAnterior;
      const tipoMovimiento = diferencia > 0 ? 'Entrada' : diferencia < 0 ? 'Salida' : 'Ajuste';
      const cantidad = Math.abs(diferencia);
      
      await MovimientoInventario.crear({
        id_joya: req.params.id,
        tipo_movimiento: tipoMovimiento,
        cantidad: cantidad,
        motivo: 'Ajuste de inventario por modificación',
        usuario: req.session?.username || 'Sistema',
        stock_antes: stockAnterior,
        stock_despues: stockNuevo
      });
    }

    await Joya.actualizar(req.params.id, joyaData);
    res.json({ mensaje: 'Joya actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar joya:', error);
    // Limpiar archivo temporal si existe
    if (req.file) {
      cleanupTempFile(req.file.path);
    }
    res.status(500).json({ error: 'Error al actualizar joya' });
  }
});

// DELETE /api/joyas/:id - Eliminar joya físicamente o marcar como descontinuado
router.delete('/:id', async (req, res) => {
  try {
    const joya = await Joya.obtenerPorId(req.params.id);
    if (!joya) {
      return res.status(404).json({ error: 'Joya no encontrada' });
    }

    const resultado = await Joya.eliminar(req.params.id);

    if (resultado.eliminado) {
      // Eliminación física exitosa - eliminar imagen de Cloudinary
      if (joya.imagen_public_id) {
        try {
          await deleteImage(joya.imagen_public_id);
        } catch (err) {
          console.error('Error al eliminar imagen de Cloudinary:', err);
          // No fallar si no se puede eliminar la imagen
        }
      }
      
      res.json({ 
        success: true,
        mensaje: 'Joya eliminada completamente del sistema',
        eliminado: true
      });
    } else if (resultado.marcado_descontinuado) {
      // Tiene dependencias - solo se marcó como descontinuado
      res.status(409).json({
        success: false,
        error: 'No se puede eliminar la joya debido a dependencias existentes',
        mensaje: 'La joya fue marcada como descontinuada porque tiene registros relacionados',
        marcado_descontinuado: true,
        dependencias: resultado.dependencias
      });
    } else {
      res.status(400).json({ 
        success: false,
        error: 'No se pudo procesar la eliminación' 
      });
    }
  } catch (error) {
    console.error('Error al eliminar joya:', error);
    res.status(500).json({ error: 'Error al eliminar joya' });
  }
});

// POST /api/joyas/upload-image - Subir imagen independiente
router.post('/upload-image', uploadMiddleware, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No se proporcionó ninguna imagen',
        errorType: 'NO_FILE'
      });
    }

    // Subir imagen a Cloudinary
    const resultadoImagen = await uploadImage(req.file.path, 'joyas');
    
    // Limpiar archivo temporal
    cleanupTempFile(req.file.path);
    
    res.json({
      url: resultadoImagen.url,
      publicId: resultadoImagen.publicId,
      width: resultadoImagen.width,
      height: resultadoImagen.height,
      format: resultadoImagen.format
    });
  } catch (error) {
    console.error('Error al subir imagen:', error);
    // Limpiar archivo temporal si existe
    if (req.file) {
      cleanupTempFile(req.file.path);
    }
    res.status(500).json({ 
      error: error.message || 'Error al subir imagen',
      errorType: 'UPLOAD_ERROR'
    });
  }
});

module.exports = router;
