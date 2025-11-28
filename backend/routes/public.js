/**
 * Public API Routes for Storefront
 * 
 * These routes are accessible WITHOUT authentication, designed for the 
 * public-facing e-commerce storefront. They expose read-only product data
 * and allow order creation from anonymous customers.
 * 
 * Security: No authentication required, but rate limiting should be considered
 * for production deployments.
 */

const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const Joya = require('../models/Joya');
const Venta = require('../models/Venta');
const ItemVenta = require('../models/ItemVenta');
const Cliente = require('../models/Cliente');
const MovimientoInventario = require('../models/MovimientoInventario');

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
 * Generate a unique identifier for web orders (for cedula field)
 * Uses cryptographically secure random bytes for uniqueness
 * @returns {string} Unique web order identifier
 */
function generateWebOrderId() {
  const randomPart = crypto.randomBytes(4).toString('hex');
  return `WEB-${Date.now()}-${randomPart}`;
}

/**
 * GET /api/public/products
 * Get all active products with optional filtering for storefront display
 * Only returns products with estado='Activo' and stock > 0
 */
router.get('/products', async (req, res) => {
  try {
    const filtros = {
      busqueda: req.query.busqueda || req.query.search,
      categoria: req.query.categoria || req.query.category,
      precio_min: req.query.precio_min || req.query.price_min,
      precio_max: req.query.precio_max || req.query.price_max,
      // Only show active products with stock for public storefront
      estado: 'Activo',
      pagina: req.query.pagina || req.query.page || 1,
      por_pagina: req.query.por_pagina || req.query.per_page || 20
    };

    const resultado = await Joya.obtenerTodas(filtros);

    // Filter to only show products with stock > 0 for public storefront
    const productosDisponibles = resultado.joyas.filter(j => j.stock_actual > 0);

    // Transform data for public consumption (hide sensitive fields)
    const productos = productosDisponibles.map(joya => transformToPublicProduct(joya));

    res.json({
      products: productos,
      total: productos.length,
      page: parseInt(filtros.pagina),
      per_page: parseInt(filtros.por_pagina),
      total_pages: Math.ceil(productos.length / parseInt(filtros.por_pagina))
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
      pagina: 1,
      por_pagina: 8
    };

    const resultado = await Joya.obtenerTodas(filtros);

    // Filter to only show products with stock
    const productosDisponibles = resultado.joyas.filter(j => j.stock_actual > 0);

    const productos = productosDisponibles.slice(0, 8).map(joya => transformToPublicProduct(joya));

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
 */
router.get('/categories', async (req, res) => {
  try {
    const categorias = await Joya.obtenerCategorias();
    res.json({ categories: categorias });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Error fetching categories' });
  }
});

/**
 * POST /api/public/orders
 * Create a new order from the storefront
 * Creates or finds customer, then creates the sale
 */
router.post('/orders', async (req, res) => {
  try {
    const { 
      customer, 
      items, 
      payment_method, 
      notes 
    } = req.body;

    // Validate required fields
    if (!customer || !customer.nombre || !customer.telefono || !customer.email) {
      return res.status(400).json({ 
        error: 'Customer name, phone and email are required' 
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must have at least one item' });
    }

    // Sanitize customer input to prevent XSS and injection
    const sanitizeString = (str) => {
      if (typeof str !== 'string') return '';
      // Escape HTML special characters and limit length
      return str
        .trim()
        .substring(0, 500)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    };

    const sanitizedCustomer = {
      nombre: sanitizeString(customer.nombre),
      telefono: sanitizeString(customer.telefono),
      email: sanitizeString(customer.email),
      cedula: customer.cedula ? sanitizeString(customer.cedula) : null,
      direccion: customer.direccion ? sanitizeString(customer.direccion) : ''
    };

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedCustomer.email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate phone format - only allow digits, plus, and parentheses
    const phoneRegex = /^[0-9+()]{6,20}$/;
    // First remove spaces and hyphens from phone to normalize, then validate
    const normalizedPhone = customer.telefono.replace(/[\s-]/g, '');
    if (!phoneRegex.test(normalizedPhone)) {
      return res.status(400).json({ error: 'Invalid phone format' });
    }
    // Update sanitized phone with normalized version
    sanitizedCustomer.telefono = normalizedPhone;

    // Validate items array
    if (!Array.isArray(items) || items.length > 100) {
      return res.status(400).json({ error: 'Invalid items array' });
    }

    // Validate and check stock for all items
    let subtotal = 0;
    const itemsValidados = [];

    for (const item of items) {
      const joya = await Joya.obtenerPorId(item.product_id);

      if (!joya) {
        return res.status(404).json({ 
          error: `Product with ID ${item.product_id} not found` 
        });
      }

      if (joya.estado !== 'Activo') {
        return res.status(400).json({ 
          error: `Product "${joya.nombre}" is not available` 
        });
      }

      if (joya.stock_actual < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for "${joya.nombre}". Available: ${joya.stock_actual}` 
        });
      }

      const itemSubtotal = joya.precio_venta * item.quantity;
      subtotal += itemSubtotal;

      itemsValidados.push({
        id_joya: joya.id,
        cantidad: item.quantity,
        precio_unitario: joya.precio_venta,
        subtotal: itemSubtotal,
        joya: joya // Keep reference for stock update
      });
    }

    // Try to find existing customer by email or create new one
    let cliente = null;
    try {
      // First try to find by cedula if provided
      const clienteData = {
        nombre: sanitizedCustomer.nombre,
        telefono: sanitizedCustomer.telefono,
        cedula: sanitizedCustomer.cedula || generateWebOrderId(), // Generate unique cedula for web orders
        direccion: sanitizedCustomer.direccion,
        email: sanitizedCustomer.email,
        notas: 'Cliente desde tienda web'
      };

      // Check if customer with this cedula exists
      if (sanitizedCustomer.cedula) {
        cliente = await Cliente.obtenerPorCedula(sanitizedCustomer.cedula);
      }

      if (!cliente) {
        const resultado = await Cliente.crear(clienteData);
        // Use the id from the create result instead of making a second query
        cliente = { id: resultado.id, ...clienteData };
      }
    } catch (clienteError) {
      console.error('Error creating customer:', clienteError);
      // Continue without customer if creation fails
    }

    // Create the sale
    const ventaData = {
      id_usuario: null, // No user for public orders
      metodo_pago: payment_method || 'Pendiente', // Payment pending for web orders
      subtotal: subtotal,
      descuento: 0,
      total: subtotal,
      efectivo_recibido: null,
      cambio: null,
      notas: notes || 'Pedido desde tienda web',
      tipo_venta: 'Contado',
      id_cliente: cliente ? cliente.id : null,
      monto_efectivo: 0,
      monto_tarjeta: 0,
      monto_transferencia: 0
    };

    const resultadoVenta = await Venta.crear(ventaData);
    const idVenta = resultadoVenta.id;

    // Create sale items and update stock
    for (const item of itemsValidados) {
      await ItemVenta.crear({
        id_venta: idVenta,
        id_joya: item.id_joya,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal
      });

      // Update stock
      const nuevoStock = item.joya.stock_actual - item.cantidad;
      await Joya.actualizarStock(item.id_joya, nuevoStock);

      // Record inventory movement
      await MovimientoInventario.crear({
        id_joya: item.id_joya,
        tipo_movimiento: 'Salida',
        cantidad: item.cantidad,
        motivo: `Venta web #${idVenta}`,
        usuario: 'Sistema Web',
        stock_antes: item.joya.stock_actual,
        stock_despues: nuevoStock
      });
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: idVenta,
        total: subtotal,
        items_count: items.length,
        customer_name: sanitizedCustomer.nombre
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Error creating order' });
  }
});

/**
 * GET /api/public/orders/:id
 * Get order details for confirmation page
 */
router.get('/orders/:id', async (req, res) => {
  try {
    const venta = await Venta.obtenerPorId(req.params.id);

    if (!venta) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const items = await ItemVenta.obtenerPorVenta(req.params.id);

    // Get product details for each item
    const itemsWithDetails = await Promise.all(
      items.map(async (item) => {
        const joya = await Joya.obtenerPorId(item.id_joya);
        return {
          id: item.id,
          product_name: joya ? joya.nombre : 'Producto no disponible',
          product_image: joya ? joya.imagen_url : null,
          quantity: item.cantidad,
          unit_price: item.precio_unitario,
          subtotal: item.subtotal
        };
      })
    );

    res.json({
      id: venta.id,
      date: venta.fecha_venta,
      total: venta.total,
      subtotal: venta.subtotal,
      discount: venta.descuento,
      payment_method: venta.metodo_pago,
      notes: venta.notas,
      items: itemsWithDetails
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Error fetching order' });
  }
});

module.exports = router;
