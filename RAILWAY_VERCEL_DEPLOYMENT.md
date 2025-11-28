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
NODE_ENV=production       # CRITICAL: Enables cross-origin cookie settings
SUPABASE_URL=<your-supabase-url>
SUPABASE_KEY=<your-supabase-anon-key>
SESSION_SECRET=<random-secure-secret>
CLOUDINARY_CLOUD_NAME=<your-cloudinary-name>
CLOUDINARY_API_KEY=<your-cloudinary-key>
CLOUDINARY_API_SECRET=<your-cloudinary-secret>
```

**Optional:**
```bash
FRONTEND_URL=https://sistemajoyeria-frontend.vercel.app  # For additional CORS origin
REDIS_URL=<redis-url>  # For session persistence across restarts
```

> **Note:** `NODE_ENV=production` is the most critical variable. Without it, cookies will use `sameSite: 'lax'` which breaks cross-origin login.

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

### Issue: "Error al iniciar sesión. Por favor, intenta de nuevo."

**This is the most common production issue.** It occurs when cross-origin cookies don't work between Vercel (frontend) and Railway (backend).

**Root Causes:**

1. **Missing cross-origin cookie configuration**
   - Vercel and Railway are on different domains
   - Cookies require `sameSite: 'none'` and `secure: true` for cross-origin requests
   
2. **Missing CORS credentials**
   - Frontend must send `withCredentials: true` in axios requests
   - Backend must respond with `Access-Control-Allow-Credentials: true`

3. **Browser blocking third-party cookies**
   - Some browsers (Safari, Firefox with enhanced tracking protection) block cross-origin cookies by default
   - This is a browser security feature, not a bug

**Solutions:**

1. **Verify backend cookie configuration** (`backend/server.js`):
   ```javascript
   // In production, always use cross-origin settings
   const cookieConfig = {
     httpOnly: true,
     maxAge: 24 * 60 * 60 * 1000,
     secure: isProduction,           // true in production
     sameSite: isProduction ? 'none' : 'lax'  // 'none' in production
   };
   ```

2. **Verify CORS configuration** (`backend/server.js`):
   ```javascript
   const corsOptions = {
     origin: [...allowedOrigins],
     credentials: true  // CRITICAL: Allow cookies
   };
   ```

3. **Verify frontend axios configuration** (`frontend/src/services/api.js`):
   ```javascript
   const api = axios.create({
     baseURL: API_URL,
     withCredentials: true  // CRITICAL: Send cookies
   });
   ```

4. **For users with blocked third-party cookies**, consider:
   - Using same-domain deployment (e.g., Railway for both frontend and backend)
   - Or using token-based authentication (JWT in localStorage) instead of session cookies

**Debugging Steps:**

1. Check Railway logs for CORS blocking messages:
   ```
   🚫 CORS bloqueado para origen: https://...
   ```

2. Check browser console for cookie warnings

3. Test the health endpoint directly:
   ```bash
   curl https://sistemajoyeria-production.up.railway.app/health
   ```

4. Test login endpoint directly:
   ```bash
   curl -X POST https://sistemajoyeria-production.up.railway.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"your-password"}'
   ```

---

## Deployment Checklist

### Railway
- [ ] Push to main/production branch
- [ ] Verify environment variables are set (see Environment Variables section)
- [ ] Check build logs for errors
- [ ] Test health endpoint: `/health`
- [ ] Verify `NODE_ENV=production` is set

### Vercel
- [ ] Push to main/production branch
- [ ] Verify build completes
- [ ] Test all routes work (SPA rewrite)
- [ ] Test API connectivity

### Post-Deployment Testing
- [ ] Open browser DevTools → Network tab
- [ ] Attempt login and check:
  - [ ] Request sent to correct Railway URL
  - [ ] Response status is 200 (not CORS error)
  - [ ] `Set-Cookie` header present in response
  - [ ] Cookie appears in browser storage
- [ ] Verify database operations work
- [ ] Check image uploads (Cloudinary)

### If Login Still Fails

1. **Check Railway Environment Variables:**
   - `NODE_ENV=production` ← MUST be set
   - `SUPABASE_URL` and `SUPABASE_KEY` ← Required for database
   - `SESSION_SECRET` ← Required for sessions

2. **Check Browser Settings:**
   - Try in Chrome (most permissive for third-party cookies)
   - Disable tracking protection temporarily for testing
   - Clear all cookies and try again

3. **Check CORS:**
   - Verify frontend origin is in `allowedOrigins` array in `server.js`

---

**Last Updated:** 2025-11-28  
**Status:** ✅ Production Ready
