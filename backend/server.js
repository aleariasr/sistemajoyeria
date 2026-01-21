// Load environment variables from backend/.env when running locally
// This must run before other modules that read process.env
require('dotenv').config();

// Validate environment variables with comprehensive schema
const { validateEnv, logEnvStatus } = require('./utils/env-validation');

try {
  const env = validateEnv(process.env.NODE_ENV === 'production');
  logEnvStatus(env);
} catch (error) {
  console.error('\n❌ Error de inicialización:', error.message);
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { initDatabase, initDatabaseDia } = require('./supabase-db');
const { crearUsuariosIniciales } = require('./init-users');

const app = express();
// Railway proporciona el puerto, en local usar 3001
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
// Railway usa 0.0.0.0 por defecto, que está bien
const HOST = process.env.HOST || '0.0.0.0';

// ============================================================
// PROXY TRUST - Critical for Railway edge proxy
// ============================================================
// Railway uses an edge proxy (railway-edge) in front of the app.
// Express needs to trust this proxy to correctly handle cookies,
// secure connections, and client IPs in production.
if (NODE_ENV === 'production') {
  // Trust first proxy (Railway edge)
  app.set('trust proxy', 1);
  console.log('🔒 Proxy trust enabled for Railway edge');
}

// Database connection state (used for health check)
let databaseReady = false;

/* ============================================================
   CONFIGURACIÓN DE COOKIES PARA CROSS-ORIGIN (Vercel + Railway)
   ============================================================ */

// En producción (Railway + Vercel), siempre necesitamos sameSite: 'none' y secure: true
// porque el frontend (Vercel) y backend (Railway) están en dominios diferentes
const isProduction = NODE_ENV === 'production';

/*
 * SECURITY NOTE: CSRF Protection
 * 
 * This application uses session cookies for authentication with the following protections:
 * 1. sameSite: 'none' + secure: true in production (HTTPS required)
 * 2. Strict CORS origin checking with allowlist
 * 3. JSON-based API (not susceptible to classic form-based CSRF)
 * 4. httpOnly cookies (not accessible via JavaScript)
 * 
 * For additional security, consider implementing CSRF tokens for state-changing operations.
 * However, the current configuration provides adequate protection for this JSON API architecture.
 */

/* ============================================================
   COOKIE-SESSION CONFIGURATION (Stateless Sessions)
   ============================================================ */

// Configure cookie-session for stateless session management
// This stores the session directly in the cookie (encrypted), eliminating
// the need for server-side storage (Redis/MemoryStore) and avoiding issues
// with Railway proxy edge that doesn't maintain session affinity
app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_SECRET || 'joyeria-secret-key-2024'],
  
  // Cookie configuration
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  
  // Cross-origin configuration (for Railway + Vercel)
  secure: isProduction, // Only HTTPS in production
  httpOnly: true, // Not accessible from JavaScript
  sameSite: isProduction ? 'none' : 'lax', // Allow cross-origin in production
  
  // Domain configuration - don't set domain to allow cookies across Railway proxy
  // domain: undefined, // Let the browser determine the domain
  
  // Path
  path: '/',
  
  // Signed cookies (already enabled via keys, but explicit is better)
  signed: true,
}));

console.log("✅ Cookie-session configured for cross-origin");
if (isProduction) {
  console.log("🔐 Cookies configured for cross-origin (sameSite: none, secure: true)");
}

