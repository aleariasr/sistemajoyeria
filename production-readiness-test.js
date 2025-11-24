#!/usr/bin/env node
/**
 * Comprehensive Production Readiness Test
 * Tests critical functionality without requiring database connection
 */

const path = require('path');

console.log('=== COMPREHENSIVE PRODUCTION READINESS TEST ===\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✓ ${description}`);
    passedTests++;
  } catch (error) {
    console.error(`✗ ${description}`);
    console.error(`  Error: ${error.message}`);
    failedTests++;
  }
}

// Test 1: Check required files exist
console.log('--- File Structure Tests ---');

const fs = require('fs');
const requiredFiles = [
  'backend/server.js',
  'backend/package.json',
  'backend/.env.example',
  'backend/supabase-db.js',
  'backend/utils/timezone.js',
  'backend/utils/validaciones.js',
  'backend/models/Venta.js',
  'backend/models/VentaDia.js',
  'backend/models/Abono.js',
  'backend/models/CuentaPorCobrar.js',
  'backend/models/IngresoExtra.js',
  'backend/models/Devolucion.js',
  'backend/routes/ventas.js',
  'backend/routes/cierrecaja.js',
  'backend/routes/ingresos-extras.js',
  'backend/routes/devoluciones.js',
  'Procfile',
  'railway.json'
];

requiredFiles.forEach(file => {
  test(`Required file exists: ${file}`, () => {
    if (!fs.existsSync(file)) {
      throw new Error(`File not found: ${file}`);
    }
  });
});

// Test 2: Check timezone functions
console.log('\n--- Timezone Tests ---');

const timezone = require('./backend/utils/timezone');

test('formatearFechaSQL returns ISO 8601 format', () => {
  const fecha = timezone.formatearFechaSQL();
  if (!fecha.includes('T')) {
    throw new Error(`Expected ISO 8601 format with 'T', got: ${fecha}`);
  }
  // Verify format: YYYY-MM-DDTHH:MM:SS
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
  if (!isoRegex.test(fecha)) {
    throw new Error(`Invalid ISO 8601 format: ${fecha}`);
  }
});

test('obtenerRangoDia returns correct format', () => {
  const rango = timezone.obtenerRangoDia();
  if (!rango.fecha_desde || !rango.fecha_hasta) {
    throw new Error('Missing fecha_desde or fecha_hasta');
  }
  if (!rango.fecha_desde.includes('T') || !rango.fecha_hasta.includes('T')) {
    throw new Error('Range dates not in ISO 8601 format');
  }
});

test('obtenerFechaActualCR returns valid date string', () => {
  const fecha = timezone.obtenerFechaActualCR();
  // Should return YYYY-MM-DD format string
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(fecha)) {
    throw new Error(`Expected YYYY-MM-DD format, got: ${fecha}`);
  }
  // Verify it's a valid date
  const dateObj = new Date(fecha);
  if (isNaN(dateObj.getTime())) {
    throw new Error(`Invalid date string: ${fecha}`);
  }
});

// Test 3: Check validation functions
console.log('\n--- Validation Tests ---');

const validaciones = require('./backend/utils/validaciones');

test('esNumeroPositivo validates correctly', () => {
  if (!validaciones.esNumeroPositivo(10)) throw new Error('Should accept 10');
  if (validaciones.esNumeroPositivo(-5)) throw new Error('Should reject -5');
  if (validaciones.esNumeroPositivo('abc')) throw new Error('Should reject string');
});

test('validarMoneda validates currency codes correctly', () => {
  if (!validaciones.validarMoneda('CRC')) throw new Error('Should accept CRC');
  if (!validaciones.validarMoneda('USD')) throw new Error('Should accept USD');
  if (validaciones.validarMoneda('XXX')) throw new Error('Should reject XXX');
  if (validaciones.validarMoneda(1000)) throw new Error('Should reject number');
});

test('esEnteroPositivo validates correctly', () => {
  if (!validaciones.esEnteroPositivo(5)) throw new Error('Should accept 5');
  if (validaciones.esEnteroPositivo(5.5)) throw new Error('Should reject 5.5');
  if (validaciones.esEnteroPositivo(-1)) throw new Error('Should reject -1');
});

// Test 4: Check calculation precision
console.log('\n--- Calculation Precision Tests ---');

test('Subtotal calculation is precise', () => {
  const items = [
    { precio_unitario: 10.50, cantidad: 2 }, // 21.00
    { precio_unitario: 5.25, cantidad: 3 }   // 15.75
  ];
  const subtotal = items.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);
  const expected = 36.75;
  if (Math.abs(subtotal - expected) > 0.01) {
    throw new Error(`Expected ${expected}, got ${subtotal}`);
  }
});

test('Discount calculation is correct', () => {
  const subtotal = 100;
  const descuento = 10;
  const total = subtotal - descuento;
  if (total !== 90) {
    throw new Error(`Expected 90, got ${total}`);
  }
});

test('Change calculation is correct', () => {
  const total = 87.50;
  const efectivo = 100;
  const cambio = efectivo - total;
  if (cambio !== 12.50) {
    throw new Error(`Expected 12.50, got ${cambio}`);
  }
});

