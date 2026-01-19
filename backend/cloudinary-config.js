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

/**
 * Extrae el public_id de una URL de Cloudinary
 * @param {string} cloudinaryUrl - URL completa de Cloudinary
 * @returns {string|null} - Public ID o null si no se puede extraer
 */
const extractPublicId = (cloudinaryUrl) => {
  try {
    if (!cloudinaryUrl || typeof cloudinaryUrl !== 'string') {
      return null;
    }

    // Cloudinary URLs have format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{version}/{public_id}.{format}
    // We need to extract {public_id} which includes the folder path
    const url = new URL(cloudinaryUrl);
    const pathParts = url.pathname.split('/');
    
    // Find 'upload' or 'private' in path
    const uploadIndex = pathParts.findIndex(part => part === 'upload' || part === 'private');
    if (uploadIndex === -1) {
      return null;
    }
    
    // Everything after 'upload' is either version/public_id or just public_id
    const remainingParts = pathParts.slice(uploadIndex + 1);
    
    // Skip version if it starts with 'v' followed by digits
    let startIndex = 0;
    if (remainingParts[0] && /^v\d+$/.test(remainingParts[0])) {
      startIndex = 1;
    }
    
    // Join remaining parts and remove file extension
    const publicIdWithExt = remainingParts.slice(startIndex).join('/');
    const lastDotIndex = publicIdWithExt.lastIndexOf('.');
    
    if (lastDotIndex > 0) {
      return publicIdWithExt.substring(0, lastDotIndex);
    }
    
    return publicIdWithExt;
  } catch (error) {
    console.error('Error extracting public_id from URL:', error);
    return null;
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage,
  getOptimizedUrl,
  extractPublicId
};
