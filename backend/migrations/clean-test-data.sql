-- =========================================
-- LIMPIEZA DE DATOS DE PRUEBA
-- Sistema de Joyería
-- =========================================
-- Este script elimina TODOS los datos de prueba
-- pero PRESERVA las joyas y los usuarios registrados
-- 
-- IMPORTANTE: Ejecutar en el SQL Editor de Supabase
-- URL: https://mvujkbpbqyihixkbzthe.supabase.co/project/_/sql
-- =========================================

-- Iniciar transacción para poder hacer rollback si hay errores
BEGIN;

-- =========================================
-- PASO 1: Eliminar tablas dependientes primero
-- (respetando las restricciones de clave foránea)
-- =========================================

-- 1.1 Eliminar abonos (depende de cuentas_por_cobrar)
DELETE FROM abonos;
RAISE NOTICE '✅ Tabla abonos limpiada';

-- 1.2 Eliminar items de venta (depende de ventas y joyas)
DELETE FROM items_venta;
RAISE NOTICE '✅ Tabla items_venta limpiada';

-- 1.3 Eliminar items de venta del día (depende de ventas_dia y joyas)
DELETE FROM items_venta_dia;
RAISE NOTICE '✅ Tabla items_venta_dia limpiada';

-- 1.4 Eliminar devoluciones (depende de ventas y joyas)
DELETE FROM devoluciones;
RAISE NOTICE '✅ Tabla devoluciones limpiada';

-- =========================================
-- PASO 2: Eliminar tablas de segundo nivel
-- =========================================

-- 2.1 Eliminar cuentas por cobrar (depende de ventas y clientes)
DELETE FROM cuentas_por_cobrar;
RAISE NOTICE '✅ Tabla cuentas_por_cobrar limpiada';

-- =========================================
-- PASO 3: Eliminar tablas de tercer nivel
-- =========================================

-- 3.1 Eliminar ventas (depende de usuarios y clientes)
DELETE FROM ventas;
RAISE NOTICE '✅ Tabla ventas limpiada';

-- 3.2 Eliminar ventas del día (tabla temporal)
DELETE FROM ventas_dia;
RAISE NOTICE '✅ Tabla ventas_dia limpiada';

-- =========================================
-- PASO 4: Eliminar tablas relacionadas con inventario
-- (dependen de joyas pero no eliminamos joyas)
-- =========================================

-- 4.1 Eliminar movimientos de inventario
DELETE FROM movimientos_inventario;
RAISE NOTICE '✅ Tabla movimientos_inventario limpiada';

-- 4.2 Eliminar reservas de inventario
DELETE FROM reservas_inventario;
RAISE NOTICE '✅ Tabla reservas_inventario limpiada';

-- 4.3 Eliminar auditoría de inventario
DELETE FROM auditoria_inventario;
RAISE NOTICE '✅ Tabla auditoria_inventario limpiada';

-- =========================================
-- PASO 5: Eliminar tablas independientes
-- =========================================

-- 5.1 Eliminar clientes
DELETE FROM clientes;
RAISE NOTICE '✅ Tabla clientes limpiada';

-- 5.2 Eliminar ingresos extras
DELETE FROM ingresos_extras;
RAISE NOTICE '✅ Tabla ingresos_extras limpiada';

-- 5.3 Eliminar cierres de caja
DELETE FROM cierres_caja;
RAISE NOTICE '✅ Tabla cierres_caja limpiada';

-- =========================================
-- PASO 6: Reiniciar secuencias de IDs
-- (opcional, para que los nuevos registros
-- empiecen desde 1)
-- =========================================

-- Reiniciar secuencias de tablas limpiadas
ALTER SEQUENCE IF EXISTS abonos_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS items_venta_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS items_venta_dia_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS devoluciones_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS cuentas_por_cobrar_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS ventas_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS ventas_dia_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS movimientos_inventario_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS reservas_inventario_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS auditoria_inventario_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS clientes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS ingresos_extras_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS cierres_caja_id_seq RESTART WITH 1;

RAISE NOTICE '✅ Secuencias reiniciadas';

-- =========================================
-- VERIFICACIÓN: Mostrar conteos finales
-- =========================================

-- Verificar que joyas y usuarios siguen intactos
DO $$
DECLARE
  v_joyas INTEGER;
  v_usuarios INTEGER;
  v_ventas INTEGER;
  v_clientes INTEGER;
  v_items INTEGER;
  v_movimientos INTEGER;
  v_cuentas INTEGER;
  v_abonos INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_joyas FROM joyas;
  SELECT COUNT(*) INTO v_usuarios FROM usuarios;
  SELECT COUNT(*) INTO v_ventas FROM ventas;
  SELECT COUNT(*) INTO v_clientes FROM clientes;
  SELECT COUNT(*) INTO v_items FROM items_venta;
  SELECT COUNT(*) INTO v_movimientos FROM movimientos_inventario;
  SELECT COUNT(*) INTO v_cuentas FROM cuentas_por_cobrar;
  SELECT COUNT(*) INTO v_abonos FROM abonos;
  
  RAISE NOTICE '';
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'RESUMEN DE LIMPIEZA';
  RAISE NOTICE '=========================================';
  RAISE NOTICE '📦 Joyas preservadas: %', v_joyas;
  RAISE NOTICE '👤 Usuarios preservados: %', v_usuarios;
  RAISE NOTICE '';
  RAISE NOTICE 'Tablas limpiadas (deben estar en 0):';
  RAISE NOTICE '  - Ventas: %', v_ventas;
  RAISE NOTICE '  - Clientes: %', v_clientes;
  RAISE NOTICE '  - Items de venta: %', v_items;
  RAISE NOTICE '  - Movimientos: %', v_movimientos;
  RAISE NOTICE '  - Cuentas por cobrar: %', v_cuentas;
  RAISE NOTICE '  - Abonos: %', v_abonos;
  RAISE NOTICE '=========================================';
  
  -- Validar que joyas y usuarios no fueron afectados
  IF v_joyas = 0 THEN
    RAISE EXCEPTION '❌ ERROR: Las joyas fueron eliminadas por error!';
  END IF;
  
  IF v_usuarios = 0 THEN
    RAISE EXCEPTION '❌ ERROR: Los usuarios fueron eliminados por error!';
  END IF;
  
  RAISE NOTICE '✅ Limpieza completada exitosamente';
  RAISE NOTICE '✅ Joyas y usuarios preservados correctamente';
END $$;

-- Confirmar transacción
COMMIT;

-- =========================================
-- MENSAJE FINAL
-- =========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=========================================';
  RAISE NOTICE '✅ LIMPIEZA COMPLETADA EXITOSAMENTE';
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'La base de datos ha sido limpiada.';
  RAISE NOTICE 'Las joyas y usuarios han sido preservados.';
  RAISE NOTICE 'El sistema está listo para uso en producción.';
  RAISE NOTICE '=========================================';
END $$;
