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

# Iniciar servicios (3 terminales separadas)
npm run start:backend    # Puerto 3001 - API
npm run start:frontend   # Puerto 3000 - POS
npm run start:storefront # Puerto 3002 - Tienda Online
```

### 📱 Acceso desde Dispositivos Móviles

Al iniciar el backend, verá la IP local para conectar otros dispositivos:
```
📱 Acceso multi-dispositivo (red local):
   Backend API: http://192.168.1.100:3001

📋 Para conectar dispositivos móviles en la misma red:
   1. Asegúrese de que todos los dispositivos estén en la misma red WiFi
   2. Acceda desde el móvil a: http://192.168.1.100:3000
```

Ver [DEVELOPMENT.md](DEVELOPMENT.md) para instrucciones detalladas.

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

## 🔒 Seguridad

- ✅ Sesiones con cookies httpOnly
- ✅ Contraseñas bcrypt (12 rounds)
- ✅ CORS dinámico desde `FRONTEND_URL`
- ✅ Headers de seguridad (HSTS, X-Frame-Options, X-Content-Type-Options)
- ✅ SQL injection: queries parametrizadas + escape en ILIKE
- ✅ XSS prevention: escape de HTML en entradas de usuario

---

**Licencia:** MIT
