# Sistema de Joyería 💎

Sistema completo de gestión para joyerías con:
- **Backend**: Node.js + Express + Supabase
- **Frontend POS**: React (punto de venta)
- **Storefront**: Next.js (tienda online)

## 🎯 Características

- 🔐 Autenticación con roles (Admin/Dependiente)
- 💎 Inventario con imágenes en Cloudinary
- 💰 Ventas: efectivo, tarjeta, transferencia, mixto
- 💳 Ventas a crédito con cuentas por cobrar
- 📊 Cierre de caja y reportes
- 🛒 Tienda online con carrito de compras
- 📦 **Sistema de pedidos online con notificaciones por email**
- 📧 **Emails automáticos para confirmación y seguimiento de pedidos**
- 📱 **Multi-dispositivo**: Acceso desde celulares/tablets en red local
- 🌐 **Híbrido**: Funciona local o en la nube (Railway + Vercel)

## 🚀 Modos de Uso

### Modo Local (Red Interna)
Ideal para tiendas físicas con computadora principal y dispositivos móviles auxiliares.

```
┌─────────────────────────────────────────────────────────┐
│                   RED LOCAL (WiFi)                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌───────────────┐     ┌───────────────┐                │
│  │  Computadora  │────▶│   Backend     │                │
│  │  Principal    │     │   (Puerto     │                │
│  │  Windows/Mac/ │     │    3001)      │                │
│  │  Linux        │     └───────┬───────┘                │
│  └───────────────┘             │                        │
│                                ▼                        │
│  ┌───────────────┐     ┌───────────────┐                │
│  │  Tablet/Móvil │────▶│   Frontend    │                │
│  │  POS Auxiliar │     │   POS         │                │
│  │  192.168.x.x  │     │   (Puerto     │                │
│  └───────────────┘     │    3000)      │                │
│                        └───────────────┘                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Modo Producción (Internet)
Para acceso desde cualquier lugar vía internet.

```
Internet ──▶ Vercel (Frontend/Storefront) ──▶ Railway (Backend) ──▶ Supabase/Cloudinary
```

## 🚀 Instalación Rápida (Desarrollo Local)

```bash
# Clonar e instalar
git clone https://github.com/aleariasr/sistemajoyeria.git
cd sistemajoyeria
npm install

# Configurar variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env con credenciales de Supabase y Cloudinary

# 📱 IMPORTANTE para acceso desde móviles/tablets:
cp frontend/.env.example frontend/.env
# El archivo frontend/.env debe contener HOST=0.0.0.0

# Iniciar servicios (3 terminales separadas)
npm run start:backend    # Puerto 3001 - API
npm run start:frontend   # Puerto 3000 - POS
npm run start:storefront # Puerto 3002 - Tienda Online
```

### 📱 Acceso desde Dispositivos Móviles

**Requisito**: El archivo `frontend/.env` debe existir con `HOST=0.0.0.0` (ver arriba).

Al iniciar el backend y frontend, verá las IPs locales para conectar otros dispositivos:
```
📱 Acceso multi-dispositivo (red local):
   Backend API:  http://192.168.1.100:3001
   Frontend POS: http://192.168.1.100:3000

📋 Para conectar dispositivos móviles en la misma red:
   1. Asegúrese de que todos los dispositivos estén en la misma red WiFi
   2. Acceda desde el móvil a: http://192.168.1.100:3000
   3. El frontend detectará automáticamente el backend
```

Ver [CONFIGURACION_RED_LOCAL.md](CONFIGURACION_RED_LOCAL.md) para guía paso a paso detallada.

### Login por Defecto
- **Admin:** `admin` / `admin123`
- **Dependiente:** `dependiente` / `dependiente123`

## ⚙️ Variables de Entorno

### Backend (`backend/.env`)
```bash
PORT=3001
NODE_ENV=development
HOST=0.0.0.0
SESSION_SECRET=tu-clave-secreta-aqui

# Supabase (REQUERIDO)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-anon-key

# Cloudinary (REQUERIDO)
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret

# Producción (múltiples URLs separadas por coma)
FRONTEND_URL=https://pos.vercel.app,https://tienda.vercel.app
```

### Frontend POS (`frontend/.env`)
```bash
# En desarrollo local, se detecta automáticamente
# Solo configurar para producción:
REACT_APP_API_URL=http://localhost:3001/api
```

### Storefront (`storefront/.env.local`)
```bash
# En desarrollo local, se detecta automáticamente
# Solo configurar para producción:
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 🌐 Deploy

**Arquitectura:**
- **Backend**: Railway (Node.js + Express)
- **Frontend POS**: Vercel (React)
- **Storefront**: Vercel (Next.js)
- **Base de Datos**: Supabase (PostgreSQL)

Ver [DEPLOY.md](DEPLOY.md) para instrucciones completas.

## 📁 Estructura

```
sistemajoyeria/
├── backend/          # API Node.js + Express
│   ├── models/       # Modelos de datos
│   ├── routes/       # Rutas API
│   ├── middleware/   # Autenticación
│   └── migrations/   # SQL Supabase
├── frontend/         # React POS
│   └── src/
│       ├── components/
│       └── services/
├── storefront/       # Next.js Tienda
│   └── src/
│       ├── app/
│       └── components/
└── DEPLOY.md         # Guía de despliegue
```

## 🗄️ Base de Datos

PostgreSQL en Supabase. Ejecutar migraciones en orden:
1. `backend/supabase-migration.sql`
2. `backend/migrations/create-pedidos-online.sql`
3. `backend/migrations/complete-pedidos-online.sql` (para sistema de pedidos)

## 🧪 Testing y Calidad

### Suite Completa de QA (Recomendado)

