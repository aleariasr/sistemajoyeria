/**
 * Test: API routing - Verify catch-all never returns HTML for API routes
 * 
 * This test verifies the fix for the duplicate HTML error alert issue.
 * It ensures that:
 * 1. The catch-all route never serves HTML for API routes
 * 2. API 404s return JSON (not HTML)
 * 3. Non-API routes serve the frontend HTML
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

console.log('🧪 Testing API Routing Logic...\n');

// Create test app with the same routing logic as server.js
const app = express();

// Simulate some API routes
app.get('/api/joyas', (req, res) => {
  res.json({ message: 'Joyas route' });
});

app.get('/api/imagenes-joya/joya/:id', (req, res) => {
  res.json([]);
});

// Create a temporary HTML file for testing
const testHtmlPath = path.join(__dirname, 'test-index.html');
fs.writeFileSync(testHtmlPath, '<!doctype html><html><body>Test</body></html>');

// Simulate the catch-all logic from server.js
app.get('*', (req, res, next) => {
  // NEVER serve frontend HTML for API routes - let them fall through to 404 handler
  if (req.path.startsWith('/api/')) {
    // Let it fall through to the API 404 handler below
    return next();
  }
  
  // Serve React frontend for all other routes
  res.sendFile(testHtmlPath);
});

// 404 handler for API routes (must come after catch-all)
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Ruta API no encontrada',
    path: req.path,
    availableRoutes: ['/api/joyas', '/api/imagenes-joya']
  });
});

// Start test server
const server = app.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  
  let passed = 0;
  let failed = 0;
  
  // Test helper
  const test = async (name, url, expectedType, expectedStatus = 200) => {
    try {
      const response = await fetch(`${baseUrl}${url}`);
      const contentType = response.headers.get('content-type');
      const status = response.status;
      
      let body;
      if (contentType && contentType.includes('application/json')) {
        body = await response.json();
      } else {
        body = await response.text();
      }
      
      const isJson = contentType && contentType.includes('application/json');
      const isHtml = typeof body === 'string' && body.includes('<!doctype html>');
      
      // Check expectations
      let testPassed = true;
      let errorMsg = '';
      
      if (expectedType === 'json' && !isJson) {
        testPassed = false;
        errorMsg = `Expected JSON but got ${contentType}`;
      } else if (expectedType === 'html' && !isHtml) {
        testPassed = false;
        errorMsg = `Expected HTML but got ${contentType}`;
      }
      
      if (status !== expectedStatus) {
        testPassed = false;
        errorMsg = `Expected status ${expectedStatus} but got ${status}`;
      }
      
      if (testPassed) {
        console.log(`✅ PASS: ${name}`);
        passed++;
      } else {
        console.log(`❌ FAIL: ${name}`);
        console.log(`   ${errorMsg}`);
        console.log(`   Content-Type: ${contentType}`);
        console.log(`   Status: ${status}`);
        if (typeof body === 'string' && body.length < 100) {
          console.log(`   Body: ${body}`);
        } else if (typeof body === 'object') {
          console.log(`   Body: ${JSON.stringify(body)}`);
        }
        failed++;
      }
    } catch (error) {
      console.log(`❌ FAIL: ${name}`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
  };
  
  console.log('Running tests...\n');
  
  // Test 1: Valid API route should return JSON
  await test(
    'Valid API route (/api/joyas) returns JSON',
    '/api/joyas',
    'json',
    200
  );
  
  // Test 2: Valid API route with params should return JSON
  await test(
    'Valid API route with params (/api/imagenes-joya/joya/123) returns JSON',
    '/api/imagenes-joya/joya/123',
    'json',
    200
  );
  
  // Test 3: CRITICAL - Invalid API route should return JSON 404 (NOT HTML)
  await test(
    '❗ CRITICAL: Invalid API route (/api/nonexistent) returns JSON 404 (NOT HTML)',
    '/api/nonexistent',
    'json',
    404
  );
  
  // Test 4: Invalid nested API route should return JSON 404 (NOT HTML)
  await test(
    '❗ CRITICAL: Invalid nested API route (/api/imagenes-joya/invalid) returns JSON 404 (NOT HTML)',
    '/api/imagenes-joya/invalid',
    'json',
    404
  );
  
  // Test 5: Non-API route should return HTML
  await test(
    'Non-API route (/) returns HTML',
    '/',
    'html',
    200
  );
  
  // Test 6: Frontend route should return HTML
  await test(
    'Frontend route (/ventas) returns HTML',
    '/ventas',
    'html',
    200
  );
  
  // Cleanup
  server.close();
  fs.unlinkSync(testHtmlPath);
  
  // Results
  console.log('\n' + '='.repeat(60));
  console.log(`Tests completed: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60));
  
  if (failed === 0) {
    console.log('\n✅ All tests passed! API routing is correctly configured.');
    console.log('   - API routes never return HTML');
    console.log('   - API 404s return JSON');
    console.log('   - Frontend routes serve HTML');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please review the routing logic.');
    process.exit(1);
  }
});
