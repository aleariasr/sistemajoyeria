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

**Root cause:** Using `cd backend && node server.js` in the start command can fail in certain Railway/Nixpacks build contexts because:
1. The working directory context may differ from the repository root
2. The `cd backend` command may not find the directory in the build output
3. Shell command chaining with `cd` is fragile across different environments

### ✅ Solution: Use npm Workspace Commands

The fix is to use npm workspace commands instead of `cd backend`:
- `npm start --workspace=backend` runs from the root and properly sets the working directory
- npm handles path resolution correctly regardless of the current directory
- This is the recommended approach for monorepo deployments

### ✅ Server Startup Pattern

The server uses a **"bind first, connect later"** pattern optimized for cloud deployments:

1. **HTTP server binds immediately** - Responds to health checks within milliseconds
2. **Database connects asynchronously** - Happens in background without blocking
3. **Health endpoint shows connection status** - `/health` includes `databaseConnected: true/false`

This ensures Railway's health checks pass quickly, even if database connection takes several seconds.

```javascript
// Server binds first
server = app.listen(PORT, HOST, () => {
  // Then database connects asynchronously
  Promise.all([initDatabase(), initDatabaseDia()])
    .then(() => { databaseReady = true; })
    .catch((err) => { /* Server stays up for debugging */ });
});
```

### ✅ Current Configuration

**`railway.json`:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start --workspace=backend",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Key points:**
- ❌ No `buildCommand` - let Nixpacks auto-detect (runs `npm install` at root)
- ✅ `startCommand` uses `npm start --workspace=backend` - works reliably across environments
- ✅ npm workspaces handle working directory and module resolution automatically

**`nixpacks.toml`:**
```toml
[phases.setup]
nixPkgs = ["nodejs_20", "npm"]

[phases.install]
cmds = ["npm install"]

[start]
cmd = "npm start --workspace=backend"
```

**`Procfile`:**
```text
web: npm start --workspace=backend
```

### Why npm Workspace Commands Are Better

Instead of relying on shell `cd` commands, npm workspace commands:
1. **Always work from root:** They don't depend on the current working directory
2. **Proper module resolution:** npm sets up the environment correctly for hoisted dependencies
3. **Cross-platform compatible:** Works the same on all platforms
4. **Leverage package.json scripts:** The `backend/package.json` defines `"start": "node server.js"`

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

### Issue: `Application failed to respond` 

**Cause:** Railway health checks timeout because the server takes too long to start (typically waiting for database initialization before binding to the port).

**How it's fixed:**
The server now uses a "bind first, connect later" pattern:
1. The HTTP server binds to the port immediately when the app starts
2. Database initialization happens asynchronously in the background
3. Health checks pass immediately while database connects

**Health check endpoint behavior:**
```json
// Before database connects:
{"status":"ok","databaseConnected":false,...}

// After database connects:
{"status":"ok","databaseConnected":true,...}
```

**If this issue persists:**
1. Check Railway build logs for errors during `npm install`
2. Verify environment variables are set correctly
3. Check that no other process is using the port
4. Review the Railway service logs for startup errors

### Issue: `cd: backend: No such file or directory`

**Cause:** The `cd backend` shell command fails because Railway/Nixpacks runs from a different working directory, or the backend folder isn't in the expected location after build.

**Solutions:**
1. **Use npm workspace commands** (recommended):
   ```json
   // railway.json
   "startCommand": "npm start --workspace=backend"
   ```
   
2. **Verify configuration files match:**
   - `railway.json` → `"startCommand": "npm start --workspace=backend"`
   - `nixpacks.toml` → `cmd = "npm start --workspace=backend"`
   - `Procfile` → `web: npm start --workspace=backend`

3. **Check Railway dashboard settings:**
   - Railway dashboard settings can override config files
   - Go to: Service Settings → Deploy → Start Command
   - Ensure it's set to: `npm start --workspace=backend`
   - Or clear the field to use the config file values

4. **Verify the backend directory exists in deployment:**
   - Check Railway build logs for any errors
   - Ensure `.gitignore` or `.railwayignore` doesn't exclude `/backend`

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
