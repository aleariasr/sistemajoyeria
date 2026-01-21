# Frontend Testing Guide

## Overview

This document describes the testing infrastructure for the POS React application.

## Test Structure

```
frontend/src/
├── __tests__/              # Integration tests
│   ├── Login.test.js
│   ├── Ventas.test.js
│   ├── CierreCaja.test.js
│   └── CuentasPorCobrar.test.js
├── mocks/                  # MSW mock handlers
│   ├── handlers.js
│   └── server.js
├── setupTests.js           # Jest setup
└── test-utils.js           # Test utilities and helpers
```

## Testing Stack

- **React Testing Library** - Component testing
- **Jest** - Test runner and assertions
- **MSW (Mock Service Worker)** - API mocking
- **User Event** - User interaction simulation

## Running Tests

```bash
# Run all tests once
npm test --workspace=frontend

# Run tests in watch mode
npm run test:watch --workspace=frontend

# Run tests with coverage
npm run test:coverage --workspace=frontend

# Run specific test file
npm test --workspace=frontend -- Login.test.js
```

## Test Files

### Login.test.js
Tests authentication flows:
- ✅ Login with admin credentials
- ✅ Login with dependiente credentials  
- ✅ Login failure with invalid credentials
- ✅ Logout functionality
- ✅ Form validation
- ✅ Loading states

### Ventas.test.js
Tests sales flows:
- ✅ Product search and display
- ✅ Add/remove items to cart
- ✅ Cash payment (contado)
- ✅ Card payment
- ✅ Mixed payment (efectivo + tarjeta)
- ✅ Credit sale with client selection
- ✅ Stock validation
- ✅ Total calculation
- ✅ Cart clearing after sale

### CierreCaja.test.js
Tests cash closure flows:
- ✅ Display daily summary
- ✅ Admin can close cash register
- ✅ Calculate discrepancies
- ✅ Form validation
- ✅ Date filtering
- ✅ Permission checks (admin only)
- ✅ Summary calculations

### CuentasPorCobrar.test.js
Tests accounts receivable:
- ✅ Display accounts list
- ✅ Account details with balance
- ✅ Partial payment (abono)
- ✅ Full payment completion
- ✅ Payment amount validation
- ✅ Payment history
- ✅ Filter by status
- ✅ Total receivables calculation

## MSW Mock Handlers

The `mocks/handlers.js` file contains mock API responses for:

**Auth endpoints:**
- POST `/api/auth/login`
- GET `/api/auth/session`
- POST `/api/auth/logout`

**Joyas endpoints:**
- GET `/api/joyas`
- POST `/api/joyas`
- PUT `/api/joyas/:id`
- DELETE `/api/joyas/:id`

**Ventas endpoints:**
- POST `/api/ventas`
- GET `/api/ventas/:id`

**Cuentas por cobrar endpoints:**
- GET `/api/cuentas-por-cobrar`
- POST `/api/cuentas-por-cobrar/:id/abonos`

**Cierre de caja endpoints:**
- GET `/api/cierrecaja/resumen-dia`
- POST `/api/cierrecaja/cerrar-caja`

## Test Utilities

`test-utils.js` provides:

**renderWithProviders(component, options)**
- Renders components with AuthProvider and Router
- Use this instead of plain `render()` from RTL

**Mock data:**
- `mockAdminUser` - Admin user object
- `mockDependienteUser` - Dependiente user object
- `mockJoyas` - Sample jewelry products
- `mockClientes` - Sample clients
- `mockVentas` - Sample sales
- `mockCuentasPorCobrar` - Sample receivables

## Writing New Tests

### Basic test structure:

```javascript
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils';
import MyComponent from '../components/MyComponent';

describe('MyComponent', () => {
  test('does something', async () => {
    renderWithProviders(<MyComponent />);
    const user = userEvent.setup();
    
    // Find elements
    const button = screen.getByRole('button', { name: /click me/i });
    
    // Interact
    await user.click(button);
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });
  });
});
```

### Mocking API responses:

```javascript
import { server } from '../mocks/server';
import { rest } from 'msw';

test('handles API error', async () => {
  server.use(
    rest.get('http://localhost:3001/api/joyas', (req, res, ctx) => {
      return res(
        ctx.status(500),
        ctx.json({ success: false, message: 'Server error' })
      );
    })
  );
  
  // Test error handling...
});
```

## Best Practices

1. **Test user behavior, not implementation**
   - Focus on what users see and do
   - Avoid testing internal state or methods

2. **Use semantic queries**
   - Prefer `getByRole`, `getByLabelText`, `getByText`
   - Avoid `getByTestId` unless necessary

3. **Wait for async operations**
   - Always use `waitFor` for async assertions
   - Use `findBy*` queries for elements that appear async

4. **Keep tests independent**
   - Each test should work in isolation
   - MSW handlers are reset after each test

5. **Test critical paths**
   - Focus on user workflows
   - Don't test every component in isolation

## Debugging Tests

### View DOM structure:
```javascript
import { screen } from '@testing-library/react';
screen.debug(); // Prints entire DOM
screen.debug(element); // Prints specific element
```

### Common issues:

**"Unable to find element"**
- Check if element is rendered conditionally
- Use `findBy*` for async elements
- Check query syntax (role, label, text)

**"Test timeout"**
- Increase timeout: `waitFor(() => {...}, { timeout: 5000 })`
- Check if API mock is configured correctly
- Verify async operations complete

**"act() warning"**
- Wrap state updates in `waitFor`
- Use `userEvent` instead of `fireEvent`
- Ensure all async operations finish

## Coverage Goals

Aim for:
- **Statements:** > 80%
- **Branches:** > 75%
- **Functions:** > 80%
- **Lines:** > 80%

Focus on critical business logic and user flows.

## CI/CD Integration

Tests run automatically in CI with:
```bash
npm test --workspace=frontend
```

All tests must pass before merging to main branch.
