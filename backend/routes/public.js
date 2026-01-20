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
const { ensureProductHasValidImages } = require('../utils/imageValidation');

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
  let product;
  
  // CRITICAL FIX: For variants, build product ONLY from variant data + parent basics
  // This prevents object mutation issues where all variants share the same imagenes array
  if (varianteInfo) {
    // Build product structure directly from variant data to avoid shared references
    product = {
      id: joya.id,
      codigo: joya.codigo,
      nombre: varianteInfo.nombre_variante,  // ONLY variant name
      descripcion: varianteInfo.descripcion_variante || joya.descripcion,
      categoria: joya.categoria,
      precio: joya.precio_venta,
      moneda: joya.moneda,
      stock_disponible: joya.stock_actual > 0,
      imagen_url: varianteInfo.imagen_url,  // ONLY variant image
      // Create NEW array with ONLY variant image, NOT parent's images
      // This prevents mutation of shared parent imagenes array
      imagenes: [{
        id: 0,
        url: varianteInfo.imagen_url,
        orden: 0,
        es_principal: true
      }],
      slug: generateProductSlug(joya.codigo, varianteInfo.nombre_variante),
      es_producto_compuesto: false,  // Variants cannot be sets
      variante_id: varianteInfo.id,  // Keep for cart tracking
      _uniqueKey: `${joya.id}-${varianteInfo.id}`  // Unique identifier
    };
  } else {
    // For non-variants, use parent data normally
    product = {
      id: joya.id,
      codigo: joya.codigo,
      nombre: joya.nombre,
      descripcion: joya.descripcion,
      categoria: joya.categoria,
      precio: joya.precio_venta,
      moneda: joya.moneda,
      stock_disponible: joya.stock_actual > 0,
      imagen_url: joya.imagen_url,
      // Deep clone imagenes array to prevent mutation
      // Use JSON parse/stringify for complete deep clone
      imagenes: joya.imagenes ? JSON.parse(JSON.stringify(joya.imagenes)) : [],
      slug: generateProductSlug(joya.codigo, joya.nombre),
      es_producto_compuesto: joya.es_producto_compuesto || false,
      _uniqueKey: `${joya.id}`
    };
  }

  if (includeStock) {
    product.stock = joya.stock_actual;
  }

  // Validar y limpiar imágenes para asegurar consistencia
  product = ensureProductHasValidImages(product);

  // CRITICAL: DO NOT include variants array in the response
  // Each variant is treated as an individual product
  // Remove any internal flags that shouldn't be exposed to the client
  delete product.es_producto_variante;
  delete product.es_variante;
  delete product.variantes;

  return product;
}

/**
 * Fisher-Yates Shuffle Algorithm
 * Efficiently randomizes an array in-place
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
  const shuffled = [...array]; // Create a copy to avoid mutating the original
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * GET /api/public/products
 * Get all active products with optional filtering for storefront display
 * Only returns products with estado='Activo', stock > 0, and mostrar_en_storefront=true
 * Expands products with variants into individual "virtual products"
 * 
 * Query Parameters:
 * - shuffle: boolean - If 'true', randomizes products before pagination for global shuffle
 */
