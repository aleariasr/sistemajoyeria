# Testing Guide - Online Orders, Notifications & Auth/Roles

This document explains the test coverage for online orders, email notifications, push notifications, and authentication/authorization.

## Overview

The test suite covers:
1. **Online Orders** - Order creation, validation, stock management
2. **Email Service** - Email templates, configuration, error handling
3. **Push Notifications** - Subscription management, broadcasting
4. **Authentication & Authorization** - Session management, role-based access control

## Test Structure

```
backend/tests/
├── integration/
│   ├── pedidos-online.routes.test.js      # Online orders API tests
│   ├── notifications.routes.test.js       # Push notifications API tests
│   └── auth.routes.test.js                # Authentication tests (existing)
├── unit/
│   ├── emailService.test.js               # Email service unit tests
│   └── auth.middleware.test.js            # Auth middleware unit tests
└── mocks/
    ├── resend.mock.js                     # Email service mock
    ├── supabase.mock.js                   # Database mock
    └── cloudinary.mock.js                 # Image service mock
```

## Running Tests

### Run All Tests
```bash
npm run test:backend
```

### Run Specific Test Suites
```bash
# Online orders tests
npm run test:orders

# Notifications and email tests
npm run test:notifications

# Authentication and authorization tests
npm run test:auth

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Coverage

### 1. Online Orders (`tests/integration/pedidos-online.routes.test.js`)

Tests the complete online order flow from storefront to admin management.

#### Public Routes (No Authentication)
- `POST /api/public/orders` - Create order
  - ✓ Valid order creation with single item
  - ✓ Multiple items in order
  - ✓ Insufficient stock (returns 400)
  - ✓ Zero stock product (returns 400)
  - ✓ Missing customer data (returns 400)
  - ✓ Invalid email format (returns 400)
  - ✓ Invalid phone format (returns 400)
  - ✓ Empty items array (returns 400)
  - ✓ Invalid quantity (returns 400)
  - ✓ XSS sanitization
  - ✓ Optional address field

- `GET /api/public/orders/:id` - Get order confirmation
  - ✓ Valid order retrieval
  - ✓ Non-existent order (returns 404)

#### Admin Routes (Authentication Required)
- `GET /api/pedidos-online` - List orders
  - ✓ Admin access
  - ✓ Dependiente access
  - ✓ Unauthenticated (returns 401)

- `GET /api/pedidos-online/:id` - Get order details
  - ✓ Admin access
  - ✓ Unauthenticated (returns 401)

- `PATCH /api/pedidos-online/:id/estado` - Update order status
  - ✓ Invalid estado (returns 400)
  - ✓ Unauthenticated (returns 401)

- `PATCH /api/pedidos-online/:id` - Update order notes
  - ✓ Admin can update notes
  - ✓ Unauthenticated (returns 401)

- `GET /api/pedidos-online/resumen/stats` - Get statistics
  - ✓ Admin access
  - ✓ Unauthenticated (returns 401)

### 2. Email Service (`tests/unit/emailService.test.js`)

Tests email generation and sending with mocks (no real emails sent).

#### Email Functions
- `enviarConfirmacionPedido` - Order confirmation to customer
  - ✓ Successful send
  - ✓ Handles orders without notes
  - ✓ Returns not configured when API key missing
  - ✓ Currency formatting

- `notificarNuevoPedido` - New order notification to admin
  - ✓ Successful send
  - ✓ Returns not configured when admin email missing
  - ✓ Includes all order items

- `enviarConfirmacionPago` - Payment confirmation to customer
  - ✓ Successful send
  - ✓ Indicates order in preparation

- `enviarNotificacionEnvio` - Shipping notification to customer
  - ✓ Successful send
  - ✓ Includes delivery information

- `enviarCancelacionPedido` - Cancellation notification
  - ✓ Successful send with reason
  - ✓ Handles cancellation without reason

- `enviarTicketVentaPOS` - POS receipt email
  - ✓ Successful send
  - ✓ Cash payment details
  - ✓ Mixed payment details
  - ✓ Discount display
  - ✓ Notes inclusion

#### Template Validation
- ✓ Store branding included
- ✓ Reply-to address
- ✓ Valid HTML structure

### 3. Push Notifications (`tests/integration/notifications.routes.test.js`)

Tests push notification subscription and broadcasting.

#### Routes
- `GET /api/notifications/vapid-public`
  - ✓ Returns public key when configured
  - ✓ Returns 503 when not configured
  - ✓ No authentication required

- `POST /api/notifications/subscribe`
  - ✓ Authenticated user can subscribe
  - ✓ Requires authentication (401)
  - ✓ Missing endpoint (400)
  - ✓ Missing keys (400)
  - ✓ Incomplete keys (400)

- `DELETE /api/notifications/unsubscribe`
  - ✓ Authenticated user can unsubscribe
  - ✓ Requires authentication (401)
  - ✓ Missing endpoint (400)

- `POST /api/notifications/test`
  - ✓ Send test notification
  - ✓ Default title/body
  - ✓ Requires authentication (401)
  - ✓ No subscriptions found

- `POST /api/notifications/broadcast`
  - ✓ Broadcast to all users
  - ✓ Requires authentication (401)
  - ✓ Missing title (400)
  - ✓ Missing body (400)
  - ✓ requireInteraction flag

### 4. Authentication Middleware (`tests/unit/auth.middleware.test.js`)

Tests authentication and role-based access control.

#### Middleware Functions
- `requireAuth` - Basic authentication
  - ✓ Allows authenticated user
  - ✓ Blocks no session (401)
  - ✓ Blocks empty session (401)
  - ✓ Blocks session without userId (401)

- `requireAdmin` - Administrator access
  - ✓ Allows admin role
  - ✓ Allows capitalized Admin role
  - ✓ Blocks non-admin (403)
  - ✓ Blocks unauthenticated (401)
  - ✓ Blocks user without role (403)

- `requireRole` - Flexible role checking
  - ✓ Single role (string)
  - ✓ Multiple roles (array)
  - ✓ Case-insensitive
  - ✓ Blocks non-matching role (403)
  - ✓ Blocks unauthenticated (401)

- `checkSessionExpiration` - Session timeout
  - ✓ Allows active session
  - ✓ Expires after timeout (401)
  - ✓ Allows request without session
  - ✓ Allows session without lastActivity
  - ✓ Uses default timeout
  - ✓ Updates lastActivity on each request

#### Middleware Chaining
- ✓ requireAuth -> requireAdmin (success)
- ✓ Chain fails on first rejection
- ✓ Chain fails on second rejection

## Mocks and Test Data

### Email Mock (`mocks/resend.mock.js`)
- Simulates Resend email service
- Captures sent emails for verification
- No real email sending
- Configurable responses

**Configuration:**
```javascript
process.env.RESEND_API_KEY = 'test-api-key';
process.env.EMAIL_FROM = 'test@example.com';
process.env.EMAIL_FROM_NAME = 'Test Store';
process.env.ADMIN_EMAIL = 'admin@example.com';
```

### Push Notification Mock
- Simulates push notification service
- Tracks sent notifications
- No real push notifications

### Database Mock (`mocks/supabase.mock.js`)
- In-memory database simulation
- Fixtures for users, products, orders
- Consistent test data

## Environment Variables

### Required for Tests
None - tests use mocks and don't require real API keys.

### Required for Production
```bash
# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Your Store Name
EMAIL_REPLY_TO=support@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com

