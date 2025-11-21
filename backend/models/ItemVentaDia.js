const { supabase } = require('../supabase-db');

class ItemVentaDia {
  // Crear nuevo item de venta del día
  static async crear(itemData) {
    const { id_venta_dia, id_joya, cantidad, precio_unitario, subtotal } = itemData;

    const { data, error } = await supabase
      .from('items_venta_dia')
      .insert([{
        id_venta_dia,
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

  // Obtener items de una venta del día
  static async obtenerPorVenta(idVentaDia) {
    const { data, error } = await supabase
      .from('items_venta_dia')
      .select(`
        *,
        joyas!items_venta_dia_id_joya_fkey (codigo, nombre, moneda)
      `)
      .eq('id_venta_dia', idVentaDia);

    if (error) {
      throw error;
    }

    // Formatear para mantener compatibilidad
    return data.map(item => ({
      ...item,
      codigo: item.joyas?.codigo,
      nombre: item.joyas?.nombre,
      moneda: item.joyas?.moneda
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
