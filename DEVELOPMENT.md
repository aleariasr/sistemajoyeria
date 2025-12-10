# 🔧 Guía de Desarrollo Local - Sistema de Joyería

Esta guía explica cómo configurar y ejecutar el sistema en modo desarrollo local, incluyendo acceso desde dispositivos móviles en la misma red.

---

## 📋 Requisitos Previos

- **Node.js 20+** (recomendado: usar nvm para gestionar versiones)
- **npm 9+**
- **Cuenta Supabase** (para base de datos)
- **Cuenta Cloudinary** (para imágenes)

---

## 🚀 Instalación Inicial

```bash
# Clonar el repositorio
git clone https://github.com/aleariasr/sistemajoyeria.git
cd sistemajoyeria

# Instalar todas las dependencias (backend, frontend, storefront)
npm install
```

---

## ⚙️ Configuración de Variables de Entorno

### Backend (`backend/.env`)

```bash
# Copiar archivo de ejemplo
cp backend/.env.example backend/.env

# Editar con tus credenciales reales
```

Contenido mínimo requerido:
```env
PORT=3001
HOST=0.0.0.0
NODE_ENV=development
SESSION_SECRET=tu-clave-secreta-desarrollo

# Supabase (REQUERIDO)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-anon-key

# Cloudinary (REQUERIDO)
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
```

### Frontend POS (`frontend/.env`)

```bash
cp frontend/.env.example frontend/.env
```

**🚨 IMPORTANTE para acceso desde dispositivos móviles/tablets:**

El archivo `frontend/.env` debe contener:
```env
# REQUERIDO para acceso multi-dispositivo
HOST=0.0.0.0

# La URL del backend se detecta automáticamente
# - localhost:3000 → localhost:3001/api
# - 192.168.1.100:3000 → 192.168.1.100:3001/api
# 
# Solo configure REACT_APP_API_URL para producción:
# REACT_APP_API_URL=https://tu-backend.railway.app/api
```

Sin `HOST=0.0.0.0`, el frontend solo será accesible en localhost del mismo equipo.

### Storefront (`storefront/.env.local`)

```bash
cp storefront/.env.example storefront/.env.local
```

Para desarrollo local:
```env
# En desarrollo local, la URL se detecta automáticamente
# Solo configure esto para producción
# NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## 🖥️ Iniciar Servicios en Desarrollo

### Opción 1: Ejecutar Todo (3 terminales)

```bash
# Terminal 1 - Backend (puerto 3001)
npm run start:backend

# Terminal 2 - Frontend POS (puerto 3000)
npm run start:frontend

# Terminal 3 - Storefront (puerto 3002)
npm run start:storefront
```

### Opción 2: Solo Backend + Frontend POS

```bash
# Terminal 1
npm run start:backend

# Terminal 2
npm run start:frontend
```

### Opción 3: Desarrollo con Auto-reload

```bash
# Backend con nodemon (reinicia al cambiar código)
npm run dev:backend

# Storefront con hot reload
npm run dev:storefront
```

---

## 📱 Acceso desde Dispositivos Móviles (Red Local)

El sistema soporta acceso desde múltiples dispositivos en la misma red WiFi, perfecto para:
- Usar tablets como puntos de venta adicionales
- Probar la tienda online desde teléfonos móviles
- Demostrar el sistema a clientes

### Pasos para Configurar

1. **Asegúrese de que todos los dispositivos estén en la misma red WiFi**

2. **Inicie el backend** - Al iniciar, mostrará las IPs disponibles:
   ```bash
   npm run start:backend
   ```
   
   Verá algo como:
   ```
   📱 Acceso multi-dispositivo (red local):
      Backend API: http://192.168.1.100:3001
   
   📋 Para conectar dispositivos móviles en la misma red:
      1. Asegúrese de que todos los dispositivos estén en la misma red WiFi
      2. Configure la variable de entorno en el frontend:
         REACT_APP_API_URL=http://192.168.1.100:3001/api
      3. Para el storefront:
         NEXT_PUBLIC_API_URL=http://192.168.1.100:3001/api
   ```

3. **Inicie el frontend/storefront** con la IP correcta:
   ```bash
   # El frontend detecta automáticamente la IP del backend
   npm run start:frontend
   ```

4. **Acceda desde el dispositivo móvil**:
   - Abra el navegador en su teléfono/tablet
   - Vaya a `http://192.168.1.100:3000` para el POS
   - Vaya a `http://192.168.1.100:3002` para la tienda online

