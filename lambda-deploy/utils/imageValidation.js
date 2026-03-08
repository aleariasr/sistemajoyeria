/**
 * Validación de URLs de imágenes
 * Asegura que las imágenes estén disponibles y correctamente formateadas
 */

/**
 * Valida que una URL de imagen sea válida
 * @param {string} imageUrl - URL de la imagen a validar
 * @returns {boolean} true si la URL es válida, false en caso contrario
 */
function isValidImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return false;
  }

  try {
    const url = new URL(imageUrl);
    
    // Verificar que sea http o https
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }

    // Verificar que tenga una extensión de imagen común o sea de Cloudinary
    const isCloudinary = imageUrl.includes('cloudinary.com');
    const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i.test(imageUrl);
    
    return isCloudinary || hasImageExtension;
  } catch (error) {
    return false;
  }
}

/**
 * Limpia y valida un arreglo de imágenes
 * Elimina URLs inválidas y asegura que cada imagen tenga la estructura correcta
 * @param {Array} imagenes - Array de objetos de imagen
 * @returns {Array} Array limpio de imágenes válidas
 */
function cleanImageArray(imagenes) {
  if (!Array.isArray(imagenes)) {
    return [];
  }

  return imagenes
    .filter(img => img && img.url && isValidImageUrl(img.url))
    .map(img => ({
      id: img.id,
      url: img.url,
      orden: img.orden || img.orden_display || 0,
      es_principal: img.es_principal || false
    }));
}

/**
 * Selecciona la imagen principal de un array de imágenes
 * @param {Array} imagenes - Array de objetos de imagen
 * @param {string} fallbackImageUrl - URL de imagen de respaldo
 * @returns {string|null} URL de la imagen principal o null
 */
function selectPrimaryImage(imagenes, fallbackImageUrl = null) {
  if (!imagenes || !Array.isArray(imagenes) || imagenes.length === 0) {
    return isValidImageUrl(fallbackImageUrl) ? fallbackImageUrl : null;
  }

  // Buscar imagen marcada como principal
  const principal = imagenes.find(img => img.es_principal);
  if (principal && isValidImageUrl(principal.url)) {
    return principal.url;
  }

  // Si no hay principal, tomar la primera
  const primera = imagenes[0];
  if (primera && isValidImageUrl(primera.url)) {
    return primera.url;
  }

  // Fallback a imagen_url si existe
  return isValidImageUrl(fallbackImageUrl) ? fallbackImageUrl : null;
}

/**
 * Asegura que un producto tenga al menos una imagen válida
 * @param {Object} product - Objeto de producto
 * @returns {Object} Producto con imágenes validadas
 */
function ensureProductHasValidImages(product) {
  if (!product) {
    return product;
  }

  // Limpiar array de imágenes
  const imagenesLimpias = cleanImageArray(product.imagenes);
  
  // Seleccionar imagen principal
  const imagenPrincipal = selectPrimaryImage(imagenesLimpias, product.imagen_url);

  return {
    ...product,
    imagenes: imagenesLimpias,
    imagen_url: imagenPrincipal
  };
}

module.exports = {
  isValidImageUrl,
  cleanImageArray,
  selectPrimaryImage,
  ensureProductHasValidImages
};
