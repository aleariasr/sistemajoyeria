-- Migration to consolidate duplicate cuentas_por_cobrar
-- This script unifies all active accounts for each client into a single account

-- =========================================
-- STEP 1: Create movimientos table to track credit sale history
-- =========================================
CREATE TABLE IF NOT EXISTS movimientos_cuenta (
  id BIGSERIAL PRIMARY KEY,
  id_cuenta_por_cobrar BIGINT NOT NULL REFERENCES cuentas_por_cobrar(id) ON DELETE CASCADE,
  id_venta BIGINT REFERENCES ventas(id),
  tipo TEXT NOT NULL, -- 'venta_credito', 'abono', 'ajuste'
  monto NUMERIC(10, 2) NOT NULL,
  descripcion TEXT,
  fecha_movimiento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usuario TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_movimientos_cuenta_id_cuenta ON movimientos_cuenta(id_cuenta_por_cobrar);
CREATE INDEX IF NOT EXISTS idx_movimientos_cuenta_fecha ON movimientos_cuenta(fecha_movimiento);

-- =========================================
-- STEP 2: Consolidate existing duplicate accounts
-- =========================================

-- First, create a temporary table to identify which accounts to consolidate
CREATE TEMP TABLE cuentas_a_consolidar AS
SELECT 
  id_cliente,
  MIN(id) as cuenta_principal_id,
  ARRAY_AGG(id ORDER BY fecha_creacion) as todas_cuentas_ids,
  COUNT(*) as num_cuentas,
  SUM(monto_total) as total_monto,
  SUM(monto_pagado) as total_pagado,
  SUM(saldo_pendiente) as total_saldo
FROM cuentas_por_cobrar
WHERE estado = 'Pendiente'
GROUP BY id_cliente
HAVING COUNT(*) > 1;

-- Display consolidation plan (for logging purposes)
DO $$
DECLARE
  rec RECORD;
  total_clientes INT;
BEGIN
  SELECT COUNT(*) INTO total_clientes FROM cuentas_a_consolidar;
  
  IF total_clientes > 0 THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CONSOLIDATION PLAN';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total clients with duplicate accounts: %', total_clientes;
    
    FOR rec IN SELECT * FROM cuentas_a_consolidar LOOP
      RAISE NOTICE 'Client ID: % - Accounts to consolidate: % -> Keep account #%', 
        rec.id_cliente, rec.num_cuentas, rec.cuenta_principal_id;
      RAISE NOTICE '  Total owed: % | Total paid: % | Remaining: %',
        rec.total_monto, rec.total_pagado, rec.total_saldo;
    END LOOP;
    RAISE NOTICE '========================================';
  ELSE
    RAISE NOTICE 'No duplicate accounts found. No consolidation needed.';
  END IF;
END $$;

-- =========================================
-- STEP 3: Create movimientos for historical credit sales BEFORE consolidation
-- =========================================

-- Insert movimientos for each credit sale (from cuentas that will be consolidated)
INSERT INTO movimientos_cuenta (id_cuenta_por_cobrar, id_venta, tipo, monto, descripcion, fecha_movimiento, usuario)
SELECT 
  c.cuenta_principal_id,
  cpc.id_venta,
  'venta_credito',
  cpc.monto_total,
  'Venta a crédito - Migración desde cuenta #' || cpc.id,
  cpc.fecha_creacion,
  'system_migration'
FROM cuentas_por_cobrar cpc
JOIN cuentas_a_consolidar c ON cpc.id_cliente = c.id_cliente
WHERE cpc.estado = 'Pendiente'
ORDER BY cpc.fecha_creacion;

-- Insert movimientos for historical abonos (before moving them to principal account)
INSERT INTO movimientos_cuenta (id_cuenta_por_cobrar, id_venta, tipo, monto, descripcion, fecha_movimiento, usuario)
SELECT 
  c.cuenta_principal_id,
  NULL,
  'abono',
  a.monto,
  'Abono - ' || a.metodo_pago || COALESCE(' - ' || a.notas, ''),
  a.fecha_abono,
  a.usuario
FROM abonos a
JOIN cuentas_por_cobrar cpc ON a.id_cuenta_por_cobrar = cpc.id
JOIN cuentas_a_consolidar c ON cpc.id_cliente = c.id_cliente
WHERE cpc.estado = 'Pendiente'
ORDER BY a.fecha_abono;

-- =========================================
-- STEP 4: Migrate abonos to principal account
-- =========================================

-- Update abonos to point to the principal account for each client
-- Using a simpler approach with explicit joins
UPDATE abonos 
SET id_cuenta_por_cobrar = consolidacion.cuenta_principal_id
FROM (
  SELECT 
    cpc.id as cuenta_antigua_id,
    cac.cuenta_principal_id
  FROM cuentas_por_cobrar cpc
  INNER JOIN cuentas_a_consolidar cac ON cpc.id_cliente = cac.id_cliente
  WHERE cpc.estado = 'Pendiente' 
    AND cpc.id != cac.cuenta_principal_id
) consolidacion
WHERE abonos.id_cuenta_por_cobrar = consolidacion.cuenta_antigua_id;

-- =========================================
-- STEP 5: Update principal accounts with consolidated totals
-- =========================================

UPDATE cuentas_por_cobrar
SET 
  monto_total = c.total_monto,
  monto_pagado = c.total_pagado,
  saldo_pendiente = c.total_saldo,
  fecha_ultima_modificacion = NOW()
FROM cuentas_a_consolidar c
WHERE cuentas_por_cobrar.id = c.cuenta_principal_id;

-- =========================================
-- STEP 6: Mark duplicate accounts as consolidated (change estado to 'Consolidada')
-- =========================================

UPDATE cuentas_por_cobrar
SET 
  estado = 'Consolidada',
  fecha_ultima_modificacion = NOW()
WHERE id IN (
  SELECT unnest(todas_cuentas_ids) 
  FROM cuentas_a_consolidar
) AND id NOT IN (
  SELECT cuenta_principal_id 
  FROM cuentas_a_consolidar
);

-- =========================================
-- STEP 7: Add constraint to prevent future duplicates
-- =========================================

-- Create a unique index on id_cliente where estado = 'Pendiente'
-- This ensures only one active account per client
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_cuenta_activa_por_cliente
ON cuentas_por_cobrar (id_cliente)
WHERE estado = 'Pendiente';

-- =========================================
-- STEP 8: Display final results
-- =========================================

DO $$
DECLARE
  total_consolidadas INT;
  total_activas INT;
BEGIN
  SELECT COUNT(*) INTO total_consolidadas 
  FROM cuentas_por_cobrar 
  WHERE estado = 'Consolidada';
  
  SELECT COUNT(*) INTO total_activas 
  FROM cuentas_por_cobrar 
  WHERE estado = 'Pendiente';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION COMPLETED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Accounts marked as consolidated: %', total_consolidadas;
  RAISE NOTICE 'Active unique accounts: %', total_activas;
  RAISE NOTICE '========================================';
END $$;

-- Clean up temporary table
DROP TABLE IF EXISTS cuentas_a_consolidar;
