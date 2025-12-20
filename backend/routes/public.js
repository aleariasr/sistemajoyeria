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
const ImagenJoya = require('../models/ImagenJoya');
const VarianteProducto = require('../models/VarianteProducto');
const ProductoCompuesto = require('../models/ProductoCompuesto');

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
 * @param {Object} varianteInfo - Optional variant information
 * @returns {Object} Public product object
 */
function transformToPublicProduct(joya, includeStock = false, varianteInfo = null) {
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
    imagenes: joya.imagenes || [],
    slug: generateProductSlug(joya.codigo, joya.nombre),
    es_producto_variante: joya.es_producto_variante || false,
    es_producto_compuesto: joya.es_producto_compuesto || false
  };

  if (varianteInfo) {
    product.es_variante = true;
    product.variante_id = varianteInfo.id;
    product.variante_nombre = varianteInfo.nombre_variante;
    product.nombre = `${joya.nombre} - ${varianteInfo.nombre_variante}`;
    product.imagen_url = varianteInfo.imagen_url;
    product.descripcion = varianteInfo.descripcion_variante || joya.descripcion;
  }

  if (includeStock) {
    product.stock = joya.stock_actual;
  }

  return product;
}

/**
 * GET /api/public/products
 * Get all active products with optional filtering for storefront display
 * Only returns products with estado='Activo', stock > 0, and mostrar_en_storefront=true
 * Expands products with variants into individual "virtual products"
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
      mostrar_en_storefront: true, // Only show products marked as visible in storefront
      pagina: pagina,
      por_pagina: porPagina
    };

    const resultado = await Joya.obtenerTodas(filtros);
    // Bulk fetch images for all products to avoid N+1 queries
const joyaIds = resultado.joyas.map(j => j.id);
const imagesByJoya = await ImagenJoya.obtenerPorJoyas(joyaIds);

const productosExpandidos = [];

for (const joya of resultado.joyas) {
  const imagenes = imagesByJoya[joya.id] || [];
  joya.imagenes = imagenes.map(img => ({
    id: img.id,
    url: img.imagen_url,
    orden: img.orden_display,
    es_principal: img.es_principal
  }));

  if (joya.es_producto_variante) {
    const variantes = await VarianteProducto.obtenerPorProducto(joya.id, true);
    for (const variante of variantes) {
      productosExpandidos.push(transformToPublicProduct(joya, false, variante));
    }
  } else {
    productosExpandidos.push(transformToPublicProduct(joya));
  }
}
    res.json({
      products: productosExpandidos,
      total: productosExpandidos.length,
      page: resultado.pagina,
      per_page: resultado.por_pagina,
      total_pages: Math.ceil(productosExpandidos.length / resultado.por_pagina)
    });
  } catch (error) {
    console.error('Error fetching public products:', error);
    res.status(500).json({ error: 'Error fetching products' });
  }
});

/**
 * GET /api/public/products/featured
 * Get featured/highlighted products for homepage
 * Returns the 8 most recent active products with stock and visible in storefront
 */
router.get('/products/featured', async (req, res) => {
  try {
    const filtros = {
      estado: 'Activo',
      con_stock: true, // Filter by stock > 0 in database query
      mostrar_en_storefront: true, // Only show products marked as visible in storefront
      pagina: 1,
      por_pagina: 8 // Get exactly 8 products
    };

    const resultado = await Joya.obtenerTodas(filtros);

    // Bulk fetch images for all products to avoid N+1 queries
    const joyaIds = resultado.joyas.map(j => j.id);
    const imagesByJoya = await ImagenJoya.obtenerPorJoyas(joyaIds);

    // Transform data for public consumption
    const productos = resultado.joyas.map((joya) => {
      const imagenes = imagesByJoya[joya.id] || [];
      joya.imagenes = imagenes.map(img => ({
        id: img.id,
        url: img.imagen_url,
        orden: img.orden_display,
        es_principal: img.es_principal
      }));
      return transformToPublicProduct(joya);
    });

    res.json({ products: productos });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ error: 'Error fetching featured products' });
  }
});

/**
 * GET /api/public/products/:id
 * Get a single product by ID for product detail page
 * Only returns if product is active, has stock, and is visible in storefront
 * Includes variant information if available
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

    // Check if product is visible in storefront
    if (!joya.mostrar_en_storefront) {
      return res.status(404).json({ error: 'Product not available' });
    }

    // Get all images for this product
    const imagenes = await ImagenJoya.obtenerPorJoya(joya.id);
    joya.imagenes = imagenes.map(img => ({
      id: img.id,
      url: img.imagen_url,
      orden: img.orden_display,
      es_principal: img.es_principal
    }));

    // Include stock for cart validation
    const producto = transformToPublicProduct(joya, true);

    // If product has variants, include them
    if (joya.es_producto_variante) {
      const variantes = await VarianteProducto.obtenerPorProducto(joya.id, true);
      producto.variantes = variantes.map(v => ({
        id: v.id,
        nombre: v.nombre_variante,
        descripcion: v.descripcion_variante,
        imagen_url: v.imagen_url
      }));
    }

    // If product is a set, include component info
    if (joya.es_producto_compuesto) {
      const stockDisponible = await ProductoCompuesto.calcularStockDisponible(joya.id);
      producto.stock_set = stockDisponible;
      producto.stock = stockDisponible; // Override with calculated set stock
      producto.stock_disponible = stockDisponible > 0;
    }

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
 * GET /api/public/products/:id/componentes
 * Get components for a composite product (set)
 * Returns component details for displaying in product detail page
 */
router.get('/products/:id/componentes', async (req, res) => {
  try {
    const joya = await Joya.obtenerPorId(req.params.id);

    if (!joya || !joya.es_producto_compuesto) {
      return res.status(404).json({ error: 'Composite product not found' });
    }

    // Get components with details
    const componentes = await ProductoCompuesto.obtenerComponentesConDetalles(req.params.id);

    // Calculate set stock
    const stockDisponible = await ProductoCompuesto.calcularStockDisponible(req.params.id);

    // Transform components for public consumption
    const componentesPublicos = componentes.map(comp => ({
      id: comp.producto.id,
      codigo: comp.producto.codigo,
      nombre: comp.producto.nombre,
      precio: comp.producto.precio_venta,
      moneda: comp.producto.moneda,
      stock_disponible: comp.producto.stock_actual > 0,
      stock: comp.producto.stock_actual,
      imagen_url: comp.producto.imagen_url,
      cantidad_requerida: comp.cantidad_requerida
    }));

    res.json({
      componentes: componentesPublicos,
      stock_set: stockDisponible,
      completo: stockDisponible > 0
    });
  } catch (error) {
    console.error('Error fetching product components:', error);
    res.status(500).json({ error: 'Error fetching components' });
  }
});

/**
 * NOTE: Order creation endpoints (POST /orders, GET /orders/:id) have been moved to
 * backend/routes/pedidos-online.js to use the new workflow-based order management system.
 * The new system uses the pedidos_online table with proper state management
 * (Pendiente → Confirmado → Enviado → Entregado) instead of creating sales directly.
 */

module.exports = router;
