/**
 * Utility functions for formatting values
 */

/**
 * Format price in Costa Rican Colones
 * @param {number} price - Price to format
 * @returns {string} Formatted price
 */
function formatPrice(price) {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 0
  }).format(price);
}

/**
 * Format price in specified currency
 * @param {number} price - Price to format
 * @param {string} currency - Currency code (CRC, USD, etc.)
 * @returns {string} Formatted price
 */
function formatPriceWithCurrency(price, currency = 'CRC') {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'CRC' ? 0 : 2
  }).format(price);
}

module.exports = {
  formatPrice,
  formatPriceWithCurrency
};
