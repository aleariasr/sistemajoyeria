/**
 * Public API Routes for Storefront
 * 
 * These routes are accessible WITHOUT authentication, designed for the 
 * public-facing e-commerce storefront. They expose read-only product data.
 * 
 * Order creation has been moved to backend/routes/pedidos-online.js to use
 * the new workflow-based order management system with email notifications.
 * 
 * Security: No authentication required, but rate limiting should be considered
 * for production deployments.
 */

const express = require('express');
const router = express.Router();
const Joya = require('../models/Joya');

/**
 * Generate a URL-friendly slug from product code and name
 * @param {string} codigo - Product code
 * @param {string} nombre - Product name
 * @returns {string} URL-safe slug
 */
function generateProductSlug(codigo, nombre) {
  return `${codigo.toLowerCase()}-${nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
}

/**
 * Transform a joya (jewelry item) to a public product format
 * Hides sensitive fields like cost and exact stock numbers
 * @param {Object} joya - Raw joya object from database
 * @param {boolean} includeStock - Whether to include exact stock count
 * @returns {Object} Public product object
 */
function transformToPublicProduct(joya, includeStock = false) {
  const product = {
    id: joya.id,
    codigo: joya.codigo,
    nombre: joya.nombre,
    descripcion: joya.descripcion,
    categoria: joya.categoria,
    precio: joya.precio_venta,
    moneda: joya.moneda,
    stock_disponible: joya.stock_actual > 0,
    imagen_url: joya.imagen_url,
    slug: generateProductSlug(joya.codigo, joya.nombre)
  };
  
  // Include exact stock count only for product detail view
  if (includeStock) {
    product.stock = joya.stock_actual;
  }
  
  return product;
}

/**
 * GET /api/public/products
 * Get all active products with optional filtering for storefront display
 * Only returns products with estado='Activo' and stock > 0
 */
router.get('/products', async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina || req.query.page || 1);
    const porPagina = parseInt(req.query.por_pagina || req.query.per_page || 50);
    
    const filtros = {
      busqueda: req.query.busqueda || req.query.search,
      categoria: req.query.categoria || req.query.category,
      precio_min: req.query.precio_min || req.query.price_min,
      precio_max: req.query.precio_max || req.query.price_max,
      // Only show active products with stock for public storefront
      estado: 'Activo',
      con_stock: true, // Filter by stock > 0 in database query
      pagina: pagina,
      por_pagina: porPagina
    };

    const resultado = await Joya.obtenerTodas(filtros);

    // Transform data for public consumption (hide sensitive fields)
    const productos = resultado.joyas.map(joya => transformToPublicProduct(joya));

    res.json({
      products: productos,
      total: resultado.total,
      page: resultado.pagina,
      per_page: resultado.por_pagina,
      total_pages: resultado.total_paginas
    });
  } catch (error) {
    console.error('Error fetching public products:', error);
    res.status(500).json({ error: 'Error fetching products' });
  }
});

/**
 * GET /api/public/products/featured
 * Get featured/highlighted products for homepage
 * Returns the 8 most recent active products with stock
 */
router.get('/products/featured', async (req, res) => {
  try {
    const filtros = {
      estado: 'Activo',
      con_stock: true, // Filter by stock > 0 in database query
      pagina: 1,
      por_pagina: 8 // Get exactly 8 products
    };

    const resultado = await Joya.obtenerTodas(filtros);

    // Transform data for public consumption
    const productos = resultado.joyas.map(joya => transformToPublicProduct(joya));

    res.json({ products: productos });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ error: 'Error fetching featured products' });
  }
});

/**
 * GET /api/public/products/:id
 * Get a single product by ID for product detail page
 */
router.get('/products/:id', async (req, res) => {
  try {
    const joya = await Joya.obtenerPorId(req.params.id);

    if (!joya) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Only show active products with stock
    if (joya.estado !== 'Activo') {
      return res.status(404).json({ error: 'Product not available' });
    }

    // Include stock for cart validation
    const producto = transformToPublicProduct(joya, true);

    res.json(producto);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Error fetching product' });
  }
});

/**
 * GET /api/public/categories
 * Get all product categories for filtering
 * Only returns categories from active products with stock
 */
router.get('/categories', async (req, res) => {
  try {
    // Use efficient database query to get categories from available products
    const categorias = await Joya.obtenerCategoriasDisponibles();
    res.json({ categories: categorias });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Error fetching categories' });
  }
});

/**
 * NOTE: Order creation endpoints (POST /orders, GET /orders/:id) have been moved to
 * backend/routes/pedidos-online.js to use the new workflow-based order management system.
 * The new system uses the pedidos_online table with proper state management
 * (Pendiente → Confirmado → Enviado → Entregado) instead of creating sales directly.
 */

module.exports = router;
