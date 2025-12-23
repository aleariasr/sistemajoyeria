# Gestión Mejorada de Sesiones

## Descripción

Este documento describe las mejoras implementadas para la gestión de sesiones en el sistema POS de joyería, diseñadas para resolver problemas de sesiones expiradas y mejorar la experiencia del usuario.

## Problema Original

- **Sesiones expiradas silenciosamente**: Cuando la sesión del usuario expiraba, las peticiones API fallaban con 401 pero el frontend seguía mostrando al usuario como logueado.
- **Estado inconsistente**: El usuario parecía estar autenticado pero todas las operaciones fallaban.
- **Sin renovación automática**: Las sesiones no se extendían automáticamente con la actividad del usuario.

## Solución Implementada

### 1. Backend - Endpoint de Renovación de Sesión

**Archivo**: `backend/routes/auth.js`

Se agregó un nuevo endpoint `POST /auth/refresh-session` que:
- Verifica que existe una sesión válida
- Actualiza la marca de tiempo de actividad
- Fuerza el envío de un nuevo Set-Cookie header con el maxAge renovado
- Retorna 401 si la sesión ya expiró

```javascript
router.post('/refresh-session', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ 
      error: 'Sesión no válida o expirada',
      expired: true 
    });
  }

  req.session.lastActivity = Date.now();
  req.session.isNew = true;
  
  res.json({ 
    success: true,
    mensaje: 'Sesión renovada exitosamente',
    usuario: { /* datos del usuario */ }
  });
});
```

### 2. Frontend - Interceptor de Axios

**Archivo**: `frontend/src/services/api.js`

Se implementó un interceptor de respuesta que:
- Detecta errores 401 (Unauthorized)
- Previene múltiples llamadas de logout simultáneas
- Llama automáticamente al handler `window.onSessionExpired`
- Maneja la limpieza del estado de autenticación

```javascript
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !isLoggingOut) {
      isLoggingOut = true;
      if (window.onSessionExpired) {
        await window.onSessionExpired();
      }
      setTimeout(() => { isLoggingOut = false; }, 2000);
    }
    return Promise.reject(err);
  }
);
```

### 3. Frontend - AuthContext Mejorado

**Archivo**: `frontend/src/context/AuthContext.js`

Se agregaron las siguientes funcionalidades:

#### Estado de Sesión Expirada
```javascript
const [sessionExpired, setSessionExpired] = useState(false);
```

#### Método refreshSession
```javascript
const refreshSessionHandler = useCallback(async () => {
  try {
    const response = await refreshSessionAPI();
    if (response.data.success) {
      console.log('✅ Sesión renovada exitosamente');
      return true;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      await logout(true);
      return false;
    }
  }
}, [logout]);
```

#### Logout Mejorado
```javascript
const logout = useCallback(async (isAutomatic = false) => {
  // Cerrar sesión en el backend
  await api.post('/auth/logout');
  
  // Limpiar estado
  setUser(null);
  setSessionExpired(isAutomatic);
  localStorage.removeItem('lastApiUrl');
  
  // Mostrar notificación si es automático
  if (isAutomatic) {
    toast.warning('⏰ Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
  }
}, []);
```

#### Handler Global de Sesión Expirada
```javascript
useEffect(() => {
  window.onSessionExpired = async () => {
    await logout(true);
  };
  return () => { window.onSessionExpired = null; };
}, [logout]);
```

### 4. Frontend - Rastreo de Actividad

**Archivo**: `frontend/src/App.js`

Se implementó un sistema de rastreo de actividad que:
- Detecta eventos de usuario (clicks, teclas, scroll, touch)
- Mantiene registro de la última actividad
- Renueva la sesión periódicamente si hay actividad reciente

```javascript
// Constantes
const ACTIVITY_DEBOUNCE = 5 * 60 * 1000; // 5 minutos
const SESSION_CHECK_INTERVAL = 60 * 1000; // 1 minuto

// Rastrear actividad
const handleUserActivity = useCallback(() => {
  lastActivityRef.current = Date.now();
}, []);

// Detectar eventos de actividad
useEffect(() => {
  if (!user) return;
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
  events.forEach(event => {
    document.addEventListener(event, handleUserActivity, { passive: true });
  });
  return () => {
    events.forEach(event => {
      document.removeEventListener(event, handleUserActivity);
    });
  };
}, [user, handleUserActivity]);

// Renovar sesión periódicamente
useEffect(() => {
  if (!user) return;
  
  const checkAndRefreshSession = async () => {
    const timeSinceLastActivity = Date.now() - lastActivityRef.current;
    if (timeSinceLastActivity < ACTIVITY_DEBOUNCE) {
      console.log('🔄 Usuario activo, renovando sesión...');
      await refreshSession();
    }
  };
  
  const timer = setInterval(checkAndRefreshSession, SESSION_CHECK_INTERVAL);
  return () => clearInterval(timer);
}, [user, refreshSession]);
```

### 5. Notificaciones Toast

**Librería**: `react-toastify`

Se integró para mostrar notificaciones visuales al usuario:
- Cuando la sesión expira automáticamente
- Con estilo y animaciones profesionales
- Posicionadas estratégicamente para no interrumpir el flujo de trabajo

```javascript
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// En App.js
<ToastContainer
  position="top-right"
  autoClose={5000}
  hideProgressBar={false}
  theme="light"
/>
```

## Flujo de Funcionamiento

### Caso 1: Usuario Activo

