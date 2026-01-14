/**
 * Utilidades para manejo de fechas y horas en Costa Rica
 * Timezone: America/Costa_Rica (UTC-6)
 * 
 * Usa date-fns-tz para manejo robusto de zonas horarias que:
 * - Maneja correctamente DST (Daylight Saving Time) si aplica
 * - Es consistente independientemente del timezone del servidor
 * - Usa la base de datos IANA timezone
 */

const { toZonedTime, formatInTimeZone } = require('date-fns-tz');
const { parseISO } = require('date-fns');

// Zona horaria configurable desde variable de entorno
// Por defecto: America/Costa_Rica (UTC-6)
const TIMEZONE = process.env.TZ || 'America/Costa_Rica';

// Mantener constante por compatibilidad con código existente
const COSTA_RICA_OFFSET_HOURS = -6;

/**
 * Obtiene la fecha y hora actual en la zona horaria configurada
 * @returns {Date} Fecha ajustada a la zona horaria local
 */
function obtenerFechaCostaRica() {
  // Obtener hora actual UTC y convertirla a la zona horaria configurada
  const now = new Date();
  return toZonedTime(now, TIMEZONE);
}

/**
 * Formatea una fecha en formato ISO para SQL (YYYY-MM-DDTHH:MM:SS)
 * Compatible con PostgreSQL TIMESTAMP WITH TIME ZONE
 * 
 * @param {Date} fecha - Fecha a formatear (opcional, usa fecha actual de CR si no se proporciona)
 * @returns {string} Fecha formateada para SQL en formato ISO 8601
 */
function formatearFechaSQL(fecha = null) {
  const fechaCR = fecha || obtenerFechaCostaRica();
  
  // Usar date-fns-tz para formatear correctamente en la zona horaria
  // Formato ISO 8601: YYYY-MM-DDTHH:MM:SS (compatible con PostgreSQL)
  return formatInTimeZone(fechaCR, TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
}

/**
 * Obtiene la fecha actual en la zona horaria configurada en formato YYYY-MM-DD
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
function obtenerFechaActualCR() {
  const fechaCR = obtenerFechaCostaRica();
  
  // Formatear solo la fecha usando date-fns-tz
  return formatInTimeZone(fechaCR, TIMEZONE, 'yyyy-MM-dd');
}

/**
 * Obtiene el rango de fechas para un día completo en Costa Rica
 * @param {string} fecha - Fecha en formato YYYY-MM-DD (opcional, usa fecha actual si no se proporciona)
 * @returns {Object} Objeto con fecha_desde y fecha_hasta en formato ISO
 */
function obtenerRangoDia(fecha = null) {
  const fechaUsar = fecha || obtenerFechaActualCR();
  return {
    fecha_desde: `${fechaUsar}T00:00:00`,
    fecha_hasta: `${fechaUsar}T23:59:59`
  };
}

/**
 * Convierte una fecha del frontend (string ISO) a la zona horaria configurada
 * Útil cuando el frontend envía fechas que deben interpretarse en hora local
 * 
 * @param {string} fechaISO - Fecha en formato ISO 8601
 * @returns {Date} Fecha convertida a la zona horaria local
 */
function convertirFechaFrontend(fechaISO) {
  try {
    const fecha = parseISO(fechaISO);
    return toZonedTime(fecha, TIMEZONE);
  } catch (error) {
    console.error('Error al convertir fecha del frontend:', error);
    return obtenerFechaCostaRica(); // Fallback a fecha actual
  }
}

/**
 * Formatea una fecha para mostrar en el frontend
 * Asegura que la fecha se muestre en la zona horaria correcta
 * 
 * @param {Date|string} fecha - Fecha a formatear
 * @returns {string} Fecha formateada en formato ISO para el frontend
 */
function formatearFechaParaFrontend(fecha) {
  const fechaDate = typeof fecha === 'string' ? parseISO(fecha) : fecha;
  return formatInTimeZone(fechaDate, TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
}

module.exports = {
  obtenerFechaCostaRica,
  formatearFechaSQL,
  obtenerFechaActualCR,
  obtenerRangoDia,
  convertirFechaFrontend,
  formatearFechaParaFrontend,
  COSTA_RICA_OFFSET_HOURS,
  TIMEZONE
};
