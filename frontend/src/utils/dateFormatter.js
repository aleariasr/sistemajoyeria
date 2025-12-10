/**
 * Utilidades para formateo de fechas
 * 
 * El backend guarda las fechas en hora de Costa Rica.
 * Estas funciones formatean las fechas sin realizar conversiones de timezone,
 * mostrando la hora exactamente como viene del servidor.
 */

/**
 * Formatea una fecha en formato corto: DD/MM/YYYY HH:MM
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export function formatearFechaCorta(fecha) {
  // Usar la fecha tal como viene del servidor sin conversión de timezone
  // El servidor ya guarda en hora de Costa Rica
  const date = new Date(fecha);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Formatea una fecha en formato largo: DD de mes de YYYY, HH:MM
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Fecha formateada en formato largo
 */
export function formatearFechaLarga(fecha) {
  const MONTHS_ES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  
  // Usar la fecha tal como viene del servidor sin conversión de timezone
  // El servidor ya guarda en hora de Costa Rica
  const date = new Date(fecha);
  
  const day = date.getDate();
  const month = MONTHS_ES[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day} de ${month} de ${year}, ${hours}:${minutes}`;
}

/**
 * Formatea solo la hora de una fecha: HH:MM
 * @param {string|Date} fecha - Fecha de la cual extraer la hora
 * @returns {string} Hora formateada
 */
export function formatearHora(fecha) {
  const date = new Date(fecha);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

/**
 * Formatea solo la fecha sin hora: DD/MM/YYYY
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Fecha formateada sin hora
 */
export function formatearSoloFecha(fecha) {
  const date = new Date(fecha);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${day}/${month}/${year}`;
}