```bash
# Ejecutar TODA la suite de QA en un solo comando (100% mocked)
npm run test:full

# O usar el shell script directamente
./scripts/test-full.sh
```

**15 Suites de Tests** ejecutadas en secuencia (~2-3 minutos):
1. ✅ Backend unit tests (modelos, utilidades)
2. ✅ Backend auth tests (autenticación, middleware)
3. ✅ Backend joyas CRUD tests (crear, leer, actualizar, eliminar)
4. ✅ Backend public API tests (endpoints storefront)
5. ✅ Backend POS tests (ventas, devoluciones, cierre caja, cuentas)
6. ✅ Backend pedidos online tests
7. ✅ Backend notifications tests (email, push)
8. ✅ Backend smoke E2E tests (flujos completos)
9. ✅ Backend performance tests (benchmarks API)
10. ✅ Frontend POS tests (componentes React)
11. ✅ Storefront unit tests
12. ✅ Storefront lint check
13. ✅ Frontend build verification
14. ✅ Storefront build verification
15. ✅ Storefront E2E tests (Playwright)

**Ventajas**:
- ✅ **100% Mocked** - No requiere servicios reales (Supabase, Cloudinary, Resend)
- ✅ **Sin credenciales** - No necesita variables de entorno
- ✅ **CI/CD Ready** - Ejecuta limpiamente en cualquier entorno
- ✅ **Rápido** - Suite completa en 2-3 minutos
- ✅ **Determinístico** - Mismo resultado cada vez

**Ver** [QUICK_VERIFICATION_GUIDE.md](QUICK_VERIFICATION_GUIDE.md) para documentación completa con:
- 📋 Detalles de cada suite de tests
- 🎯 Arquitectura de mocks (Supabase, Cloudinary, Resend)
- 🔧 Troubleshooting y debugging
- 📊 Benchmarks de performance
- 🚀 Integración CI/CD

### Tests Individuales

```bash
# Backend
npm run test:backend              # Todos los tests backend
npm run test:backend:passing      # Solo tests que pasan (rápido)
npm run test:backend:smoke        # Suite E2E smoke completa
npm run test:backend:performance  # Tests de performance

# Tests específicos
npm run test:unit                 # Tests unitarios (modelos)
npm run test:auth                 # Tests de autenticación
npm run test:pos                  # Tests POS (ventas, devoluciones, cierre)
npm run test:orders               # Tests de pedidos online
npm run test:notifications        # Tests de notificaciones

# Storefront
npm run test:storefront           # Unit tests
npm run test:storefront:e2e       # E2E con Playwright
npm run test:storefront:all       # Todos los tests storefront

# Builds y Linting
npm run build:frontend            # Build frontend POS
npm run build:storefront          # Build storefront Next.js
npm run lint:storefront           # ESLint storefront
```

### Tests del Backend (Mocked)

Los tests del backend utilizan mocks de Supabase, Cloudinary y Resend, **no requieren servidor ni credenciales reales**:

- ✅ **Tests unitarios** de modelos (Joya, shuffle, filtros)
- ✅ **Tests de integración** de rutas (auth, ventas, public API)
- ✅ **Smoke E2E** - flujo completo: creación → venta → devolución → cierre
- ✅ **Performance tests** - tiempos de respuesta clave
- ✅ **Fixtures en memoria** con datos de prueba
- ✅ **Ejecución rápida** (~6-8 segundos por suite)

Ver **[QUICK_VERIFICATION_GUIDE.md](QUICK_VERIFICATION_GUIDE.md)** para guía completa.

```bash
cd backend
npm test                    # Ejecutar todos los tests
npm run test:coverage       # Ver cobertura (coverage/lcov-report/index.html)
```

### Smoke E2E Tests

Los smoke tests validan el flujo completo end-to-end:

1. ✅ Creación de joya → Listado admin
2. ✅ Checkout storefront simulado
3. ✅ Venta POS → Devolución
4. ✅ Cierre de caja
5. ✅ Pedido online simulado
6. ✅ Validación de consistencia stock/variantes/sets

```bash
npm run test:backend:smoke
```

### Performance Tests

Validan tiempos de respuesta de endpoints clave:

- `/api/public/products` - < 150ms
- `/api/joyas` - < 200ms
- `/api/ventas` - < 300ms

```bash
npm run test:backend:performance
```

### Verificación Pre-Deploy

Antes de desplegar o hacer un PR, ejecute:

```bash
# Opción 1: Suite completa (recomendado)
npm run test:full

# Opción 2: Verificación individual
npm install                    # 1. Instalar dependencias
npm run test:backend:passing   # 2. Tests backend (rápido)
npm run test:storefront        # 3. Tests storefront
npm run lint:storefront        # 4. Linting
npm run build:frontend         # 5. Build frontend
npm run build:storefront       # 6. Build storefront
```

Todos los comandos deben completarse sin errores.

## 📚 Documentación

- 📦 **[Sistema de Pedidos Online](PEDIDOS_ONLINE.md)** - Guía completa del sistema de gestión de pedidos
- 🚀 **[Guía de Despliegue](DEPLOY.md)** - Instrucciones para producción
- 🔧 **[Desarrollo](DEVELOPMENT.md)** - Guía para desarrolladores

## 🔒 Seguridad

- ✅ Sesiones con cookies httpOnly
- ✅ Contraseñas bcrypt (12 rounds)
- ✅ CORS dinámico desde `FRONTEND_URL`
- ✅ Headers de seguridad (HSTS, X-Frame-Options, X-Content-Type-Options)
- ✅ SQL injection: queries parametrizadas + escape en ILIKE
- ✅ XSS prevention: escape de HTML en entradas de usuario
- ✅ Validación de variables de entorno en startup (zod schema)

---

**Licencia:** MIT
