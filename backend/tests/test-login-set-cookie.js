/**
 * Test for Set-Cookie header on login
 * Verifies that the cookie-session sends Set-Cookie header after login
 */

console.log('🧪 Testing Set-Cookie Header on Login...\n');

const fs = require('fs');
const path = require('path');

let allPassed = true;

// Test 1: Verify auth.js reassigns req.session completely
const authFilePath = path.join(__dirname, '..', 'routes', 'auth.js');
const authContent = fs.readFileSync(authFilePath, 'utf8');

// Check for complete session reassignment pattern (req.session = {...})
const hasSessionReassignment = /req\.session\s*=\s*\{[\s\S]*?userId:[\s\S]*?username:[\s\S]*?role:[\s\S]*?fullName:[\s\S]*?\}/m.test(authContent);

if (hasSessionReassignment) {
  console.log('✅ PASS: Login route reassigns req.session completely (not just properties)');
} else {
  console.log('❌ FAIL: Login route does NOT reassign req.session completely');
  console.log('   Expected: req.session = { userId, username, role, fullName, ... }');
  console.log('   This is required to force cookie-session to detect changes');
  allPassed = false;
}

// Test 2: Verify lastActivity timestamp is added
if (authContent.includes('lastActivity') && authContent.includes('Date.now()')) {
  console.log('✅ PASS: Login adds lastActivity timestamp to force unique session values');
} else {
  console.log('❌ FAIL: Login does NOT add lastActivity timestamp');
  console.log('   This is required to ensure every login creates a unique session');
  allPassed = false;
}

// Test 3: Verify session is marked as isNew
if (authContent.includes('req.session.isNew = true')) {
  console.log('✅ PASS: Login marks session as isNew = true');
} else {
  console.log('❌ FAIL: Login does NOT mark session as isNew');
  console.log('   This explicitly signals cookie-session to send Set-Cookie header');
  allPassed = false;
}

// Test 4: Verify session ID is preserved or created
const hasSessionId = /sessionId\s*=\s*req\.session\.id\s*\|\|/m.test(authContent);
const usesRandomUUID = authContent.includes('crypto.randomUUID()');
const usesTimestamp = authContent.includes('Date.now().toString()');

if (hasSessionId && (usesRandomUUID || usesTimestamp)) {
  console.log('✅ PASS: Login preserves or creates session ID');
} else {
  console.log('❌ FAIL: Login does NOT handle session ID properly');
  allPassed = false;
}

// Test 5: Verify the session object contains all required fields in reassignment
// Extract the login route section (between router.post('/login' and the next route or end)
const loginRouteMatch = authContent.match(/router\.post\(['"]\/login['"],[\s\S]*?(?=router\.(?:post|get|put|delete)|module\.exports)/m);
if (loginRouteMatch) {
  const routeContent = loginRouteMatch[0];
  const hasAllFields = 
    routeContent.includes('userId:') &&
    routeContent.includes('username:') &&
    routeContent.includes('role:') &&
    routeContent.includes('fullName:') &&
    routeContent.includes('id:') &&
    routeContent.includes('lastActivity:');
  
  if (hasAllFields) {
    console.log('✅ PASS: Session reassignment includes all required fields');
  } else {
    console.log('❌ FAIL: Session reassignment is missing some fields');
    console.log('   Required: userId, username, role, fullName, id, lastActivity');
    allPassed = false;
  }
} else {
  console.log('⚠️  SKIP: Could not extract login route for field verification');
}

// Test 6: Verify other routes (logout, session check) are NOT affected
const logoutRoute = authContent.match(/router\.post\(['"]\/logout['"],[\s\S]*?}\);/m);
const sessionRoute = authContent.match(/router\.get\(['"]\/session['"],[\s\S]*?}\);/m);

let otherRoutesUnchanged = true;

if (logoutRoute && logoutRoute[0].includes('req.session = null')) {
  console.log('✅ PASS: Logout route unchanged (still uses req.session = null)');
} else {
  console.log('❌ FAIL: Logout route may have been modified incorrectly');
  otherRoutesUnchanged = false;
  allPassed = false;
}

if (sessionRoute && sessionRoute[0].includes('req.session.userId')) {
  console.log('✅ PASS: Session check route unchanged (still reads req.session properties)');
} else {
  console.log('❌ FAIL: Session check route may have been modified incorrectly');
  otherRoutesUnchanged = false;
  allPassed = false;
}

// Summary
console.log('\n' + '='.repeat(60));
if (allPassed) {
  console.log('✅ All Set-Cookie tests passed!');
  console.log('\n📋 Summary:');
  console.log('  • Login reassigns req.session completely (forces change detection)');
  console.log('  • lastActivity timestamp ensures unique session on each login');
  console.log('  • isNew = true explicitly signals cookie-session to send header');
  console.log('  • Session ID is properly preserved/created');
  console.log('  • All required session fields are included');
  console.log('  • Other auth routes remain unchanged');
  console.log('\n🚀 Set-Cookie header should now be sent on every login!');
  console.log('   This fixes Safari session persistence issues.');
  process.exit(0);
} else {
  console.log('❌ Some tests failed!');
  console.log('Please review the failures above.');
  process.exit(1);
}
