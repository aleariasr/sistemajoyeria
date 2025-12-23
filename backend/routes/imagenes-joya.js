const express = require('express');
const router = express.Router();
const ImagenJoya = require('../models/ImagenJoya');
const { requireAuth } = require('../middleware/auth');

/**
 * POST /api/imagenes-joya
 * Agregar nueva imagen a una joya
 */
router.post('/imagenes-joya', requireAuth, async (req, res) => {
  try {
    const { id_joya, imagen_url, orden_display, es_principal } = req.body;
    
    // Validaciones
    if (!id_joya || !imagen_url) {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos',
        errorType: 'MISSING_FIELDS'
      });
    }
    
    // Validar que imagen_url sea una URL válida
    if (typeof imagen_url !== 'string' || imagen_url.trim().length === 0) {
      return res.status(400).json({ 
        error: 'La URL de la imagen no es válida',
        errorType: 'INVALID_URL'
      });
    }
    
    // Validar formato de URL básico
    try {
      new URL(imagen_url);
    } catch (urlError) {
      return res.status(400).json({ 
        error: 'La URL de la imagen no tiene un formato válido',
        errorType: 'INVALID_URL_FORMAT'
      });
    }
    
    // Validar que la URL sea de un dominio permitido (seguridad)
    const allowedDomains = ['cloudinary.com', 'res.cloudinary.com'];
    const url = new URL(imagen_url);
    const isAllowedDomain = allowedDomains.some(domain => url.hostname.includes(domain));
    
    if (!isAllowedDomain) {
      return res.status(400).json({ 
        error: 'Solo se permiten URLs de Cloudinary',
        errorType: 'DOMAIN_NOT_ALLOWED'
      });
    }
    
    const imagen = await ImagenJoya.crear({
      id_joya,
      imagen_url,
      orden_display,
      es_principal
    });
    
    res.status(201).json(imagen);
  } catch (error) {
    console.error('Error al crear imagen:', error);
    res.status(500).json({ 
      error: 'Error al crear imagen',
      errorType: 'SERVER_ERROR'
    });
  }
});

/**
 * GET /api/imagenes-joya/joya/:id
 * Obtener todas las imágenes de una joya
 */
router.get('/imagenes-joya/joya/:id', requireAuth, async (req, res) => {
  try {
    const imagenes = await ImagenJoya.obtenerPorJoya(req.params.id);
    res.json(imagenes);
  } catch (error) {
    console.error('Error al obtener imágenes:', error);
    res.status(500).json({ error: 'Error al obtener imágenes' });
  }
});

/**
 * PUT /api/imagenes-joya/reordenar
 * Actualizar orden de múltiples imágenes
 */
router.put('/imagenes-joya/reordenar', requireAuth, async (req, res) => {
  try {
    const { imagenes } = req.body;
    
    if (!Array.isArray(imagenes)) {
      return res.status(400).json({ error: 'Se espera un array de imágenes' });
    }
    
    await ImagenJoya.actualizarOrden(imagenes);
    res.json({ success: true });
  } catch (error) {
    console.error('Error al reordenar imágenes:', error);
    res.status(500).json({ error: 'Error al reordenar imágenes' });
  }
});

/**
 * DELETE /api/imagenes-joya/:id
 * Eliminar una imagen
 */
router.delete('/imagenes-joya/:id', requireAuth, async (req, res) => {
  try {
    await ImagenJoya.eliminar(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar imagen:', error);
    res.status(500).json({ error: 'Error al eliminar imagen' });
  }
});

/**
 * PUT /api/imagenes-joya/:id/principal
 * Marcar imagen como principal
 */
router.put('/imagenes-joya/:id/principal', requireAuth, async (req, res) => {
  try {
    await ImagenJoya.marcarComoPrincipal(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error al marcar como principal:', error);
    res.status(500).json({ error: 'Error al marcar como principal' });
  }
});

module.exports = router;
