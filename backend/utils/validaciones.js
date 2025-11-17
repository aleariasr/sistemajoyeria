/**
 * Utilidades de validación y sanitización
 */

/**
 * Valida que un valor sea un número positivo
 */
const esNumeroPositivo = (valor) => {
  // Convert string to number if needed
  const num = typeof valor === 'string' ? parseFloat(valor) : valor;
  return typeof num === 'number' && !isNaN(num) && num >= 0;
};

/**
 * Valida que un valor sea un entero positivo
 */
const esEnteroPositivo = (valor) => {
  // Convert string to number if needed
  const num = typeof valor === 'string' ? parseFloat(valor) : valor;
  // Check if it's a valid number and an integer
  return typeof num === 'number' && !isNaN(num) && Number.isInteger(num) && num >= 0;
};

/**
 * Sanitiza un string removiendo caracteres peligrosos
 */
const sanitizarString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim();
};

/**
 * Valida formato de código (letras-números)
 */
const validarCodigo = (codigo) => {
  if (!codigo || typeof codigo !== 'string') return false;
  // Permite letras, números, guiones y guiones bajos
  const regex = /^[A-Z0-9_-]+$/i;
  return regex.test(codigo.trim());
};

/**
 * Valida que un string no esté vacío después de trimear
 */
const esStringNoVacio = (str) => {
  return typeof str === 'string' && str.trim().length > 0;
};

/**
 * Valida formato de moneda
 */
const validarMoneda = (moneda) => {
  const monedasValidas = ['CRC', 'USD', 'EUR'];
  return monedasValidas.includes(moneda);
};

/**
 * Valida estado de joya
 */
const validarEstado = (estado) => {
  const estadosValidos = ['Activo', 'Descontinuado', 'Agotado'];
  return estadosValidos.includes(estado);
};

/**
 * Valida tipo de movimiento
 */
const validarTipoMovimiento = (tipo) => {
  const tiposValidos = ['Entrada', 'Salida', 'Ajuste'];
  return tiposValidos.includes(tipo);
};

/**
 * Limita la longitud de un string
 */
const limitarLongitud = (str, maxLength) => {
  if (typeof str !== 'string') return str;
  return str.substring(0, maxLength);
};

module.exports = {
  esNumeroPositivo,
  esEnteroPositivo,
  sanitizarString,
  validarCodigo,
  esStringNoVacio,
  validarMoneda,
  validarEstado,
  validarTipoMovimiento,
  limitarLongitud
};

// Helper function to convert numeric fields from strings to numbers
const convertirCamposNumericos = (data) => {
  return {
    ...data,
    costo: data.costo !== undefined ? parseFloat(data.costo) : undefined,
    precio_venta: data.precio_venta !== undefined ? parseFloat(data.precio_venta) : undefined,
    stock_actual: data.stock_actual !== undefined ? parseInt(data.stock_actual, 10) : undefined,
    stock_minimo: data.stock_minimo !== undefined ? parseInt(data.stock_minimo, 10) : undefined,
    peso_gramos: data.peso_gramos !== undefined && data.peso_gramos !== '' ? parseFloat(data.peso_gramos) : undefined
  };
};

module.exports = {
  esNumeroPositivo,
  esEnteroPositivo,
  sanitizarString,
  validarCodigo,
  esStringNoVacio,
  validarMoneda,
  validarEstado,
  validarTipoMovimiento,
  limitarLongitud,
  convertirCamposNumericos
};
