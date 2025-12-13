# Safari Cookie Compatibility Guide

## Overview

Safari (both iOS and macOS) has stricter cookie policies compared to Chrome and Firefox. This document explains how the Sistema de Joyería handles Safari's requirements for cross-origin cookies.

## The Problem

Safari blocks cookies in cross-origin requests by default due to Intelligent Tracking Prevention (ITP). This affects our system because:

1. **Frontend POS** (Vercel) and **Backend API** (Railway) are on different domains in production
2. **Storefront** (Vercel) and **Backend API** (Railway) are on different domains in production
3. Session authentication relies on cookies

Without proper configuration, users on Safari would:
- Successfully log in
- Receive a session cookie
- Lose the session on subsequent requests (cookie not sent by browser)

## The Solution

### 1. Backend Cookie Configuration

Located in `backend/server.js` (lines 80-100):

```javascript
app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_SECRET],
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  
  // Safari requirements for cross-origin cookies:
  secure: isProduction,              // MUST be true in production (HTTPS)
  httpOnly: true,                     // Security: not accessible via JavaScript
  sameSite: isProduction ? 'none' : 'lax',  // 'none' allows cross-origin in production
  
  path: '/',
  signed: true,
}));
```

**Key points:**
- `sameSite: 'none'` + `secure: true` in production allows cross-origin cookies
- `secure: true` requires HTTPS (Railway provides this automatically)
- `httpOnly: true` provides security against XSS attacks

### 2. Backend CORS Configuration

Located in `backend/server.js` (lines 184-252):

```javascript
const corsOptions = {
  origin: function (origin, callback) { /* ... */ },
  credentials: true,  // CRITICAL: Allow credentials (cookies)
  
  // Safari-specific explicit headers:
  exposedHeaders: ['Set-Cookie'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
};
```

**Key points:**
- `credentials: true` tells Express to include `Access-Control-Allow-Credentials: true` header
- `exposedHeaders: ['Set-Cookie']` explicitly allows cookie headers
- `allowedHeaders` must include 'Cookie' for Safari
- Origin must be specific (not '*') when using credentials

### 3. Frontend Configuration

#### React POS (`frontend/src/services/api.js`):

```javascript
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true  // Send cookies with every request
});
```

#### Next.js Storefront (`storefront/src/lib/api/client.ts`):

```javascript
const client = axios.create({
  baseURL: getApiUrl(),
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true  // Send cookies with every request
});
```

**Key points:**
- `withCredentials: true` instructs axios to include cookies in requests
- This works with `fetch` API using `credentials: 'include'`
- Must be set on the client, not per-request

### 4. Production Requirements

For Safari to accept cookies in production, you MUST have:

✅ **HTTPS on backend** (Railway provides this)
✅ **HTTPS on frontend** (Vercel provides this)
✅ **Specific origin in CORS** (configured via `FRONTEND_URL` env var)
✅ **`sameSite: 'none'` + `secure: true`** (configured when NODE_ENV=production)
✅ **`withCredentials: true`** on all API clients (configured)
✅ **`credentials: true`** in CORS (configured)

## Environment Variables

### Backend (Railway)

```bash
NODE_ENV=production
SESSION_SECRET=<strong-random-string>
FRONTEND_URL=https://pos.vercel.app,https://tienda.vercel.app
SUPABASE_URL=<your-supabase-url>
SUPABASE_KEY=<your-supabase-key>
```

### Frontend POS (Vercel)

```bash
REACT_APP_API_URL=https://your-backend.railway.app/api
```

### Storefront (Vercel)

```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
```

## Testing Safari Compatibility

### Local Development

Safari should work in local development with these URLs:
- Frontend: `http://localhost:3000`
- Storefront: `http://localhost:3002`
- Backend: `http://localhost:3001`

Note: In development, cookies use `sameSite: 'lax'` which works for same-origin requests.

### Production Testing

1. **Deploy to production** with all environment variables configured
2. **Open Safari** (iOS or macOS)
3. **Test login flow:**
   - Go to the frontend/storefront
   - Log in with valid credentials
   - Verify session persists (check authenticated routes work)
   - Refresh the page (session should remain)
4. **Check browser console** for errors
5. **Check backend logs** on Railway for cookie debugging info

### Debugging

The backend includes detailed logging for Safari issues:

```
🔐 Login request recibido:
  - Origin: https://your-frontend.vercel.app
  - User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)...
  - Time: 2024-01-01T00:00:00.000Z

📤 Response headers para login:
  - Set-Cookie: session=...; path=/; expires=...; httponly; secure; samesite=none
  - Cookie includes SameSite: true
  - Cookie includes Secure: true
  - Cookie includes HttpOnly: true
  - Secure context: true
  - Protocol: https
  - CORS Access-Control-Allow-Credentials: true
  - CORS Access-Control-Allow-Origin: https://your-frontend.vercel.app
```

If you see `⚠️ No cookie header` in subsequent requests, Safari is blocking the cookie.

## Common Issues and Solutions

### Issue 1: Cookie Set but Not Sent

**Symptom:** Login succeeds but subsequent requests fail with 401

**Causes:**
- Missing `withCredentials: true` in frontend → Fixed ✅
- Missing `credentials: true` in CORS → Fixed ✅
- Not using HTTPS in production → Check Railway/Vercel settings
- Wrong origin in CORS allowlist → Check `FRONTEND_URL` env var

### Issue 2: Cookie Not Set at All

**Symptom:** No `Set-Cookie` header in response

**Causes:**
- Session not saved → Check `req.session.userId = ...` in login route
- `secure: true` but using HTTP → Use HTTPS or set `secure: false` in dev
- Missing `SESSION_SECRET` → Check Railway env vars

### Issue 3: CORS Error in Safari

**Symptom:** CORS policy error in Safari console

**Causes:**
- Origin not in allowlist → Add to `FRONTEND_URL`
- Using `Access-Control-Allow-Origin: *` with credentials → Use specific origin
- Missing preflight response → Ensure OPTIONS requests return 200

## Safari's Intelligent Tracking Prevention (ITP)

Safari's ITP can still block cookies in certain scenarios:

1. **Third-party cookies:** Completely blocked
2. **First-party cookies from cross-origin requests:** Allowed with `SameSite=None`
3. **Redirect-based logins:** May be blocked (we use direct POST, so OK)
4. **Link decoration:** Stripped after 24 hours (doesn't affect us)

Our configuration works because:
- We use first-party cookies (user navigates to our frontend domain)
- Login is via direct POST to our backend (not a redirect)
- `SameSite=None` explicitly allows cross-origin use

## References

- [Safari ITP Documentation](https://webkit.org/blog/category/privacy/)
- [MDN: SameSite Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [Express Cookie-Session](https://github.com/expressjs/cookie-session)
- [Axios withCredentials](https://axios-http.com/docs/req_config)

## Monitoring

Watch for these patterns in backend logs:

✅ **Good:** Cookie present in requests after login
```
🔐 Login request recibido → 📤 Response headers → [next request has cookie]
```

❌ **Bad:** No cookie in subsequent requests
```
🔐 Login request recibido → 📤 Response headers → ⚠️ No cookie header
```

If you see the bad pattern on Safari, review this document and check all requirements are met.
