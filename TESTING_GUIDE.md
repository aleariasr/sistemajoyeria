# Testing Guide - Credit Sales & Cash Register Fixes

## Overview
This guide outlines the tests that should be performed to verify the credit sales and cash register synchronization fixes.

## Fixed Issues

### 1. Credit Sales Synchronization
**Problem**: Credit sales were being saved to `ventas_dia` (day database) and incorrectly included in cash register closing.
**Fix**: Credit sales now go directly to the main `ventas` database.

### 2. Cash Register Summary
**Problem**: Cash register summary included credit sales amounts.
**Fix**: Cash register summary now only shows cash/payment actually received (excluding credit sales).

### 3. Abonos (Payments) Not Reflected
**Problem**: Payments on credit accounts were not included in cash register.
**Fix**: Abonos are now included in the cash register summary and closing.

### 4. Data Loss During Transfer
**Problem**: `tipo_venta` and `id_cliente` fields were lost during cash register closing.
**Fix**: All fields are now preserved during the transfer process.

## Test Scenarios

### Scenario 1: Create a Cash Sale
1. Login to the system
2. Navigate to "Nueva Venta"
3. Add a product to the cart
4. Select "Contado" (Cash sale)
5. Select payment method: "Efectivo"
6. Complete the sale

**Expected Results:**
- Sale is saved to `ventas_dia` database
- Sale appears in "Cierre de Caja"
- Sale is included in cash register summary

### Scenario 2: Create a Credit Sale
1. Login to the system
2. Navigate to "Nueva Venta"
3. Add a product to the cart
4. Select "Credito" (Credit sale)
5. Select a client
6. Complete the sale

**Expected Results:**
- Sale is saved DIRECTLY to main `ventas` database
- Sale does NOT appear in "Cierre de Caja" (day sales)
- An account receivable (`cuenta_por_cobrar`) is created
- Sale is NOT included in cash register totals

### Scenario 3: Make a Payment on Credit Account
1. Navigate to "Cuentas por Cobrar"
2. Select an account with pending balance
3. Click "Registrar Abono"
4. Enter payment amount and method
5. Complete the payment

**Expected Results:**
- Abono (payment) is recorded
- Account balance is updated
- Abono appears in "Cierre de Caja" under "Abonos"
- Abono is included in cash register totals by payment method

### Scenario 4: Cash Register Closing
1. Navigate to "Cierre de Caja"
2. Verify summary shows:
   - Only cash sales (not credit sales)
   - Abonos received today
   - Combined totals by payment method
3. Click "Realizar Cierre de Caja"

**Expected Results:**
- Only cash/card sales are transferred from `ventas_dia` to `ventas`
- All fields (`tipo_venta`, `id_cliente`) are preserved
- `ventas_dia` database is cleared
- Credit sales remain in main database (already there)

### Scenario 5: Historical Sales View
1. Navigate to "Historial de Ventas"
2. View the list of sales

**Expected Results:**
- Both cash and credit sales are visible
- "Tipo" column shows "Contado" or "Crédito"
- Visual badges distinguish between sale types
- Filtering works correctly

### Scenario 6: Sale Detail View
1. Navigate to "Historial de Ventas"
2. Click "Ver Detalle" on any sale

**Expected Results:**
- Sale type is clearly displayed
- All information is present (items, amounts, payment details)
- Credit sales show client information (if linked)

## Database Verification

### Check ventas_dia
```sql
SELECT COUNT(*) FROM ventas_dia WHERE tipo_venta = 'Credito';
-- Should return 0 (credit sales should NOT be here)
```

### Check main ventas
```sql
SELECT COUNT(*), tipo_venta FROM ventas GROUP BY tipo_venta;
-- Should show both 'Contado' and 'Credito' sales
```

### Check accounts receivable
```sql
SELECT c.*, v.tipo_venta 
FROM cuentas_por_cobrar c 
LEFT JOIN ventas v ON c.id_venta = v.id;
-- All should have tipo_venta = 'Credito'
```

### Check abonos
```sql
SELECT COUNT(*), metodo_pago FROM abonos GROUP BY metodo_pago;
-- Should show payments by method
```

## API Endpoints to Test

### POST /api/ventas
- With `tipo_venta: 'Contado'` → saves to ventas_dia
- With `tipo_venta: 'Credito'` → saves to main ventas + creates cuenta_por_cobrar

### GET /api/cierrecaja/resumen-dia
- Returns only cash/card sales (not credit)
- Includes abonos in the summary
- Shows combined totals

### POST /api/cierrecaja/cerrar-caja
- Transfers only non-credit sales
- Preserves all fields
- Clears ventas_dia

### POST /api/cuentas-por-cobrar/:id/abonos
- Creates abono record
- Updates account balance
- Abono appears in cash register

## Edge Cases to Test

1. **Mixed sales day**: Create both cash and credit sales, verify closing works correctly
2. **Multiple payment methods**: Test Efectivo, Tarjeta, Transferencia
3. **Partial payments**: Make partial abonos on credit accounts
4. **Same day operations**: Create sale, make payment, close register all in same day
5. **Date boundaries**: Test operations crossing midnight
6. **Empty cash register**: Try to close with no sales
7. **Credit only day**: Day with only credit sales (should allow closing with no sales to transfer)

## Performance Checks

- Verify page load times are acceptable
- Check that large numbers of sales don't slow down the system
- Ensure database queries are efficient

## Security Checks

- Verify authentication is required for all operations
- Check that users can only access authorized functions
- Ensure SQL injection prevention is working

## Rollback Plan

If issues are found:
1. The changes are isolated to specific files
2. Git can be used to revert to previous commit
3. Database migrations are backward compatible

## Files Modified

- `backend/routes/ventas.js`
- `backend/routes/cierrecaja.js`
- `backend/models/VentaDia.js`
- `frontend/src/components/CierreCaja.js`
- `frontend/src/components/HistorialVentas.js`
- `frontend/src/components/DetalleVenta.js`

## Success Criteria

✅ Credit sales don't appear in cash register closing  
✅ Cash register summary only shows actual cash/payments received  
✅ Abonos appear in cash register  
✅ All fields preserved during transfer  
✅ No data loss  
✅ UI clearly distinguishes credit vs cash sales  
✅ All existing functionality still works  
✅ System is production-ready  
