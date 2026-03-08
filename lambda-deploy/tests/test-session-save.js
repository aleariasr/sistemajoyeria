/**
 * Test for session save fix
 * DEPRECATED: This test was for express-session with explicit save() calls.
 * The application now uses cookie-session which saves automatically.
 * See test-cookie-session.js for current session tests.
 */

console.log('⚠️  DEPRECATED: This test is for express-session (old implementation)\n');
console.log('📋 Current implementation uses cookie-session');
console.log('✅ See test-cookie-session.js for current session tests\n');

const fs = require('fs');
const path = require('path');

let allPassed = true;

// Test 1: Verify server.js contains environment validation
const serverFilePath = path.join(__dirname, '..', 'server.js');
const serverContent = fs.readFileSync(serverFilePath, 'utf8');

// Test environment validation
if (serverContent.includes('Variables de entorno faltantes')) {
  console.log('✅ PASS: Environment variable validation is present');
} else {
  console.log('❌ FAIL: Environment variable validation is missing');
  allPassed = false;
}

// Test required vars check
const requiredVars = ['SESSION_SECRET', 'FRONTEND_URL', 'SUPABASE_URL', 'SUPABASE_KEY'];
let requiredVarsFound = true;
for (const varName of requiredVars) {
  if (!serverContent.includes(`'${varName}'`)) {
    console.log(`❌ FAIL: Required variable '${varName}' not in validation list`);
    requiredVarsFound = false;
    allPassed = false;
  }
}
if (requiredVarsFound) {
  console.log('✅ PASS: All required environment variables are validated');
}

// Test debugging middleware
if (serverContent.includes('Login request recibido')) {
  console.log('✅ PASS: Login debugging middleware is present');
} else {
  console.log('❌ FAIL: Login debugging middleware is missing');
  allPassed = false;
}

// Summary
console.log('\n' + '='.repeat(60));
if (allPassed) {
  console.log('✅ All tests passed!');
  console.log('\n💡 Note: For full session testing, run: node tests/test-cookie-session.js');
  process.exit(0);
} else {
  console.log('❌ Some tests failed!');
  process.exit(1);
}