router.get('/products', async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina || req.query.page || 1);
    const porPagina = parseInt(req.query.por_pagina || req.query.per_page || 50);
    const shouldShuffle = req.query.shuffle === 'true';
    
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
      por_pagina: porPagina,
      shuffle: shouldShuffle // Pass shuffle flag to model
    };

    const resultado = await Joya.obtenerTodas(filtros);
    
    console.log(`📦 [Página ${pagina}] Productos de DB: ${resultado.joyas.length}`);
    
    // CRITICAL: Deduplicate products by ID in case database query returns duplicates
    const joyasUnicas = Array.from(
      new Map(resultado.joyas.map(j => [j.id, j])).values()
    );
    
    console.log(`📦 [Página ${pagina}] Únicos: ${joyasUnicas.length}`);
    
    // Bulk fetch images for all products to avoid N+1 queries
    const joyaIds = joyasUnicas.map(j => j.id);
    const imagesByJoya = await ImagenJoya.obtenerPorJoyas(joyaIds);

    // Bulk fetch variants for products marked as es_producto_variante to avoid N+1 queries
    const joyasConVariantes = joyasUnicas.filter(j => j.es_producto_variante);
    let variantesByProducto = {};

    if (joyasConVariantes.length > 0) {
      console.log(`📦 [Página ${pagina}] Productos con variantes: ${joyasConVariantes.length}`);
      const variantesIds = joyasConVariantes.map(j => j.id);
      
      // Fetch all variants for all parent products in a single database query
      variantesByProducto = await VarianteProducto.obtenerPorProductos(variantesIds, true);
      
      // Log variant counts for debugging
      Object.keys(variantesByProducto).forEach(joyaId => {
        const variantes = variantesByProducto[joyaId];
        console.log(`📦 [Página ${pagina}] Producto ${joyaId}: ${variantes.length} variantes`);
      });
    }

    const productosExpandidos = [];
    const procesadosIds = new Set(); // Track processed parent products to avoid duplicates

    for (const joya of joyasUnicas) {
      // Skip if this product was already processed
      if (procesadosIds.has(joya.id)) {
        console.warn(`⚠️  Producto duplicado detectado: ${joya.id} - ${joya.codigo}. Saltando...`);
        continue;
      }
      procesadosIds.add(joya.id);

      const imagenes = imagesByJoya[joya.id] || [];
      
      // Don't mutate joya directly - create new object for images
      const joyaConImagenes = {
        ...joya,
        imagenes: imagenes.map(img => ({
          id: img.id,
          url: img.imagen_url,
          orden: img.orden_display,
          es_principal: img.es_principal
        }))
      };

      if (joyaConImagenes.es_producto_variante) {
        const variantes = variantesByProducto[joyaConImagenes.id] || [];
        
        if (variantes.length === 0) {
          console.warn(`⚠️  [Página ${pagina}] Producto ${joyaConImagenes.codigo} sin variantes activas`);
          continue; // Don't show parent if it has no active variants
        }
        
        console.log(`📦 [Página ${pagina}] Expandiendo ${joyaConImagenes.codigo}: ${variantes.length} variantes`);
        
        // CRITICAL: Each variant creates its own independent product object
        // The transformToPublicProduct function now builds variant products
        // directly from variant data to prevent object mutation issues
        for (const variante of variantes) {
          productosExpandidos.push(transformToPublicProduct(joyaConImagenes, false, variante));
        }
      } else {
        productosExpandidos.push(transformToPublicProduct(joyaConImagenes));
      }
    }
    
    console.log(`📦 [Página ${pagina}] Productos únicos después de deduplicación: ${procesadosIds.size}`);
    console.log(`📦 [Página ${pagina}] Productos expandidos: ${productosExpandidos.length}`);
    res.json({
      products: productosExpandidos,
      total: resultado.total, // Total products in database matching filters
      total_products: productosExpandidos.length, // Products returned in this page (after variant expansion)
      page: resultado.pagina,
      per_page: resultado.por_pagina,
      total_pages: resultado.total_paginas, // Total pages based on database count
      has_more: resultado.pagina < resultado.total_paginas // Indicates if there are more pages
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
 * 
 * Query Parameters:
 * - variante_id: If provided, returns only that specific variant as a standalone product
 * 
 * IMPORTANT: Each variant is treated as an independent product in the storefront.
 * The client should NOT see a selector of variants - each variant appears separately in the catalog.
 */
router.get('/products/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const varianteId = req.query.variante_id ? parseInt(req.query.variante_id) : null;
    
    // Validate productId is a positive integer
    if (isNaN(productId) || productId <= 0) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    
    // Validate varianteId if provided
    if (req.query.variante_id && (isNaN(varianteId) || varianteId <= 0)) {
      return res.status(400).json({ error: 'Invalid variant ID' });
    }
    
    const joya = await Joya.obtenerPorId(productId);

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

    // CRITICAL: If a variante_id is provided in query, return ONLY that variant as individual product
    // Do NOT include other variants in the response
    if (varianteId && joya.es_producto_variante) {
      const variante = await VarianteProducto.obtenerPorId(varianteId);
      
      if (!variante || variante.id_producto_padre !== joya.id || !variante.activo) {
        return res.status(404).json({ error: 'Variant not found or inactive' });
      }
      
      // Return this specific variant as a standalone product
      // NO incluir lista de variantes hermanas
      const producto = transformToPublicProduct(joya, true, variante);
      return res.json(producto);
    }

    // Si el producto tiene variantes pero NO se especificó variante_id,
    // devolver la primera variante activa como default
    if (joya.es_producto_variante) {
      const variantes = await VarianteProducto.obtenerPorProducto(joya.id, true);
      
      if (variantes.length === 0) {
        return res.status(404).json({ error: 'Product has no active variants' });
      }
      
      // Devolver solo la primera variante como producto individual
      const producto = transformToPublicProduct(joya, true, variantes[0]);
      return res.json(producto);
    }

    // Include stock for cart validation
    const producto = transformToPublicProduct(joya, true);

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
      descripcion: comp.producto.descripcion,
      precio: comp.producto.precio_venta,
      moneda: comp.producto.moneda,
      stock_disponible: comp.producto.stock_actual > 0 && comp.producto.estado === 'Activo',
      stock: comp.producto.stock_actual,
      imagen_url: comp.producto.imagen_url,
      cantidad_requerida: comp.cantidad_requerida,
      estado: comp.producto.estado,
      es_activo: comp.producto.estado === 'Activo'
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
