-- Migración para agregar campo 'cerrado' a la tabla abonos
-- Esto permite marcar los abonos que ya fueron incluidos en un cierre de caja
-- y evitar que se contabilicen nuevamente en futuros cierres

-- Agregar columna 'cerrado' a la tabla abonos
ALTER TABLE abonos 
ADD COLUMN IF NOT EXISTS cerrado BOOLEAN NOT NULL DEFAULT false;

-- Agregar columna 'fecha_cierre' para registrar cuándo se cerró
ALTER TABLE abonos 
ADD COLUMN IF NOT EXISTS fecha_cierre TIMESTAMP WITH TIME ZONE;

-- Crear índice para mejorar el rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_abonos_cerrado ON abonos(cerrado);

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Columnas cerrado y fecha_cierre agregadas exitosamente a la tabla abonos';
END $$;
