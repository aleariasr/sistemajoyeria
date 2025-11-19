/**
 * Utilidades para manejo de fechas y horas en Costa Rica
 * Timezone: America/Costa_Rica (UTC-6)
 */

// Costa Rica está en UTC-6
const COSTA_RICA_OFFSET_HOURS = -6;

/**
 * Obtiene la fecha y hora actual en Costa Rica
 * @returns {Date} Fecha ajustada a Costa Rica
 */
function obtenerFechaCostaRica() {
  const now = new Date();
  // Ajustar a UTC-6 (Costa Rica)
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const costaRicaTime = new Date(utc + (3600000 * COSTA_RICA_OFFSET_HOURS));
  return costaRicaTime;
}

/**
 * Formatea una fecha en formato ISO para SQL (YYYY-MM-DD HH:MM:SS)
 * @param {Date} fecha - Fecha a formatear (opcional, usa fecha actual de CR si no se proporciona)
 * @returns {string} Fecha formateada para SQL
 */
function formatearFechaSQL(fecha = null) {
  const fechaCR = fecha || obtenerFechaCostaRica();
  const year = fechaCR.getFullYear();
  const month = String(fechaCR.getMonth() + 1).padStart(2, '0');
  const day = String(fechaCR.getDate()).padStart(2, '0');
  const hours = String(fechaCR.getHours()).padStart(2, '0');
  const minutes = String(fechaCR.getMinutes()).padStart(2, '0');
  const seconds = String(fechaCR.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Obtiene la fecha actual en Costa Rica en formato YYYY-MM-DD
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
function obtenerFechaActualCR() {
  const fechaCR = obtenerFechaCostaRica();
  const year = fechaCR.getFullYear();
  const month = String(fechaCR.getMonth() + 1).padStart(2, '0');
  const day = String(fechaCR.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Obtiene el rango de fechas para un día completo en Costa Rica
 * @param {string} fecha - Fecha en formato YYYY-MM-DD (opcional, usa fecha actual si no se proporciona)
 * @returns {Object} Objeto con fecha_desde y fecha_hasta
 */
function obtenerRangoDia(fecha = null) {
  const fechaUsar = fecha || obtenerFechaActualCR();
  return {
    fecha_desde: `${fechaUsar} 00:00:00`,
    fecha_hasta: `${fechaUsar} 23:59:59`
  };
}

module.exports = {
  obtenerFechaCostaRica,
  formatearFechaSQL,
  obtenerFechaActualCR,
  obtenerRangoDia,
  COSTA_RICA_OFFSET_HOURS
};
