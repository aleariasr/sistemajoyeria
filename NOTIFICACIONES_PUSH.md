# Notificaciones Push - Push Notifications System

## 📋 Descripción

Sistema de notificaciones push en navegador para alertar a usuarios del POS cuando llega un nuevo pedido online. Funciona incluso si están en otra pestaña.

## 🎯 Caso de Uso

**Flujo de Notificación:**

1. Cliente hace pedido en el storefront
2. Backend envía notificación push a todos los usuarios autenticados en POS
3. Usuarios reciben:
   - Notificación push del navegador
   - Sonido de alerta
   - Mensaje: "🛍️ Nuevo Pedido - Juan Pérez - ₡50,000"
4. Al hacer clic, se abre la página de pedidos online
5. Compatible con Chrome, Firefox, Safari

## 🗄️ Base de Datos

### Tabla: `push_subscriptions`

```sql
CREATE TABLE push_subscriptions (
  id SERIAL PRIMARY KEY,
  id_usuario INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used TIMESTAMP DEFAULT NOW()
);
```

## 🔐 Configuración VAPID

### Generar Claves

```bash
node backend/utils/generateVapidKeys.js
```

Salida:
```
🔐 Generating VAPID keys for push notifications...

✅ Keys generated successfully!

Add these to your .env file:

VAPID_PUBLIC_KEY=BN2oF_xZKhHE6eXSnxeZnLsKxWTUwTdqLTqqB15dWLRojizk__PnBx1bw6cS2ZuQpZj2vWBkjwg-KnbtJ420MnM
VAPID_PRIVATE_KEY=KfGUMKkQee-zrQ8GAS3zr4u7fves_Qdv9NqQ2fm8a6U
VAPID_SUBJECT=mailto:admin@cueroyperla.com
```

### Variables de Entorno

```env
# backend/.env
VAPID_PUBLIC_KEY=<tu_clave_publica>
VAPID_PRIVATE_KEY=<tu_clave_privada>
VAPID_SUBJECT=mailto:admin@cueroyperla.com
```

**⚠️ IMPORTANTE:** 
- La clave privada debe mantenerse **SECRETA**
- Nunca commitear al repositorio
- Usar diferentes claves para desarrollo y producción

## 📡 API Endpoints

### Backend

```
GET    /api/notifications/vapid-public      # Obtener clave pública (público)
POST   /api/notifications/subscribe         # Registrar suscripción (auth)
DELETE /api/notifications/unsubscribe       # Eliminar suscripción (auth)
POST   /api/notifications/test              # Enviar prueba (auth)
POST   /api/notifications/broadcast         # Enviar a todos (interno)
```

## 🔧 Implementación Frontend

### 1. Service Worker

**Archivo:** `frontend/public/service-worker.js`

```javascript
// Manejar notificaciones push
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      data: data.data,
      requireInteraction: data.requireInteraction,
      vibrate: data.vibrate,
      tag: 'pedido-online',
      renotify: true
    })
  );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
```

### 2. Registrar Service Worker

**Archivo:** `frontend/public/index.html`

```html
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('✅ Service Worker registrado'))
      .catch(err => console.error('❌ Error:', err));
  }
</script>
```

### 3. Solicitar Permiso y Suscribirse

**Archivo:** `frontend/src/utils/notifications.js`

```javascript
export async function activarNotificaciones() {
  // 1. Solicitar permiso del navegador
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Permiso denegado');
  }
  
  // 2. Registrar service worker
  const registration = await navigator.serviceWorker.ready;
  
  // 3. Obtener clave pública VAPID
  const response = await fetch('/api/notifications/vapid-public');
  const { publicKey } = await response.json();
  
  // 4. Suscribirse a push
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey)
  });
  
  // 5. Enviar suscripción al backend
  await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(subscription)
  });
  
  return true;
}

// Convertir clave VAPID a Uint8Array
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
```

### 4. Componente UI

**Archivo:** `frontend/src/components/NotificacionesPush.js`

```javascript
import React, { useState } from 'react';
import { activarNotificaciones } from '../utils/notifications';

function NotificacionesPush() {
  const [activadas, setActivadas] = useState(false);

  const handleActivar = async () => {
    try {
      await activarNotificaciones();
      setActivadas(true);
      alert('✅ Notificaciones activadas correctamente');
    } catch (error) {
      alert('❌ Error al activar notificaciones: ' + error.message);
    }
  };

  return (
    <div className="notificaciones-push">
      {!activadas && (
        <div className="banner">
          🔔 Activa las notificaciones para recibir alertas de pedidos online
          <button onClick={handleActivar}>Activar Notificaciones</button>
        </div>
      )}
    </div>
  );
}

export default NotificacionesPush;
```

## 📱 PWA Configuration

### Manifest.json

**Archivo:** `frontend/public/manifest.json`

```json
{
  "name": "Sistema Joyería POS",
  "short_name": "Joyería POS",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1a1a1a",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Agregar al HTML

```html
<link rel="manifest" href="/manifest.json">
<meta name="apple-mobile-web-app-capable" content="yes">
<link rel="apple-touch-icon" href="/icon-192x192.png">
```

## 🔔 Envío de Notificaciones

### Desde Pedidos Online

**Archivo:** `backend/routes/pedidos-online.js`

```javascript
const { enviarATodos, crearPayload } = require('../services/pushNotificationService');

