-- =========================================
-- MIGRACIÓN: Restricciones para Eliminación de Joyas
-- =========================================
-- Esta migración ajusta las restricciones de claves foráneas
-- para permitir la eliminación física de joyas sin dependencias
-- críticas mientras protege registros importantes.
-- 
-- Fecha: 2025-12-23
-- 
-- ESTRATEGIA:
-- - Tablas críticas (ventas, movimientos, pedidos): RESTRICT (prevenir eliminación)
-- - Tablas secundarias (imágenes, reservas, auditoría): CASCADE (eliminar automáticamente)
-- - Productos compuestos: CASCADE para limpieza automática

-- =========================================
-- 1. ITEMS_VENTA - RESTRICT (proteger historial de ventas)
-- =========================================
-- Las ventas son registros críticos que no deben perder su referencia
DO $$
BEGIN
  -- Eliminar constraint existente si existe
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'items_venta_id_joya_fkey'
    AND table_name = 'items_venta'
  ) THEN
    ALTER TABLE items_venta DROP CONSTRAINT items_venta_id_joya_fkey;
  END IF;
  
  -- Agregar constraint con ON DELETE RESTRICT
  ALTER TABLE items_venta 
    ADD CONSTRAINT items_venta_id_joya_fkey 
    FOREIGN KEY (id_joya) REFERENCES joyas(id) 
    ON DELETE RESTRICT;
  
  RAISE NOTICE '✅ items_venta: ON DELETE RESTRICT configurado';
END $$;

-- =========================================
-- 2. ITEMS_VENTA_DIA - RESTRICT (proteger ventas temporales)
-- =========================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'items_venta_dia_id_joya_fkey'
    AND table_name = 'items_venta_dia'
  ) THEN
    ALTER TABLE items_venta_dia DROP CONSTRAINT items_venta_dia_id_joya_fkey;
  END IF;
  
  ALTER TABLE items_venta_dia 
    ADD CONSTRAINT items_venta_dia_id_joya_fkey 
    FOREIGN KEY (id_joya) REFERENCES joyas(id) 
    ON DELETE RESTRICT;
  
  RAISE NOTICE '✅ items_venta_dia: ON DELETE RESTRICT configurado';
END $$;

-- =========================================
-- 3. MOVIMIENTOS_INVENTARIO - RESTRICT (proteger historial)
-- =========================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'movimientos_inventario_id_joya_fkey'
    AND table_name = 'movimientos_inventario'
  ) THEN
    ALTER TABLE movimientos_inventario DROP CONSTRAINT movimientos_inventario_id_joya_fkey;
  END IF;
  
  ALTER TABLE movimientos_inventario 
    ADD CONSTRAINT movimientos_inventario_id_joya_fkey 
    FOREIGN KEY (id_joya) REFERENCES joyas(id) 
    ON DELETE RESTRICT;
  
  RAISE NOTICE '✅ movimientos_inventario: ON DELETE RESTRICT configurado';
END $$;

-- =========================================
-- 4. ITEMS_PEDIDO_ONLINE - RESTRICT (proteger pedidos)
-- =========================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'items_pedido_online_id_joya_fkey'
    AND table_name = 'items_pedido_online'
  ) THEN
    ALTER TABLE items_pedido_online DROP CONSTRAINT items_pedido_online_id_joya_fkey;
  END IF;
  
  ALTER TABLE items_pedido_online 
    ADD CONSTRAINT items_pedido_online_id_joya_fkey 
    FOREIGN KEY (id_joya) REFERENCES joyas(id) 
    ON DELETE RESTRICT;
  
  RAISE NOTICE '✅ items_pedido_online: ON DELETE RESTRICT configurado';
END $$;

-- =========================================
-- 5. RESERVAS_INVENTARIO - CASCADE (ya configurado, verificar)
-- =========================================
-- Las reservas pueden eliminarse automáticamente si se elimina la joya
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'reservas_inventario_id_joya_fkey'
    AND table_name = 'reservas_inventario'
  ) THEN
    ALTER TABLE reservas_inventario DROP CONSTRAINT reservas_inventario_id_joya_fkey;
  END IF;
  
  ALTER TABLE reservas_inventario 
    ADD CONSTRAINT reservas_inventario_id_joya_fkey 
    FOREIGN KEY (id_joya) REFERENCES joyas(id) 
    ON DELETE CASCADE;
  
  RAISE NOTICE '✅ reservas_inventario: ON DELETE CASCADE verificado';
END $$;

