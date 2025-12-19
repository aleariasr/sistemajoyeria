/**
 * Routes: Productos Compuestos (Composite Products / Sets)
 * 
 * Manages product sets composed of multiple individual products.
 * Handles stock calculation and component management.
 */

const express = require('express');
const router = express.Router();
const ProductoCompuesto = require('../models/ProductoCompuesto');
const Joya = require('../models/Joya');
const { requireAuth } = require('../middleware/auth');

// All routes require authentication
router.use(requireAuth);

/**
 * POST /api/productos-compuestos
 * Add a component to a set
 */
router.post('/', async (req, res) => {
  try {
    const {
      id_producto_set,
      id_producto_componente,
      cantidad,
      orden_display
    } = req.body;

    // Validate required fields
    if (!id_producto_set || !id_producto_componente) {
      return res.status(400).json({
        error: 'Missing required fields: id_producto_set, id_producto_componente'
      });
    }

    // Verify both products exist
    const productoSet = await Joya.obtenerPorId(id_producto_set);
    const productoComponente = await Joya.obtenerPorId(id_producto_componente);

    if (!productoSet) {
      return res.status(404).json({ error: 'Set product not found' });
    }
    if (!productoComponente) {
      return res.status(404).json({ error: 'Component product not found' });
    }

    // Check component limit (max 20)
    const dentroDelLimite = await ProductoCompuesto.validarLimiteComponentes(id_producto_set);
    if (!dentroDelLimite) {
      return res.status(400).json({
        error: 'Maximum component limit reached (20 per set)'
      });
    }

    // Check for circular references
    const noCircular = await ProductoCompuesto.validarNoCircular(id_producto_set, id_producto_componente);
    if (!noCircular) {
      return res.status(400).json({
        error: 'Circular reference detected: component set contains the parent set'
      });
    }

    // Add component
    const componente = await ProductoCompuesto.agregarComponente({
      id_producto_set,
      id_producto_componente,
      cantidad: cantidad || 1,
      orden_display
    });

    // Mark set as composite product if not already marked
    if (!productoSet.es_producto_compuesto) {
      await Joya.actualizar(id_producto_set, { es_producto_compuesto: true });
    }

    res.json({
      success: true,
      data: componente,
      message: 'Component added successfully'
    });
  } catch (error) {
    console.error('Error adding component:', error);
    res.status(500).json({ error: error.message || 'Error adding component' });
  }
});

/**
 * GET /api/productos-compuestos/set/:id
 * Get all components for a set with full details
 */
router.get('/set/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const componentes = await ProductoCompuesto.obtenerComponentesConDetalles(id);

    res.json({
      success: true,
      data: componentes,
      total: componentes.length
    });
  } catch (error) {
    console.error('Error fetching components:', error);
    res.status(500).json({ error: 'Error fetching components' });
  }
});

/**
 * GET /api/productos-compuestos/validar-stock/:id
 * Validate stock availability for a set
 */
router.get('/validar-stock/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cantidad = parseInt(req.query.cantidad || 1);

    const stockDisponible = await ProductoCompuesto.calcularStockDisponible(id);
    const suficiente = stockDisponible >= cantidad;

    res.json({
      success: true,
      data: {
        stock_disponible: stockDisponible,
        cantidad_solicitada: cantidad,
        suficiente
      }
    });
  } catch (error) {
    console.error('Error validating stock:', error);
    res.status(500).json({ error: 'Error validating stock' });
  }
});

/**
 * PUT /api/productos-compuestos/:id/cantidad
 * Update component quantity
 */
router.put('/:id/cantidad', async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;

    if (!cantidad || cantidad <= 0) {
      return res.status(400).json({ error: 'Quantity must be positive' });
    }

    const componente = await ProductoCompuesto.actualizarCantidad(id, cantidad);

    res.json({
      success: true,
      data: componente,
      message: 'Component quantity updated successfully'
    });
  } catch (error) {
    console.error('Error updating component quantity:', error);
    res.status(500).json({ error: 'Error updating component quantity' });
  }
});

/**
 * DELETE /api/productos-compuestos/:id
 * Remove a component from a set
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get component data before deleting
    const { data: componentData } = await require('../supabase-db').supabase
      .from('productos_compuestos')
      .select('id_producto_set')
      .eq('id', id)
      .single();

    if (!componentData) {
      return res.status(404).json({ error: 'Component not found' });
    }

    // Delete component
    await ProductoCompuesto.eliminarComponente(id);

    // Check if this was the last component - if so, unmark set
    const componentesRestantes = await ProductoCompuesto.contarComponentes(componentData.id_producto_set);
    if (componentesRestantes === 0) {
      await Joya.actualizar(componentData.id_producto_set, { es_producto_compuesto: false });
    }

    res.json({
      success: true,
      message: 'Component removed successfully'
    });
  } catch (error) {
    console.error('Error removing component:', error);
    res.status(500).json({ error: 'Error removing component' });
  }
});

module.exports = router;
