/**
 * Integration Tests for Push Notifications Routes
 * Tests /api/notifications/* endpoints
 */

const request = require('supertest');
const express = require('express');
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
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

// Mock Cloudinary
jest.mock('../../cloudinary-config', () => require('../mocks/cloudinary.mock'));

// Mock Resend
jest.mock('resend', () => require('../mocks/resend.mock'));

// Mock push notification service
const mockPushService = {
  enviarATodos: jest.fn().mockResolvedValue(2),
  enviarAUsuario: jest.fn().mockResolvedValue(1),
  crearPayload: jest.fn((data) => data)
};

jest.mock('../../services/pushNotificationService', () => mockPushService);

describe('Push Notifications Routes Integration Tests', () => {
  let app;
  let mockSupabase;
  let fixtures;
  let adminAgent;
  let dependienteAgent;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Get fresh fixtures for each test
    fixtures = getFixtures();
    
    // Create mock Supabase with fixtures
    mockSupabase = createMockSupabase(fixtures);
    
    // Replace the supabase instance in the mocked module
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
      keys: ['test-secret-key-1', 'test-secret-key-2'],
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      secure: false,
      httpOnly: true
    }));

    // Mount routes
    const authRoutes = require('../../routes/auth');
    const notificationsRoutes = require('../../routes/notifications');
    
    app.use('/api/auth', authRoutes);
    app.use('/api/notifications', notificationsRoutes);

    // Create authenticated agents
    adminAgent = request.agent(app);
    dependienteAgent = request.agent(app);

    // Login admin
    await adminAgent
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });

    // Login dependiente
    await dependienteAgent
      .post('/api/auth/login')
      .send({ username: 'dependiente', password: 'dependiente123' });
  });

  describe('GET /api/notifications/vapid-public - Get VAPID Public Key', () => {
    
    it('should return public key when configured', async () => {
      // Set VAPID public key in env
      process.env.VAPID_PUBLIC_KEY = 'test-vapid-public-key';

      const response = await request(app)
        .get('/api/notifications/vapid-public')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.publicKey).toBe('test-vapid-public-key');
    });

    it('should return 503 when VAPID key not configured', async () => {
      // Remove VAPID key
      delete process.env.VAPID_PUBLIC_KEY;

      const response = await request(app)
        .get('/api/notifications/vapid-public')
        .expect(503);

      expect(response.body.error).toContain('not configured');
    });

    it('should not require authentication', async () => {
      process.env.VAPID_PUBLIC_KEY = 'test-key';
      
      const response = await request(app)
        .get('/api/notifications/vapid-public')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/notifications/subscribe - Subscribe to Push Notifications', () => {
    
    it('should allow authenticated user to subscribe', async () => {
      const subscriptionData = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-123',
        keys: {
          p256dh: 'test-p256dh-key',
          auth: 'test-auth-key'
        }
      };

      const response = await adminAgent
        .post('/api/notifications/subscribe')
        .send(subscriptionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should require authentication', async () => {
      const subscriptionData = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-456',
        keys: {
          p256dh: 'test-p256dh-key',
          auth: 'test-auth-key'
        }
      };

      const response = await request(app)
        .post('/api/notifications/subscribe')
        .send(subscriptionData)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should fail with missing endpoint', async () => {
      const subscriptionData = {
        keys: {
          p256dh: 'test-p256dh-key',
          auth: 'test-auth-key'
        }
      };

      const response = await adminAgent
        .post('/api/notifications/subscribe')
        .send(subscriptionData)
        .expect(400);

      expect(response.body.error).toContain('required');
    });

    it('should fail with missing keys', async () => {
      const subscriptionData = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-789'
      };

      const response = await adminAgent
        .post('/api/notifications/subscribe')
        .send(subscriptionData)
        .expect(400);

      expect(response.body.error).toContain('required');
    });

    it('should fail with incomplete keys', async () => {
      const subscriptionData = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-abc',
        keys: {
          p256dh: 'test-p256dh-key'
          // Missing auth key
        }
      };

      const response = await adminAgent
        .post('/api/notifications/subscribe')
        .send(subscriptionData)
        .expect(400);

      expect(response.body.error).toContain('required');
    });
  });

  describe('DELETE /api/notifications/unsubscribe - Unsubscribe from Push Notifications', () => {
    
    it('should allow authenticated user to unsubscribe', async () => {
      const unsubscribeData = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-to-remove'
      };

      const response = await adminAgent
        .delete('/api/notifications/unsubscribe')
        .send(unsubscribeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('removed');
    });

    it('should require authentication', async () => {
      const unsubscribeData = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint'
      };

      const response = await request(app)
        .delete('/api/notifications/unsubscribe')
        .send(unsubscribeData)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should fail with missing endpoint', async () => {
      const response = await adminAgent
        .delete('/api/notifications/unsubscribe')
        .send({})
        .expect(400);

      expect(response.body.error).toContain('endpoint');
    });
  });

  describe('POST /api/notifications/test - Send Test Notification', () => {
    
    it('should allow authenticated user to send test notification', async () => {
      const response = await adminAgent
        .post('/api/notifications/test')
        .send({
          title: 'Test Notification',
          body: 'This is a test'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();
      expect(mockPushService.enviarAUsuario).toHaveBeenCalled();
    });

    it('should use default title and body if not provided', async () => {
      const response = await adminAgent
        .post('/api/notifications/test')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPushService.crearPayload).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('Test'),
          body: expect.any(String)
        })
      );
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/notifications/test')
        .send({
          title: 'Test',
          body: 'Test body'
        })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should return success false when no subscriptions found', async () => {
      // Mock to return 0 sent notifications
      mockPushService.enviarAUsuario.mockResolvedValueOnce(0);

      const response = await adminAgent
        .post('/api/notifications/test')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No active subscriptions');
    });
  });

  describe('POST /api/notifications/broadcast - Broadcast Notification to All Users', () => {
    
    it('should allow authenticated user to broadcast notification', async () => {
      const notificationData = {
        title: 'System Update',
        body: 'The system will be updated tonight',
        data: {
          url: '/system',
          type: 'system'
        }
      };

      const response = await adminAgent
        .post('/api/notifications/broadcast')
        .send(notificationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('sent');
      expect(mockPushService.enviarATodos).toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      const notificationData = {
        title: 'Test',
        body: 'Test body'
      };

      const response = await request(app)
        .post('/api/notifications/broadcast')
        .send(notificationData)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should fail with missing title', async () => {
      const notificationData = {
        body: 'Test body'
      };

      const response = await adminAgent
        .post('/api/notifications/broadcast')
        .send(notificationData)
        .expect(400);

      expect(response.body.error).toContain('title');
    });

    it('should fail with missing body', async () => {
      const notificationData = {
        title: 'Test'
      };

      const response = await adminAgent
        .post('/api/notifications/broadcast')
        .send(notificationData)
        .expect(400);

      expect(response.body.error).toContain('body');
    });

    it('should create payload with requireInteraction flag', async () => {
      const notificationData = {
        title: 'Important Update',
        body: 'Please read this'
      };

      await adminAgent
        .post('/api/notifications/broadcast')
        .send(notificationData)
        .expect(200);

      expect(mockPushService.crearPayload).toHaveBeenCalledWith(
        expect.objectContaining({
          requireInteraction: true
        })
      );
    });
  });
});
