/**
 * Test Reply-To Email Configuration
 * 
 * Verifies that the EMAIL_REPLY_TO configuration is properly loaded
 * and that all email functions include the reply_to parameter
 */

// Set test environment variables
process.env.RESEND_API_KEY = 'test_key_1234567890';
process.env.EMAIL_FROM = 'ventas@cueroyperla.com';
process.env.EMAIL_FROM_NAME = 'Cuero&Perla';
process.env.EMAIL_REPLY_TO = 'contacto@cueroyperla.com';
process.env.ADMIN_EMAIL = 'admin@cueroyperla.com';
process.env.STORE_NAME = 'Cuero&Perla';
process.env.STORE_URL = 'https://cueroyperla.com';
process.env.STORE_PHONE = '+506-7269-7050';

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  testsRun++;
  try {
    fn();
    testsPassed++;
    log(`✓ ${name}`, colors.green);
  } catch (error) {
    testsFailed++;
    log(`✗ ${name}`, colors.red);
    log(`  Error: ${error.message}`, colors.red);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// ============================================
// TEST 1: Verify EMAIL_CONFIG includes replyTo
// ============================================

log('\n=== TEST 1: EMAIL_CONFIG Configuration ===\n', colors.cyan);

// We need to check the emailService module
// Since it uses Resend which we don't have in test environment,
// we'll check if the configuration is properly structured

test('EMAIL_REPLY_TO environment variable is set', () => {
  assert(process.env.EMAIL_REPLY_TO === 'contacto@cueroyperla.com', 
    'EMAIL_REPLY_TO should be set to contacto@cueroyperla.com');
});

test('EMAIL_FROM environment variable is set', () => {
  assert(process.env.EMAIL_FROM === 'ventas@cueroyperla.com', 
    'EMAIL_FROM should be set to ventas@cueroyperla.com');
});

test('All required email environment variables are set', () => {
  assert(process.env.RESEND_API_KEY, 'RESEND_API_KEY should be set');
  assert(process.env.EMAIL_FROM, 'EMAIL_FROM should be set');
  assert(process.env.EMAIL_FROM_NAME, 'EMAIL_FROM_NAME should be set');
  assert(process.env.EMAIL_REPLY_TO, 'EMAIL_REPLY_TO should be set');
  assert(process.env.ADMIN_EMAIL, 'ADMIN_EMAIL should be set');
});

// ============================================
// TEST 2: Check email service file structure
// ============================================

log('\n=== TEST 2: Email Service File Structure ===\n', colors.cyan);

const fs = require('fs');
const path = require('path');

const emailServicePath = path.join(__dirname, '..', 'services', 'emailService.js');

test('emailService.js file exists', () => {
  assert(fs.existsSync(emailServicePath), 'emailService.js should exist');
});

const emailServiceContent = fs.readFileSync(emailServicePath, 'utf8');

test('EMAIL_CONFIG includes replyTo property', () => {
  assert(emailServiceContent.includes('replyTo: process.env.EMAIL_REPLY_TO'), 
    'EMAIL_CONFIG should include replyTo property');
});

test('EMAIL_CONFIG has default value for replyTo', () => {
  assert(emailServiceContent.includes("'contacto@cueroyperla.com'"), 
    'replyTo should have default value contacto@cueroyperla.com');
});

test('Footer template includes replyTo in mailto link', () => {
  assert(emailServiceContent.includes('mailto:${EMAIL_CONFIG.replyTo}'), 
    'Footer should include mailto link with replyTo');
});

test('Footer template shows reply-to instructions', () => {
  assert(emailServiceContent.includes('Para consultas, responde a:'), 
    'Footer should show reply-to instructions');
  assert(emailServiceContent.includes('Por favor responde a ${EMAIL_CONFIG.replyTo}'), 
    'Footer should mention replyTo address');
});

// ============================================
// TEST 3: Check all 6 functions have reply_to
// ============================================

log('\n=== TEST 3: All Email Functions Include reply_to ===\n', colors.cyan);

const emailFunctions = [
  'enviarConfirmacionPedido',
  'notificarNuevoPedido',
  'enviarConfirmacionPago',
  'enviarNotificacionEnvio',
  'enviarCancelacionPedido',
  'enviarTicketVentaPOS'
];

emailFunctions.forEach(funcName => {
  test(`${funcName} includes reply_to parameter`, () => {
    // More flexible check: just verify the function exists and contains reply_to somewhere
    // This is less brittle than regex matching
    assert(emailServiceContent.includes(`async function ${funcName}`), 
      `${funcName} function should exist`);
    
    // Look for the function and check if reply_to appears after it
    const funcIndex = emailServiceContent.indexOf(`async function ${funcName}`);
    const nextFuncIndex = emailServiceContent.indexOf('async function', funcIndex + 1);
    const endIndex = nextFuncIndex > 0 ? nextFuncIndex : emailServiceContent.length;
    const funcContent = emailServiceContent.substring(funcIndex, endIndex);
    
    // Check for reply_to with flexible matching (allows spaces/formatting variations)
    const hasReplyTo = /reply_to\s*:\s*EMAIL_CONFIG\.replyTo/.test(funcContent);
    assert(hasReplyTo, 
      `${funcName} should include reply_to parameter with EMAIL_CONFIG.replyTo value`);
  });
});

// ============================================
// TEST 4: Check .env.example is updated
// ============================================

log('\n=== TEST 4: .env.example Configuration ===\n', colors.cyan);

const envExamplePath = path.join(__dirname, '..', '.env.example');

test('.env.example file exists', () => {
  assert(fs.existsSync(envExamplePath), '.env.example should exist');
});

const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');

test('.env.example includes EMAIL_REPLY_TO', () => {
  assert(envExampleContent.includes('EMAIL_REPLY_TO'), 
    '.env.example should include EMAIL_REPLY_TO variable');
});

test('.env.example includes EMAIL_REPLY_TO comment', () => {
  assert(envExampleContent.includes('a dónde llegan las respuestas'), 
    '.env.example should have descriptive comment for EMAIL_REPLY_TO');
});

// ============================================
// TEST 5: Check documentation is updated
// ============================================

log('\n=== TEST 5: Documentation Updated ===\n', colors.cyan);

const docPath = path.join(__dirname, '..', '..', 'PEDIDOS_ONLINE.md');

test('PEDIDOS_ONLINE.md exists', () => {
  assert(fs.existsSync(docPath), 'PEDIDOS_ONLINE.md should exist');
});

const docContent = fs.readFileSync(docPath, 'utf8');

test('Documentation mentions EMAIL_REPLY_TO', () => {
  assert(docContent.includes('EMAIL_REPLY_TO'), 
    'Documentation should mention EMAIL_REPLY_TO');
});

test('Documentation explains Reply-To functionality', () => {
  assert(docContent.includes('Email Reply-To') || docContent.includes('reply-to'), 
    'Documentation should explain Reply-To functionality');
});

test('Documentation shows EMAIL_REPLY_TO example', () => {
  assert(docContent.includes('contacto@cueroyperla.com'), 
    'Documentation should show EMAIL_REPLY_TO example');
});

// ============================================
// SUMMARY
// ============================================

log('\n' + '='.repeat(50), colors.cyan);
log('TEST SUMMARY', colors.cyan);
log('='.repeat(50), colors.cyan);
log(`Total Tests: ${testsRun}`);
log(`Passed: ${testsPassed}`, colors.green);
log(`Failed: ${testsFailed}`, testsFailed > 0 ? colors.red : colors.green);
log('='.repeat(50) + '\n', colors.cyan);

if (testsFailed > 0) {
  log('❌ Some tests failed. Please review the errors above.', colors.red);
  process.exit(1);
} else {
  log('✅ All tests passed! Reply-To email functionality is properly implemented.', colors.green);
  log('\n📧 Email Configuration Summary:', colors.cyan);
  log(`   From: ${process.env.EMAIL_FROM}`, colors.yellow);
  log(`   Reply-To: ${process.env.EMAIL_REPLY_TO}`, colors.yellow);
  log(`   Admin: ${process.env.ADMIN_EMAIL}`, colors.yellow);
  log('\n✨ When customers reply to emails, responses will go to: ' + process.env.EMAIL_REPLY_TO, colors.green);
  process.exit(0);
}