1. Usuario interactúa con el sistema (click, tecla, scroll)
2. Se actualiza `lastActivityRef.current`
3. Cada 1 minuto se verifica la última actividad
4. Si la actividad es reciente (< 5 minutos), se llama a `/auth/refresh-session`
5. Backend actualiza la cookie de sesión con nuevo maxAge
6. Sesión se mantiene activa indefinidamente mientras hay actividad

### Caso 2: Usuario Inactivo

1. Usuario no interactúa por más de 5 minutos
2. El timer de verificación detecta inactividad
3. No se llama a refresh-session
4. Después de 24 horas (maxAge de la sesión), la cookie expira
5. Siguiente petición al backend retorna 401
6. Interceptor de axios detecta el 401
7. Se ejecuta logout automático
8. Se muestra toast de sesión expirada
9. Usuario es redirigido a login

### Caso 3: Sesión Expira Durante Operación

1. Usuario tiene la aplicación abierta pero inactiva por 24+ horas
2. Intenta realizar una operación (venta, consulta, etc.)
3. Backend retorna 401 Unauthorized
4. Interceptor detecta el error
5. Ejecuta logout automático
6. Muestra notificación "Tu sesión ha expirado"
7. Redirige a login
8. Estado se limpia completamente

## Configuración

### Backend

La configuración de sesión se encuentra en `backend/server.js`:

```javascript
app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_SECRET],
  maxAge: 24 * 60 * 60 * 1000, // 24 horas
  secure: isProduction,
  httpOnly: true,
  sameSite: isProduction ? 'none' : 'lax',
}));
```

### Frontend

Las constantes de configuración están en `frontend/src/App.js`:

```javascript
const ACTIVITY_DEBOUNCE = 5 * 60 * 1000; // 5 minutos entre refresh
const SESSION_CHECK_INTERVAL = 60 * 1000; // Verificar cada 1 minuto
```

## Criterios de Aceptación Cumplidos

- ✅ El cliente detecta silenciosamente cualquier 401 y cierra sesión automáticamente
- ✅ La actividad del cliente (clics/navegación) extiende la sesión sin interrumpir al usuario
- ✅ La sesión no puede ser corrupta con caché (estado siempre reseteado en logout)
- ✅ Backend maneja específicamente refresh-session y evita problemas con sesiones vencidas
- ✅ Los toasts aparecen claros y estilizados cuando se cierra sesión automáticamente

## Seguridad

Esta implementación mantiene las siguientes prácticas de seguridad:

1. **Cookies HttpOnly**: No accesibles desde JavaScript
2. **SameSite Protection**: Previene ataques CSRF
3. **Secure en Producción**: Solo HTTPS en producción
4. **Sin exposición de datos sensibles**: Las sesiones se manejan completamente en cookies firmadas
5. **Timeout de inactividad**: Las sesiones expiran si no hay actividad

## Testing Manual

Para probar la funcionalidad:

1. **Test de actividad**:
   - Iniciar sesión
   - Usar el sistema por varios minutos
   - Observar en console: "🔄 Usuario activo, renovando sesión..."
   - Verificar que no hay interrupciones

2. **Test de inactividad**:
   - Iniciar sesión
   - Dejar la aplicación abierta sin interactuar por 5+ minutos
   - Observar en console: "⏸️ Usuario inactivo, no se renueva la sesión"

3. **Test de sesión expirada**:
   - Simular 401 modificando temporalmente el código
   - Verificar que aparece toast de sesión expirada
   - Verificar redirección automática a login
   - Verificar que el estado se limpia completamente

4. **Test de múltiples 401**:
   - Simular múltiples peticiones fallidas simultáneas
   - Verificar que solo se ejecuta un logout
   - Verificar que no hay múltiples toasts

## Mantenimiento

### Ajustar tiempos de inactividad

Para cambiar cuándo se considera al usuario "inactivo":

```javascript
// En frontend/src/App.js
const ACTIVITY_DEBOUNCE = 10 * 60 * 1000; // Cambiar a 10 minutos
```

### Ajustar frecuencia de verificación

Para cambiar con qué frecuencia se verifica la actividad:

```javascript
// En frontend/src/App.js
const SESSION_CHECK_INTERVAL = 2 * 60 * 1000; // Cambiar a cada 2 minutos
```

### Personalizar notificaciones

Para cambiar el estilo de las notificaciones:

```javascript
// En frontend/src/context/AuthContext.js
toast.warning('Tu mensaje personalizado', {
  position: 'top-center', // top-left, top-right, bottom-left, etc.
  autoClose: 5000, // milisegundos
  theme: 'light', // light, dark, colored
});
```

## Archivos Modificados

- ✅ `backend/routes/auth.js` - Nuevo endpoint refresh-session
- ✅ `frontend/src/services/api.js` - Interceptor 401 y exportación de refreshSession
- ✅ `frontend/src/context/AuthContext.js` - Lógica de refresh y logout mejorado
- ✅ `frontend/src/App.js` - Rastreo de actividad y renovación periódica
- ✅ `frontend/package.json` - Dependencia react-toastify
- ✅ `frontend/src/components/GaleriaImagenesJoya.js` - Fix de eslint warning

## Dependencias Nuevas

```json
{
  "react-toastify": "^11.0.5"
}
```

## Notas Adicionales

- El sistema es completamente transparente para el usuario activo
- No hay impacto en el rendimiento (eventos con `passive: true`)
- Compatible con todos los navegadores modernos
- Funciona en desktop y móvil
- No requiere cambios en otros componentes existentes
