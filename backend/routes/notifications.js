/**
 * Routes: Push Notifications
 * 
 * Handles browser push notification subscriptions and test notifications.
 */

const express = require('express');
const router = express.Router();
const PushSubscription = require('../models/PushSubscription');
const { requireAuth } = require('../middleware/auth');
const {
  enviarAUsuario,
  enviarATodos,
  crearPayload
} = require('../services/pushNotificationService');

/**
 * GET /api/notifications/vapid-public
 * Get VAPID public key for client subscription
 * No auth required - public key is meant to be public
 */
router.get('/vapid-public', (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return res.status(503).json({
      error: 'Push notifications not configured'
    });
  }

  res.json({
    success: true,
    publicKey
  });
});

/**
 * POST /api/notifications/subscribe
 * Register a new push notification subscription
 * Requires authentication
 */
router.post('/subscribe', requireAuth, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;

    // Validate required fields
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({
        error: 'Missing required subscription fields'
      });
    }

    // Save subscription
    const subscription = await PushSubscription.guardar({
      id_usuario: req.session.userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      user_agent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: subscription,
      message: 'Subscription saved successfully'
    });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ error: error.message || 'Error saving subscription' });
  }
});

/**
 * DELETE /api/notifications/unsubscribe
 * Remove a push notification subscription
 * Requires authentication
 */
router.delete('/unsubscribe', requireAuth, async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Missing endpoint' });
    }

    await PushSubscription.eliminarPorEndpoint(endpoint);

    res.json({
      success: true,
      message: 'Subscription removed successfully'
    });
  } catch (error) {
    console.error('Error removing subscription:', error);
    res.status(500).json({ error: 'Error removing subscription' });
  }
});

/**
 * POST /api/notifications/test
 * Send a test notification (admin only)
 * Requires authentication
 */
router.post('/test', requireAuth, async (req, res) => {
  try {
    // Optional: Add admin check here if needed
    // if (!req.session.isAdmin) {
    //   return res.status(403).json({ error: 'Admin access required' });
    // }

    const userId = req.session.userId;
    const { title, body } = req.body;

    const payload = crearPayload({
      title: title || '🧪 Test Notification',
      body: body || 'This is a test notification from the POS system',
      data: {
        url: '/',
        tipo: 'test'
      }
    });

    const sentCount = await enviarAUsuario(userId, payload);

    if (sentCount === 0) {
      return res.json({
        success: false,
        message: 'No active subscriptions found for your user'
      });
    }

    res.json({
      success: true,
      message: `Test notification sent to ${sentCount} device(s)`
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Error sending test notification' });
  }
});

/**
 * POST /api/notifications/broadcast
 * Send notification to all users (admin only)
 * Internal use - called from other services
 */
router.post('/broadcast', requireAuth, async (req, res) => {
  try {
    const { title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Missing title or body' });
    }

    const payload = crearPayload({
      title,
      body,
      data: data || {},
      requireInteraction: true
    });

    const sentCount = await enviarATodos(payload);

    res.json({
      success: true,
      message: `Notification sent to ${sentCount} device(s)`
    });
  } catch (error) {
    console.error('Error broadcasting notification:', error);
    res.status(500).json({ error: 'Error broadcasting notification' });
  }
});

module.exports = router;
