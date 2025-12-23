-- =========================================
-- MIGRACIÓN: Hacer campos de cliente opcionales
-- =========================================
-- Esta migración hace que los campos telefono y cedula sean opcionales
-- y elimina la restricción UNIQUE de cedula
-- Solo el campo nombre será obligatorio

-- Descripción de cambios:
-- 1. Hacer telefono opcional (permitir NULL)
-- 2. Hacer cedula opcional (permitir NULL)
-- 3. Eliminar restricción UNIQUE de cedula

-- =========================================
-- PASO 1: Eliminar restricción UNIQUE de cedula
-- =========================================
ALTER TABLE clientes 
  DROP CONSTRAINT IF EXISTS clientes_cedula_key;

-- =========================================
-- PASO 2: Hacer columna telefono opcional
-- =========================================
ALTER TABLE clientes 
  ALTER COLUMN telefono DROP NOT NULL;

-- =========================================
-- PASO 3: Hacer columna cedula opcional
-- =========================================
ALTER TABLE clientes 
  ALTER COLUMN cedula DROP NOT NULL;

-- =========================================
-- VERIFICACIÓN
-- =========================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migración completada exitosamente';
  RAISE NOTICE '📋 Cambios realizados:';
  RAISE NOTICE '   - Campo telefono ahora es opcional';
  RAISE NOTICE '   - Campo cedula ahora es opcional';
  RAISE NOTICE '   - Restricción UNIQUE de cedula eliminada';
  RAISE NOTICE '   - Solo el campo nombre es obligatorio';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NOTA: Los datos existentes no se han modificado';
END $$;
