# Sistema de Joyería - Copilot Instructions

Este es un repositorio monorepo con:
- **backend/** - API Node.js + Express + Supabase
- **frontend/** - React POS (punto de venta)
- **storefront/** - Next.js (tienda online pública)

## Estructura del Proyecto

```
sistemajoyeria/
├── backend/              # API Node.js + Express
│   ├── models/          # Modelos de datos (Joya, Venta, Cliente, etc.)
│   ├── routes/          # Rutas API
│   ├── middleware/      # Middleware de autenticación
│   ├── migrations/      # Migraciones SQL para Supabase
│   └── server.js        # Servidor principal
├── frontend/            # React POS
│   └── src/
│       ├── components/  # Componentes React
│       ├── services/    # Servicios API (axios)
│       └── context/     # AuthContext
├── storefront/          # Next.js Tienda Online
│   └── src/
│       ├── app/         # App Router (Next.js 14)
│       ├── components/  # Componentes React
│       ├── hooks/       # Custom hooks (useApi, useCart)
│       └── lib/         # Utilidades
├── package.json         # Root package con workspaces
└── DEPLOY.md           # Guía de despliegue
```

## Comandos de Desarrollo

```bash
npm install                    # Instala dependencias de todos los workspaces
npm run start:backend          # Backend (puerto 3001)
npm run start:frontend         # Frontend POS (puerto 3000)
npm run start:storefront       # Storefront (puerto 3002)
npm run dev:backend            # Backend con nodemon
npm run build:frontend         # Build frontend
npm run build:storefront       # Build storefront
```

## Convenciones

### Backend (Node.js/Express)
- Rutas en `routes/` organizadas por recurso
- Modelos en `models/` con métodos estáticos
- Middleware `requireAuth` para rutas protegidas
- Respuestas JSON consistentes: `{ success, data }` o `{ error }`
- Async/await con try/catch

### Frontend (React)
- Componentes funcionales con hooks
- Context API para autenticación (AuthContext)
- Servicios en `services/api.js` con axios
- react-router-dom v6

### Storefront (Next.js)
- App Router (Next.js 14)
- TypeScript
- Tailwind CSS
- Zustand para estado (carrito)
- React Query para fetching

## Variables de Entorno

### Backend
- `SUPABASE_URL`, `SUPABASE_KEY` - Base de datos
- `CLOUDINARY_*` - Imágenes
- `SESSION_SECRET` - Sesiones
- `FRONTEND_URL` - CORS en producción

### Frontend
- `REACT_APP_API_URL` - URL del backend

### Storefront
- `NEXT_PUBLIC_API_URL` - URL del backend

## Despliegue

- **Backend**: Railway (usa `railway.json` y `nixpacks.toml`)
- **Frontend/Storefront**: Vercel (usa `vercel.json` en cada carpeta)

## Seguridad

- Autenticación con sesiones Express (httpOnly cookies)
- Contraseñas bcrypt
- SQL injection prevention en búsquedas
- CORS dinámico desde `FRONTEND_URL`
- Headers de seguridad (HSTS, X-Frame-Options)
