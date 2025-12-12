/**
 * Test for session save fix
 * Verifies that req.session.save() is properly called during login
 */

console.log('🧪 Testing Session Save Fix...\n');

// Test 1: Verify auth.js contains req.session.save()
const fs = require('fs');
const path = require('path');

const authFilePath = path.join(__dirname, '..', 'routes', 'auth.js');
const authContent = fs.readFileSync(authFilePath, 'utf8');

let allPassed = true;

// Test that session save is called
if (authContent.includes('req.session.save(')) {
  console.log('✅ PASS: req.session.save() is present in auth.js');
} else {
  console.log('❌ FAIL: req.session.save() is NOT present in auth.js');
  allPassed = false;
}

// Test that error handling exists
if (authContent.includes('Error al guardar sesión')) {
  console.log('✅ PASS: Error handling for session save is present');
} else {
  console.log('❌ FAIL: Error handling for session save is missing');
  allPassed = false;
}

// Test that success logging exists
if (authContent.includes('Sesión guardada correctamente')) {
  console.log('✅ PASS: Success logging for session save is present');
} else {
  console.log('❌ FAIL: Success logging for session save is missing');
  allPassed = false;
}

// Test 2: Verify server.js contains environment validation
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

if (serverContent.includes('Guardando sesión')) {
  console.log('✅ PASS: Session save debugging is present');
} else {
  console.log('❌ FAIL: Session save debugging is missing');
  allPassed = false;
}

// Summary
console.log('\n' + '='.repeat(60));
if (allPassed) {
  console.log('✅ All session save fix tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed!');
  process.exit(1);
}
