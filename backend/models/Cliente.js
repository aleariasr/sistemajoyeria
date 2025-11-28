const { supabase } = require('../supabase-db');

class Cliente {
  // Crear nuevo cliente
  static async crear(clienteData) {
    const { nombre, telefono, cedula, direccion, email, notas } = clienteData;

    const { data, error } = await supabase
      .from('clientes')
      .insert([{
        nombre,
        telefono,
        cedula,
        direccion: direccion || null,
        email: email || null,
        notas: notas || null
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { id: data.id };
  }

  // Obtener todos los clientes con filtros
  static async obtenerTodos(filtros = {}) {
    const { busqueda, pagina = 1, por_pagina = 50 } = filtros;

    let query = supabase.from('clientes').select('*', { count: 'exact' });

    // Filtro de búsqueda por nombre, cédula o teléfono
    // Sanitize input to prevent injection
    if (busqueda) {
      const sanitizedBusqueda = busqueda
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_');
      query = query.or(`nombre.ilike.%${sanitizedBusqueda}%,cedula.ilike.%${sanitizedBusqueda}%,telefono.ilike.%${sanitizedBusqueda}%`);
    }

    // Ordenar y paginar
    const offset = (pagina - 1) * por_pagina;
    query = query.order('nombre', { ascending: true })
                 .range(offset, offset + por_pagina - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      clientes: data,
      total: count,
      pagina: parseInt(pagina),
      por_pagina: parseInt(por_pagina),
      total_paginas: Math.ceil(count / por_pagina)
    };
  }

  // Obtener un cliente por ID
  static async obtenerPorId(id) {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  // Obtener un cliente por cédula
  static async obtenerPorCedula(cedula) {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('cedula', cedula)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  // Actualizar cliente
  static async actualizar(id, clienteData) {
    const { nombre, telefono, cedula, direccion, email, notas } = clienteData;

    const { data, error } = await supabase
      .from('clientes')
      .update({
        nombre,
        telefono,
        cedula,
        direccion,
        email,
        notas
      })
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    return { changes: data.length };
  }

  // Eliminar cliente
  static async eliminar(id) {
    const { data, error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    return { changes: data.length };
  }

  // Buscar clientes por nombre o cédula
  static async buscar(termino) {
    // Sanitize input to prevent injection
    const sanitizedTermino = termino
      .replace(/\\/g, '\\\\')
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_');
    
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .or(`nombre.ilike.%${sanitizedTermino}%,cedula.ilike.%${sanitizedTermino}%,telefono.ilike.%${sanitizedTermino}%`)
      .order('nombre', { ascending: true })
      .limit(10);

    if (error) {
      throw error;
    }

    return data;
  }
}

module.exports = Cliente;
