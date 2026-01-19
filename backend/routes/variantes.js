/**
 * Routes: Variantes de Producto (Product Variants)
 * 
 * Manages product variants - different visual designs of the same product
 * that share price and stock from parent product.
 */

const express = require('express');
const router = express.Router();
const VarianteProducto = require('../models/VarianteProducto');
const Joya = require('../models/Joya');
const { requireAuth } = require('../middleware/auth');
const { uploadMiddleware, cleanupTempFile } = require('../middleware/upload');
const { uploadImage, deleteImage } = require('../cloudinary-config');

// All routes require authentication
router.use(requireAuth);

/**
 * POST /api/variantes
 * Create a new product variant
 */
router.post('/', uploadMiddleware, async (req, res) => {
  let uploadedImagePublicId = null;
  
  try {
    const {
      id_producto_padre,
      nombre_variante,
      descripcion_variante,
      orden_display,
      activo
    } = req.body;

    // Validate required fields
    if (!id_producto_padre || !nombre_variante) {
      // Cleanup temp file if exists
      if (req.file) {
        cleanupTempFile(req.file.path);
      }
      return res.status(400).json({
        error: 'Missing required fields: id_producto_padre, nombre_variante'
      });
    }

    // Validate image file is provided
    if (!req.file) {
      return res.status(400).json({
        error: 'Image file is required'
      });
    }

    // Verify parent product exists
    const producto = await Joya.obtenerPorId(id_producto_padre);
    if (!producto) {
      cleanupTempFile(req.file.path);
      return res.status(404).json({ error: 'Parent product not found' });
    }

    // Check variant limit (max 100)
    const dentroDelLimite = await VarianteProducto.validarLimite(id_producto_padre);
    if (!dentroDelLimite) {
      cleanupTempFile(req.file.path);
      return res.status(400).json({
        error: 'Maximum variant limit reached (100 per product)'
      });
    }

    // Upload image to Cloudinary
    let imagen_url;
    try {
      const resultadoImagen = await uploadImage(req.file.path, 'variantes');
      imagen_url = resultadoImagen.url;
      uploadedImagePublicId = resultadoImagen.publicId;
      
      // Cleanup temp file
      cleanupTempFile(req.file.path);
    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error);
      cleanupTempFile(req.file.path);
      return res.status(500).json({ 
        error: 'Failed to upload image: ' + (error.message || 'Unknown error')
      });
    }

    // Create variant
    const variante = await VarianteProducto.crear({
      id_producto_padre,
      nombre_variante,
      descripcion_variante,
      imagen_url,
      orden_display,
      activo
    });

    // If this is the first variant, mark parent as variant product
    if (!producto.es_producto_variante) {
      await Joya.actualizar(id_producto_padre, { es_producto_variante: true });
    }

    res.json({
      success: true,
      data: variante,
      message: 'Variant created successfully'
    });
  } catch (error) {
    console.error('Error creating variant:', error);
    
    // Cleanup uploaded image if variant creation failed
    if (uploadedImagePublicId) {
      try {
        await deleteImage(uploadedImagePublicId);
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded image:', cleanupError);
      }
    }
    
    // Cleanup temp file if exists
    if (req.file) {
      cleanupTempFile(req.file.path);
    }
    
    res.status(500).json({ error: error.message || 'Error creating variant' });
  }
});

/**
 * GET /api/variantes/:id
 * Get variant by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const variante = await VarianteProducto.obtenerPorId(id);

    if (!variante) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    res.json({
      success: true,
      data: variante
    });
  } catch (error) {
    console.error('Error fetching variant:', error);
    res.status(500).json({ error: 'Error fetching variant' });
  }
});

/**
 * GET /api/variantes/producto/:id
 * Get all variants for a parent product
 */
router.get('/producto/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const soloActivas = req.query.activas === 'true';

    const variantes = await VarianteProducto.obtenerPorProducto(id, soloActivas);

    res.json({
      success: true,
      data: variantes,
      total: variantes.length
    });
  } catch (error) {
    console.error('Error fetching variants:', error);
    res.status(500).json({ error: 'Error fetching variants' });
  }
});

/**
 * PUT /api/variantes/:id
 * Update a variant
 */
