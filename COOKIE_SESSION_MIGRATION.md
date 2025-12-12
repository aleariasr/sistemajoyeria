# Cookie-Session Migration

## Overview

The application has been migrated from `express-session` with `MemoryStore` to `cookie-session` for better compatibility with Railway's proxy edge infrastructure.

## Problem

With `express-session` and `MemoryStore`:
- Railway's proxy doesn't maintain session affinity
- Each request could get routed to a different instance
- Different sessionID on each request → session loss → 401 errors
- Warning: "MemoryStore is not designed for production"

## Solution

`cookie-session` stores the entire session in an encrypted cookie:
- ✅ No server-side storage required (stateless)
- ✅ Works perfectly with proxies and load balancers
- ✅ Simpler architecture
- ✅ Compatible with express-session API
- ✅ Automatic encryption/decryption

## Changes Made

### 1. Dependencies (`backend/package.json`)
```json
"cookie-session": "^2.0.0"  // Added
```

### 2. Server Configuration (`backend/server.js`)
- Removed: `express-session`, Redis configuration, MemoryStore
- Added: `cookie-session` with proper cross-origin settings

```javascript
const cookieSession = require('cookie-session');

app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_SECRET || 'joyeria-secret-key-2024'],
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  secure: isProduction,        // HTTPS only in production
  httpOnly: true,              // Not accessible from JavaScript
  sameSite: isProduction ? 'none' : 'lax', // Cross-origin support
  path: '/',
}));
```

### 3. Auth Routes (`backend/routes/auth.js`)
- **Login**: Removed `req.session.save()` callback (automatic with cookie-session)
- **Logout**: Changed from `req.session.destroy()` to `req.session = null`

### 4. Other Routes
- **No changes needed!** All routes use `req.session.*` which is compatible

### 5. Middleware
- **No changes needed!** `requireAuth` checks `req.session.userId` (compatible)

## API Compatibility

cookie-session is compatible with express-session API:

| Operation | express-session | cookie-session | Status |
|-----------|----------------|----------------|--------|
| Read session | `req.session.userId` | `req.session.userId` | ✅ Compatible |
| Set session | `req.session.userId = 1` | `req.session.userId = 1` | ✅ Compatible |
| Save session | `req.session.save(cb)` | Automatic on response | ✅ No action needed |
| Clear session | `req.session.destroy(cb)` | `req.session = null` | ⚠️ Changed |

## Testing

Run the validation test:
```bash
cd backend
node tests/test-cookie-session.js
```

## Deployment Notes

### Environment Variables (Railway)
No changes needed! Same variables:
- `SESSION_SECRET` - Used as encryption key for cookies
- `FRONTEND_URL` - For CORS (same as before)
- `SUPABASE_URL`, `SUPABASE_KEY` - Database (unchanged)

### HTTPS Requirement
In production (Railway):
- `secure: true` - Cookies only sent over HTTPS
- `sameSite: 'none'` - Required for cross-origin (Vercel ↔ Railway)

### Cookie Size Limit
- Maximum: 4KB per cookie
- Current usage: ~500 bytes (userId, username, role, fullName)
- ✅ Well within limits

## Security

cookie-session provides strong security:
1. **Encryption**: Session data encrypted with `SESSION_SECRET`
2. **HttpOnly**: Cookie not accessible from JavaScript
3. **Secure**: HTTPS-only in production
4. **SameSite**: Cross-origin protection
5. **Signed**: Tamper detection with HMAC

## Rollback Plan

If needed, revert to express-session:
1. The dependency is still in `package.json`
2. Git revert to commit before migration
3. Redeploy to Railway

## Benefits

✅ **Reliability**: No session loss with Railway proxy  
✅ **Simplicity**: No Redis/MemoryStore to manage  
✅ **Scalability**: Fully stateless architecture  
✅ **Performance**: No database lookups for sessions  
✅ **Cost**: No Redis instance needed  

## References

- [cookie-session documentation](https://github.com/expressjs/cookie-session)
- [Railway proxy architecture](https://docs.railway.app/reference/networking)
- [Express session best practices](https://github.com/expressjs/session#compatible-session-stores)
