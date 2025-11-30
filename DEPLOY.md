# 🚀 Guía de Deploy - Sistema de Joyería

Este documento explica cómo desplegar el sistema completo en producción:
- **Backend**: Railway
- **Frontend POS**: Vercel
- **Storefront (Tienda Online)**: Vercel

Para desarrollo local, consulte [DEVELOPMENT.md](DEVELOPMENT.md).

---

## 🏗️ Arquitectura de Producción

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │  Frontend POS    │    │   Storefront     │                   │
│  │  (Vercel)        │    │   (Vercel)       │                   │
│  │  React           │    │   Next.js        │                   │
│  └────────┬─────────┘    └────────┬─────────┘                   │
│           │                       │                              │
│           └───────────┬───────────┘                              │
│                       │                                          │
│                       ▼                                          │
│           ┌──────────────────────┐                               │
│           │    Backend API       │                               │
│           │    (Railway)         │                               │
│           │    Node.js/Express   │                               │
│           └────────┬─────────────┘                               │
│                    │                                             │
│           ┌────────┴───────────┐                                 │
│           │                    │                                 │
│           ▼                    ▼                                 │
│  ┌─────────────────┐  ┌─────────────────┐                       │
│  │   Supabase      │  │   Cloudinary    │                       │
│  │   (PostgreSQL)  │  │   (Imágenes)    │                       │
│  └─────────────────┘  └─────────────────┘                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Pre-requisitos

Antes de comenzar, necesitas:

