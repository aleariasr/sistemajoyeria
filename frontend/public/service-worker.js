/**
 * Service Worker for Push Notifications
 * 
 * Handles incoming push notifications and notification click events
 */

/* eslint-disable no-restricted-globals */

// Listen for push events
self.addEventListener('push', (event) => {
  console.log('📨 Push notification received');

  if (!event.data) {
    console.log('No data in push event');
    return;
  }

  try {
    const data = event.data.json();
    console.log('Push data:', data);

    const options = {
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/badge-72x72.png',
      data: data.data || {},
      requireInteraction: data.requireInteraction || false,
      vibrate: data.vibrate || [200, 100, 200],
      tag: data.tag || 'notification',
      renotify: true
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('Error handling push event:', error);
  }
});

// Listen for notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked');
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Service worker activation
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  event.waitUntil(clients.claim());
});

// Service worker installation
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker installing');
  self.skipWaiting();
});
