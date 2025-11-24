# Sistema de Inventario de Joyería 💎

Sistema completo de gestión para joyerías con base de datos PostgreSQL en la nube.

## 🎯 Características Principales

- 🔐 **Autenticación segura**: Login con roles (Administrador/Dependiente)
- 💎 **Gestión de inventario**: CRUD completo con imágenes
- 💰 **Sistema de ventas**: Múltiples métodos de pago (efectivo, tarjeta, transferencia, mixto)
- 💳 **Ventas a crédito**: Gestión de cuentas por cobrar y abonos
- 💵 **Ingresos extras**: Registro de ingresos fuera de ventas (fondo de caja, préstamos, etc.)
- 🔄 **Devoluciones**: Sistema de gestión de devoluciones con workflow de aprobación
- 📊 **Cierre de caja**: Reportes completos y cierre diario
- 👥 **Gestión de clientes**: Base de datos de clientes
- 📱 **Multi-dispositivo**: Acceso desde cualquier dispositivo en la red

## 🚀 Instalación Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/aleariasr/sistemajoyeria.git
cd sistemajoyeria
```

### 2. Instalar Backend
```bash
cd backend
npm install
cp .env.example .env
# Editar .env si es necesario (ver sección Variables de Entorno)
npm start
```

El backend correrá en `http://localhost:3001`

### 3. Instalar Frontend
```bash
cd frontend
npm install
npm start
```

El frontend correrá en `http://localhost:3000`

### 4. Login por Defecto
- **Admin:** `admin` / `admin123`
- **Dependiente:** `dependiente` / `dependiente123`

## 🔧 Variables de Entorno

### Backend (.env)

**Requeridas:**
```bash
# Servidor
PORT=3001
NODE_ENV=development
HOST=0.0.0.0

# Base de datos Supabase (REQUERIDO)
SUPABASE_URL=https://mvujkbpbqyihixkbzthe.supabase.co
SUPABASE_KEY=tu_clave_de_supabase

# Cloudinary para imágenes (REQUERIDO)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Sesión (CAMBIAR EN PRODUCCIÓN)
SESSION_SECRET=joyeria-secret-key-2024
```

**Opcionales:**
```bash
# Redis (solo en producción con alta carga)
REDIS_URL=redis://usuario:password@host:port

# CORS - URL del frontend (si separado)
FRONTEND_URL=https://tu-frontend.railway.app
```

### Frontend (.env)

**Opcional:**
```bash
# Solo si necesitas apuntar a un servidor específico
REACT_APP_API_URL=http://localhost:3001/api

# Para acceso multi-dispositivo, NO configures esta variable
# El sistema detectará automáticamente la IP correcta
```

## 🌐 Deploy en Railway

### Preparación de la Base de Datos

**IMPORTANTE**: Antes de deployar, ejecuta la migración SQL en Supabase:

1. Ve a tu proyecto en Supabase: https://supabase.com
2. Abre el SQL Editor
3. Ejecuta el archivo `backend/migrations/add-new-features.sql`
4. Verifica que las tablas se crearon correctamente

### Configuración en Railway

1. Conecta tu repositorio a Railway
2. Configura las siguientes variables de entorno:

```bash
# Backend Service - Variables Requeridas
PORT=3001
NODE_ENV=production
HOST=0.0.0.0

# Base de datos Supabase
SUPABASE_URL=https://mvujkbpbqyihixkbzthe.supabase.co
SUPABASE_KEY=tu_clave_de_supabase

# Cloudinary para imágenes
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Sesión - IMPORTANTE: genera una clave aleatoria segura
SESSION_SECRET=tu_clave_secreta_aleatoria_muy_larga

# CORS - URL del frontend (si separado)
FRONTEND_URL=https://tu-frontend.railway.app
```

3. Railway detectará automáticamente el `Procfile` y ejecutará el backend

### Frontend en Railway (Opcional)

Si quieres deployar el frontend por separado:

```bash
# Variables de entorno del frontend
REACT_APP_API_URL=https://tu-backend.railway.app/api
```

## 📦 Comandos Útiles

```bash
# Backend
cd backend
npm start                 # Iniciar servidor
npm run dev              # Iniciar con nodemon (desarrollo)
npm test                 # Ejecutar tests

# Frontend
cd frontend
npm start                # Iniciar desarrollo
npm run build            # Build para producción

# Tests de producción
node production-readiness-test.js  # Verificar sistema antes de deploy
```

## 📁 Estructura del Proyecto

```
sistemajoyeria/
├── backend/              # API Node.js + Express
│   ├── models/          # Modelos de datos (10 archivos)
│   ├── routes/          # Rutas API (8 archivos)
│   ├── middleware/      # Middleware de autenticación
│   ├── utils/           # Utilidades y validaciones
│   ├── server.js        # Servidor principal
│   └── supabase-db.js   # Configuración de base de datos
├── frontend/            # Aplicación React
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── services/    # Servicios API
│   │   └── context/     # Context de autenticación
│   └── public/
├── Procfile            # Configuración Railway
└── README.md
```

## 🗄️ Base de Datos

El sistema usa PostgreSQL en Supabase. El schema completo está en:
- `backend/supabase-migration.sql`

### Tablas Principales:
- `usuarios` - Gestión de usuarios
- `joyas` - Inventario de productos
- `clientes` - Base de clientes
- `ventas` / `ventas_dia` - Transacciones
- `items_venta` / `items_venta_dia` - Detalles de ventas
- `cuentas_por_cobrar` - Créditos
- `abonos` - Pagos de créditos
- `movimientos_inventario` - Historial

## 🔒 Seguridad

- ✅ Autenticación con sesiones
- ✅ Contraseñas encriptadas (bcrypt)
- ✅ Control de acceso por roles
- ✅ Validaciones de datos
- ✅ CORS configurado

## 📚 Documentación Adicional

- `CHANGELOG.md` - Historial de cambios
- `GUIA_IMPRESION.md` - Sistema de tickets
- `GUIA_MULTI_DISPOSITIVO.md` - Configuración de red
- `backend/GUIA_COMPLETA.md` - Guía técnica detallada

## 🆘 Solución de Problemas

### Backend no se conecta a Supabase
- Verificar variables de entorno `SUPABASE_URL` y `SUPABASE_KEY`
- Asegurar que el schema SQL fue ejecutado

### Frontend no se conecta al backend
- Verificar que el backend esté corriendo
- En Railway, configurar `REACT_APP_API_URL` correctamente

### Errores de CORS
- En producción, configurar `FRONTEND_URL` en el backend
- Verificar que ambos servicios estén en HTTPS

---

**Versión:** 2.0  
**Licencia:** MIT  
**Última actualización:** 2025-11-24
