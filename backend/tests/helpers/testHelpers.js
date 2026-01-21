/**
 * Test Helper Utilities
 * Provides utilities for setting up test app and simulating auth
 */

const request = require('supertest');
const express = require('express');
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');

/**
 * Create Express app with mocked dependencies
 */
function createTestApp(mockSupabase, mockCloudinary) {
  const app = express();

  // Middleware
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Session middleware
  app.use(cookieSession({
    name: 'session',
    keys: ['test-secret-key'],
    maxAge: 24 * 60 * 60 * 1000,
    secure: false,
    httpOnly: true,
    sameSite: 'lax'
  }));

  return app;
}

/**
 * Create authenticated request with session cookie
 */
function createAuthenticatedRequest(app, userId = 1, rol = 'Administrador') {
  return request.agent(app).set('Cookie', [`session=${encodeSessionCookie({ userId, rol })}`]);
}

/**
 * Encode session data to cookie format (simplified)
 */
function encodeSessionCookie(sessionData) {
  // In real app, this is encrypted by cookie-session
  // For testing, we'll use a simple approach
  return Buffer.from(JSON.stringify(sessionData)).toString('base64');
}

/**
 * Simulate login and get session cookie
 */
async function loginUser(app, username = 'admin', password = 'admin123') {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ username, password });

  // Extract cookie from response
  const cookies = response.headers['set-cookie'];
  if (cookies && cookies.length > 0) {
    return cookies[0].split(';')[0];
  }

  return null;
}

/**
 * Create request with session data
 */
function withSession(sessionData = {}) {
  return (req, res, next) => {
    req.session = sessionData;
    next();
  };
}

/**
 * Create admin session middleware
 */
function withAdminSession() {
  return withSession({ userId: 1, rol: 'Administrador' });
}

/**
 * Create dependiente session middleware
 */
function withDependienteSession() {
  return withSession({ userId: 2, rol: 'Dependiente' });
}

module.exports = {
  createTestApp,
  createAuthenticatedRequest,
  encodeSessionCookie,
  loginUser,
  withSession,
  withAdminSession,
  withDependienteSession
};
