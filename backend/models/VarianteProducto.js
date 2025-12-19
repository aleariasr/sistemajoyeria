const { supabase } = require('../supabase-db');

/**
 * Model: VarianteProducto (Product Variant)
 * 
 * Manages product variants - different visual designs of the same product
 * that share the same price and stock from the parent product.
 * 
 * Example: A group of earrings with 15 different designs, all priced at ₡15,000
 * and sharing a common stock of 30 units.
 */
class VarianteProducto {
  /**
   * Create a new product variant
   * @param {Object} varianteData - Variant data
   * @returns {Promise<Object>} Created variant
   */
  static async crear(varianteData) {
    const {
      id_producto_padre,
      nombre_variante,
      descripcion_variante,
      imagen_url,
      orden_display,
      activo
    } = varianteData;

    // Validate required fields
    if (!id_producto_padre || !nombre_variante || !imagen_url) {
      throw new Error('Missing required fields: id_producto_padre, nombre_variante, imagen_url');
    }

    // Validate imagen_url is from Cloudinary (security)
    try {
      const url = new URL(imagen_url);
      if (!url.hostname.endsWith('cloudinary.com') && !url.hostname.endsWith('res.cloudinary.com')) {
        throw new Error('Image URL must be from Cloudinary');
      }
    } catch (error) {
      throw new Error('Invalid image URL or must be from Cloudinary');
    }

    const { data, error } = await supabase
      .from('variantes_producto')
      .insert([{
        id_producto_padre,
        nombre_variante: nombre_variante.trim(),
        descripcion_variante: descripcion_variante ? descripcion_variante.trim() : null,
        imagen_url,
        orden_display: orden_display || 0,
        activo: activo !== undefined ? activo : true
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Get variant by ID
   * @param {number} id - Variant ID
   * @returns {Promise<Object|null>} Variant data
   */
  static async obtenerPorId(id) {
    const { data, error } = await supabase
      .from('variantes_producto')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  /**
   * Get all variants for a parent product
   * @param {number} idProductoPadre - Parent product ID
   * @param {boolean} soloActivas - Only return active variants
   * @returns {Promise<Array>} List of variants
   */
  static async obtenerPorProducto(idProductoPadre, soloActivas = false) {
    let query = supabase
      .from('variantes_producto')
      .select('*')
      .eq('id_producto_padre', idProductoPadre)
      .order('orden_display', { ascending: true })
      .order('created_at', { ascending: true });

    if (soloActivas) {
      query = query.eq('activo', true);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Update a variant
   * @param {number} id - Variant ID
   * @param {Object} varianteData - Updated data
   * @returns {Promise<Object>} Updated variant
   */
  static async actualizar(id, varianteData) {
    const {
      nombre_variante,
      descripcion_variante,
      imagen_url,
      orden_display,
      activo
    } = varianteData;

    const updateData = {};

    if (nombre_variante !== undefined) {
      updateData.nombre_variante = nombre_variante.trim();
    }
    if (descripcion_variante !== undefined) {
      updateData.descripcion_variante = descripcion_variante ? descripcion_variante.trim() : null;
    }
    if (imagen_url !== undefined) {
      // Validate imagen_url is from Cloudinary
      try {
        const url = new URL(imagen_url);
        if (!url.hostname.endsWith('cloudinary.com') && !url.hostname.endsWith('res.cloudinary.com')) {
          throw new Error('Image URL must be from Cloudinary');
        }
        updateData.imagen_url = imagen_url;
      } catch (error) {
        throw new Error('Invalid image URL or must be from Cloudinary');
      }
    }
    if (orden_display !== undefined) {
      updateData.orden_display = orden_display;
    }
    if (activo !== undefined) {
      updateData.activo = activo;
    }

    const { data, error } = await supabase
      .from('variantes_producto')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Delete a variant
   * @param {number} id - Variant ID
   * @returns {Promise<Object>} Deletion result
   */
  static async eliminar(id) {
    const { data, error } = await supabase
      .from('variantes_producto')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    return { changes: data.length };
  }

  /**
   * Reorder variants for a product
   * @param {Array} ordenes - Array of {id, orden_display}
   * @returns {Promise<void>}
   */
  static async reordenar(ordenes) {
    // Use Promise.all for batch updates
    const updates = ordenes.map(({ id, orden_display }) =>
      supabase
        .from('variantes_producto')
        .update({ orden_display })
        .eq('id', id)
    );

    await Promise.all(updates);
  }

  /**
   * Count variants for a product
   * @param {number} idProductoPadre - Parent product ID
   * @param {boolean} soloActivas - Only count active variants
   * @returns {Promise<number>} Count
   */
  static async contarPorProducto(idProductoPadre, soloActivas = false) {
    let query = supabase
      .from('variantes_producto')
      .select('id', { count: 'exact', head: true })
      .eq('id_producto_padre', idProductoPadre);

    if (soloActivas) {
      query = query.eq('activo', true);
    }

    const { count, error } = await query;

    if (error) {
      throw error;
    }

    return count || 0;
  }

  /**
   * Validate variant limit (max 100 per product)
   * @param {number} idProductoPadre - Parent product ID
   * @returns {Promise<boolean>} True if under limit
   */
  static async validarLimite(idProductoPadre) {
    const count = await this.contarPorProducto(idProductoPadre);
    return count < 100;
  }
}

module.exports = VarianteProducto;
