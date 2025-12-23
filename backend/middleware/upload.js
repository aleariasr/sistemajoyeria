const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear directorio temporal si no existe
const tmpDir = path.join(__dirname, '../tmp/uploads');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

// Configuración de almacenamiento temporal
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tmpDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'joya-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|heic|heif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (jpeg, jpg, png, gif, webp)'));
  }
};

// Configurar multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // Límite de 50MB para permitir imágenes de alta calidad
  },
  fileFilter: fileFilter
});

// Middleware para un solo archivo
const uploadSingle = upload.single('imagen');

// Middleware con manejo de errores
const uploadMiddleware = (req, res, next) => {
  uploadSingle(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Error de Multer
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          error: 'El archivo es demasiado grande. Tamaño máximo: 50MB',
          errorType: 'FILE_TOO_LARGE'
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ 
          error: 'Número de archivos no esperado',
          errorType: 'UNEXPECTED_FILE'
        });
      }
      return res.status(400).json({ 
        error: err.message,
        errorType: 'MULTER_ERROR'
      });
    } else if (err) {
      // Otro tipo de error (ej: fileFilter)
      return res.status(400).json({ 
        error: err.message,
        errorType: 'VALIDATION_ERROR'
      });
    }
    // Todo bien, continuar
    next();
  });
};

// Función para limpiar archivo temporal
const cleanupTempFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Error al eliminar archivo temporal:', err);
    }
  }
};

module.exports = {
  uploadMiddleware,
  cleanupTempFile
};
