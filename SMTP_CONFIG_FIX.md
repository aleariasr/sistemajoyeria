# Email Service SMTP Configuration Fix

## Problem
The email service was experiencing "Connection timeout" errors when attempting to send emails using iCloud Mail (smtp.mail.me.com). The error occurred in production on Railway when trying to send sale receipts from the POS system.

## Root Cause
The original nodemailer configuration had several issues:
1. No timeout settings - connections could hang indefinitely
2. No connection pooling - each email created a new connection
3. Strict TLS settings without environment override - incompatible with some SMTP providers
4. Limited error logging - difficult to diagnose connection issues
5. No connection verification on startup

## Solution Implemented

### 1. Enhanced SMTP Configuration
Updated `backend/services/emailService.js` with:

```javascript
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: EMAIL_CONFIG.user,
    pass: EMAIL_CONFIG.password
  },
  // Connection pooling for better performance
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  // Timeout settings to prevent hanging connections
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000,   // 30 seconds
  socketTimeout: 60000,     // 60 seconds
  // TLS configuration - allows environment override
  tls: {
    rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
    minVersion: 'TLSv1.2'
  },
  // Debug logging in development
  debug: process.env.NODE_ENV === 'development',
  logger: process.env.NODE_ENV === 'development'
});

// Verify connection on startup
transporter.verify(function(error, success) {
  if (error) {
    console.error('❌ SMTP Connection verification failed:', error);
  } else {
    console.log('✅ SMTP Server is ready to send emails');
  }
});
```

### 2. Improved Error Logging
All email sending functions now log detailed error information:

```javascript
catch (error) {
  console.error('❌ Error sending email:', {
    code: error.code,
    command: error.command,
    response: error.response,
    responseCode: error.responseCode,
    message: error.message
  });
  return { sent: false, error: error.message, code: error.code };
}
```

### 3. Environment Variables
Added new optional configuration in `.env.example`:

```env
# SMTP Configuration
SMTP_HOST=smtp.mail.me.com
SMTP_PORT=587
SMTP_SECURE=false

# Optional: Disable certificate verification if needed
# SMTP_REJECT_UNAUTHORIZED=false
```

## SMTP Provider Configuration

### iCloud Mail
```env
SMTP_HOST=smtp.mail.me.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=your-email@icloud.com
EMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

Get app-specific password from: https://appleid.apple.com

### Gmail (Port 587)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=app-specific-password
```

Get app-specific password from: https://myaccount.google.com/apppasswords

### Gmail SSL (Port 465)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=app-specific-password
```

## Benefits

1. **Prevents Timeouts**: Connection, greeting, and socket timeouts prevent indefinite hanging
2. **Better Performance**: Connection pooling reuses SMTP connections efficiently
3. **Provider Compatibility**: Configurable TLS settings work with various SMTP providers
4. **Better Debugging**: Detailed error logging and optional debug mode
5. **Early Detection**: Connection verification on startup catches configuration issues early
6. **Production Ready**: Tested with iCloud Mail, Gmail, and Gmail SSL configurations

## Testing

All tests pass successfully:
- ✅ `test-email-venta.js` - Email functionality tests
- ✅ `test-smtp-config.js` - SMTP configuration tests  
- ✅ `test-email-service-startup.js` - Startup configuration tests

## Deployment Notes

For Railway deployment, ensure these environment variables are set:
- `EMAIL_USER` - Your email address
- `EMAIL_APP_PASSWORD` - App-specific password
- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP port (usually 587 or 465)
- `SMTP_SECURE` - "true" for port 465, "false" for port 587

If you experience certificate issues with your SMTP provider, you can temporarily set:
- `SMTP_REJECT_UNAUTHORIZED=false` (use with caution)

## Files Modified
- `backend/services/emailService.js` - Enhanced SMTP configuration and error handling
- `backend/.env.example` - Added SMTP configuration documentation

## Files Added
- `backend/tests/test-smtp-config.js` - Configuration validation tests
- `backend/tests/test-email-service-startup.js` - Startup configuration tests
- `SMTP_CONFIG_FIX.md` - This documentation file