// Logs de debugging para sesiones en producción
if (NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Log para peticiones de login
    if (req.path.includes('/auth/login') && req.method === 'POST') {
      console.log('🔐 Login request recibido:');
      console.log('  - Origin:', req.headers.origin);
      console.log('  - User-Agent:', (req.headers['user-agent']?.substring(0, 50) || 'unknown') + '...');
      console.log('  - Time:', new Date().toISOString());
    }
    
    // Log cuando se guarda una sesión en login (cookie-session guarda automáticamente)
    if (req.path.includes('/auth/login') && req.session && !req.session._saveLogged) {
      console.log('💾 Cookie-session activa (sesión se guarda automáticamente en la cookie)');
      req.session._saveLogged = true;
    }
    
    // Hook into response to log Set-Cookie header
    if (req.path.includes('/auth/login') && req.method === 'POST') {
      const oldWriteHead = res.writeHead;
      res.writeHead = function(...args) {
        const setCookieHeader = res.getHeader('set-cookie');
        console.log('📤 Response headers para login:');
        console.log('  - Set-Cookie:', setCookieHeader || 'NO SET');
        if (setCookieHeader) {
          // Log cookie attributes for Safari debugging
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
   CORS — Soporte para Local (Windows/Mac/Linux + Móviles) + Producción (Vercel + Railway)
   ============================================================ */

/**
 * Parse FRONTEND_URL which can contain multiple URLs separated by commas
 * This allows supporting both POS frontend and Storefront in production
 * Example: FRONTEND_URL=https://pos.vercel.app,https://tienda.vercel.app
 */
function parseAllowedFrontendUrls() {
  const urls = [];
  
  // Support comma-separated list of URLs in FRONTEND_URL
  if (process.env.FRONTEND_URL) {
    const frontendUrls = process.env.FRONTEND_URL.split(',').map(url => url.trim());
    for (const url of frontendUrls) {
      if (url) {
        const normalizedUrl = url.replace(/\/$/, ''); // Remove trailing slash
        urls.push(normalizedUrl);
        
        // Support Vercel preview deployments
        if (normalizedUrl.includes('.vercel.app')) {
          const baseDomain = normalizedUrl.replace('https://', '').split('.')[0];
          urls.push(new RegExp(`^https:\\/\\/${baseDomain}[a-zA-Z0-9._-]*\\.vercel\\.app$`, 'i'));
        }
      }
    }
  }
  
  // Also check STOREFRONT_URL for backwards compatibility
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
    // Allow requests with no origin (like mobile apps, curl, or same-origin requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      // ============================================================
      // Desarrollo local - localhost
      // ============================================================
      'http://localhost',
      'http://localhost:80',
      'http://localhost:3000',  // Frontend POS (React)
      'http://localhost:3001',  // Backend (for testing)
      'http://localhost:3002',  // Storefront (Next.js)
      'http://127.0.0.1',
      'http://127.0.0.1:80',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      
      // ============================================================
      // Red local - Dispositivos móviles y otras computadoras
      // Soporta los tres rangos de IP privadas estándar:
      // - 192.168.x.x (Redes domésticas más comunes)
      // - 10.x.x.x (Redes empresariales y VPNs)
      // - 172.16.x.x - 172.31.x.x (Redes medianas)
      // 
      // Note: These regex patterns use \d{1,3} for each octet which technically
      // allows values 0-999 instead of the valid range 0-255. This is acceptable
      // for CORS allowlisting because:
      // 1. Invalid IPs (e.g., 192.168.999.999) won't resolve to real hosts
      // 2. Browsers can't connect to non-existent IPs, so no security risk
      // 3. Strict validation (0-255) would make patterns much more complex
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
  // Explicit headers for Safari cookie compatibility
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
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
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
   COOKIE DEBUGGING MIDDLEWARE (Production Only)
   ============================================================ */
// Log cookie presence for debugging Safari issues in production
// Only logs when there are actual issues (missing cookies)
if (NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Only log for authenticated routes (not public endpoints)
    const isPublicRoute = req.path.startsWith('/api/public') || 
                          req.path === '/health' || 
                          req.path === '/' ||
                          req.path.startsWith('/api/auth/login') ||
                          req.path.startsWith('/api/auth/session') ||
                          req.path.startsWith('/api/system');
    
    // Only log when there's an issue: missing cookie on protected route
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
// Public routes for storefront (no authentication required)
const publicRoutes = require('./routes/public');
// Online orders management (includes public and admin routes)
const pedidosOnlineRoutes = require('./routes/pedidos-online');
// New features routes
const variantesRoutes = require('./routes/variantes');
const productosCompuestosRoutes = require('./routes/productos-compuestos');
const notificationsRoutes = require('./routes/notifications');
// System routes (time, health check, etc.)
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
// Public API for storefront - accessible without authentication
app.use('/api/public', publicRoutes);
// Online orders API - includes both public and admin routes
app.use('/api', pedidosOnlineRoutes);
// New features APIs
app.use('/api/variantes', variantesRoutes);
app.use('/api/productos-compuestos', productosCompuestosRoutes);
app.use('/api/notifications', notificationsRoutes);
// System API - accessible without authentication
app.use('/api/system', systemRoutes);


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
   FRONTEND BUILD SERVING (React SPA)
   ============================================================ */
// Serve React frontend build files (if available)
// This must come AFTER all API routes to avoid overriding them

const frontendBuildPath = path.join(__dirname, '../frontend/build');
const frontendIndexPath = path.join(frontendBuildPath, 'index.html');

// Check if frontend build exists
if (fs.existsSync(frontendBuildPath)) {
  console.log('✅ Frontend build encontrado, sirviendo archivos estáticos');
  
  // Serve static files from the React build directory
  app.use(express.static(frontendBuildPath));
  
  // Catch-all handler: serve React's index.html for all non-API routes
  // This enables React Router to handle client-side routing
  app.get('*', (req, res, next) => {
    // NEVER serve frontend HTML for API routes - let them fall through to 404 handler
    if (req.path.startsWith('/api/')) {
      // Let it fall through to the API 404 handler below
      return next();
    }
    
    // Serve React frontend for all other routes
    res.sendFile(frontendIndexPath);
  });
  
  // 404 handler for API routes (must come after catch-all)
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      error: 'Ruta API no encontrada',
      path: req.path,
      availableRoutes: [
        '/api/joyas',
        '/api/imagenes-joya',
        '/api/variantes',
        '/api/productos-compuestos',
        '/api/movimientos',
        '/api/ventas',
        '/api/clientes',
        '/api/cuentas-por-cobrar',
        '/api/auth',
        '/api/public',
        '/api/system'
      ]
    });
  });
} else {
  console.log('ℹ️  Frontend build no encontrado, solo sirviendo API');
  
  // No frontend build - return 404 JSON for all unmatched routes
  app.use((req, res) => {
    res.status(404).json({
      error: 'Ruta no encontrada',
      path: req.path,
      message: req.path.startsWith('/api') 
        ? 'Ruta API no encontrada' 
        : 'Frontend build no disponible. Use frontend por separado en desarrollo.'
    });
  });
}


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
  
  // Mostrar IPs de red local para acceso multi-dispositivo
  // Esto es útil tanto en desarrollo como en producción local
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
    console.log(`\n📱 Acceso multi-dispositivo (red local):`);
    addresses.forEach(addr => {
      console.log(`   Backend API: http://${addr}:${PORT}`);
    });
    if (NODE_ENV === 'development') {
      console.log(`\n📋 Para conectar dispositivos móviles en la misma red:`);
      console.log(`   1. Asegúrese de que todos los dispositivos estén en la misma red WiFi`);
      console.log(`   2. Configure la variable de entorno en el frontend:`);
      console.log(`      REACT_APP_API_URL=http://${addresses[0]}:${PORT}/api`);
      console.log(`   3. Para el storefront:`);
      console.log(`      NEXT_PUBLIC_API_URL=http://${addresses[0]}:${PORT}/api`);
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
