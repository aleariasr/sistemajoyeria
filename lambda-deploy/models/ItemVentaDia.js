const { supabase } = require('../supabase-db');

class ItemVentaDia {
  // Crear nuevo item de venta del día
  static async crear(itemData) {
    const { id_venta_dia, id_joya, cantidad, precio_unitario, subtotal, descripcion_item } = itemData;

    const { data, error } = await supabase
      .from('items_venta_dia')
      .insert([{
        id_venta_dia,
        id_joya: id_joya || null,
        cantidad,
        precio_unitario,
        subtotal,
        descripcion_item: descripcion_item || null
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { id: data.id };
  }

  // Obtener items de una venta del día
  static async obtenerPorVenta(idVentaDia) {
    const { data, error } = await supabase
      .from('items_venta_dia')
      .select(`
        *,
        joyas (codigo, nombre, categoria, moneda)
      `)
      .eq('id_venta_dia', idVentaDia)
      .order('id', { ascending: true });

    if (error) {
      throw error;
    }

    // Formatear para mantener compatibilidad, manejando items sin joya
    return data.map(item => ({
      ...item,
      codigo: item.joyas?.codigo || null,
      nombre: item.joyas?.nombre || item.descripcion_item || 'Otros',
      categoria: item.joyas?.categoria || null,
      moneda: item.joyas?.moneda || 'CRC'
    }));
  }

  // Obtener todos los items del día
  static async obtenerTodos() {
    const { data, error } = await supabase
      .from('items_venta_dia')
      .select('*');

    if (error) {
      throw error;
    }

    return data;
  }
}

module.exports = ItemVentaDia;