### Solución de Problemas de Red Local

#### El dispositivo móvil no puede conectar
1. Verifique que ambos dispositivos estén en la misma red WiFi
2. Verifique que el firewall de su computadora permita conexiones en los puertos 3000, 3001 y 3002:
   
   **Windows:**
   ```powershell
   # Abrir PowerShell como Administrador
   netsh advfirewall firewall add rule name="Node.js" dir=in action=allow protocol=TCP localport=3000-3002
   ```
   
   **macOS:**
   ```bash
   # macOS generalmente permite conexiones locales por defecto
   # Si tiene problemas, verifique Preferencias del Sistema > Seguridad y Privacidad > Firewall
   ```
   
   **Linux:**
   ```bash
   # Ubuntu/Debian
   sudo ufw allow 3000:3002/tcp
   ```

#### Error de CORS
Si ve errores de CORS en la consola del navegador:
1. Verifique que el backend está corriendo
2. Verifique que la IP es correcta
3. El backend automáticamente permite IPs locales (192.168.x.x, 10.x.x.x, 172.16-31.x.x)

---

## 🔑 Usuarios por Defecto

Al iniciar por primera vez, se crean estos usuarios:

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `admin123` | Administrador |
| `dependiente` | `dependiente123` | Dependiente |

> ⚠️ **Importante**: Cambie estas contraseñas antes de usar en producción.

---

## 📊 Base de Datos

### Migraciones
Si es la primera vez que configura Supabase:

1. Ir a [Supabase](https://supabase.com) y crear proyecto
2. En SQL Editor, ejecutar:
   - `backend/supabase-migration.sql`
   - `backend/migrations/create-pedidos-online.sql`

### Reiniciar Datos de Prueba
Para reiniciar con datos limpios:
1. En Supabase SQL Editor, ejecutar `TRUNCATE` en las tablas
2. Reiniciar el backend para regenerar usuarios

---

## 🧪 Testing

```bash
# Tests del backend
npm run test:backend

# Tests del storefront
npm run test:storefront

# Linting del storefront
npm run lint:storefront
```

---

## 🏗️ Builds

```bash
# Build frontend POS
npm run build:frontend

# Build storefront
npm run build:storefront
```

---

## 📁 Estructura de Puertos

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| Backend API | 3001 | API Express + autenticación |
| Frontend POS | 3000 | React - Punto de Venta |
| Storefront | 3002 | Next.js - Tienda Online |

---

## 🔍 Debugging

### Ver logs detallados del backend
El backend muestra logs en desarrollo:
```
2024-01-15T10:30:00.000Z - POST /api/auth/login
2024-01-15T10:30:01.000Z - GET /api/joyas
```

### Verificar conexión API
```bash
# Health check
curl http://localhost:3001/health

# Con IP local
curl http://192.168.1.100:3001/health
```

### Verificar que el frontend detecta la IP
Abra la consola del navegador (F12) y busque:
```
🌐 API_URL detectada: http://192.168.1.100:3001/api
```

---

## 🌐 Transición a Producción

Para desplegar en producción (Railway + Vercel), consulte [DEPLOY.md](DEPLOY.md).

Los cambios necesarios:
1. Configurar `FRONTEND_URL` en el backend (Railway)
2. Configurar `REACT_APP_API_URL` en el frontend (Vercel)
3. Configurar `NEXT_PUBLIC_API_URL` en el storefront (Vercel)
4. Cambiar `NODE_ENV=production` en el backend