# Store Information
STORE_NAME=Your Jewelry Store
STORE_URL=https://yourdomain.com
STORE_PHONE=+1234567890

# Push Notifications (Optional)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

## Behavior Without Configuration

### Email Service
- Returns `{ sent: false, reason: 'not_configured' }`
- Logs warning to console
- Does not crash or throw errors
- Order creation still succeeds

### Push Notifications
- Returns 503 when VAPID key missing
- Subscription attempts handled gracefully
- Does not crash application

## Security Testing

### Input Validation
- ✓ Email format validation
- ✓ Phone format validation
- ✓ XSS prevention (HTML sanitization)
- ✓ SQL injection prevention (parameterized queries)
- ✓ Rate limiting (10 requests per hour per IP)
- ✓ Maximum field lengths

### Authentication
- ✓ Session-based authentication
- ✓ Role-based access control (RBAC)
- ✓ Admin-only routes protected
- ✓ Session expiration
- ✓ Secure cookie settings

### Authorization
- ✓ Admin routes require admin role
- ✓ POS routes require authentication
- ✓ Public routes accessible without auth
- ✓ Proper error messages (401, 403)

## Common Issues and Solutions

### Issue: Tests fail with "jest: command not found"
**Solution:** Run `npm install` to install dependencies

### Issue: Tests fail with module not found
**Solution:** Ensure you're running tests from the backend directory or use the workspace command from root:
```bash
npm run test:backend  # From root
# OR
cd backend && npm test  # From backend directory
```

### Issue: Mock not working
**Solution:** Check that mocks are defined before requiring the modules that use them. See existing test files for examples.

### Issue: Session tests fail
**Solution:** Ensure cookie-session middleware is properly configured in tests with the same settings as production.

## Best Practices

1. **Use Fresh Fixtures** - Reset fixtures in `beforeEach` for test isolation
2. **Mock External Services** - Never make real API calls in tests
3. **Test Error Cases** - Test both success and failure scenarios
4. **Descriptive Test Names** - Use clear, descriptive test names
5. **Arrange-Act-Assert** - Follow AAA pattern in tests
6. **Avoid Test Interdependence** - Each test should be independent
7. **Clean Up** - Clear mocks in `afterEach` or `beforeEach`

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Manual workflow dispatch

**Required:** All tests must pass before merging.

## Future Enhancements

- [ ] Add tests for composite products (sets)
- [ ] Add tests for product variants
- [ ] Add tests for order state transitions
- [ ] Add tests for stock restoration on cancellation
- [ ] Add performance tests for large order lists
- [ ] Add end-to-end tests with real browser

## Related Documentation

- [Backend API Documentation](../BACKEND_COMPLETE.md)
- [Security Guidelines](../../SECURITY.md)
- [Deployment Guide](../../DEPLOY.md)
