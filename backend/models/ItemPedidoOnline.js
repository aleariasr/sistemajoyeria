/**
 * Model: ItemPedidoOnline
 * 
 * Handles individual items within online orders
 * Stores product snapshot at time of purchase
 */

const { supabase } = require('../supabase-db');

class ItemPedidoOnline {
  /**
   * Create order items in batch
   * @param {number} idPedido - Order ID
   * @param {Array} items - Array of item objects
   */
  static async crearItems(idPedido, items) {
    const itemsData = items.map(item => ({
      id_pedido: idPedido,
      id_joya: item.id_joya,
      nombre_producto: item.nombre_producto,
      precio_unitario: item.precio_unitario,
      cantidad: item.cantidad,
      subtotal: item.subtotal,
      imagen_url: item.imagen_url || null
    }));

    const { data, error } = await supabase
      .from('items_pedido_online')
      .insert(itemsData)
      .select();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Get all items for a specific order
   * @param {number} idPedido - Order ID
   */
  static async obtenerPorPedido(idPedido) {
    const { data, error } = await supabase
      .from('items_pedido_online')
      .select('*')
      .eq('id_pedido', idPedido)
      .order('id', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Get items with product details joined
   * @param {number} idPedido - Order ID
   */
  static async obtenerConDetalles(idPedido) {
    const { data, error } = await supabase
      .from('items_pedido_online')
      .select(`
        *,
        joyas (
          codigo,
          nombre,
          categoria,
          stock_actual,
          imagen_url
        )
      `)
      .eq('id_pedido', idPedido)
      .order('id', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Delete all items for an order
   * Used when cancelling orders
   * @param {number} idPedido - Order ID
   */
  static async eliminarPorPedido(idPedido) {
    const { error } = await supabase
      .from('items_pedido_online')
      .delete()
      .eq('id_pedido', idPedido);

    if (error) {
      throw error;
    }

    return { success: true };
  }
}

module.exports = ItemPedidoOnline;