router.put('/:id', uploadMiddleware, async (req, res) => {
  let uploadedImagePublicId = null;
  
  try {
    const { id } = req.params;
    const {
      nombre_variante,
      descripcion_variante,
      orden_display,
      activo
    } = req.body;

    // Verify variant exists
    const varianteExistente = await VarianteProducto.obtenerPorId(id);
    if (!varianteExistente) {
      if (req.file) {
        cleanupTempFile(req.file.path);
      }
      return res.status(404).json({ error: 'Variant not found' });
    }

    // Prepare update data
    const updateData = {
      nombre_variante,
      descripcion_variante,
      orden_display,
      activo
    };

    // Handle image upload if new image provided
    if (req.file) {
      try {
        const resultadoImagen = await uploadImage(req.file.path, 'variantes');
        updateData.imagen_url = resultadoImagen.url;
        uploadedImagePublicId = resultadoImagen.publicId;
        
        // Store old image public_id for cleanup after successful update
        const oldImageUrl = varianteExistente.imagen_url;
        
        // Cleanup temp file
        cleanupTempFile(req.file.path);
        
        // Update variant
        const varianteActualizada = await VarianteProducto.actualizar(id, updateData);
        
        // Delete old image from Cloudinary after successful update
        if (oldImageUrl) {
          try {
            // Extract public_id from URL
            const urlParts = oldImageUrl.split('/');
            const fileWithExt = urlParts[urlParts.length - 1];
            const fileName = fileWithExt.split('.')[0];
            const folder = urlParts[urlParts.length - 2];
            const oldPublicId = `${folder}/${fileName}`;
            
            await deleteImage(oldPublicId);
          } catch (err) {
            console.error('Error deleting old image:', err);
            // Continue even if old image deletion fails
          }
        }

        return res.json({
          success: true,
          data: varianteActualizada,
          message: 'Variant updated successfully'
        });
      } catch (error) {
        console.error('Error uploading new image:', error);
        cleanupTempFile(req.file.path);
        
        // Cleanup newly uploaded image if update failed
        if (uploadedImagePublicId) {
          try {
            await deleteImage(uploadedImagePublicId);
          } catch (cleanupError) {
            console.error('Error cleaning up uploaded image:', cleanupError);
          }
        }
        
        return res.status(500).json({ 
          error: 'Failed to upload new image: ' + (error.message || 'Unknown error')
        });
      }
    }

    // Update variant without image change
    const varianteActualizada = await VarianteProducto.actualizar(id, updateData);

    res.json({
      success: true,
      data: varianteActualizada,
      message: 'Variant updated successfully'
    });
  } catch (error) {
    console.error('Error updating variant:', error);
    
    // Cleanup uploaded image if update failed
    if (uploadedImagePublicId) {
      try {
        await deleteImage(uploadedImagePublicId);
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded image:', cleanupError);
      }
    }
    
    // Cleanup temp file if exists
    if (req.file) {
      cleanupTempFile(req.file.path);
    }
    
    res.status(500).json({ error: error.message || 'Error updating variant' });
  }
});

/**
 * DELETE /api/variantes/:id
 * Delete a variant
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify variant exists
    const variante = await VarianteProducto.obtenerPorId(id);
    if (!variante) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    // Delete variant
    await VarianteProducto.eliminar(id);

    // Check if this was the last variant - if so, unmark parent
    const variantesRestantes = await VarianteProducto.obtenerPorProducto(variante.id_producto_padre);
    if (variantesRestantes.length === 0) {
      await Joya.actualizar(variante.id_producto_padre, { es_producto_variante: false });
    }

    res.json({
      success: true,
      message: 'Variant deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting variant:', error);
    res.status(500).json({ error: 'Error deleting variant' });
  }
});

/**
 * POST /api/variantes/reordenar
 * Reorder variants
 */
router.post('/reordenar', async (req, res) => {
  try {
    const { ordenes } = req.body;

    // Validate ordenes format
    if (!Array.isArray(ordenes)) {
      return res.status(400).json({ error: 'ordenes must be an array' });
    }

    // Validate each order entry
    for (const orden of ordenes) {
      if (!orden.id || orden.orden_display === undefined) {
        return res.status(400).json({
          error: 'Each order entry must have id and orden_display'
        });
      }
    }

    // Reorder variants
    await VarianteProducto.reordenar(ordenes);

    res.json({
      success: true,
      message: 'Variants reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering variants:', error);
    res.status(500).json({ error: 'Error reordering variants' });
  }
});

module.exports = router;
