const { supabase } = require('../supabase-db');
const { formatearFechaSQL } = require('../utils/timezone');

class MovimientoInventario {
  // Crear nuevo movimiento
  static async crear(movimientoData) {
    const {
      id_joya, tipo_movimiento, cantidad, motivo,
      usuario, stock_antes, stock_despues
    } = movimientoData;

    // Usar fecha de Costa Rica para el registro
    const fechaMovimiento = formatearFechaSQL();

    const { data, error } = await supabase
      .from('movimientos_inventario')
      .insert([{
        id_joya,
        tipo_movimiento,
        cantidad,
        motivo,
        usuario: usuario || 'Sistema',
        stock_antes,
        stock_despues,
        fecha_movimiento: fechaMovimiento
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { id: data.id };
  }

  // Obtener todos los movimientos con filtros
  static async obtenerTodos(filtros = {}) {
    const {
      id_joya, tipo_movimiento, fecha_desde, fecha_hasta,
      pagina = 1, por_pagina = 50
    } = filtros;

    let query = supabase
      .from('movimientos_inventario')
      .select(`
        *,
        joyas!movimientos_inventario_id_joya_fkey (codigo, nombre)
      `, { count: 'exact' });

    // Filtro por joya
    if (id_joya) {
      query = query.eq('id_joya', id_joya);
    }

    // Filtro por tipo de movimiento
    if (tipo_movimiento) {
      query = query.eq('tipo_movimiento', tipo_movimiento);
    }

    // Filtro por fecha desde
    if (fecha_desde) {
      query = query.gte('fecha_movimiento', fecha_desde);
    }

    // Filtro por fecha hasta
    if (fecha_hasta) {
      query = query.lte('fecha_movimiento', fecha_hasta);
    }

    // Ordenar y paginar
    const offset = (pagina - 1) * por_pagina;
    query = query.order('fecha_movimiento', { ascending: false })
                 .range(offset, offset + por_pagina - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // Formatear datos para mantener compatibilidad
    const movimientos = data.map(mov => ({
      ...mov,
      codigo: mov.joyas?.codigo,
      nombre: mov.joyas?.nombre
    }));

    return {
      movimientos,
      total: count,
      pagina: parseInt(pagina),
      por_pagina: parseInt(por_pagina),
      total_paginas: Math.ceil(count / por_pagina)
    };
  }

  // Obtener movimientos de una joya específica
  static async obtenerPorJoya(id_joya, limite = 10) {
    const { data, error } = await supabase
      .from('movimientos_inventario')
      .select('*')
      .eq('id_joya', id_joya)
      .order('fecha_movimiento', { ascending: false })
      .limit(limite);

    if (error) {
      throw error;
    }

    return data;
  }
}

module.exports = MovimientoInventario;
