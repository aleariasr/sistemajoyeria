/**
 * Fábrica de la aplicación Express.
 * Construye y exporta la app sin iniciar el servidor HTTP ni cargar variables de entorno.
 * Importado por server.js (arranque local) y lambda.js (AWS Lambda).
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

const app = express();

// ============================================================
// PROXY TRUST - Requerido detrás de Railway/Lambda/API Gateway
// ============================================================
if (isProduction) {
  // Confiar en el primer proxy (Railway edge / AWS API Gateway)
  app.set('trust proxy', 1);
  console.log('🔒 Proxy trust enabled');
}

// Estado de la base de datos (actualizado por server.js o lambda.js)
let databaseReady = false;

/**
 * Permite que el bootstrap (server.js / lambda.js) indique que la DB está lista.
 * Se usa en el endpoint /health para informar el estado real de la conexión.
 */
const setDatabaseReady = (value) => {
  databaseReady = value;
};

/* ============================================================
   CONFIGURACIÓN DE COOKIES PARA CROSS-ORIGIN (Vercel + Lambda)
   ============================================================ */

/*
 * NOTA DE SEGURIDAD: Protección CSRF
 *
 * Esta aplicación usa cookies de sesión con las siguientes protecciones:
 * 1. sameSite: 'none' + secure: true en producción (HTTPS requerido)
 * 2. Verificación estricta de origen CORS con allowlist
 * 3. API basada en JSON (no susceptible a CSRF clásico por formularios)
 * 4. Cookies httpOnly (no accesibles desde JavaScript)
 */

/* ============================================================
   COOKIE-SESSION CONFIGURATION (Stateless Sessions)
   ============================================================ */

// Sesiones stateless en cookie (no requiere almacenamiento en servidor)
app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_SECRET || 'joyeria-secret-key-2024'],

  // Configuración de la cookie
  maxAge: 24 * 60 * 60 * 1000, // 24 horas

  // Configuración cross-origin (para Lambda/Vercel)
  secure: isProduction,       // Solo HTTPS en producción
  httpOnly: true,             // No accesible desde JavaScript
  sameSite: isProduction ? 'none' : 'lax', // Cross-origin en producción

  path: '/',
  signed: true,
}));

console.log('✅ Cookie-session configured for cross-origin');
if (isProduction) {
  console.log('🔐 Cookies configured for cross-origin (sameSite: none, secure: true)');
}

// Logs de debugging de sesión en producción
if (isProduction) {
  app.use((req, res, next) => {
    // Log para peticiones de login
    if (req.path.includes('/auth/login') && req.method === 'POST') {
      console.log('🔐 Login request recibido:');
      console.log('  - Origin:', req.headers.origin);
      console.log('  - User-Agent:', (req.headers['user-agent']?.substring(0, 50) || 'unknown') + '...');
      console.log('  - Time:', new Date().toISOString());
    }

    // Log cuando se guarda una sesión en login
    if (req.path.includes('/auth/login') && req.session && !req.session._saveLogged) {
      console.log('💾 Cookie-session activa (sesión se guarda automáticamente en la cookie)');
      req.session._saveLogged = true;
    }

    // Hook into response para loggear Set-Cookie header
    if (req.path.includes('/auth/login') && req.method === 'POST') {
      const oldWriteHead = res.writeHead;
      res.writeHead = function(...args) {
        const setCookieHeader = res.getHeader('set-cookie');
        console.log('📤 Response headers para login:');
        console.log('  - Set-Cookie:', setCookieHeader || 'NO SET');
        if (setCookieHeader) {
          const cookieStr = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
          console.log('  - Cookie includes SameSite:', cookieStr.includes('SameSite'));
          console.log('  - Cookie includes Secure:', cookieStr.includes('Secure'));
          console.log('  - Cookie includes HttpOnly:', cookieStr.includes('HttpOnly'));
        }
        console.log('  - Secure context:', req.secure);
        console.log('  - Protocol:', req.protocol);
        console.log('  - CORS Access-Control-Allow-Credentials:', res.getHeader('access-control-allow-credentials'));
        console.log('  - CORS Access-Control-Allow-Origin:', res.getHeader('access-control-allow-origin'));
        return oldWriteHead.apply(res, args);
      };
    }

    next();
  });
}


/* ============================================================
   CORS — Soporte para Local (Windows/Mac/Linux + Móviles) + Producción (Vercel + Lambda)
   ============================================================ */

/**
 * Parsea FRONTEND_URL que puede contener múltiples URLs separadas por comas.
 * Ejemplo: FRONTEND_URL=https://pos.vercel.app,https://tienda.vercel.app
 */
