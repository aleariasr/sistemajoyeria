/**
 * Test script for session refresh functionality
 * Tests the new /auth/refresh-session endpoint
 */

const axios = require('axios');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const TEST_USER = {
  username: 'admin',
  password: 'admin123'
};

// Create axios instance with cookie jar simulation
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  // Store cookies manually for testing
  headers: {
    'Content-Type': 'application/json'
  }
});

let sessionCookie = null;

// Interceptor to handle cookies in Node.js environment
api.interceptors.response.use(
  (response) => {
    // Save cookies from Set-Cookie header
    const setCookie = response.headers['set-cookie'];
    if (setCookie && setCookie.length > 0) {
      sessionCookie = setCookie[0].split(';')[0];
      console.log('📝 Session cookie saved:', sessionCookie.substring(0, 30) + '...');
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.request.use(
  (config) => {
    // Add saved cookie to requests
    if (sessionCookie) {
      config.headers.Cookie = sessionCookie;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

async function testSessionRefresh() {
  console.log('\n🧪 Testing Session Refresh Functionality\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Login
    console.log('\n1️⃣ Test: Login');
    const loginResponse = await api.post('/auth/login', TEST_USER);
    console.log('✅ Login successful:', loginResponse.data.mensaje);
    console.log('👤 User:', loginResponse.data.usuario.username);

    // Test 2: Check session
    console.log('\n2️⃣ Test: Check session');
    const sessionResponse = await api.get('/auth/session');
    console.log('✅ Session valid:', sessionResponse.data.loggedIn);
    console.log('👤 User from session:', sessionResponse.data.usuario.username);

    // Test 3: Refresh session
    console.log('\n3️⃣ Test: Refresh session (with valid session)');
    const refreshResponse = await api.post('/auth/refresh-session');
    console.log('✅ Session refreshed:', refreshResponse.data.success);
    console.log('📝 Message:', refreshResponse.data.mensaje);

    // Test 4: Verify session still valid after refresh
    console.log('\n4️⃣ Test: Verify session after refresh');
    const sessionResponse2 = await api.get('/auth/session');
    console.log('✅ Session still valid:', sessionResponse2.data.loggedIn);

    // Test 5: Logout
    console.log('\n5️⃣ Test: Logout');
    await api.post('/auth/logout');
    console.log('✅ Logout successful');
    sessionCookie = null; // Clear cookie

    // Test 6: Try to refresh without valid session
    console.log('\n6️⃣ Test: Refresh session (without valid session)');
    try {
      await api.post('/auth/refresh-session');
      console.log('❌ Should have failed but succeeded');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Correctly rejected with 401:', error.response.data.error);
        console.log('✅ Expired flag:', error.response.data.expired);
      } else {
        throw error;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed!\n');
    return true;

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    console.log('\n' + '='.repeat(60));
    return false;
  }
}

// Run tests
if (require.main === module) {
  testSessionRefresh()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testSessionRefresh };
