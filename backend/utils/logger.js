/**
 * Logger utility for backend
 * 
 * Provides consistent logging across the application with appropriate
 * log levels for development vs production.
 */

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const isDevelopment = NODE_ENV === 'development';

/**
 * Logger class with level-aware methods
 */
class Logger {
  /**
   * Log informational messages (development only by default)
   * @param {...any} args - Arguments to log
   */
  static info(...args) {
    if (isDevelopment) {
      console.log(...args);
    }
  }

  /**
   * Log debug messages (development only)
   * @param {...any} args - Arguments to log
   */
  static debug(...args) {
    if (isDevelopment) {
      console.log('🔍', ...args);
    }
  }

  /**
   * Log warning messages (all environments)
   * @param {...any} args - Arguments to log
   */
  static warn(...args) {
    console.warn('⚠️', ...args);
  }

  /**
   * Log error messages (all environments)
   * @param {...any} args - Arguments to log
   */
  static error(...args) {
    console.error('❌', ...args);
  }

  /**
   * Log success messages (development only by default)
   * @param {...any} args - Arguments to log
   */
  static success(...args) {
    if (isDevelopment) {
      console.log('✅', ...args);
    }
  }

  /**
   * Log important messages (all environments)
   * Used for startup messages, critical operations
   * @param {...any} args - Arguments to log
   */
  static important(...args) {
    console.log(...args);
  }

  /**
   * Log HTTP request information (development only)
   * @param {string} method - HTTP method
   * @param {string} path - Request path
   * @param {number} [statusCode] - Response status code
   */
  static request(method, path, statusCode) {
    if (isDevelopment) {
      const status = statusCode ? `[${statusCode}]` : '';
      console.log(`🌐 ${method} ${path} ${status}`);
    }
  }

  /**
   * Express middleware for request logging
   */
  static requestMiddleware() {
    return (req, res, next) => {
      if (isDevelopment) {
        const start = Date.now();
        
        // Log when response finishes
        res.on('finish', () => {
          const duration = Date.now() - start;
          const statusEmoji = res.statusCode < 400 ? '✓' : '✗';
          console.log(
            `${statusEmoji} ${req.method} ${req.path} [${res.statusCode}] ${duration}ms`
          );
        });
      }
      next();
    };
  }
}

module.exports = Logger;