function parseAllowedFrontendUrls() {
  const urls = [];

  // Soporte para lista separada por comas en FRONTEND_URL
  if (process.env.FRONTEND_URL) {
    const frontendUrls = process.env.FRONTEND_URL.split(',').map(url => url.trim());
    for (const url of frontendUrls) {
      if (url) {
        const normalizedUrl = url.replace(/\/$/, '');
        urls.push(normalizedUrl);

        // Soporte para deployments preview de Vercel
        if (normalizedUrl.includes('.vercel.app')) {
          const baseDomain = normalizedUrl.replace('https://', '').split('.')[0];
          urls.push(new RegExp(`^https:\\/\\/${baseDomain}[a-zA-Z0-9._-]*\\.vercel\\.app$`, 'i'));
        }
      }
    }
  }

  // También revisar STOREFRONT_URL para compatibilidad retroactiva
  if (process.env.STOREFRONT_URL) {
    const storefrontUrl = process.env.STOREFRONT_URL.replace(/\/$/, '');
    if (storefrontUrl && !urls.includes(storefrontUrl)) {
      urls.push(storefrontUrl);
      if (storefrontUrl.includes('.vercel.app')) {
        const baseDomain = storefrontUrl.replace('https://', '').split('.')[0];
        urls.push(new RegExp(`^https:\\/\\/${baseDomain}[a-zA-Z0-9._-]*\\.vercel\\.app$`, 'i'));
      }
    }
  }

  return urls;
}

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir peticiones sin origen (apps móviles, curl, same-origin)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      // ============================================================
      // Desarrollo local - localhost
      // ============================================================
      'http://localhost',
      'http://localhost:80',
      'http://localhost:3000',  // Frontend POS (React)
      'http://localhost:3001',  // Backend (para testing)
      'http://localhost:3002',  // Storefront (Next.js)
      'http://127.0.0.1',
      'http://127.0.0.1:80',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',

      // ============================================================
      // Red local - Dispositivos móviles y otras computadoras
      // Note: \d{1,3} es suficiente para CORS allowlisting (IPs inválidas no resuelven a hosts reales)
      // ============================================================
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}$/,
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d{1,5}$/,
      /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
      /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5}$/,
      /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}$/,
      /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}:\d{1,5}$/,

      // ============================================================
      // Producción - URLs desde variables de entorno
      // ============================================================
      ...parseAllowedFrontendUrls()
    ];

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
  optionsSuccessStatus: 200,
  exposedHeaders: ['Set-Cookie'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
};

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));


/* ============================================================
   SECURITY HEADERS
   ============================================================ */
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
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
   COOKIE DEBUGGING MIDDLEWARE (Production Only)
   ============================================================ */
if (isProduction) {
  app.use((req, res, next) => {
    const isPublicRoute = req.path.startsWith('/api/public') ||
                          req.path === '/health' ||
                          req.path === '/' ||
                          req.path.startsWith('/api/auth/login') ||
                          req.path.startsWith('/api/auth/session') ||
                          req.path.startsWith('/api/system');

    if (!isPublicRoute && !req.headers.cookie) {
      console.log(`⚠️  No cookie header for ${req.method} ${req.path}`);
      console.log(`   Origin: ${req.headers.origin || 'none'}`);
      console.log(`   User-Agent: ${(req.headers['user-agent']?.substring(0, 50) || 'unknown')}...`);
    }

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
const imagenesJoyaRoutes = require('./routes/imagenes-joya');
// Rutas públicas para el storefront (sin autenticación)
const publicRoutes = require('./routes/public');
// Gestión de pedidos online (incluye rutas públicas y de admin)
const pedidosOnlineRoutes = require('./routes/pedidos-online');
// Rutas de nuevas funcionalidades
const variantesRoutes = require('./routes/variantes');
const productosCompuestosRoutes = require('./routes/productos-compuestos');
const notificationsRoutes = require('./routes/notifications');
// Rutas de sistema (hora, health check, etc.)
const systemRoutes = require('./routes/system');

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
app.use('/api', imagenesJoyaRoutes);
// API pública para el storefront - accesible sin autenticación
app.use('/api/public', publicRoutes);
// API de pedidos online - incluye rutas públicas y de admin
app.use('/api', pedidosOnlineRoutes);
// APIs de nuevas funcionalidades
app.use('/api/variantes', variantesRoutes);
app.use('/api/productos-compuestos', productosCompuestosRoutes);
app.use('/api/notifications', notificationsRoutes);
// API de sistema - accesible sin autenticación
app.use('/api/system', systemRoutes);


/* ============================================================
   HEALTHCHECK
   ============================================================ */
app.get('/health', (req, res) => {
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
   404 - Rutas no encontradas (API-only, sin estáticos frontend)
   ============================================================ */
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path,
    message: req.path.startsWith('/api')
      ? 'Ruta API no encontrada'
      : 'Backend API-only. Usar frontend por separado.'
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
    error: isProduction
      ? 'Error interno del servidor'
      : err.message
  });
});


module.exports = { app, setDatabaseReady };
