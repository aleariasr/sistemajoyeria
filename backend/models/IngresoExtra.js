const { supabase } = require('../supabase-db');
const { formatearFechaSQL } = require('../utils/timezone');

class IngresoExtra {
  // Crear nuevo ingreso extra
  static async crear(ingresoData) {
    const {
      tipo, monto, metodo_pago, descripcion,
      id_usuario, usuario, notas
    } = ingresoData;

    const fechaIngreso = formatearFechaSQL();

    const { data, error } = await supabase
      .from('ingresos_extras')
      .insert([{
        tipo,
        monto,
        metodo_pago,
        descripcion,
        id_usuario,
        usuario: usuario || null,
        notas: notas || null,
        cerrado: false,
        fecha_ingreso: fechaIngreso
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { id: data.id };
  }

  // Obtener todos los ingresos extras con filtros
  static async obtenerTodos(filtros = {}) {
    const {
      tipo, cerrado, fecha_desde, fecha_hasta,
      pagina = 1, por_pagina = 50
    } = filtros;

    let query = supabase
      .from('ingresos_extras')
      .select(`
        *,
        usuarios!ingresos_extras_id_usuario_fkey (username, full_name)
      `, { count: 'exact' });

    // Filtro por tipo
    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    // Filtro por cerrado
    if (cerrado !== undefined) {
      query = query.eq('cerrado', cerrado);
    }

    // Filtro por fecha desde
    if (fecha_desde) {
      query = query.gte('fecha_ingreso', fecha_desde);
    }

    // Filtro por fecha hasta
    if (fecha_hasta) {
      query = query.lte('fecha_ingreso', fecha_hasta);
    }

    // Ordenar y paginar
    const offset = (pagina - 1) * por_pagina;
    query = query.order('fecha_ingreso', { ascending: false })
                 .range(offset, offset + por_pagina - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // Formatear datos
    const ingresos = data.map(ingreso => ({
      ...ingreso,
      username: ingreso.usuarios?.username,
      nombre_usuario: ingreso.usuarios?.full_name
    }));

    return {
      ingresos,
      total: count || 0,
      pagina: parseInt(pagina),
      por_pagina: parseInt(por_pagina),
      total_paginas: Math.ceil((count || 0) / por_pagina)
    };
  }

  // Obtener ingreso por ID
  static async obtenerPorId(id) {
    const { data, error } = await supabase
      .from('ingresos_extras')
      .select(`
        *,
        usuarios!ingresos_extras_id_usuario_fkey (username, full_name)
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data) {
      return {
        ...data,
        username: data.usuarios?.username,
        nombre_usuario: data.usuarios?.full_name
      };
    }

    return data;
  }

  // Obtener ingresos no cerrados del día
  static async obtenerDelDia(filtros = {}) {
    const { fecha_desde, fecha_hasta } = filtros;

    const { data, error } = await supabase
      .from('ingresos_extras')
      .select(`
        *,
        usuarios!ingresos_extras_id_usuario_fkey (username, full_name)
      `)
      .eq('cerrado', false)
      .gte('fecha_ingreso', fecha_desde)
      .lte('fecha_ingreso', fecha_hasta)
      .order('fecha_ingreso', { ascending: false });

    if (error) {
      throw error;
    }

    return data.map(ingreso => ({
      ...ingreso,
      username: ingreso.usuarios?.username,
      nombre_usuario: ingreso.usuarios?.full_name
    }));
  }

  // Marcar ingresos como cerrados
  static async marcarComoCerrados(filtros = {}) {
    const { fecha_desde, fecha_hasta } = filtros;
    const fechaCierre = formatearFechaSQL();

    let query = supabase
      .from('ingresos_extras')
      .update({
        cerrado: true,
        fecha_cierre: fechaCierre
      })
      .eq('cerrado', false);

    if (fecha_desde) {
      query = query.gte('fecha_ingreso', fecha_desde);
    }

    if (fecha_hasta) {
      query = query.lte('fecha_ingreso', fecha_hasta);
    }

    const { data, error } = await query.select('id, monto, tipo, metodo_pago, fecha_ingreso, fecha_cierre');

    if (error) {
      throw error;
    }

    return {
      count: data?.length || 0,
      ingresos: data
    };
  }

  // Obtener resumen de ingresos
  static async obtenerResumen(filtros = {}) {
    const { fecha_desde, fecha_hasta } = filtros;

    let query = supabase.from('ingresos_extras').select('*');

    if (fecha_desde) {
      query = query.gte('fecha_ingreso', fecha_desde);
    }

    if (fecha_hasta) {
      query = query.lte('fecha_ingreso', fecha_hasta);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const resumen = {
      total_ingresos: data.length,
      monto_total: data.reduce((sum, ing) => sum + parseFloat(ing.monto || 0), 0),
      // Por tipo
      fondo_caja: data.filter(ing => ing.tipo === 'Fondo de Caja').length,
      monto_fondo_caja: data.filter(ing => ing.tipo === 'Fondo de Caja').reduce((sum, ing) => sum + parseFloat(ing.monto || 0), 0),
      prestamos: data.filter(ing => ing.tipo === 'Prestamo').length,
      monto_prestamos: data.filter(ing => ing.tipo === 'Prestamo').reduce((sum, ing) => sum + parseFloat(ing.monto || 0), 0),
      otros: data.filter(ing => ing.tipo === 'Otros').length,
      monto_otros: data.filter(ing => ing.tipo === 'Otros').reduce((sum, ing) => sum + parseFloat(ing.monto || 0), 0),
      // Por método de pago
      efectivo: data.filter(ing => ing.metodo_pago === 'Efectivo').length,
      monto_efectivo: data.filter(ing => ing.metodo_pago === 'Efectivo').reduce((sum, ing) => sum + parseFloat(ing.monto || 0), 0),
      tarjeta: data.filter(ing => ing.metodo_pago === 'Tarjeta').length,
      monto_tarjeta: data.filter(ing => ing.metodo_pago === 'Tarjeta').reduce((sum, ing) => sum + parseFloat(ing.monto || 0), 0),
      transferencia: data.filter(ing => ing.metodo_pago === 'Transferencia').length,
      monto_transferencia: data.filter(ing => ing.metodo_pago === 'Transferencia').reduce((sum, ing) => sum + parseFloat(ing.monto || 0), 0)
    };

    return resumen;
  }
}

module.exports = IngresoExtra;
