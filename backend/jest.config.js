module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/unit/**/*.test.js',
    '**/tests/integration/auth.routes.test.js',
    '**/tests/integration/ventas.routes.test.js',
    '**/tests/integration/devoluciones.routes.test.js',
    '**/tests/integration/cierrecaja.routes.test.js',
    '**/tests/integration/cuentas-por-cobrar.routes.test.js'
  ],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'models/**/*.js',
    'routes/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
  verbose: true
};
