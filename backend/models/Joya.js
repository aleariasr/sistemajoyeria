const { supabase } = require('../supabase-db');

// Configuration constants for shuffle and category balancing
const MAX_CONSECUTIVE_CATEGORY = 3; // Maximum number of consecutive products from same category
const MAX_BALANCING_ITERATIONS = 100; // Maximum iterations to prevent infinite loops during balancing

class Joya {
  // Crear nueva joya
  static async crear(joyaData) {
    const {
      codigo, nombre, descripcion, categoria, proveedor, costo,
      precio_venta, moneda, stock_actual, stock_minimo, ubicacion, estado,
      imagen_url, imagen_public_id, mostrar_en_storefront,
      es_producto_variante, es_producto_compuesto
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
        imagen_public_id: imagen_public_id || null,
        mostrar_en_storefront: mostrar_en_storefront !== undefined ? mostrar_en_storefront : true,
        es_producto_variante: es_producto_variante || false,
        es_producto_compuesto: es_producto_compuesto || false
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
      stock_bajo, sin_stock, estado, con_stock, mostrar_en_storefront,
      excluir_sets,
      pagina = 1,
      por_pagina = 20,
      shuffle = false,
      shuffle_seed = null
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

    // Filtro por categoría (case-insensitive para compatibilidad con frontend)
    // Frontend normaliza categorías a minúsculas (e.g., "anillos")
    // Base de datos almacena con capitalización (e.g., "Anillos")
    // ilike sin wildcards hace coincidencia exacta pero case-insensitive
    if (categoria) {
      query = query.ilike('categoria', categoria);
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

    // Filtro por visibilidad en storefront
    // Accepts both boolean and string for compatibility with query params
    if (mostrar_en_storefront === true || mostrar_en_storefront === 'true') {
      query = query.eq('mostrar_en_storefront', true);
    }

    // Filtro por estado
    if (estado) {
      query = query.eq('estado', estado);
    }

    // Filtro para excluir sets (productos compuestos)
    // Accepts: true, 'true' (case-insensitive) for backward compatibility
    if (excluir_sets === true || (typeof excluir_sets === 'string' && excluir_sets.toLowerCase() === 'true')) {
      query = query.eq('es_producto_compuesto', false);
    }

    // If shuffle is requested, fetch all results first, shuffle, then paginate
    if (shuffle === true || shuffle === 'true') {
      // Fetch all matching products (without pagination, but with count)
      // Order by fecha_creacion DESC with fallback to id DESC for stability
      const allQuery = query
        .order('fecha_creacion', { ascending: false })
        .order('id', { ascending: false });
      const { data: allData, error: allError, count } = await allQuery;

      if (allError) {
        throw allError;
      }

      // Shuffle the entire result set using deterministic or random shuffle
      let shuffled;
      if (shuffle_seed) {
        // Use seeded shuffle for deterministic order
        shuffled = this._shuffleArraySeeded(allData || [], shuffle_seed);
        // Apply category balancing to enforce max 3 consecutive rule
        shuffled = this._balanceCategories(shuffled);
      } else {
        // Use non-deterministic shuffle for backward compatibility
        shuffled = this._shuffleArray(allData || []);
      }

      // Apply pagination to shuffled results
      const offset = (paginaNum - 1) * porPaginaNum;
      const paginatedData = shuffled.slice(offset, offset + porPaginaNum);

      return {
        joyas: paginatedData,
        total: count || 0,
        pagina: paginaNum,
        por_pagina: porPaginaNum,
        total_paginas: Math.max(1, Math.ceil((count || 0) / porPaginaNum))
      };
    }

    // Normal path: order and paginate directly in database
    // Order by fecha_creacion DESC with fallback to id DESC for stable sorting
    const offset = (paginaNum - 1) * porPaginaNum;
    const hasta = offset + porPaginaNum - 1;
    query = query
      .order('fecha_creacion', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, hasta);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // Defensive deduplication: ensure no duplicate entries by ID
    // (Although no joins in query, this is a safety measure)
    const uniqueJoyas = data && Array.isArray(data) ? Array.from(
      new Map(data.filter(j => j?.id).map(j => [j.id, j])).values()
    ) : [];

    return {
      joyas: uniqueJoyas,
      total: count || 0,
      pagina: paginaNum,
      por_pagina: porPaginaNum,
      total_paginas: Math.max(1, Math.ceil((count || 0) / porPaginaNum))
    };
  }

  // Fisher-Yates shuffle algorithm for randomizing arrays
  static _shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Seeded random number generator (Mulberry32)
  // Returns a deterministic pseudo-random float between 0 and 1
  static _seededRandom(seed) {
    let state = seed;
    return function() {
      state = (state + 0x6D2B79F5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Fisher-Yates shuffle with seeded RNG for deterministic shuffling
  static _shuffleArraySeeded(array, seed) {
    const shuffled = [...array];
    const random = this._seededRandom(seed);
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }

  // Balance categories to ensure no more than MAX_CONSECUTIVE_CATEGORY consecutive products from same category
  // Uses a sliding window approach to redistribute products when violations are found
  static _balanceCategories(products, maxConsecutive = MAX_CONSECUTIVE_CATEGORY) {
    if (!products || products.length <= maxConsecutive) {
      return products;
    }

    const result = [...products];
    let changes = true;
    let iterations = 0;

    while (changes && iterations < MAX_BALANCING_ITERATIONS) {
      changes = false;
      iterations++;

      for (let i = 0; i <= result.length - maxConsecutive - 1; i++) {
        // Check if we have maxConsecutive + 1 consecutive items with same category
        const window = result.slice(i, i + maxConsecutive + 1);
        const firstCategory = window[0]?.categoria;
        
        if (!firstCategory) continue;

        const allSameCategory = window.every(p => p?.categoria === firstCategory);
        
        if (allSameCategory) {
          // Find the next product with a different category after this window
          let swapIndex = -1;
          for (let j = i + maxConsecutive + 1; j < result.length; j++) {
            if (result[j]?.categoria !== firstCategory) {
              swapIndex = j;
              break;
            }
          }

          // If found a different category, swap it with the violating position
          if (swapIndex !== -1) {
            const temp = result[i + maxConsecutive];
            result[i + maxConsecutive] = result[swapIndex];
            result[swapIndex] = temp;
            changes = true;
          }
        }
      }
    }

    return result;
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

  // Obtener una joya por código (case-insensitive)
  static async obtenerPorCodigo(codigo) {
    const { data, error } = await supabase
      .from('joyas')
      .select('*')
      .ilike('codigo', codigo)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  // Buscar códigos similares (para autocomplete y prevenir duplicados)
  static async buscarCodigosSimilares(codigoParteial) {
    const { data, error } = await supabase
      .from('joyas')
      .select('id, codigo, nombre')
      .ilike('codigo', `%${codigoParteial}%`)
      .order('codigo', { ascending: true })
      .limit(10);

    if (error) {
      throw error;
    }

    return data || [];
  }

  // Actualizar joya
  static async actualizar(id, joyaData) {
    const {
      codigo, nombre, descripcion, categoria, proveedor, costo,
      precio_venta, moneda, stock_actual, stock_minimo, ubicacion, estado,
      imagen_url, imagen_public_id, mostrar_en_storefront,
      es_producto_variante, es_producto_compuesto
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
    if (mostrar_en_storefront !== undefined) {
      updateData.mostrar_en_storefront = mostrar_en_storefront;
    }
    if (es_producto_variante !== undefined) {
      updateData.es_producto_variante = es_producto_variante;
    }
    if (es_producto_compuesto !== undefined) {
      updateData.es_producto_compuesto = es_producto_compuesto;
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

  // Verificar dependencias de una joya antes de eliminar
  static async verificarDependencias(id) {
    const dependencias = {
      tiene_dependencias: false,
      detalles: []
    };

    // Verificar ventas - obtener count directamente
    const { count: countVentas, error: errorVentas } = await supabase
      .from('items_venta')
      .select('id', { count: 'exact', head: true })
      .eq('id_joya', id);

    if (errorVentas) {
      throw errorVentas;
    }

    if (countVentas && countVentas > 0) {
      dependencias.tiene_dependencias = true;
      dependencias.detalles.push({
        tipo: 'ventas',
        cantidad: countVentas,
        mensaje: `Esta joya está asociada a ${countVentas} venta(s) registrada(s)`
      });
    }

    // Verificar movimientos de inventario - obtener count directamente
    const { count: countMovimientos, error: errorMovimientos } = await supabase
      .from('movimientos_inventario')
      .select('id', { count: 'exact', head: true })
      .eq('id_joya', id);

    if (errorMovimientos) {
      throw errorMovimientos;
    }

    if (countMovimientos && countMovimientos > 0) {
      dependencias.tiene_dependencias = true;
      dependencias.detalles.push({
        tipo: 'movimientos',
        cantidad: countMovimientos,
        mensaje: `Esta joya tiene ${countMovimientos} movimiento(s) de inventario registrado(s)`
      });
    }

    // Verificar si es componente de algún set
    const { data: sets, error: errorSets } = await supabase
      .from('productos_compuestos')
      .select('id_producto_set, joyas:id_producto_set(codigo, nombre)')
      .eq('id_producto_componente', id);

    if (errorSets) {
      throw errorSets;
    }

    if (sets && sets.length > 0) {
      dependencias.tiene_dependencias = true;
      const nombresSets = sets.map(s => s.joyas?.nombre || 'Desconocido').join(', ');
      dependencias.detalles.push({
        tipo: 'sets',
        cantidad: sets.length,
        mensaje: `Esta joya es componente de ${sets.length} set(s): ${nombresSets}`
      });
    }

    // Verificar pedidos online - obtener count directamente
    const { count: countPedidos, error: errorPedidos } = await supabase
      .from('items_pedido_online')
      .select('id', { count: 'exact', head: true })
      .eq('id_joya', id);

    if (errorPedidos) {
      throw errorPedidos;
    }

    if (countPedidos && countPedidos > 0) {
      dependencias.tiene_dependencias = true;
      dependencias.detalles.push({
        tipo: 'pedidos_online',
        cantidad: countPedidos,
        mensaje: `Esta joya está en ${countPedidos} pedido(s) online`
      });
    }

    return dependencias;
  }

  // Eliminar físicamente (solo si no tiene dependencias)
  static async eliminar(id) {
    // Verificar dependencias primero
    const dependencias = await this.verificarDependencias(id);
    
    if (dependencias.tiene_dependencias) {
      // Si tiene dependencias, solo marcar como descontinuado
      const { data, error } = await supabase
        .from('joyas')
        .update({ estado: 'Descontinuado' })
        .eq('id', id)
        .select();

      if (error) {
        throw error;
      }

      return {
        changes: data.length,
        eliminado: false,
        marcado_descontinuado: true,
        dependencias: dependencias.detalles
      };
    }

    // Si no tiene dependencias, eliminar físicamente
    const { data, error } = await supabase
      .from('joyas')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    return {
      changes: data.length,
      eliminado: true,
      marcado_descontinuado: false
    };
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
      .eq('mostrar_en_storefront', true)
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
