const { supabase } = require('../supabase-db');

class Joya {
  // Crear nueva joya
  static async crear(joyaData) {
    const {
      codigo, nombre, descripcion, categoria, proveedor, costo,
      precio_venta, moneda, stock_actual, stock_minimo, ubicacion, estado,
      imagen_url, imagen_public_id
    } = joyaData;

    const { data, error } = await supabase
      .from('joyas')
      .insert([{
        codigo,
        nombre,
        descripcion,
        categoria,
        proveedor,
        costo,
        precio_venta,
        moneda: moneda || 'CRC',
        stock_actual,
        stock_minimo: stock_minimo || 5,
        ubicacion,
        estado: estado || 'Activo',
        imagen_url: imagen_url || null,
        imagen_public_id: imagen_public_id || null
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { id: data.id };
  }

  // Obtener todas las joyas con paginación y filtros
  static async obtenerTodas(filtros = {}) {
    const {
      busqueda, categoria, precio_min, precio_max,
      stock_bajo, sin_stock, estado, con_stock,
      pagina = 1,
      por_pagina = 20
    } = filtros;

    const paginaNum = Math.max(1, parseInt(pagina, 10) || 1);
    const porPaginaNum = Math.max(1, parseInt(por_pagina, 10) || 20);

    let query = supabase.from('joyas').select('*', { count: 'exact' });

    // Búsqueda general - sanitize input to prevent injection
    if (busqueda) {
      // Escape special characters for ILIKE pattern
      const sanitizedBusqueda = busqueda
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_');
      query = query.or(`codigo.ilike.%${sanitizedBusqueda}%,nombre.ilike.%${sanitizedBusqueda}%,descripcion.ilike.%${sanitizedBusqueda}%,categoria.ilike.%${sanitizedBusqueda}%,proveedor.ilike.%${sanitizedBusqueda}%`);
    }

    // Filtro por categoría
    if (categoria) {
      query = query.eq('categoria', categoria);
    }

    // Filtro por rango de precios
    if (precio_min !== undefined) {
      query = query.gte('precio_venta', precio_min);
    }
    if (precio_max !== undefined) {
      query = query.lte('precio_venta', precio_max);
    }

    // Filtro por stock bajo
    if (stock_bajo === 'true') {
      query = query.filter('stock_actual', 'lte', 'stock_minimo');
    }

    // Filtro por sin stock
    if (sin_stock === 'true') {
      query = query.eq('stock_actual', 0);
    }

    // Filtro por productos con stock disponible (para storefront)
    if (con_stock === true || con_stock === 'true') {
      query = query.gt('stock_actual', 0);
    }

    // Filtro por estado
    if (estado) {
      query = query.eq('estado', estado);
    }

    // Ordenar y paginar
    const offset = (paginaNum - 1) * porPaginaNum;
    const hasta = offset + porPaginaNum - 1;
    query = query
      .order('fecha_creacion', { ascending: false })
      .range(offset, hasta);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      joyas: data,
      total: count || 0,
      pagina: paginaNum,
      por_pagina: porPaginaNum,
      total_paginas: Math.max(1, Math.ceil((count || 0) / porPaginaNum))
    };
  }

  // Obtener una joya por ID
  static async obtenerPorId(id) {
    const { data, error } = await supabase
      .from('joyas')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  // Obtener una joya por código
  static async obtenerPorCodigo(codigo) {
    const { data, error } = await supabase
      .from('joyas')
      .select('*')
      .eq('codigo', codigo)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  // Actualizar joya
  static async actualizar(id, joyaData) {
    const {
      codigo, nombre, descripcion, categoria, proveedor, costo,
      precio_venta, moneda, stock_actual, stock_minimo, ubicacion, estado,
      imagen_url, imagen_public_id
    } = joyaData;

    const updateData = {
      codigo, nombre, descripcion, categoria, proveedor, costo,
      precio_venta, moneda, stock_actual, stock_minimo, ubicacion, estado
    };

    if (imagen_url !== undefined) {
      updateData.imagen_url = imagen_url;
    }
    if (imagen_public_id !== undefined) {
      updateData.imagen_public_id = imagen_public_id;
    }

    const { data, error } = await supabase
      .from('joyas')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    return { changes: data.length };
  }

  // Actualizar solo el stock
  static async actualizarStock(id, nuevoStock) {
    const { data, error } = await supabase
      .from('joyas')
      .update({ stock_actual: nuevoStock })
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    return { changes: data.length };
  }

  // Eliminar (marcar como descontinuado)
  static async eliminar(id) {
    const { data, error } = await supabase
      .from('joyas')
      .update({ estado: 'Descontinuado' })
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    return { changes: data.length };
  }

  // Obtener joyas con stock bajo
  static async obtenerStockBajo() {
    const { data, error } = await supabase
      .from('joyas')
      .select('*')
      .filter('stock_actual', 'lte', 'stock_minimo')
      .eq('estado', 'Activo');

    if (error) {
      throw error;
    }

    return data;
  }

  // Obtener categorías únicas
  static async obtenerCategorias() {
    const { data, error } = await supabase
      .from('joyas')
      .select('categoria')
      .not('categoria', 'is', null)
      .order('categoria');

    if (error) {
      throw error;
    }

    // Extraer categorías únicas
    const categorias = [...new Set(data.map(row => row.categoria))];
    return categorias;
  }

  // Obtener categorías únicas de productos activos con stock
  static async obtenerCategoriasDisponibles() {
    const { data, error } = await supabase
      .from('joyas')
      .select('categoria')
      .eq('estado', 'Activo')
      .gt('stock_actual', 0)
      .not('categoria', 'is', null)
      .order('categoria');

    if (error) {
      throw error;
    }

    // Extraer categorías únicas y filtrar vacías
    const categorias = [...new Set(
      data
        .map(row => row.categoria)
        .filter(cat => cat && cat.trim() !== '')
    )];
    
    // Ordenar alfabéticamente en español
    return categorias.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }
}

module.exports = Joya;
