/**
 * Integration Tests for Authentication Routes
 * Tests /api/auth/* endpoints including login, logout, session management
 */

const request = require('supertest');
const express = require('express');
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const { createMockSupabase } = require('../mocks/supabase.mock');
const { getFixtures } = require('../fixtures/data');

// Mock Supabase before requiring any modules that use it
jest.mock('../../supabase-db', () => {
  const fixtures = require('../fixtures/data').getFixtures();
  const mockSupabase = require('../mocks/supabase.mock').createMockSupabase(fixtures);
  return {
    supabase: mockSupabase
  };
});

// Mock Cloudinary (not used in auth but required by routes)
jest.mock('../../cloudinary-config', () => require('../mocks/cloudinary.mock'));

// Mock Resend (not used in auth but required by routes)
jest.mock('resend', () => require('../mocks/resend.mock'));

describe('Auth Routes Integration Tests', () => {
  let app;
  let mockSupabase;
  let fixtures;

  beforeEach(() => {
    // Get fresh fixtures for each test
    fixtures = getFixtures();
    
    // Hash passwords for test users - bcrypt hashes are consistent with same salt
    // Using hashSync to ensure synchronous execution in beforeEach
    const adminHash = bcrypt.hashSync('admin123', 10);
    const dependienteHash = bcrypt.hashSync('dependiente123', 10);
    
    // Override usuarios fixtures with proper password_hash field
    fixtures.usuarios = [
      {
        id: 1,
        username: 'admin',
        full_name: 'Admin User',
        password_hash: adminHash, // Supabase uses password_hash, not password
        role: 'administrador',
        fecha_creacion: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        username: 'dependiente',
        full_name: 'Dependiente User',
        password_hash: dependienteHash, // Supabase uses password_hash, not password
        role: 'dependiente',
        fecha_creacion: '2024-01-01T00:00:00Z'
      }
    ];

    // Create mock Supabase with correct fixtures
    mockSupabase = createMockSupabase(fixtures);
    
    // Replace the supabase instance in the mocked module
    // This needs to happen before requiring routes
    const supabaseDb = require('../../supabase-db');
    supabaseDb.supabase = mockSupabase;

    // Create Express app
    app = express();
    
    // Middleware
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    
    // Session middleware (same as production)
    app.use(cookieSession({
      name: 'session',
      keys: ['test-secret-key'],
      maxAge: 24 * 60 * 60 * 1000,
      secure: false,
      httpOnly: true,
      sameSite: 'lax'
    }));

    // Clear the require cache for routes to pick up new mock
    delete require.cache[require.resolve('../../routes/auth')];
    delete require.cache[require.resolve('../../models/Usuario')];
    
    // Mount auth routes - must be required AFTER setting up mocks
    const authRoutes = require('../../routes/auth');
    app.use('/api/auth', authRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('mensaje', 'Login exitoso');
      expect(response.body.usuario).toMatchObject({
        id: 1,
        username: 'admin',
        role: 'administrador',
        full_name: 'Admin User'
      });

      // Should set session cookie
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toMatch(/session=/);
    });

    it('should fail login with invalid username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'invalid_user',
          password: 'admin123'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Credenciales inválidas');
      expect(response.headers['set-cookie']).toBeUndefined();
    });

    it('should fail login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'wrong_password'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Credenciales inválidas');
      expect(response.headers['set-cookie']).toBeUndefined();
    });

    it('should fail login with missing username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'admin123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Usuario y contraseña son requeridos');
    });

    it('should fail login with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Usuario y contraseña son requeridos');
    });

    it('should login dependiente user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'dependiente',
          password: 'dependiente123'
        })
        .expect(200);

      expect(response.body.usuario).toMatchObject({
        id: 2,
        username: 'dependiente',
        role: 'dependiente'
      });
    });
  });

  describe('GET /api/auth/session', () => {
    it('should return session data when logged in', async () => {
      // Create an agent to maintain cookies
      const agent = request.agent(app);
      
      // First login
      await agent
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        })
        .expect(200);

      // Check session - should use the same agent
      const response = await agent
        .get('/api/auth/session')
        .expect(200);

      expect(response.body).toMatchObject({
        loggedIn: true,
        usuario: {
          id: 1,
          username: 'admin',
          role: 'administrador',
          full_name: 'Admin User'
        }
      });
    });

    it('should return not logged in when no session', async () => {
      const response = await request(app)
        .get('/api/auth/session')
        .expect(200);

      expect(response.body).toMatchObject({
        loggedIn: false
      });
    });

    it('should return not logged in after logout', async () => {
      // Create an agent to maintain cookies
      const agent = request.agent(app);
      
      // Login
      await agent
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        })
        .expect(200);

      // Logout
      await agent
        .post('/api/auth/logout')
        .expect(200);

      // Check session - should be logged out
      const response = await agent
        .get('/api/auth/session')
        .expect(200);

      expect(response.body).toMatchObject({
        loggedIn: false
      });
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully and clear session', async () => {
      // Create an agent to maintain cookies
      const agent = request.agent(app);
      
      // First login
      await agent
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        })
        .expect(200);

      // Logout
      const response = await agent
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body).toHaveProperty('mensaje', 'Sesión cerrada exitosamente');
      
      // Session cookie should be cleared (set to empty)
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should allow logout even without session', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body).toHaveProperty('mensaje', 'Sesión cerrada exitosamente');
    });
  });

  describe('POST /api/auth/refresh-session', () => {
    it('should refresh session when logged in', async () => {
      // Create an agent to maintain cookies
      const agent = request.agent(app);
      
      // Login
      await agent
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        })
        .expect(200);

      // Refresh session
      const response = await agent
        .post('/api/auth/refresh-session')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        mensaje: 'Sesión renovada exitosamente',
        usuario: {
          id: 1,
          username: 'admin',
          role: 'administrador'
        }
      });

      // Should set new session cookie
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should fail to refresh when not logged in', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-session')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Sesión no válida o expirada',
        expired: true
      });
    });
  });

  describe('Protected Routes - User Management', () => {
    let adminAgent;
    let dependienteAgent;

    beforeEach(async () => {
      // Create agents that persist cookies
      adminAgent = request.agent(app);
      dependienteAgent = request.agent(app);
      
      // Login as admin
      await adminAgent
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        })
        .expect(200);

      // Login as dependiente
      await dependienteAgent
        .post('/api/auth/login')
        .send({
          username: 'dependiente',
          password: 'dependiente123'
        })
        .expect(200);
    });

    describe('GET /api/auth/ - List all users', () => {
      it('should allow admin to list users', async () => {
        const response = await adminAgent
          .get('/api/auth/')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });

      it('should deny access to non-admin users', async () => {
        const response = await dependienteAgent
          .get('/api/auth/')
          .expect(403);

        expect(response.body).toHaveProperty('error', 'Acceso denegado');
      });

      it('should require authentication', async () => {
        const response = await request(app)
          .get('/api/auth/')
          .expect(401);

        expect(response.body).toHaveProperty('error', 'No autenticado');
      });
    });

    describe('POST /api/auth/ - Create user', () => {
      it('should allow admin to create new user', async () => {
        const response = await adminAgent
          .post('/api/auth/')
          .send({
            username: 'newuser',
            password: 'password123',
            role: 'dependiente',
            full_name: 'New User'
          })
          .expect(201);

        expect(response.body).toHaveProperty('mensaje', 'Usuario creado exitosamente');
        expect(response.body).toHaveProperty('id');
      });

      it('should deny access to non-admin users', async () => {
        const response = await dependienteAgent
          .post('/api/auth/')
          .send({
            username: 'newuser',
            password: 'password123',
            role: 'dependiente',
            full_name: 'New User'
          })
          .expect(403);

        expect(response.body).toHaveProperty('error', 'Acceso denegado');
      });

      it('should require all fields', async () => {
        const response = await adminAgent
          .post('/api/auth/')
          .send({
            username: 'newuser'
          })
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Todos los campos son requeridos');
      });

      it('should validate role', async () => {
        const response = await adminAgent
          .post('/api/auth/')
          .send({
            username: 'newuser',
            password: 'password123',
            role: 'invalid_role',
            full_name: 'New User'
          })
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Rol inválido');
      });
    });
  });

  describe('401 Unauthorized - Protected Routes Without Auth', () => {
    it('should return 401 for GET /api/auth/ without session', async () => {
      const response = await request(app)
        .get('/api/auth/')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'No autenticado');
    });

    it('should return 401 for POST /api/auth/ without session', async () => {
      const response = await request(app)
        .post('/api/auth/')
        .send({
          username: 'test',
          password: 'test',
          role: 'dependiente',
          full_name: 'Test'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'No autenticado');
    });

    it('should return 401 for PUT /api/auth/:id without session', async () => {
      const response = await request(app)
        .put('/api/auth/1')
        .send({
          username: 'test',
          role: 'dependiente',
          full_name: 'Test'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'No autenticado');
    });

    it('should return 401 for DELETE /api/auth/:id without session', async () => {
      const response = await request(app)
        .delete('/api/auth/1')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'No autenticado');
    });
  });
});
