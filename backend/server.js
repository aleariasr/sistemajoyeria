// Cargar variables de entorno desde backend/.env en ejecución local.
// Debe ejecutarse ANTES que cualquier módulo que lea process.env.
require('dotenv').config();

// Validar variables de entorno con schema completo
const { validateEnv, logEnvStatus } = require('./utils/env-validation');

try {
  const env = validateEnv(process.env.NODE_ENV === 'production');
  logEnvStatus(env);
} catch (error) {
  console.error('\n❌ Error de inicialización:', error.message);
  process.exit(1);
}

const os = require('os');
const { initDatabase, initDatabaseDia } = require('./supabase-db');
const { crearUsuariosIniciales } = require('./init-users');
const { app, setDatabaseReady } = require('./app');

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
// Railway usa 0.0.0.0 por defecto, que está bien
const HOST = process.env.HOST || '0.0.0.0';

console.log('🚀 Iniciando Sistema de Joyería v2.0...');
console.log('📊 Base de datos: Supabase (PostgreSQL)');
console.log('🖼️  Imágenes: Cloudinary');
console.log('🛒 E-commerce Ready: Sí');

// Patrón Railway/Cloud: iniciar servidor PRIMERO, luego conectar DB.
// Esto garantiza que los health checks pasen rápidamente mientras la DB conecta en background.
const server = app.listen(PORT, HOST, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📊 Ambiente: ${NODE_ENV}`);
  console.log(`🌐 Host: ${HOST}`);

  // Mostrar IPs de red local para acceso multi-dispositivo
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

  // Inicializar DB después de que el servidor esté escuchando (async, sin bloquear)
  Promise.all([initDatabase(), initDatabaseDia()])
    .then(() => crearUsuariosIniciales())
    .then(() => {
      setDatabaseReady(true);
      console.log('✅ Base de datos inicializada correctamente');
    })
    .catch((err) => {
      console.error('❌ Error al inicializar la base de datos:', err);
      // No salir - el servidor puede seguir respondiendo health checks
    });
});


/* ============================================================
   CIERRE GRACEFUL
   ============================================================ */
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});
