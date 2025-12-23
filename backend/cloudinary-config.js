const { v2: cloudinary } = require('cloudinary');

// Configuración de Cloudinary
// SECURITY: Credentials must be provided via environment variables
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn('⚠️ Cloudinary credentials not configured. Image uploads will fail.');
  console.warn('   Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
}

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Sube una imagen a Cloudinary
 * @param {string} filePath - Ruta del archivo o buffer
 * @param {string} folder - Carpeta en Cloudinary (opcional)
 * @returns {Promise<object>} - Resultado de la subida con URL
 */
const uploadImage = async (filePath, folder = 'joyas') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'image',
      use_filename: true,
      overwrite: false,
      // Configuración de calidad y formato
      quality: 'auto:best',
      fetch_format: 'auto',
      // Configuración de CORS - permitir acceso desde diferentes orígenes
      type: 'upload',
      // Generar responsive breakpoints automáticamente
      responsive_breakpoints: {
        create_derived: true,
        bytes_step: 20000,
        min_width: 200,
        max_width: 1000,
        max_images: 5
      }
    });
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format
    };
  } catch (error) {
    console.error('Error al subir imagen a Cloudinary:', error);
    
    // Proporcionar mensajes de error más específicos
    if (error.http_code === 401) {
      throw new Error('Error de autenticación con Cloudinary. Verifique las credenciales.');
    } else if (error.http_code === 400) {
      throw new Error('Imagen inválida o corrupta. Por favor, intente con otra imagen.');
    } else if (error.http_code === 420) {
      throw new Error('Límite de uso de Cloudinary excedido.');
    } else {
      throw new Error('Error al subir imagen: ' + (error.message || 'Error desconocido'));
    }
  }
};

/**
 * Elimina una imagen de Cloudinary
 * @param {string} publicId - ID público de la imagen en Cloudinary
 * @returns {Promise<object>} - Resultado de la eliminación
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error al eliminar imagen de Cloudinary:', error);
    throw error;
  }
};

/**
 * Obtiene la URL optimizada de una imagen
 * @param {string} publicId - ID público de la imagen
 * @param {object} options - Opciones de transformación
 * @returns {string} - URL optimizada
 */
const getOptimizedUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: 'auto:best',
    ...options
  });
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage,
  getOptimizedUrl
};