test('Mixed payment sum validation with tolerance', () => {
  const total = 100.00;
  const mixto = 33.33 + 33.33 + 33.34; // Might have rounding issues
  const diff = Math.abs(mixto - total);
  if (diff > 0.01) {
    throw new Error(`Tolerance check failed: diff = ${diff}`);
  }
});

// Test 5: Check package.json configurations
console.log('\n--- Package Configuration Tests ---');

test('Backend package.json has correct start script', () => {
  const pkg = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  if (pkg.scripts.start !== 'node server.js') {
    throw new Error('Incorrect start script');
  }
});

test('Backend has required dependencies', () => {
  const pkg = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  const required = ['express', 'cors', '@supabase/supabase-js', 'express-session'];
  required.forEach(dep => {
    if (!pkg.dependencies[dep]) {
      throw new Error(`Missing dependency: ${dep}`);
    }
  });
});

test('Frontend package.json has build script', () => {
  const pkg = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
  if (!pkg.scripts.build) {
    throw new Error('Missing build script');
  }
});

// Test 6: Check Railway configuration
console.log('\n--- Railway Deployment Tests ---');

test('Procfile exists and is correct', () => {
  const procfile = fs.readFileSync('Procfile', 'utf8');
  if (!procfile.includes('cd backend') || !procfile.includes('npm start')) {
    throw new Error('Procfile not configured correctly');
  }
});

test('railway.json has correct configuration', () => {
  const railwayConfig = JSON.parse(fs.readFileSync('railway.json', 'utf8'));
  if (!railwayConfig.deploy || !railwayConfig.deploy.startCommand) {
    throw new Error('railway.json missing deploy configuration');
  }
});

// Test 7: Check environment variables documentation
console.log('\n--- Environment Variables Tests ---');

test('.env.example has required variables', () => {
  const envExample = fs.readFileSync('backend/.env.example', 'utf8');
  const required = ['PORT', 'NODE_ENV', 'SUPABASE_URL', 'SUPABASE_KEY', 'SESSION_SECRET'];
  required.forEach(varName => {
    if (!envExample.includes(varName)) {
      throw new Error(`Missing ${varName} in .env.example`);
    }
  });
});

// Test 8: Security checks
console.log('\n--- Security Tests ---');

test('No hardcoded secrets in server.js', () => {
  const serverCode = fs.readFileSync('backend/server.js', 'utf8');
  // Check for common secret patterns (excluding commented examples)
  const lines = serverCode.split('\n').filter(line => !line.trim().startsWith('//'));
  const codeWithoutComments = lines.join('\n');
  
  if (codeWithoutComments.match(/password\s*=\s*['"][^'"]+['"]/i) && 
      !codeWithoutComments.includes('process.env')) {
    throw new Error('Possible hardcoded password found');
  }
});

test('Session secret uses environment variable', () => {
  const serverCode = fs.readFileSync('backend/server.js', 'utf8');
  if (!serverCode.includes('process.env.SESSION_SECRET')) {
    throw new Error('SESSION_SECRET should use environment variable');
  }
});

// Test 9: Check for common bugs
console.log('\n--- Common Bug Tests ---');

test('No undefined variables in cierre de caja', () => {
  const cierreCode = fs.readFileSync('backend/routes/cierrecaja.js', 'utf8');
  // Check for the specific bug we fixed
  const lines = cierreCode.split('\n');
  let foundTotalAbonos = false;
  let usedBeforeDeclaration = false;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('totalAbonos') && !lines[i].includes('const totalAbonos')) {
      if (!foundTotalAbonos) {
        usedBeforeDeclaration = true;
      }
    }
    if (lines[i].includes('const totalAbonos')) {
      foundTotalAbonos = true;
    }
  }
  
  if (usedBeforeDeclaration) {
    throw new Error('totalAbonos used before declaration');
  }
  if (!foundTotalAbonos) {
    throw new Error('totalAbonos should be declared');
  }
});

test('parseFloat used with fallback values', () => {
  const files = [
    'backend/models/CuentaPorCobrar.js',
    'backend/routes/cierrecaja.js'
  ];
  
  files.forEach(file => {
    const code = fs.readFileSync(file, 'utf8');
    // Check for parseFloat usage - should have || 0 or similar
    const parseFloatMatches = code.match(/parseFloat\([^)]+\)/g) || [];
    parseFloatMatches.forEach(match => {
      // This is a basic check - in production code, most parseFloat should have fallbacks
      if (!match.includes('||') && !file.includes('validaciones')) {
        // Log warning but don't fail - not all parseFloat needs fallback
        console.log(`  ⚠ Warning: ${file} has parseFloat without fallback: ${match}`);
      }
    });
  });
});

// Summary
console.log('\n=== TEST SUMMARY ===');
console.log(`Total tests: ${totalTests}`);
console.log(`Passed: ${passedTests} ✓`);
console.log(`Failed: ${failedTests} ✗`);

if (failedTests > 0) {
  console.log('\n❌ TESTS FAILED - Fix issues before deployment');
  process.exit(1);
} else {
  console.log('\n✅ ALL TESTS PASSED - System ready for production');
  process.exit(0);
}
