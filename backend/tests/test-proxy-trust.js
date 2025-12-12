/**
 * Test for proxy trust configuration
 * Verifies that Express proxy trust is properly configured for Railway
 */

console.log('🧪 Testing Proxy Trust Configuration...\n');

const fs = require('fs');
const path = require('path');

let allPassed = true;

// Test 1: Verify server.js contains proxy trust configuration
const serverFilePath = path.join(__dirname, '..', 'server.js');
const serverContent = fs.readFileSync(serverFilePath, 'utf8');

if (serverContent.includes("app.set('trust proxy', 1)")) {
  console.log('✅ PASS: Proxy trust configuration is present');
} else {
  console.log('❌ FAIL: Proxy trust configuration is missing');
  allPassed = false;
}

// Test 2: Verify proxy trust is only enabled in production
const proxyTrustPattern = /if\s*\(\s*NODE_ENV\s*===\s*['"]production['"]\s*\)\s*{[\s\S]*?app\.set\(['"]trust proxy['"],\s*1\)/;
if (proxyTrustPattern.test(serverContent)) {
  console.log('✅ PASS: Proxy trust is conditionally enabled for production only');
} else {
  console.log('❌ FAIL: Proxy trust should be conditional for production');
  allPassed = false;
}

// Test 3: Verify proxy trust is set BEFORE cookie-session
const proxyIndex = serverContent.indexOf("app.set('trust proxy', 1)");
const cookieSessionIndex = serverContent.indexOf('app.use(cookieSession({');

if (proxyIndex > 0 && cookieSessionIndex > 0 && proxyIndex < cookieSessionIndex) {
  console.log('✅ PASS: Proxy trust is configured before cookie-session');
} else {
  console.log('❌ FAIL: Proxy trust must be configured before cookie-session');
  allPassed = false;
}

// Test 4: Verify logging for proxy trust
if (serverContent.includes("console.log('🔒 Proxy trust enabled for Railway edge')")) {
  console.log('✅ PASS: Proxy trust logging is present');
} else {
  console.log('❌ FAIL: Proxy trust logging is missing');
  allPassed = false;
}

// Test 5: Verify cookieSession has signed: true
if (serverContent.includes('signed: true')) {
  console.log('✅ PASS: Cookie-session has signed: true');
} else {
  console.log('❌ FAIL: Cookie-session should have signed: true');
  allPassed = false;
}

// Test 6: Verify response header logging middleware exists
if (serverContent.includes("res.getHeader('set-cookie')") && 
    serverContent.includes('req.secure') &&
    serverContent.includes('req.protocol')) {
  console.log('✅ PASS: Response header logging middleware is present');
} else {
  console.log('❌ FAIL: Response header logging middleware is missing');
  allPassed = false;
}

// Test 7: Verify domain comment is present
if (serverContent.includes('Domain configuration') && 
    serverContent.includes('domain: undefined')) {
  console.log('✅ PASS: Domain configuration comment is present');
} else {
  console.log('❌ FAIL: Domain configuration comment is missing');
  allPassed = false;
}

// Summary
console.log('\n' + '='.repeat(60));
if (allPassed) {
  console.log('✅ All proxy trust configuration tests passed!');
  console.log('\n📋 Summary:');
  console.log('  • Proxy trust enabled for production (Railway edge)');
  console.log('  • Proxy trust configured before cookie-session');
  console.log('  • Signed cookies explicitly enabled');
  console.log('  • Response header logging for debugging');
  console.log('  • Domain configuration documented');
  console.log('\n🚀 Ready for deployment to Railway!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed!');
  console.log('Please review the failures above.');
  process.exit(1);
}
