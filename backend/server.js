const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const { initDatabase, initDatabaseDia } = require('./supabase-db');
const { crearUsuariosIniciales } = require('./init-users');

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
// CORS configurado para múltiples dispositivos
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Lista de orígenes permitidos
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d{1,5}$/,  // IPs locales
      /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5}$/,  // Redes privadas
      /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}:\d{1,5}$/  // Redes privadas
    ];
    
    // En producción, agregar dominio real
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    
    // Verificar si el origen está permitido
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      }
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed || NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Log de peticiones en desarrollo
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Configurar sesiones
app.use(session({
  secret: 'joyeria-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Cambiar a true si se usa HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Rutas
const joyasRoutes = require('./routes/joyas');
const movimientosRoutes = require('./routes/movimientos');
const reportesRoutes = require('./routes/reportes');
const authRoutes = require('./routes/auth');
const ventasRoutes = require('./routes/ventas');
const cierreCajaRoutes = require('./routes/cierrecaja');
const clientesRoutes = require('./routes/clientes');
const cuentasPorCobrarRoutes = require('./routes/cuentas-por-cobrar');

app.use('/api/joyas', joyasRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/cierrecaja', cierreCajaRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/cuentas-por-cobrar', cuentasPorCobrarRoutes);

// Ruta de salud del servidor
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    database: 'Supabase (PostgreSQL)'
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ 
    mensaje: 'API del Sistema de Inventario de Joyería',
    version: '2.0.0',
    database: 'Supabase + Cloudinary',
    ecommerce_ready: true,
    endpoints: {
      joyas: '/api/joyas',
      movimientos: '/api/movimientos',
      reportes: '/api/reportes',
      health: '/health'
    }
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.path 
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Manejo de errores de JSON inválido
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'JSON inválido en la petición' });
  }
  
  res.status(err.status || 500).json({ 
    error: NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : err.message 
  });
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});

// Inicializar base de datos y servidor
let server;
console.log('🚀 Iniciando Sistema de Joyería v2.0...');
console.log('📊 Base de datos: Supabase (PostgreSQL)');
console.log('🖼️  Imágenes: Cloudinary');
console.log('🛒 E-commerce Ready: Sí');

Promise.all([initDatabase(), initDatabaseDia()])
  .then(() => crearUsuariosIniciales())
  .then(() => {
    server = app.listen(PORT, () => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📊 Ambiente: ${NODE_ENV}`);
      console.log(`✅ Conexión a Supabase establecida`);
      console.log(`🔐 Usuarios iniciales creados (si no existían)`);
      console.log(`${'='.repeat(60)}\n`);
      console.log('📝 Importante:');
      console.log('   - Ejecuta el script SQL en Supabase si es la primera vez');
      console.log('   - Archivo: backend/supabase-migration.sql');
      console.log(`   - URL: https://mvujkbpbqyihixkbzthe.supabase.co\n`);
    });
  })
  .catch((err) => {
    console.error('❌ Error al inicializar la aplicación:', err);
    console.error('\n⚠️  Posibles soluciones:');
    console.error('   1. Verifica que hayas ejecutado el SQL de migración en Supabase');
    console.error('   2. Verifica las credenciales de Supabase en .env');
    console.error('   3. Verifica tu conexión a internet');
    process.exit(1);
  });
