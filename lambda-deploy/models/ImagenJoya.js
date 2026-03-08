const { supabase } = require('../supabase-db');

class ImagenJoya {
  /**
   * Crear una nueva imagen
   */
  static async crear(imagenData) {
    const { id_joya, imagen_url, orden_display, es_principal } = imagenData;
    
    const { data, error } = await supabase
      .from('imagenes_joya')
      .insert([{
        id_joya,
        imagen_url,
        orden_display: orden_display || 0,
        es_principal: es_principal || false
      }])
      .select()
      .single();

    if (error) throw error;
    
    // Si es principal, actualizar joyas.imagen_url
    if (es_principal) {
      await this.actualizarImagenPrincipal(id_joya, imagen_url);
    }
    
    return data;
  }

  /**
   * Obtener todas las imágenes de una joya
   */
  static async obtenerPorJoya(id_joya) {
    const { data, error } = await supabase
      .from('imagenes_joya')
      .select('*')
      .eq('id_joya', id_joya)
      .order('orden_display', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Obtener imágenes para múltiples joyas (optimizado para evitar N+1)
   */
  static async obtenerPorJoyas(ids_joyas) {
    if (!ids_joyas || ids_joyas.length === 0) {
      return {};
    }

    const { data, error } = await supabase
      .from('imagenes_joya')
      .select('*')
      .in('id_joya', ids_joyas)
      .order('orden_display', { ascending: true });

    if (error) throw error;

    // Group images by joya id
    const imagesByJoya = {};
    (data || []).forEach(img => {
      if (!imagesByJoya[img.id_joya]) {
        imagesByJoya[img.id_joya] = [];
      }
      imagesByJoya[img.id_joya].push(img);
    });

    return imagesByJoya;
  }

  /**
   * Actualizar orden de múltiples imágenes
   */
  static async actualizarOrden(actualizaciones) {
    // actualizaciones = [{ id: 1, orden_display: 0, es_principal: true, imagen_url: ... }, ...]
    
    for (const img of actualizaciones) {
      const updateData = {
        orden_display: img.orden_display,
        es_principal: img.es_principal || false
      };
      
      const { error } = await supabase
        .from('imagenes_joya')
        .update(updateData)
        .eq('id', img.id);
      
      if (error) throw error;
      
      // Si es la nueva principal, obtener la imagen y actualizar joyas.imagen_url
      if (img.es_principal) {
        const imagenActual = await this.obtenerPorId(img.id);
        await this.actualizarImagenPrincipal(imagenActual.id_joya, imagenActual.imagen_url);
      }
    }
    
    return { success: true };
  }

  /**
   * Eliminar una imagen
   */
  static async eliminar(id) {
    // Obtener info antes de eliminar
    const imagen = await this.obtenerPorId(id);
    
    const { error } = await supabase
      .from('imagenes_joya')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    // Si era la principal, asignar la primera disponible como principal
    if (imagen.es_principal) {
      const restantes = await this.obtenerPorJoya(imagen.id_joya);
      if (restantes.length > 0) {
        await this.marcarComoPrincipal(restantes[0].id);
      } else {
        // Si no quedan imágenes, limpiar joyas.imagen_url
        await this.actualizarImagenPrincipal(imagen.id_joya, null);
      }
    }
    
    return { success: true };
  }

  /**
   * Marcar una imagen como principal
   */
  static async marcarComoPrincipal(id) {
    const imagen = await this.obtenerPorId(id);
    
    // Desmarcar otras imágenes de esta joya
    await supabase
      .from('imagenes_joya')
      .update({ es_principal: false })
      .eq('id_joya', imagen.id_joya);
    
    // Marcar esta como principal
    await supabase
      .from('imagenes_joya')
      .update({ es_principal: true })
      .eq('id', id);
    
    // Actualizar joyas.imagen_url
    await this.actualizarImagenPrincipal(imagen.id_joya, imagen.imagen_url);
    
    return { success: true };
  }

  /**
   * Actualizar imagen principal en tabla joyas (para compatibilidad)
   */
  static async actualizarImagenPrincipal(id_joya, imagen_url) {
    const { error } = await supabase
      .from('joyas')
      .update({ imagen_url })
      .eq('id', id_joya);
    
    if (error) throw error;
  }

  /**
   * Obtener imagen por ID
   */
  static async obtenerPorId(id) {
    const { data, error } = await supabase
      .from('imagenes_joya')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = ImagenJoya;
