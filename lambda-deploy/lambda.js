/**
 * AWS Lambda handler.
 * Envuelve la app Express con serverless-http para su ejecución en Lambda.
 *
 * NOTA: El estado en memoria (caché de variantes, rate-limit de pedidos,
 * contadores de notificaciones) no se comparte entre invocaciones de Lambda
 * distintas. Esto es aceptable para el caso de uso actual, pero debe
 * considerarse si se necesita consistencia estricta entre instancias.
 */

// Cargar variables de entorno (en Lambda se usan las env vars del runtime,
// .env no existe en el paquete desplegado, pero dotenv las ignora si no existe el archivo)
require('dotenv').config();

// Validar variables de entorno requeridas
const { validateEnv, logEnvStatus } = require('./utils/env-validation');

try {
  const env = validateEnv(process.env.NODE_ENV === 'production');
  logEnvStatus(env);
} catch (error) {
  console.error('\n❌ Error de configuración Lambda:', error.message);
  // En Lambda, lanzar el error para que la función falle en cold start
  // y no acepte tráfico con configuración inválida
  throw error;
}

const serverless = require('serverless-http');
const { app, setDatabaseReady } = require('./app');
const { initDatabase, initDatabaseDia } = require('./supabase-db');
const { crearUsuariosIniciales } = require('./init-users');

// Inicializar la DB una vez por contenedor Lambda (cold start).
// En invocaciones cálidas (warm) esta promesa ya está resuelta.
let dbInitPromise = null;

function getDbInitPromise() {
  if (!dbInitPromise) {
    dbInitPromise = Promise.all([initDatabase(), initDatabaseDia()])
      .then(() => crearUsuariosIniciales())
      .then(() => {
        setDatabaseReady(true);
        console.log('✅ Base de datos inicializada correctamente (Lambda cold start)');
      })
      .catch((err) => {
        console.error('❌ Error al inicializar la base de datos en Lambda:', err);
        // Permitir continuar; las rutas que usen DB fallarán individualmente
      });
  }
  return dbInitPromise;
}

const serverlessHandler = serverless(app);

/**
 * Handler principal de AWS Lambda.
 * Espera la inicialización de la DB antes de procesar el primer request.
 */
module.exports.handler = async (event, context) => {
  // Evitar que Lambda espere el event loop vacío (mejora latencia)
  context.callbackWaitsForEmptyEventLoop = false;

  await getDbInitPromise();

  return serverlessHandler(event, context);
};