// Después de crear pedido exitosamente
const pushPayload = crearPayload({
  title: '🛍️ Nuevo Pedido Online',
  body: `${customer.nombre} - Total: ${formatPrice(total)}`,
  icon: '/icon-192x192.png',
  badge: '/badge-72x72.png',
  data: {
    url: '/pedidos-online',
    pedidoId: idPedido,
    tipo: 'nuevo_pedido'
  },
  requireInteraction: true,
  vibrate: [200, 100, 200],
  tag: 'pedido-online'
});

enviarATodos(pushPayload).catch(err => {
  console.error('Error sending push notification:', err);
  // No falla el pedido si la notificación falla
});
```

### Notificación de Prueba

```javascript
// Desde el POS - Botón de prueba
const enviarPrueba = async () => {
  await fetch('/api/notifications/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      title: '🧪 Test Notification',
      body: 'Esta es una notificación de prueba'
    })
  });
};
```

## 🔒 Seguridad y Límites

### Rate Limiting

```javascript
// 100 notificaciones por hora por usuario
const MAX_NOTIFICATIONS_PER_HOUR = 100;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hora
```

### Validaciones

- ✅ Endpoint debe usar HTTPS
- ✅ Validar formato de suscripción
- ✅ Limpiar suscripciones inválidas automáticamente (410 Gone)
- ✅ Logs de errores sin bloquear creación de pedido

### Limpieza Automática

```javascript
// Eliminar suscripciones inactivas por 90 días
await PushSubscription.limpiarInactivas(90);
```

## 🌐 Compatibilidad

### Navegadores Soportados

| Navegador | Desktop | Mobile |
|-----------|---------|--------|
| Chrome    | ✅       | ✅      |
| Firefox   | ✅       | ✅      |
| Edge      | ✅       | ✅      |
| Safari    | ✅ 16+   | ⚠️ PWA* |
| Opera     | ✅       | ✅      |

**Safari iOS requiere:** App agregada al Home Screen (PWA)

### Safari iOS - Requisitos Adicionales

```html
<!-- Agregar meta tags para PWA en iOS -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<link rel="apple-touch-icon" href="/icon-192x192.png">
```

## 🎵 Sonido de Notificación

### Archivo de Audio

**Ubicación:** `frontend/public/sounds/notification.mp3`

### Reproducir Sonido

```javascript
// En el componente que recibe la notificación
const playNotificationSound = () => {
  const audio = new Audio('/sounds/notification.mp3');
  audio.volume = 0.5;
  audio.play().catch(err => console.error('Error playing sound:', err));
};

// Llamar cuando llega notificación
navigator.serviceWorker.addEventListener('message', (event) => {
  if (event.data.type === 'nuevo_pedido') {
    playNotificationSound();
  }
});
```

## 🧪 Testing

### Escenarios de Prueba

1. ✅ Activar notificaciones desde Dashboard
2. ✅ Crear pedido online, verificar notificación recibida
3. ✅ Notificación incluye sonido de alerta
4. ✅ Click en notificación abre página de pedidos
5. ✅ Funciona en Chrome (desktop y mobile)
6. ✅ Funciona en Safari (desktop y PWA iOS)
7. ✅ Enviar notificación de prueba

### Herramientas de Desarrollo

```javascript
// Chrome DevTools > Application > Service Workers
// - Ver service worker registrado
// - Simular notificaciones push
// - Inspeccionar suscripciones

// Chrome DevTools > Application > Push Messaging
// - Enviar notificación de prueba
```

## 📊 Monitoreo

### Logs del Servidor

```
✅ Push notifications configured
📤 Sending notification to 5 subscriptions...
✅ Sent 5/5 notifications successfully
📤 Removing invalid subscription: https://...
```

### Métricas

- Total de suscripciones activas
- Notificaciones enviadas por día
- Tasa de entrega exitosa
- Suscripciones eliminadas por inválidas

## 🚀 Deployment

### Desarrollo

1. Generar claves VAPID
2. Agregar a `.env`
3. Instalar dependencias: `npm install` en backend
4. Iniciar backend y frontend
5. Activar notificaciones desde Dashboard

### Producción

1. Generar claves VAPID para producción
2. Agregar a variables de entorno en Railway
3. Asegurar HTTPS habilitado (requerido para service workers)
4. Configurar manifest.json con URLs de producción
5. Subir iconos de notificación a Cloudinary o CDN

## 📚 Referencias

- Modelo: `backend/models/PushSubscription.js`
- Servicio: `backend/services/pushNotificationService.js`
- Rutas: `backend/routes/notifications.js`
- Utils: `backend/utils/generateVapidKeys.js`
- Integración: `backend/routes/pedidos-online.js`
- Service Worker: `frontend/public/service-worker.js`
- Utilidades: `frontend/src/utils/notifications.js`
- Componente: `frontend/src/components/NotificacionesPush.js`

## 🔗 Recursos Externos

- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [web-push npm](https://www.npmjs.com/package/web-push)
- [VAPID Protocol](https://datatracker.ietf.org/doc/html/rfc8292)