-- =========================================
-- 6. AUDITORIA_INVENTARIO - CASCADE (ya configurado, verificar)
-- =========================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'auditoria_inventario_id_joya_fkey'
    AND table_name = 'auditoria_inventario'
  ) THEN
    ALTER TABLE auditoria_inventario DROP CONSTRAINT auditoria_inventario_id_joya_fkey;
  END IF;
  
  ALTER TABLE auditoria_inventario 
    ADD CONSTRAINT auditoria_inventario_id_joya_fkey 
    FOREIGN KEY (id_joya) REFERENCES joyas(id) 
    ON DELETE CASCADE;
  
  RAISE NOTICE '✅ auditoria_inventario: ON DELETE CASCADE verificado';
END $$;

-- =========================================
-- 7. IMAGENES_JOYA - CASCADE (ya configurado en migración previa)
-- =========================================
-- Verificar que imagenes_joya tenga CASCADE
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'imagenes_joya') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'imagenes_joya_id_joya_fkey'
      AND table_name = 'imagenes_joya'
    ) THEN
      ALTER TABLE imagenes_joya DROP CONSTRAINT imagenes_joya_id_joya_fkey;
    END IF;
    
    ALTER TABLE imagenes_joya 
      ADD CONSTRAINT imagenes_joya_id_joya_fkey 
      FOREIGN KEY (id_joya) REFERENCES joyas(id) 
      ON DELETE CASCADE;
    
    RAISE NOTICE '✅ imagenes_joya: ON DELETE CASCADE verificado';
  END IF;
END $$;

-- =========================================
-- 8. VARIANTES_PRODUCTO - CASCADE (ya configurado en migración previa)
-- =========================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'variantes_producto') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'variantes_producto_id_producto_padre_fkey'
      AND table_name = 'variantes_producto'
    ) THEN
      ALTER TABLE variantes_producto DROP CONSTRAINT variantes_producto_id_producto_padre_fkey;
    END IF;
    
    ALTER TABLE variantes_producto 
      ADD CONSTRAINT variantes_producto_id_producto_padre_fkey 
      FOREIGN KEY (id_producto_padre) REFERENCES joyas(id) 
      ON DELETE CASCADE;
    
    RAISE NOTICE '✅ variantes_producto: ON DELETE CASCADE verificado';
  END IF;
END $$;

-- =========================================
-- 9. PRODUCTOS_COMPUESTOS - CASCADE (ya configurado en migración previa)
-- =========================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'productos_compuestos') THEN
    -- Para el set
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'productos_compuestos_id_producto_set_fkey'
      AND table_name = 'productos_compuestos'
    ) THEN
      ALTER TABLE productos_compuestos DROP CONSTRAINT productos_compuestos_id_producto_set_fkey;
    END IF;
    
    ALTER TABLE productos_compuestos 
      ADD CONSTRAINT productos_compuestos_id_producto_set_fkey 
      FOREIGN KEY (id_producto_set) REFERENCES joyas(id) 
      ON DELETE CASCADE;
    
    -- Para el componente - usar RESTRICT para prevenir eliminación
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'productos_compuestos_id_producto_componente_fkey'
      AND table_name = 'productos_compuestos'
    ) THEN
      ALTER TABLE productos_compuestos DROP CONSTRAINT productos_compuestos_id_producto_componente_fkey;
    END IF;
    
    ALTER TABLE productos_compuestos 
      ADD CONSTRAINT productos_compuestos_id_producto_componente_fkey 
      FOREIGN KEY (id_producto_componente) REFERENCES joyas(id) 
      ON DELETE RESTRICT;
    
    RAISE NOTICE '✅ productos_compuestos: Constraints configurados (set=CASCADE, componente=RESTRICT)';
  END IF;
END $$;

-- =========================================
-- RESUMEN DE CONFIGURACIÓN
-- =========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════════════════';
  RAISE NOTICE '✅ Migración de restricciones completada';
  RAISE NOTICE '══════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 TABLAS CON RESTRICT (previenen eliminación):';
  RAISE NOTICE '   - items_venta';
  RAISE NOTICE '   - items_venta_dia';
  RAISE NOTICE '   - movimientos_inventario';
  RAISE NOTICE '   - items_pedido_online';
  RAISE NOTICE '   - productos_compuestos (como componente)';
  RAISE NOTICE '';
  RAISE NOTICE '🗑️  TABLAS CON CASCADE (se eliminan automáticamente):';
  RAISE NOTICE '   - reservas_inventario';
  RAISE NOTICE '   - auditoria_inventario';
  RAISE NOTICE '   - imagenes_joya';
  RAISE NOTICE '   - variantes_producto';
  RAISE NOTICE '   - productos_compuestos (como set)';
  RAISE NOTICE '';
  RAISE NOTICE '💡 LÓGICA DE NEGOCIO:';
  RAISE NOTICE '   - Joyas sin dependencias críticas: Eliminación física';
  RAISE NOTICE '   - Joyas con ventas/movimientos: Marcado como Descontinuado';
  RAISE NOTICE '══════════════════════════════════════════════════';
END $$;
