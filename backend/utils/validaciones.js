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

/**
 * Sanitize input for ILIKE queries to prevent SQL injection
 * Escapes special characters used in PostgreSQL pattern matching
 * @param {string} input - Raw user input
 * @returns {string} Sanitized input safe for ILIKE queries
 */
const sanitizarParaBusqueda = (input) => {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/\\/g, '\\\\')  // Escape backslash
    .replace(/%/g, '\\%')     // Escape percent (wildcard)
    .replace(/_/g, '\\_');    // Escape underscore (single char wildcard)
};

/**
 * Helper function to convert numeric fields from strings to numbers
 * and boolean fields from strings to booleans
 * Handles empty strings and invalid values by returning undefined
 */
const convertirCamposNumericos = (data) => {
  const convertirNumero = (valor) => {
    if (valor === undefined || valor === null || valor === '') return undefined;
    const num = parseFloat(valor);
    return isNaN(num) ? undefined : num;
  };

  const convertirEntero = (valor) => {
    if (valor === undefined || valor === null || valor === '') return undefined;
    const num = parseInt(valor, 10);
    return isNaN(num) ? undefined : num;
  };

  const convertirBooleano = (valor) => {
    if (valor === undefined || valor === null || valor === '') return undefined;
    if (typeof valor === 'boolean') return valor;
    // Handle numeric values (0 = false, 1 = true, any other number = truthy)
    if (typeof valor === 'number') return valor !== 0;
    // Handle string values
    if (typeof valor === 'string') {
      const lowerValue = valor.toLowerCase().trim();
      if (lowerValue === 'true' || lowerValue === '1') return true;
      if (lowerValue === 'false' || lowerValue === '0') return false;
    }
    return undefined;
  };

  return {
    ...data,
    costo: convertirNumero(data.costo),
    precio_venta: convertirNumero(data.precio_venta),
    stock_actual: convertirEntero(data.stock_actual),
    stock_minimo: convertirEntero(data.stock_minimo),
    // Convert boolean fields from FormData strings to actual booleans
    mostrar_en_storefront: convertirBooleano(data.mostrar_en_storefront),
    es_producto_variante: convertirBooleano(data.es_producto_variante),
    es_producto_compuesto: convertirBooleano(data.es_producto_compuesto)
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
  sanitizarParaBusqueda,
  convertirCamposNumericos
};
