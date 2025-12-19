/**
 * Push Notifications Utilities
 * 
 * Handles browser push notification subscription and management
 */

import { obtenerVapidPublicKey, suscribirseNotificaciones } from './api';

/**
 * Convert VAPID key from base64 to Uint8Array
 * @param {string} base64String - VAPID public key in base64 format
 * @returns {Uint8Array} Converted key
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

/**
 * Check if push notifications are supported
 * @returns {boolean} True if supported
 */
export function areSoportadasNotificaciones() {
  return 'serviceWorker' in navigator && 
         'PushManager' in window && 
         'Notification' in window;
}

/**
 * Get current notification permission status
 * @returns {string} 'granted', 'denied', or 'default'
 */
export function obtenerEstadoPermiso() {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Activate push notifications
 * @returns {Promise<boolean>} True if successfully activated
 */
export async function activarNotificaciones() {
  try {
    // 1. Check if notifications are supported
    if (!areSoportadasNotificaciones()) {
      throw new Error('Las notificaciones push no son soportadas en este navegador');
    }

    // 2. Request permission from browser
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permiso de notificaciones denegado');
    }

    // 3. Register service worker
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    
    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    // 4. Get VAPID public key from backend
    const response = await obtenerVapidPublicKey();
    const { publicKey } = response.data;

    if (!publicKey) {
      throw new Error('No se pudo obtener la clave pública VAPID del servidor');
    }

    // 5. Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    // 6. Send subscription to backend
    await suscribirseNotificaciones(subscription);

    console.log('✅ Notificaciones activadas correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error activando notificaciones:', error);
    throw error;
  }
}

/**
 * Check if user is currently subscribed to notifications
 * @returns {Promise<boolean>} True if subscribed
 */
export async function estaSuscrito() {
  try {
    if (!areSoportadasNotificaciones()) {
      return false;
    }

    const registration = await navigator.serviceWorker.getRegistration('/service-worker.js');
    if (!registration) {
      return false;
    }

    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    console.error('Error verificando suscripción:', error);
    return false;
  }
}

/**
 * Play notification sound
 */
export function reproducirSonido() {
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(err => console.error('Error reproduciendo sonido:', err));
  } catch (error) {
    console.error('Error al reproducir sonido:', error);
  }
}
