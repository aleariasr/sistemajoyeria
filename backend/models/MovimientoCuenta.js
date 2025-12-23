const { supabase } = require('../supabase-db');
const { formatearFechaSQL } = require('../utils/timezone');

class MovimientoCuenta {
  // Crear nuevo movimiento
  static async crear(movimientoData) {
    const { 
      id_cuenta_por_cobrar, 
      id_venta = null, 
      tipo, 
      monto, 
      descripcion, 
      usuario 
    } = movimientoData;

    // Usar fecha de Costa Rica para el registro
    const fechaMovimiento = formatearFechaSQL();

    const { data, error } = await supabase
      .from('movimientos_cuenta')
      .insert([{
        id_cuenta_por_cobrar,
        id_venta,
        tipo,
        monto,
        descripcion: descripcion || null,
        usuario: usuario || null,
        fecha_movimiento: fechaMovimiento
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { id: data.id };
  }

  // Obtener todos los movimientos de una cuenta
  static async obtenerPorCuenta(id_cuenta_por_cobrar) {
    const { data, error } = await supabase
      .from('movimientos_cuenta')
      .select(`
        *,
        ventas!movimientos_cuenta_id_venta_fkey (fecha_venta, total, metodo_pago)
      `)
      .eq('id_cuenta_por_cobrar', id_cuenta_por_cobrar)
      .order('fecha_movimiento', { ascending: false });

    if (error) {
      throw error;
    }

    return data.map(movimiento => ({
      ...movimiento,
      fecha_venta: movimiento.ventas?.fecha_venta,
      total_venta: movimiento.ventas?.total,
      metodo_pago_venta: movimiento.ventas?.metodo_pago
    }));
  }

  // Obtener movimientos con filtros
  static async obtenerTodos(filtros = {}) {
    const { 
      id_cliente, 
      tipo, 
      fecha_desde, 
      fecha_hasta, 
      pagina = 1, 
      por_pagina = 50 
    } = filtros;

    let query = supabase
      .from('movimientos_cuenta')
      .select(`
        *,
        cuentas_por_cobrar!movimientos_cuenta_id_cuenta_por_cobrar_fkey (
          id_cliente,
          clientes!cuentas_por_cobrar_id_cliente_fkey (nombre, cedula)
        )
      `, { count: 'exact' });

    // Filtro por tipo
    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    // Filtro por cliente (requiere join)
    if (id_cliente) {
      query = query.eq('cuentas_por_cobrar.id_cliente', id_cliente);
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

    return {
      movimientos: data,
      total: count || 0,
      pagina: parseInt(pagina),
      por_pagina: parseInt(por_pagina),
      total_paginas: Math.ceil((count || 0) / por_pagina)
    };
  }
}

module.exports = MovimientoCuenta;
