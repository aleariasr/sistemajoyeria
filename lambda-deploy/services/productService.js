/**
 * Service: Product Service
 * 
 * Handles business logic for product operations, especially
 * for composite products (sets) that require special stock handling.
 */

const Joya = require('../models/Joya');
const ProductoCompuesto = require('../models/ProductoCompuesto');
const MovimientoInventario = require('../models/MovimientoInventario');

/**
 * Validate and prepare sale item, handling both regular and composite products
 * @param {Object} item - Sale item
 * @param {string} username - Username for inventory movements
 * @returns {Promise<Object>} Validated item with joya data
 */
async function validarYPrepararItem(item, username) {
  // Handle "Otros" items (no joya)
  if (!item.id_joya) {
    return {
      ...item,
      joya: null,
      descripcion_item: item.nombre || item.descripcion_item || 'Otros',
      es_set: false
    };
  }

  const joya = await Joya.obtenerPorId(item.id_joya);
  
  if (!joya) {
    throw new Error(`Producto con ID ${item.id_joya} no encontrado`);
  }

  // Check if product is a composite set
  if (joya.es_producto_compuesto) {
    // Validate set stock
    const stockDisponible = await ProductoCompuesto.calcularStockDisponible(item.id_joya);
    
    if (stockDisponible < item.cantidad) {
      throw new Error(`stock insuficiente para set "${joya.nombre}". Disponible: ${stockDisponible}`);
    }

    // Get components for later stock deduction
    const componentes = await ProductoCompuesto.obtenerComponentesConDetalles(item.id_joya);
    
    return {
      ...item,
      joya,
      es_set: true,
      componentes
    };
  } else {
    // Regular product
    if (joya.stock_actual < item.cantidad) {
      throw new Error(`stock insuficiente para "${joya.nombre}". Disponible: ${joya.stock_actual}`);
    }

    return {
      ...item,
      joya,
      es_set: false
    };
  }
}

/**
 * Update stock for a sale item (handles both regular and composite products)
 * @param {Object} itemConJoya - Item with joya data
 * @param {string} motivo - Reason for inventory movement
 * @param {string} username - Username for inventory movements
 * @returns {Promise<void>}
 */
async function actualizarStockVenta(itemConJoya, motivo, username) {
  const { joya, cantidad, es_set, componentes } = itemConJoya;

  if (!joya) {
    // No joya (Otros item), skip stock update
    return;
  }

  if (es_set) {
    // Update stock for each component in the set
    for (const comp of componentes) {
      const cantidadADescontar = comp.cantidad_requerida * cantidad;
      const producto = comp.producto;
      
      if (!producto) continue;

      const nuevoStock = producto.stock_actual - cantidadADescontar;
      
      // Update stock
      await Joya.actualizarStock(producto.id, nuevoStock);

      // Register inventory movement
      await MovimientoInventario.crear({
        id_joya: producto.id,
        tipo_movimiento: 'Salida',
        cantidad: cantidadADescontar,
        motivo: `${motivo} (Set: ${joya.nombre})`,
        usuario: username,
        stock_antes: producto.stock_actual,
        stock_despues: nuevoStock
      });
    }
  } else {
    // Regular product - update stock
    const nuevoStock = joya.stock_actual - cantidad;
    
    await Joya.actualizarStock(joya.id, nuevoStock);

    // Register inventory movement
    await MovimientoInventario.crear({
      id_joya: joya.id,
      tipo_movimiento: 'Salida',
      cantidad: cantidad,
      motivo: motivo,
      usuario: username,
      stock_antes: joya.stock_actual,
      stock_despues: nuevoStock
    });
  }
}

/**
 * Validate stock for online order (public orders from storefront)
 * @param {Object} item - Order item
 * @returns {Promise<Object>} Validated item
 */
async function validarStockPedidoOnline(item) {
  if (!item.product_id) {
    throw new Error('product_id es requerido');
  }

  const joya = await Joya.obtenerPorId(item.product_id);
  
  if (!joya) {
    throw new Error(`Producto con ID ${item.product_id} no encontrado`);
  }

  if (joya.estado !== 'Activo') {
    throw new Error(`El producto "${joya.nombre}" no está disponible`);
  }

  // Check if product is a composite set
  if (joya.es_producto_compuesto) {
    const stockDisponible = await ProductoCompuesto.calcularStockDisponible(item.product_id);
    
    if (stockDisponible < item.quantity) {
      throw new Error(`stock insuficiente para set "${joya.nombre}". Disponible: ${stockDisponible}`);
    }
  } else {
    // Regular product
    if (joya.stock_actual < item.quantity) {
      throw new Error(`stock insuficiente para "${joya.nombre}". Disponible: ${joya.stock_actual}`);
    }
  }

  return joya;
}

module.exports = {
  validarYPrepararItem,
  actualizarStockVenta,
  validarStockPedidoOnline
};
