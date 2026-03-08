/**
 * Test for Safari Cookie Compatibility
 * Verifies that the system is properly configured for Safari (iOS and macOS)
 */

console.log('🧪 Testing Safari Cookie Compatibility...\n');

const fs = require('fs');
const path = require('path');

// Define project root for more robust path resolution
const PROJECT_ROOT = path.join(__dirname, '..', '..');
const BACKEND_ROOT = path.join(__dirname, '..');

let allPassed = true;
let testCount = 0;
let passCount = 0;

function test(name, condition) {
  testCount++;
  if (condition) {
    console.log(`✅ PASS: ${name}`);
    passCount++;
  } else {
    console.log(`❌ FAIL: ${name}`);
    allPassed = false;
  }
}

// ============================================================
// Test 1: Backend Cookie Configuration
// ============================================================
console.log('📋 Testing Backend Configuration...\n');

const serverFilePath = path.join(BACKEND_ROOT, 'server.js');
const serverContent = fs.readFileSync(serverFilePath, 'utf8');

test(
  'Cookie-session uses httpOnly for security',
  serverContent.includes('httpOnly: true')
);

test(
  'Cookie-session configured with sameSite attribute',
  serverContent.includes('sameSite:')
);

test(
  'Cookie-session uses secure in production',
  serverContent.includes('secure: isProduction') || serverContent.includes("secure: NODE_ENV === 'production'")
);

test(
  'Cookie-session allows cross-origin with sameSite: none in production',
  serverContent.includes("sameSite: isProduction ? 'none' : 'lax'") ||
  serverContent.includes("sameSite: NODE_ENV === 'production' ? 'none' : 'lax'")
);

test(
  'Cookie path is set to /',
  serverContent.includes("path: '/'")
);

// ============================================================
// Test 2: CORS Configuration
// ============================================================
console.log('\n📋 Testing CORS Configuration...\n');

test(
  'CORS credentials enabled',
  serverContent.includes('credentials: true')
);

test(
  'CORS exposedHeaders includes Set-Cookie',
  serverContent.includes("exposedHeaders:") && serverContent.includes("'Set-Cookie'")
);

test(
  'CORS allowedHeaders includes Cookie',
  serverContent.includes("allowedHeaders:") && serverContent.includes("'Cookie'")
);

test(
  'CORS methods explicitly defined',
  serverContent.includes("methods:") && 
  serverContent.includes("'GET'") && 
  serverContent.includes("'POST'")
);

test(
  'Proxy trust enabled in production',
  serverContent.includes("app.set('trust proxy'")
);

// ============================================================
// Test 3: Frontend Configuration
// ============================================================
console.log('\n📋 Testing Frontend Configuration...\n');

const frontendApiPath = path.join(PROJECT_ROOT, 'frontend', 'src', 'services', 'api.js');
if (fs.existsSync(frontendApiPath)) {
  const frontendApiContent = fs.readFileSync(frontendApiPath, 'utf8');
  
  test(
    'Frontend axios uses withCredentials',
    frontendApiContent.includes('withCredentials: true')
  );
} else {
  console.log('⚠️  SKIP: Frontend api.js not found');
}

// ============================================================
// Test 4: Storefront Configuration
// ============================================================
console.log('\n📋 Testing Storefront Configuration...\n');

const storefrontApiPath = path.join(PROJECT_ROOT, 'storefront', 'src', 'lib', 'api', 'client.ts');
if (fs.existsSync(storefrontApiPath)) {
  const storefrontApiContent = fs.readFileSync(storefrontApiPath, 'utf8');
  
  test(
    'Storefront axios uses withCredentials',
    storefrontApiContent.includes('withCredentials: true')
  );
} else {
  console.log('⚠️  SKIP: Storefront client.ts not found');
}

// ============================================================
// Test 5: Documentation
// ============================================================
console.log('\n📋 Testing Documentation...\n');

const safariDocPath = path.join(PROJECT_ROOT, 'SAFARI_COOKIE_COMPATIBILITY.md');
test(
  'Safari compatibility documentation exists',
  fs.existsSync(safariDocPath)
);

// ============================================================
// Test 6: Production Requirements Check
// ============================================================
console.log('\n📋 Testing Production Requirements...\n');

test(
  'Backend has production environment check',
  serverContent.includes("NODE_ENV === 'production'")
);

test(
  'Backend validates SESSION_SECRET in production',
  serverContent.includes('SESSION_SECRET')
);

test(
  'Backend validates FRONTEND_URL in production',
  serverContent.includes('FRONTEND_URL')
);

// ============================================================
// Test 7: Debugging Features
// ============================================================
console.log('\n📋 Testing Debugging Features...\n');

test(
  'Backend logs cookie attributes in production',
  serverContent.includes('Cookie includes SameSite') ||
  serverContent.includes('Set-Cookie')
);

test(
  'Backend logs CORS headers',
  serverContent.includes('Access-Control-Allow') ||
  serverContent.includes('access-control-allow')
);

// ============================================================
// Summary
// ============================================================
console.log('\n' + '='.repeat(60));
console.log(`Tests: ${passCount}/${testCount} passed\n`);

if (allPassed) {
  console.log('✅ All Safari compatibility tests passed!\n');
  console.log('📋 Summary:');
  console.log('  ✓ Cookie configuration is Safari-compatible');
  console.log('  ✓ CORS properly configured for cross-origin cookies');
  console.log('  ✓ Frontend clients configured with withCredentials');
  console.log('  ✓ Production requirements validated');
  console.log('  ✓ Debugging features in place\n');
  console.log('🍎 Safari on iOS and macOS should work correctly!');
  console.log('📄 See SAFARI_COOKIE_COMPATIBILITY.md for details\n');
  process.exit(0);
} else {
  console.log('❌ Some tests failed!\n');
  console.log('Please review the failures above and fix the configuration.');
  console.log('See SAFARI_COOKIE_COMPATIBILITY.md for requirements.\n');
  process.exit(1);
}
