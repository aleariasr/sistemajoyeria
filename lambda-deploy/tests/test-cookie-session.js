/**
 * Test for cookie-session migration
 * Verifies that cookie-session is properly configured
 */

console.log('🧪 Testing Cookie-Session Migration...\n');

const fs = require('fs');
const path = require('path');

let allPassed = true;

// Test 1: Verify package.json contains cookie-session
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (packageJson.dependencies['cookie-session']) {
  console.log('✅ PASS: cookie-session is present in package.json');
} else {
  console.log('❌ FAIL: cookie-session is NOT present in package.json');
  allPassed = false;
}

// Test 2: Verify server.js imports cookie-session
const serverFilePath = path.join(__dirname, '..', 'server.js');
const serverContent = fs.readFileSync(serverFilePath, 'utf8');

if (serverContent.includes("require('cookie-session')")) {
  console.log('✅ PASS: cookie-session is imported in server.js');
} else {
  console.log('❌ FAIL: cookie-session is NOT imported in server.js');
  allPassed = false;
}

// Test 3: Verify express-session is NOT used anymore
if (!serverContent.includes("require('express-session')")) {
  console.log('✅ PASS: express-session is NOT imported in server.js');
} else {
  console.log('❌ FAIL: express-session is still imported in server.js');
  allPassed = false;
}

// Test 4: Verify Redis code is removed
if (!serverContent.includes('RedisStore')) {
  console.log('✅ PASS: Redis configuration is removed from server.js');
} else {
  console.log('❌ FAIL: Redis configuration is still present in server.js');
  allPassed = false;
}

// Test 5: Verify cookieSession is configured
if (serverContent.includes('cookieSession({')) {
  console.log('✅ PASS: cookieSession configuration is present');
} else {
  console.log('❌ FAIL: cookieSession configuration is missing');
  allPassed = false;
}

// Test 6: Verify cookie-session settings
if (serverContent.includes("name: 'session'") && 
    serverContent.includes('keys:') &&
    serverContent.includes('maxAge:') &&
    serverContent.includes('httpOnly:') &&
    serverContent.includes('sameSite:')) {
  console.log('✅ PASS: Cookie-session has all required settings');
} else {
  console.log('❌ FAIL: Cookie-session is missing some required settings');
  allPassed = false;
}

// Test 7: Verify auth.js still uses req.session API
const authFilePath = path.join(__dirname, '..', 'routes', 'auth.js');
const authContent = fs.readFileSync(authFilePath, 'utf8');

if (authContent.includes('req.session.userId')) {
  console.log('✅ PASS: auth.js still uses req.session API');
} else {
  console.log('❌ FAIL: auth.js does not use req.session API');
  allPassed = false;
}

// Test 8: Verify logout uses cookie-session method
if (authContent.includes('req.session = null')) {
  console.log('✅ PASS: logout uses cookie-session method (req.session = null)');
} else {
  console.log('❌ FAIL: logout does not use cookie-session method');
  allPassed = false;
}

// Test 9: Verify login does NOT use req.session.save() callback (as a function call)
// Check for the pattern "req.session.save(" which indicates an actual function call
const hasSaveCallback = authContent.match(/req\.session\.save\s*\(/);
if (!hasSaveCallback) {
  console.log('✅ PASS: login does not use req.session.save() callback (automatic with cookie-session)');
} else {
  console.log('❌ FAIL: login still uses req.session.save() callback as a function call');
  allPassed = false;
}

// Test 10: Verify middleware/auth.js is still compatible
const middlewarePath = path.join(__dirname, '..', 'middleware', 'auth.js');
const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');

if (middlewareContent.includes('req.session') && middlewareContent.includes('req.session.userId')) {
  console.log('✅ PASS: middleware/auth.js is still compatible');
} else {
  console.log('❌ FAIL: middleware/auth.js may not be compatible');
  allPassed = false;
}

// Summary
console.log('\n' + '='.repeat(60));
if (allPassed) {
  console.log('✅ All cookie-session migration tests passed!');
  console.log('\n📋 Summary:');
  console.log('  • cookie-session is properly installed and configured');
  console.log('  • express-session and Redis code removed');
  console.log('  • Session API is compatible (req.session.*)');
  console.log('  • Logout properly clears session (req.session = null)');
  console.log('  • Login uses automatic save (no callback needed)');
  console.log('\n🚀 Ready for deployment to Railway!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed!');
  console.log('Please review the failures above.');
  process.exit(1);
}
