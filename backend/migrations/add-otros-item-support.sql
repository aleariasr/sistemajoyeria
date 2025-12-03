-- =========================================
-- MIGRATION: Soporte para items "Otros" en ventas
-- Permite agregar items sin referencia a una joya específica
-- =========================================

-- Modificar items_venta para permitir id_joya NULL
ALTER TABLE items_venta 
  ALTER COLUMN id_joya DROP NOT NULL;

-- Agregar columna para descripción de items "Otros"
ALTER TABLE items_venta 
  ADD COLUMN IF NOT EXISTS descripcion_item TEXT;

-- Modificar items_venta_dia para permitir id_joya NULL
ALTER TABLE items_venta_dia 
  ALTER COLUMN id_joya DROP NOT NULL;

-- Agregar columna para descripción de items "Otros"
ALTER TABLE items_venta_dia 
  ADD COLUMN IF NOT EXISTS descripcion_item TEXT;

-- Comentarios para documentación
COMMENT ON COLUMN items_venta.id_joya IS 'ID de la joya vendida. NULL si es un item tipo "Otros"';
COMMENT ON COLUMN items_venta.descripcion_item IS 'Descripción del item cuando es tipo "Otros" (id_joya es NULL)';
COMMENT ON COLUMN items_venta_dia.id_joya IS 'ID de la joya vendida. NULL si es un item tipo "Otros"';
COMMENT ON COLUMN items_venta_dia.descripcion_item IS 'Descripción del item cuando es tipo "Otros" (id_joya es NULL)';
