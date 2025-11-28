const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const os = require('os');
const { initDatabase, initDatabaseDia } = require('./supabase-db');
const { crearUsuariosIniciales } = require('./init-users');

const app = express();
// Railway proporciona el puerto, en local usar 3001
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
// Railway usa 0.0.0.0 por defecto, que está bien
const HOST = process.env.HOST || '0.0.0.0';

// Database connection state (used for health check)
let databaseReady = false;

/* ============================================================
   CONFIGURACIÓN DE COOKIES PARA CROSS-ORIGIN (Vercel + Railway)
   ============================================================ */

// En producción (Railway + Vercel), siempre necesitamos sameSite: 'none' y secure: true
// porque el frontend (Vercel) y backend (Railway) están en dominios diferentes
const isProduction = NODE_ENV === 'production';

const cookieConfig = {
  httpOnly: true,
  maxAge: 24 * 60 * 60 * 1000, // 24 horas
  // Cross-origin (Vercel frontend + Railway backend) requiere sameSite: 'none' y secure: true
  // En producción SIEMPRE usar configuración cross-origin
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax'
};

/* ============================================================
   REDIS SOLO EN PRODUCCIÓN (NO ROMPE NADA LOCAL)
   ============================================================ */
let RedisStore = null;
let redis = null;

if (NODE_ENV === 'production' && process.env.REDIS_URL) {
  try {
    RedisStore = require('connect-redis').default;
    redis = require('redis').createClient({
      url: process.env.REDIS_URL
    });

    // Conectar cliente Redis
    redis.connect().catch(console.error);

    app.use(session({
      store: new RedisStore({ client: redis }),
      secret: process.env.SESSION_SECRET || 'joyeria-secret-key-2024',
      resave: false,
      saveUninitialized: false,
      cookie: cookieConfig
    }));

    console.log("🟢 Redis activado en producción");

  } catch (err) {
    console.error("❌ Error inicializando Redis:", err);
  }
} else {
  /* ============================================================
     SESIONES NORMALES (AMBIENTE LOCAL / SIN REDIS)
     ============================================================ */
  app.use(session({
    secret: process.env.SESSION_SECRET || 'joyeria-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: cookieConfig
  }));

  console.log("🟡 Sesiones locales activas (sin Redis)");
}

if (isProduction) {
  console.log("🔐 Cookies configuradas para cross-origin (sameSite: none, secure: true)");
}


/* ============================================================
   CORS — Soporte para Vercel + Railway
   ============================================================ */
const corsOptions = {
  origin: function (origin, callback) {
    
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      // Desarrollo local
      'http://localhost',
      'http://localhost/',
      'http://localhost:80',
      'http://localhost:3000',
      'http://127.0.0.1',
      'http://127.0.0.1:80',
      'http://127.0.0.1:3000',
      // Producción
      'https://sistemajoyeria-production.up.railway.app',
      'https://sistemajoyeria-frontend.vercel.app',
      // Patrones para red local
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}$/,
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d{1,5}$/,
      // Patrón para dominios de Vercel (preview deployments)
      /^https:\/\/sistemajoyeria-frontend[a-zA-Z0-9._-]*\.vercel\.app$/i
    ];

    // Agregar frontend real en producción
    if (process.env.FRONTEND_URL) {
      const frontendUrl = process.env.FRONTEND_URL.replace(/\/$/, ''); // Eliminar trailing slash si existe
      allowedOrigins.push(frontendUrl);
    }

    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        const normalizedOrigin = origin.replace(/\/$/, '');
        const normalizedAllowed = allowedOrigin.replace(/\/$/, '');
        return normalizedOrigin === normalizedAllowed;
      }
      if (allowedOrigin instanceof RegExp) return allowedOrigin.test(origin);
      return false;
    });

    if (isAllowed || NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log(`🚫 CORS bloqueado para origen: ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));


/* ============================================================
   SECURITY HEADERS
   ============================================================ */
app.use((req, res, next) => {
  // Prevent XSS attacks
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Only allow HTTPS in production
  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});


/* ============================================================
   LOGS SOLO EN DESARROLLO
   ============================================================ */
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}


/* ============================================================
   RUTAS
   ============================================================ */
const joyasRoutes = require('./routes/joyas');
const movimientosRoutes = require('./routes/movimientos');
const reportesRoutes = require('./routes/reportes');
const authRoutes = require('./routes/auth');
const ventasRoutes = require('./routes/ventas');
const cierreCajaRoutes = require('./routes/cierrecaja');
const clientesRoutes = require('./routes/clientes');
const cuentasPorCobrarRoutes = require('./routes/cuentas-por-cobrar');
const ingresosExtrasRoutes = require('./routes/ingresos-extras');
const devolucionesRoutes = require('./routes/devoluciones');
// Public routes for storefront (no authentication required)
const publicRoutes = require('./routes/public');

app.use('/api/joyas', joyasRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/cierrecaja', cierreCajaRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/cuentas-por-cobrar', cuentasPorCobrarRoutes);
app.use('/api/ingresos-extras', ingresosExtrasRoutes);
app.use('/api/devoluciones', devolucionesRoutes);
// Public API for storefront - accessible without authentication
app.use('/api/public', publicRoutes);


/* ============================================================
   HEALTHCHECK
   ============================================================ */
app.get('/health', (req, res) => {
  // Always return 200 for Railway health checks (server is up)
  // Include database status for debugging
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    database: 'Supabase (PostgreSQL)',
    databaseConnected: databaseReady
  });
});


/* ============================================================
   HOME
   ============================================================ */
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


/* ============================================================
   404
   ============================================================ */
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path
  });
});


/* ============================================================
   MANEJO DE ERRORES
   ============================================================ */
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'JSON inválido en la petición' });
  }

  res.status(err.status || 500).json({
    error: NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message
  });
});


/* ============================================================
   CIERRA GRACEFUL
   ============================================================ */
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});


/* ============================================================
   INICIAR SERVIDOR + BASE DE DATOS
   ============================================================ */
let server;

console.log('🚀 Iniciando Sistema de Joyería v2.0...');
console.log('📊 Base de datos: Supabase (PostgreSQL)');
console.log('🖼️  Imágenes: Cloudinary');
console.log('🛒 E-commerce Ready: Sí');

// Railway/Cloud deployment pattern: Start server FIRST, then initialize database
// This ensures health checks pass quickly while database connects in background
server = app.listen(PORT, HOST, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📊 Ambiente: ${NODE_ENV}`);
  console.log(`🌐 Host: ${HOST}`);
  
  // En desarrollo, mostrar IP de red local para acceso multi-dispositivo
  if (NODE_ENV === 'development') {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    for (const k in interfaces) {
      for (const k2 in interfaces[k]) {
        const address = interfaces[k][k2];
        if (address.family === 'IPv4' && !address.internal) {
          addresses.push(address.address);
        }
      }
    }
    if (addresses.length > 0) {
      console.log(`📱 Acceso desde red local: http://${addresses[0]}:${PORT}`);
    }
  }
  
  console.log(`${'='.repeat(60)}\n`);
  console.log('⏳ Conectando a base de datos...');
  
  // Initialize database after server is listening (async, non-blocking)
  Promise.all([initDatabase(), initDatabaseDia()])
    .then(() => crearUsuariosIniciales())
    .then(() => {
      databaseReady = true;
      console.log('✅ Base de datos inicializada correctamente');
    })
    .catch((err) => {
      console.error('❌ Error al inicializar la base de datos:', err);
      // Don't exit - server can still respond to health checks
      // API calls will fail until database is ready
    });
});
