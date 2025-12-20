# ✅ Deployment Checklist - Sistema de Joyería

## 📋 Lista de Verificación Pre-Deployment

Usa esta checklist para asegurarte de que el sistema esté listo para producción.

---

## 🗄️ BASE DE DATOS (Supabase)

### Configuración Inicial
- [ ] Proyecto de Supabase creado
- [ ] Migración base ejecutada (`supabase-migration.sql`)
- [ ] Migraciones adicionales ejecutadas según necesidades
- [ ] Variables de entorno configuradas:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_KEY`

### Verificación de Tablas
- [ ] Tabla `usuarios` existe
- [ ] Tabla `joyas` existe
- [ ] Tabla `ventas` existe
- [ ] Tabla `items_venta` existe
- [ ] Tabla `clientes` existe
- [ ] Tabla `movimientos_inventario` existe

### Tablas Opcionales (según funcionalidades)
- [ ] Tabla `imagenes_joya` (múltiples imágenes)
- [ ] Tabla `pedidos_online` (e-commerce)
- [ ] Tabla `variantes_producto` (variantes)
- [ ] Tabla `productos_compuestos` (sets)
- [ ] Tabla `push_subscriptions` (notificaciones)

### Datos Iniciales
- [ ] Usuario administrador creado (se crea automáticamente al iniciar backend)
- [ ] Productos de prueba cargados (opcional)

---

## 🖼️ CLOUDINARY (Imágenes)

### Configuración
- [ ] Cuenta de Cloudinary creada
- [ ] Variables de entorno configuradas:
  - [ ] `CLOUDINARY_CLOUD_NAME`
  - [ ] `CLOUDINARY_API_KEY`
  - [ ] `CLOUDINARY_API_SECRET`

### Verificación
- [ ] Subir imagen de prueba funciona
- [ ] URLs de imágenes son accesibles públicamente
- [ ] Transformaciones de Cloudinary funcionan

---

## 📧 EMAIL (Resend)

### Configuración
- [ ] Cuenta de Resend creada
- [ ] Dominio verificado en Resend
- [ ] Variables de entorno configuradas:
  - [ ] `RESEND_API_KEY`
  - [ ] `EMAIL_FROM` (con dominio verificado)
  - [ ] `EMAIL_FROM_NAME`
  - [ ] `EMAIL_REPLY_TO`
  - [ ] `ADMIN_EMAIL`

### Verificación
- [ ] Envío de email de prueba funciona
- [ ] Emails no caen en spam
- [ ] Email de confirmación de pedido se envía correctamente

---

## 🔔 NOTIFICACIONES PUSH (Opcional)

### Configuración
- [ ] Claves VAPID generadas (`node backend/utils/generateVapidKeys.js`)
- [ ] Variables de entorno configuradas:
  - [ ] `VAPID_PUBLIC_KEY`
  - [ ] `VAPID_PRIVATE_KEY`
  - [ ] `VAPID_SUBJECT`

### Verificación
- [ ] Service worker registrado correctamente
- [ ] Suscripción a notificaciones funciona
- [ ] Notificación de prueba se recibe

---

## 🖥️ BACKEND (Railway)

### Variables de Entorno
- [ ] `NODE_ENV=production`
- [ ] `SESSION_SECRET` (generado con crypto)
- [ ] `FRONTEND_URL` (URLs del frontend separadas por comas)
- [ ] `PORT` (Railway lo proporciona automáticamente)
- [ ] Todas las variables de Supabase
- [ ] Todas las variables de Cloudinary
- [ ] Todas las variables de Resend
- [ ] Todas las variables de VAPID (si se usan notificaciones)

### Deployment
- [ ] Repositorio conectado a Railway
- [ ] Build exitoso
- [ ] Health check (`/health`) responde correctamente
- [ ] Logs no muestran errores críticos

### Verificación
- [ ] Login funciona
- [ ] Crear joya funciona
- [ ] Subir imagen funciona
- [ ] Crear venta funciona
- [ ] API responde a solicitudes públicas

---

## 💻 FRONTEND POS (Vercel)

### Variables de Entorno
- [ ] `REACT_APP_API_URL` (URL del backend en Railway)

### Deployment
- [ ] Repositorio conectado a Vercel
- [ ] Build exitoso
- [ ] Sin errores en consola del navegador

### Verificación
- [ ] Login funciona
- [ ] Dashboard carga correctamente
- [ ] CRUD de joyas funciona
- [ ] Ventas se registran correctamente
- [ ] Imágenes se cargan correctamente
- [ ] Sesión persiste correctamente

---

## 🛒 STOREFRONT (Vercel) - Opcional

### Variables de Entorno
- [ ] `NEXT_PUBLIC_API_URL` (URL del backend en Railway)

### Deployment
- [ ] Repositorio conectado a Vercel
- [ ] Build exitoso
- [ ] Sin errores en consola del navegador

### Verificación
- [ ] Productos se listan correctamente
- [ ] Imágenes se cargan correctamente
- [ ] Galería de imágenes funciona
- [ ] Carrito funciona
- [ ] Checkout y creación de pedido funciona
- [ ] Email de confirmación llega

---

## 🔒 SEGURIDAD

### Configuración
- [ ] HTTPS habilitado (Vercel y Railway lo hacen automáticamente)
- [ ] CORS configurado correctamente
- [ ] Cookies con `SameSite=none` y `Secure=true` en producción
- [ ] Autenticación requerida en todas las rutas admin
- [ ] No hay claves secretas en el código fuente

### Verificación
- [ ] No se pueden acceder rutas admin sin autenticación
- [ ] Session cookies funcionan correctamente
- [ ] No hay warnings de seguridad en la consola
- [ ] Headers de seguridad configurados (HSTS, X-Frame-Options, etc.)

---

## ⚡ PERFORMANCE

### Backend
- [ ] Respuestas de API < 500ms para operaciones comunes
- [ ] Imágenes optimizadas con Cloudinary
- [ ] Queries de base de datos optimizadas
- [ ] Sin N+1 queries

### Frontend
- [ ] Tiempo de carga inicial < 3 segundos
- [ ] Imágenes lazy-loaded
- [ ] Assets optimizados
- [ ] No hay memory leaks

---

## 📊 MONITOREO

### Backend
- [ ] Logs configurados (Railway logs)
- [ ] Health check endpoint funciona
- [ ] Alertas configuradas para errores críticos

### Frontend
- [ ] Error boundaries implementados
- [ ] Errores se muestran correctamente al usuario
- [ ] No hay errores silenciosos

---

## 🧪 PRUEBAS

### Funcionalidad Básica
- [ ] Login/Logout
- [ ] CRUD de joyas
- [ ] Crear venta
- [ ] Gestión de stock
- [ ] Reportes

### Funcionalidades Avanzadas (si aplica)
- [ ] Galería de múltiples imágenes
- [ ] Variantes de producto
- [ ] Productos compuestos (sets)
- [ ] Pedidos online
- [ ] Notificaciones push
- [ ] Envío de emails

### Navegadores
- [ ] Chrome (última versión)
- [ ] Firefox (última versión)
- [ ] Safari (última versión)
- [ ] Edge (última versión)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## 📱 RESPONSIVIDAD

### Dispositivos
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

---

## 📚 DOCUMENTACIÓN

### Completa
- [ ] README.md actualizado
- [ ] DEPLOY.md disponible
- [ ] MIGRATION_GUIDE.md disponible
- [ ] .env.example completo
- [ ] Comentarios en código crítico

---

## 🔄 RESPALDO

### Antes de Deployment
- [ ] Backup de base de datos
- [ ] Repositorio en GitHub actualizado
- [ ] Variables de entorno documentadas

---

## 🎉 POST-DEPLOYMENT

### Verificación Final
- [ ] Todos los endpoints principales funcionan
- [ ] No hay errores en logs
- [ ] Performance aceptable
- [ ] Todas las funcionalidades críticas funcionan

### Comunicación
- [ ] Usuarios notificados del deployment
- [ ] Documentación de cambios disponible
- [ ] Soporte preparado para consultas

---

## 🆘 ROLLBACK PLAN

### En caso de problemas críticos
- [ ] Plan de rollback documentado
- [ ] Backup disponible para restaurar
- [ ] Procedimiento de reversión probado

---

## 📝 NOTAS

### Comandos Útiles

**Generar SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Generar claves VAPID:**
```bash
node backend/utils/generateVapidKeys.js
```

**Verificar health del backend:**
```bash
curl https://tu-backend.railway.app/health
```

**Test de login:**
```bash
curl -X POST https://tu-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## ✅ DEPLOYMENT COMPLETADO

Fecha: ___________  
Responsable: ___________  
Ambiente: [ ] Staging [ ] Production  
Versión: ___________

**Firma:** ___________
