const { supabase } = require('../supabase-db');

/**
 * Model: ProductoCompuesto (Composite Product / Set)
 * 
 * Manages product sets composed of multiple individual products.
 * Example: "Trio de Pulseras Oro" set contains 3 different bracelets.
 * 
 * Key features:
 * - Set stock is calculated as MIN(component_stock / required_quantity)
 * - Selling a set decrements stock from all components
 * - Components remain individually sellable
 */
class ProductoCompuesto {
  /**
   * Add a component to a set
   * @param {Object} componenteData - Component data
   * @returns {Promise<Object>} Created relationship
   */
  static async agregarComponente(componenteData) {
    const {
      id_producto_set,
      id_producto_componente,
      cantidad,
      orden_display
    } = componenteData;

    // Validate required fields
    if (!id_producto_set || !id_producto_componente) {
      throw new Error('Missing required fields: id_producto_set, id_producto_componente');
    }

    // Validate cantidad is positive
    if (cantidad && cantidad <= 0) {
      throw new Error('Quantity must be positive');
    }

    // Check for circular references (set cannot reference itself)
    if (id_producto_set === id_producto_componente) {
      throw new Error('A set cannot contain itself');
    }

    // Check if component is already in set
    const existing = await this.obtenerComponente(id_producto_set, id_producto_componente);
    if (existing) {
      throw new Error('Component already exists in this set');
    }

    const { data, error } = await supabase
      .from('productos_compuestos')
      .insert([{
        id_producto_set,
        id_producto_componente,
        cantidad: cantidad || 1,
        orden_display: orden_display || 0
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Get specific component relationship
   * @param {number} idProductoSet - Set product ID
   * @param {number} idProductoComponente - Component product ID
   * @returns {Promise<Object|null>} Component relationship
   */
  static async obtenerComponente(idProductoSet, idProductoComponente) {
    const { data, error } = await supabase
      .from('productos_compuestos')
      .select('*')
      .eq('id_producto_set', idProductoSet)
      .eq('id_producto_componente', idProductoComponente)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  /**
   * Get component relationship by ID
   * @param {number} id - Component relationship ID
   * @returns {Promise<Object|null>} Component relationship
   */
  static async obtenerPorId(id) {
    const { data, error } = await supabase
      .from('productos_compuestos')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  /**
   * Get all components for a set with full product details
   * @param {number} idProductoSet - Set product ID
   * @returns {Promise<Array>} List of components with product details
   */
  static async obtenerComponentesConDetalles(idProductoSet) {
    const { data, error } = await supabase
      .from('productos_compuestos')
      .select(`
        id,
        cantidad,
        orden_display,
        joyas:id_producto_componente (
          id,
          codigo,
          nombre,
          descripcion,
          categoria,
          precio_venta,
          moneda,
          stock_actual,
          imagen_url,
          estado
        )
      `)
      .eq('id_producto_set', idProductoSet)
      .order('orden_display', { ascending: true })
      .order('id', { ascending: true });

    if (error) {
      throw error;
    }

    // Transform response to flatten structure
    return (data || []).map(item => ({
      id: item.id,
      cantidad_requerida: item.cantidad,
      orden_display: item.orden_display,
      producto: item.joyas
    }));
  }

  /**
   * Calculate available stock for a set
   * Stock = MIN(component_stock / required_quantity) for all components
   * @param {number} idProductoSet - Set product ID
   * @returns {Promise<number>} Available set stock
   */
  static async calcularStockDisponible(idProductoSet) {
    const componentes = await this.obtenerComponentesConDetalles(idProductoSet);

    if (componentes.length === 0) {
      return 0;
    }

    // Calculate stock for each component
    const stocksPorComponente = componentes.map(comp => {
      if (!comp.producto || comp.producto.estado !== 'Activo') {
        return 0;
      }
      return Math.floor(comp.producto.stock_actual / comp.cantidad_requerida);
    });

    // Return minimum stock (bottleneck)
    return Math.min(...stocksPorComponente);
  }

  /**
   * Validate if set has enough stock for sale
   * @param {number} idProductoSet - Set product ID
   * @param {number} cantidadSolicitada - Requested quantity
   * @returns {Promise<boolean>} True if stock is sufficient
   */
  static async validarStockDisponible(idProductoSet, cantidadSolicitada = 1) {
    const stockDisponible = await this.calcularStockDisponible(idProductoSet);
    return stockDisponible >= cantidadSolicitada;
  }

  /**
   * Update component quantity
   * @param {number} id - Component relationship ID
   * @param {number} cantidad - New quantity
   * @returns {Promise<Object>} Updated component
   */
  static async actualizarCantidad(id, cantidad) {
    if (cantidad <= 0) {
      throw new Error('Quantity must be positive');
    }

    const { data, error } = await supabase
      .from('productos_compuestos')
      .update({ cantidad })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Remove a component from a set
   * @param {number} id - Component relationship ID
   * @returns {Promise<Object>} Deletion result
   */
  static async eliminarComponente(id) {
    const { data, error } = await supabase
      .from('productos_compuestos')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    return { changes: data.length };
  }

  /**
   * Count components in a set
   * @param {number} idProductoSet - Set product ID
   * @returns {Promise<number>} Count
   */
  static async contarComponentes(idProductoSet) {
    const { count, error } = await supabase
      .from('productos_compuestos')
      .select('id', { count: 'exact', head: true })
      .eq('id_producto_set', idProductoSet);

    if (error) {
      throw error;
    }

    return count || 0;
  }

  /**
   * Check if product is used as component in any set
   * @param {number} idProducto - Product ID
   * @returns {Promise<Array>} List of sets using this product
   */
  static async obtenerSetsQueContienenProducto(idProducto) {
    const { data, error } = await supabase
      .from('productos_compuestos')
      .select(`
        id_producto_set,
        cantidad,
        joyas:id_producto_set (
          id,
          codigo,
          nombre
        )
      `)
      .eq('id_producto_componente', idProducto);

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Validate component limit (max 20 per set)
   * @param {number} idProductoSet - Set product ID
   * @returns {Promise<boolean>} True if under limit
   */
  static async validarLimiteComponentes(idProductoSet) {
    const count = await this.contarComponentes(idProductoSet);
    return count < 20;
  }

  /**
   * Check for circular references in set composition
   * Prevents Set A -> Set B -> Set A scenarios
   * @param {number} idProductoSet - Set product ID
   * @param {number} idNuevoComponente - New component to add
   * @returns {Promise<boolean>} True if no circular reference
   */
  static async validarNoCircular(idProductoSet, idNuevoComponente) {
    // If the new component is not a set, no circular reference possible
    const { data: componenteData } = await supabase
      .from('joyas')
      .select('es_producto_compuesto')
      .eq('id', idNuevoComponente)
      .single();

    if (!componenteData || !componenteData.es_producto_compuesto) {
      return true;
    }

    // Check if the new component contains the current set
    const componentesDelNuevoComponente = await this.obtenerComponentesConDetalles(idNuevoComponente);
    
    for (const comp of componentesDelNuevoComponente) {
      if (comp.producto.id === idProductoSet) {
        return false; // Circular reference found
      }
    }

    return true;
  }
}

module.exports = ProductoCompuesto;
