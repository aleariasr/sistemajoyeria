# 🚀 Railway + Vercel Deployment Configuration

This document summarizes the deployment configuration for the Sistema de Joyería application, including critical insights for troubleshooting future deployment issues.

## Production URLs

| Service | URL |
|---------|-----|
| **Backend (Railway)** | https://sistemajoyeria-production.up.railway.app |
| **Frontend (Vercel)** | https://sistemajoyeria-frontend.vercel.app |

---

## ⚠️ Key Insight: npm Workspaces

This is a **monorepo with npm workspaces**. The root `package.json` defines:

```json
{
  "workspaces": ["backend", "frontend"]
}
```

**Critical Understanding:**
- Running `npm install` at the root **automatically installs all workspace dependencies**
- There's **NO need** to `cd backend && npm install` separately
- This caused the original Railway build failure

---

## Railway (Backend) Configuration

### ❌ Previous Issue (Build Failure)

```bash
# Error: /bin/bash: line 1: cd: backend: No such file or directory
```

**Root cause:** The `buildCommand` in `railway.json` included `cd backend && npm install`, which fails in the Nixpacks build context because:
1. Nixpacks runs commands from the repository root
2. The `cd backend` command was unnecessary and broken
3. npm workspaces already handles all dependencies

### ✅ Current Configuration

**`railway.json`:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd backend && node server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Key points:**
- ❌ No `buildCommand` - let Nixpacks auto-detect (runs `npm install` at root)
- ✅ `startCommand` uses `cd backend && node server.js` because `server.js` has relative requires (`./supabase-db`, `./routes/*`) that must resolve from the backend directory

**`nixpacks.toml`:**
```toml
[phases.setup]
nixPkgs = ["nodejs_20", "npm"]

[phases.install]
cmds = ["npm install"]

[start]
cmd = "cd backend && node server.js"
```

**`Procfile`:**
```text
web: cd backend && node server.js
```

### Why `startCommand` needs `cd backend`

The `server.js` file uses relative imports:
```javascript
const { initDatabase } = require('./supabase-db');  // relative to backend/
const joyasRoutes = require('./routes/joyas');       // relative to backend/
```

These paths only resolve correctly when Node.js runs from the `backend/` directory.

---

## Vercel (Frontend) Configuration

**`frontend/vercel.json`:**
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "create-react-app",
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

**Key features:**
- SPA rewrites for React Router support (all routes → `/index.html`)
- Security headers (XSS protection, clickjacking prevention)

---

## API URL Auto-Detection

The frontend automatically detects the production backend URL.

**`frontend/src/services/api.js`:**
```javascript
const PRODUCTION_API_URL = 'https://sistemajoyeria-production.up.railway.app/api';

function getApiUrl() {
  // 1. Environment variable takes priority
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // 2. In production (Vercel), use Railway URL
  if (window.location.hostname.includes('vercel.app') || 
      window.location.hostname === 'sistemajoyeria-frontend.vercel.app') {
    return PRODUCTION_API_URL;
  }

  // 3. Local development: use :3001/api
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:3001/api`;
}
```

**Benefit:** No environment variable configuration required on Vercel - it just works!

---

## CORS Configuration

**`backend/server.js`** is configured to allow:

```javascript
const allowedOrigins = [
  // Development
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  
  // Production
  'https://sistemajoyeria-production.up.railway.app',
  'https://sistemajoyeria-frontend.vercel.app',
  
  // Vercel preview deployments
  /^https:\/\/sistemajoyeria-frontend[a-zA-Z0-9._-]*\.vercel\.app$/i,
  
  // Local network (for multi-device development)
  /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d{1,5}$/
];
```

---

## Environment Variables

### Railway (Backend)

**Required:**
```bash
NODE_ENV=production
SUPABASE_URL=<your-supabase-url>
SUPABASE_KEY=<your-supabase-anon-key>
SESSION_SECRET=<random-secure-secret>
CLOUDINARY_CLOUD_NAME=<your-cloudinary-name>
CLOUDINARY_API_KEY=<your-cloudinary-key>
CLOUDINARY_API_SECRET=<your-cloudinary-secret>
```

**Optional:**
```bash
FRONTEND_URL=https://sistemajoyeria-frontend.vercel.app  # For cross-origin cookies
REDIS_URL=<redis-url>  # For session persistence across restarts
```

### Vercel (Frontend)

**Optional (auto-detected if not set):**
```bash
REACT_APP_API_URL=https://sistemajoyeria-production.up.railway.app/api
```

---

## Common Issues & Solutions

### Issue: `cd: backend: No such file or directory`

**Cause:** Build command tries to `cd backend` in Nixpacks context  
**Solution:** Remove `buildCommand` from `railway.json` - let npm workspaces handle installation

### Issue: API not found on production

**Cause:** Frontend not pointing to Railway backend  
**Solution:** Verify `api.js` has correct auto-detection logic for `vercel.app` hostname

### Issue: CORS errors

**Cause:** Backend not allowing frontend origin  
**Solution:** Ensure `https://sistemajoyeria-frontend.vercel.app` is in `allowedOrigins` array in `server.js`

### Issue: Login not working (cookies)

**Cause:** Cross-origin cookies need special configuration  
**Solution:** Ensure `FRONTEND_URL` is set in Railway and cookies use `sameSite: 'none'` + `secure: true`

---

## Deployment Checklist

### Railway
- [ ] Push to main/production branch
- [ ] Verify environment variables are set
- [ ] Check build logs for errors
- [ ] Test health endpoint: `/health`

### Vercel
- [ ] Push to main/production branch
- [ ] Verify build completes
- [ ] Test all routes work (SPA rewrite)
- [ ] Test API connectivity

### Post-Deployment
- [ ] Test login functionality (cross-origin cookies)
- [ ] Verify database operations work
- [ ] Check image uploads (Cloudinary)

---

**Last Updated:** 2025-11-28  
**Status:** ✅ Production Ready
