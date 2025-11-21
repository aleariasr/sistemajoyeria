-- Migración para asegurar que las foreign keys de items_venta tengan el nombre correcto
-- Esto permite que Supabase PostgREST pueda hacer los joins correctamente

-- Verificar y recrear la foreign key de items_venta si es necesario
DO $$
BEGIN
  -- Eliminar la constraint existente si tiene un nombre diferente
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'items_venta' 
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name != 'items_venta_id_joya_fkey'
    AND constraint_name LIKE '%id_joya%'
  ) THEN
    -- Obtener el nombre actual de la constraint
    FOR constraint_rec IN 
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'items_venta' 
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name != 'items_venta_id_joya_fkey'
      AND constraint_name LIKE '%id_joya%'
    LOOP
      EXECUTE 'ALTER TABLE items_venta DROP CONSTRAINT IF EXISTS ' || constraint_rec.constraint_name;
    END LOOP;
  END IF;

  -- Agregar la constraint con el nombre correcto si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'items_venta' 
    AND constraint_name = 'items_venta_id_joya_fkey'
  ) THEN
    ALTER TABLE items_venta 
    ADD CONSTRAINT items_venta_id_joya_fkey 
    FOREIGN KEY (id_joya) REFERENCES joyas(id);
    
    RAISE NOTICE 'Foreign key constraint items_venta_id_joya_fkey added successfully';
  ELSE
    RAISE NOTICE 'Foreign key constraint items_venta_id_joya_fkey already exists';
  END IF;
END $$;
