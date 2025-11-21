-- =========================================
-- FIX: Add missing foreign key constraint to items_venta_dia
-- =========================================
-- This script adds the missing foreign key relationship between
-- items_venta_dia and joyas tables.
--
-- Run this in Supabase SQL Editor:
-- https://mvujkbpbqyihixkbzthe.supabase.co/project/_/sql
--
-- This fixes the error:
-- "Could not find a relationship between 'items_venta_dia' and 'joyas' in the schema cache"

-- Add the foreign key constraint if it doesn't exist
DO $$
BEGIN
  -- Check if the foreign key already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'items_venta_dia_id_joya_fkey'
    AND table_name = 'items_venta_dia'
  ) THEN
    -- Add the foreign key constraint
    ALTER TABLE items_venta_dia
      ADD CONSTRAINT items_venta_dia_id_joya_fkey 
      FOREIGN KEY (id_joya) 
      REFERENCES joyas(id);
    
    RAISE NOTICE 'Foreign key constraint items_venta_dia_id_joya_fkey added successfully';
  ELSE
    RAISE NOTICE 'Foreign key constraint items_venta_dia_id_joya_fkey already exists';
  END IF;
END $$;

-- Verify the constraint was added
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'items_venta_dia'
  AND tc.constraint_name = 'items_venta_dia_id_joya_fkey';
