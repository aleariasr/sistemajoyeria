const { supabase } = require('../supabase-db');
const { formatearFechaSQL, obtenerRangoDia } = require('../utils/timezone');
const { sanitizarParaBusqueda } = require('../utils/validaciones');

class CierreCaja {
  /**
   * Registra un nuevo cierre de caja con el resumen completo.
   */
  static async registrar({ resumen = {}, id_usuario = null, usuario = null, notas = null }) {
    const fecha_cierre = formatearFechaSQL();

    const payload = {
      fecha_cierre,
      id_usuario,
      usuario,
      resumen,
      total_ventas: resumen.total_ventas || resumen.total_ventas_contado || 0,
      total_ingresos: resumen.total_ingresos || 0,
      total_general: resumen.total_ingresos_combinado || resumen.total_general || 0,
      total_efectivo_combinado: resumen.total_efectivo_combinado || 0,
      total_transferencia_combinado: resumen.total_transferencia_combinado || 0,
      total_tarjeta_combinado: resumen.total_tarjeta_combinado || 0,
      monto_total_abonos: resumen.monto_total_abonos || resumen.monto_abonos_cerrados || 0,
      monto_total_ingresos_extras: resumen.monto_total_ingresos_extras || resumen.monto_ingresos_extras_cerrados || 0,
      notas
    };

    const { data, error } = await supabase
      .from('cierres_caja')
      .insert([payload])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
    * Obtiene histórico paginado de cierres con filtros opcionales.
    */
  static async obtenerHistorico({ pagina = 1, por_pagina = 20, fecha = null, usuario = null }) {
    let query = supabase
      .from('cierres_caja')
      .select('*', { count: 'exact' });

    if (fecha) {
      const { fecha_desde, fecha_hasta } = obtenerRangoDia(fecha);
      query = query.gte('fecha_cierre', fecha_desde).lte('fecha_cierre', fecha_hasta);
    }

    if (usuario) {
      // Sanitize input to prevent SQL injection
      const sanitizedUsuario = sanitizarParaBusqueda(usuario);
      query = query.ilike('usuario', `%${sanitizedUsuario}%`);
    }

    const offset = (pagina - 1) * por_pagina;
    query = query
      .order('fecha_cierre', { ascending: false })
      .range(offset, offset + por_pagina - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      cierres: data || [],
      total: count || 0,
      pagina: Number(pagina),
      por_pagina: Number(por_pagina),
      total_paginas: Math.max(1, Math.ceil((count || 0) / por_pagina))
    };
  }
}

module.exports = CierreCaja;