1. **Cuenta en Supabase** (https://supabase.com)
   - Crear un proyecto y ejecutar las migraciones SQL
   - Obtener `SUPABASE_URL` y `SUPABASE_KEY`

2. **Cuenta en Cloudinary** (https://cloudinary.com)
   - Obtener `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

3. **Cuenta en Railway** (https://railway.app)
   - Para el backend

4. **Cuenta en Vercel** (https://vercel.com)
   - Para frontend POS y storefront

---

## 1️⃣ Configurar Supabase

### 1.1 Crear Proyecto
1. Ir a https://supabase.com
2. Crear nuevo proyecto
3. Esperar a que se cree (toma ~2 minutos)

### 1.2 Ejecutar Migraciones
1. Ir a **SQL Editor** en el panel de Supabase
2. Ejecutar el contenido de `backend/supabase-migration.sql`
3. Ejecutar el contenido de `backend/migrations/create-pedidos-online.sql`
4. Verificar que las tablas se crearon correctamente

### 1.3 Obtener Credenciales
1. Ir a **Settings > API**
2. Copiar:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_KEY`

---

## 2️⃣ Desplegar Backend en Railway

### 2.1 Crear Proyecto
1. Ir a https://railway.app
2. Click en **"New Project"**
3. Seleccionar **"Deploy from GitHub repo"**
4. Conectar tu repositorio `sistemajoyeria`

### 2.2 Configurar Root Directory
Railway detectará el monorepo. Configura:
- **Root Directory**: `/` (raíz del proyecto)

### 2.3 Configurar Variables de Entorno
En Railway, ir a **Variables** y agregar:

```env
NODE_ENV=production
PORT=3001
SESSION_SECRET=<generar-valor-seguro-aleatorio>
SUPABASE_URL=<tu-url-de-supabase>
SUPABASE_KEY=<tu-key-de-supabase>
CLOUDINARY_CLOUD_NAME=<tu-cloud-name>
CLOUDINARY_API_KEY=<tu-api-key>
CLOUDINARY_API_SECRET=<tu-api-secret>
FRONTEND_URL=<urls-de-vercel-separadas-por-coma>
```

> 💡 **Tip**: Para generar SESSION_SECRET:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

> 🔗 **FRONTEND_URL**: Puede incluir múltiples URLs separadas por comas para soportar
> tanto el Frontend POS como el Storefront:
> ```env
> FRONTEND_URL=https://pos.vercel.app,https://tienda.vercel.app
> ```

### 2.4 Verificar Deploy
1. Railway desplegará automáticamente
2. Una vez listo, copiar la URL del servicio (ej: `https://sistemajoyeria-production.up.railway.app`)
3. Verificar que `/health` responde correctamente:
   ```bash
   curl https://tu-backend.railway.app/health
   ```

---

## 3️⃣ Desplegar Frontend POS en Vercel

### 3.1 Importar Proyecto
1. Ir a https://vercel.com
2. Click en **"Add New... > Project"**
3. Importar desde GitHub el repositorio `sistemajoyeria`

### 3.2 Configurar Proyecto
- **Framework Preset**: Create React App
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `build`

### 3.3 Configurar Variables de Entorno
En la sección **Environment Variables**, agregar:

```env
REACT_APP_API_URL=https://tu-backend.railway.app/api
```

> ⚠️ **Importante**: Reemplazar `tu-backend.railway.app` con la URL real de Railway

### 3.4 Desplegar
1. Click en **"Deploy"**
2. Esperar a que termine el build
3. Copiar la URL del deploy (ej: `https://sistemajoyeria-pos.vercel.app`)

### 3.5 Actualizar FRONTEND_URL en Railway
1. Volver a Railway
2. Agregar/actualizar la variable `FRONTEND_URL` con la URL de Vercel
3. Railway se redesplegará automáticamente

---

## 4️⃣ Desplegar Storefront en Vercel

### 4.1 Crear Nuevo Proyecto
1. En Vercel, click en **"Add New... > Project"**
2. Importar el mismo repositorio `sistemajoyeria`

### 4.2 Configurar Proyecto
- **Framework Preset**: Next.js
- **Root Directory**: `storefront`
- **Build Command**: `npm run build`

### 4.3 Configurar Variables de Entorno
```env
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app/api
NEXT_PUBLIC_SITE_URL=https://tu-storefront.vercel.app
```

### 4.4 Desplegar
1. Click en **"Deploy"**
2. Verificar que la tienda online funciona correctamente

---

## 5️⃣ Verificación Final

### Checklist de Verificación

- [ ] Backend responde en `/health`
- [ ] Frontend POS puede hacer login
- [ ] Frontend POS puede ver productos
- [ ] Frontend POS puede crear ventas
- [ ] Storefront muestra productos
- [ ] Storefront permite agregar al carrito
- [ ] Storefront permite crear pedidos

### URLs Finales

Después del deploy, tendrás:

| Servicio | URL Ejemplo |
|----------|-------------|
| Backend API | `https://sistemajoyeria-production.railway.app` |
| Frontend POS | `https://sistemajoyeria-pos.vercel.app` |
| Storefront | `https://cueroyperia.vercel.app` |

---

## 🔧 Solución de Problemas

### Error de CORS
- Verificar que `FRONTEND_URL` en Railway incluye la URL exacta de Vercel
- Verificar que no hay barra diagonal al final de las URLs

### Error de Login (Cookies)
- Verificar que `NODE_ENV=production` en Railway
- Las cookies requieren HTTPS, que Railway y Vercel proporcionan automáticamente

### Productos no aparecen en Storefront
- Verificar que `NEXT_PUBLIC_API_URL` está correctamente configurado
- Verificar que los productos tienen `estado='Activo'` y `stock_actual > 0`

### Error de Base de Datos
- Verificar que las migraciones SQL se ejecutaron correctamente
- Verificar que `SUPABASE_URL` y `SUPABASE_KEY` son correctos

---

## 📝 Desarrollo Local

Para desarrollo local, crear archivos `.env` en cada carpeta:

### backend/.env
```env
PORT=3001
HOST=0.0.0.0
NODE_ENV=development
SESSION_SECRET=dev-secret-key
SUPABASE_URL=<tu-url>
SUPABASE_KEY=<tu-key>
CLOUDINARY_CLOUD_NAME=<tu-cloud-name>
CLOUDINARY_API_KEY=<tu-api-key>
CLOUDINARY_API_SECRET=<tu-api-secret>
```

### frontend/.env
```env
REACT_APP_API_URL=http://localhost:3001/api
```

### storefront/.env.local
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Ejecutar en desarrollo
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend POS
cd frontend && npm start

# Terminal 3 - Storefront
cd storefront && npm run dev
```

---

## 🔒 Seguridad

### Variables de Entorno Sensibles
Nunca commitear archivos `.env` reales al repositorio. Las variables sensibles son:
- `SESSION_SECRET`
- `SUPABASE_KEY`
- `CLOUDINARY_API_SECRET`

### Rotación de Credenciales
Si sospechas que las credenciales fueron expuestas:
1. Regenerar keys en Supabase y Cloudinary
2. Actualizar variables en Railway
3. Regenerar `SESSION_SECRET`

---

## 📞 Soporte

Si tienes problemas con el deploy:
1. Revisar logs en Railway (para backend)
2. Revisar logs en Vercel (para frontend/storefront)
3. Verificar que todas las variables de entorno están configuradas
4. Verificar que las migraciones SQL se ejecutaron correctamente
