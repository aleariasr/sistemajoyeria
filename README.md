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
- 📱 Multi-dispositivo

## 🚀 Instalación Local

```bash
# Clonar e instalar
git clone https://github.com/aleariasr/sistemajoyeria.git
cd sistemajoyeria
npm install

# Configurar variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env con tus credenciales

# Iniciar desarrollo
npm run start:backend   # Puerto 3001
npm run start:frontend  # Puerto 3000
npm run start:storefront # Puerto 3002
```

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

# Producción
FRONTEND_URL=https://tu-frontend.vercel.app
```

### Frontend (`frontend/.env`)
```bash
REACT_APP_API_URL=http://localhost:3001/api
```

### Storefront (`storefront/.env.local`)
```bash
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
