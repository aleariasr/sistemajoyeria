/**
 * Service: Push Notification Service
 * 
 * Handles sending browser push notifications using the Web Push API.
 * Supports sending notifications to individual users or broadcasting to all.
 */

const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@cueroyperla.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  );
  console.log('✅ Push notifications configured');
} else {
  console.warn('⚠️  VAPID keys not configured. Push notifications will not work.');
  console.warn('   Run: node backend/utils/generateVapidKeys.js to generate keys');
}

/**
 * Rate limiting for push notifications
 * 
 * NOTE: This is an in-memory implementation suitable for single-instance deployments.
 * For production multi-instance deployments, consider using:
 * - Redis for distributed rate limiting
 * - Database-backed rate limiting
 * - Dedicated rate limiting service (e.g., rate-limiter-flexible)
 */
const notificationCounts = new Map();
const MAX_NOTIFICATIONS_PER_HOUR = 100;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(userId) {
  const now = Date.now();
  const userCounts = notificationCounts.get(userId) || [];
  
  // Remove old entries outside window
  const recentCounts = userCounts.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentCounts.length >= MAX_NOTIFICATIONS_PER_HOUR) {
    return false;
  }
  
  recentCounts.push(now);
  notificationCounts.set(userId, recentCounts);
  return true;
}

/**
 * Send push notification to a specific subscription
 * @param {Object} subscription - Push subscription object
 * @param {Object} payload - Notification payload
 * @returns {Promise<boolean>} Success status
 */
async function enviarNotificacion(subscription, payload) {
  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth
      }
    };

    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload)
    );

    // Update last_used timestamp
    await PushSubscription.actualizarUltimoUso(subscription.endpoint);

    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);

    // If subscription is invalid (410 Gone), remove it
    if (error.statusCode === 410) {
      console.log('📤 Removing invalid subscription:', subscription.endpoint);
      await PushSubscription.eliminarPorEndpoint(subscription.endpoint);
    }

    return false;
  }
}

/**
 * Send notification to a specific user
 * @param {number} userId - User ID
 * @param {Object} payload - Notification payload
 * @returns {Promise<number>} Number of successful deliveries
 */
async function enviarAUsuario(userId, payload) {
  // Check rate limit
  if (!checkRateLimit(userId)) {
    console.warn(`⚠️  Rate limit exceeded for user ${userId}`);
    return 0;
  }

  const subscriptions = await PushSubscription.obtenerPorUsuario(userId);
  
  if (subscriptions.length === 0) {
    console.log(`📭 No subscriptions found for user ${userId}`);
    return 0;
  }

  let successCount = 0;

  for (const subscription of subscriptions) {
    const success = await enviarNotificacion(subscription, payload);
    if (success) successCount++;
  }

  return successCount;
}

/**
 * Send notification to all subscribed users
 * @param {Object} payload - Notification payload
 * @returns {Promise<number>} Number of successful deliveries
 */
async function enviarATodos(payload) {
  const subscriptions = await PushSubscription.obtenerTodas();
  
  if (subscriptions.length === 0) {
    console.log('📭 No active subscriptions found');
    return 0;
  }

  console.log(`📤 Sending notification to ${subscriptions.length} subscriptions...`);

  let successCount = 0;

  for (const subscription of subscriptions) {
    const success = await enviarNotificacion(subscription, payload);
    if (success) successCount++;
  }

  console.log(`✅ Sent ${successCount}/${subscriptions.length} notifications successfully`);

  return successCount;
}

/**
 * Create a standard notification payload
 * @param {Object} options - Notification options
 * @returns {Object} Formatted payload
 */
function crearPayload(options) {
  const {
    title,
    body,
    icon = '/icon-192x192.png',
    badge = '/badge-72x72.png',
    data = {},
    requireInteraction = false,
    vibrate = [200, 100, 200],
    tag = 'general'
  } = options;

  return {
    title,
    body,
    icon,
    badge,
    data: {
      url: '/',
      ...data
    },
    requireInteraction,
    vibrate,
    tag,
    renotify: true
  };
}

module.exports = {
  enviarNotificacion,
  enviarAUsuario,
  enviarATodos,
  crearPayload
};
