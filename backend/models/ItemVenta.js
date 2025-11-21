const { supabase } = require('../supabase-db');

class ItemVenta {
  // Crear nuevo item de venta
  static async crear(itemData) {
    const {
      id_venta, id_joya, cantidad, precio_unitario, subtotal
    } = itemData;

    const { data, error } = await supabase
      .from('items_venta')
      .insert([{
        id_venta,
        id_joya,
        cantidad,
        precio_unitario,
        subtotal
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { id: data.id };
  }

  // Obtener items de una venta
  static async obtenerPorVenta(id_venta) {
    const { data, error } = await supabase
      .from('items_venta')
      .select(`
        *,
        joyas!items_venta_id_joya_fkey (codigo, nombre, categoria)
      `)
      .eq('id_venta', id_venta)
      .order('id', { ascending: true });

    if (error) {
      throw error;
    }

    // Formatear datos para mantener compatibilidad
    return data.map(item => ({
      ...item,
      codigo: item.joyas?.codigo,
      nombre: item.joyas?.nombre,
      categoria: item.joyas?.categoria
    }));
  }

  // Crear múltiples items de venta en una transacción
  static async crearMultiples(items) {
    const itemsToInsert = items.map(item => ({
      id_venta: item.id_venta,
      id_joya: item.id_joya,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      subtotal: item.subtotal
    }));

    const { data, error } = await supabase
      .from('items_venta')
      .insert(itemsToInsert)
      .select();

    if (error) {
      throw error;
    }

    return { count: data.length };
  }
}

module.exports = ItemVenta;
