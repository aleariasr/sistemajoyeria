-- MIGRATION: Multiple Images per Product
-- Date: 2025-12-19
-- Description: Add support for multiple images per jewelry product

-- 1. CREATE TABLE
CREATE TABLE IF NOT EXISTS imagenes_joya (
  id SERIAL PRIMARY KEY,
  id_joya INTEGER NOT NULL REFERENCES joyas(id) ON DELETE CASCADE,
  imagen_url TEXT NOT NULL,
  orden_display INTEGER DEFAULT 0,
  es_principal BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_imagenes_joya_id ON imagenes_joya(id_joya);
CREATE INDEX IF NOT EXISTS idx_imagenes_joya_orden ON imagenes_joya(id_joya, orden_display);
CREATE INDEX IF NOT EXISTS idx_imagenes_joya_principal ON imagenes_joya(id_joya, es_principal) WHERE es_principal = true;

COMMENT ON TABLE imagenes_joya IS 'Galería de imágenes para cada producto (múltiples fotos)';
COMMENT ON COLUMN imagenes_joya.orden_display IS 'Orden de visualización (0 = primera, principal)';
COMMENT ON COLUMN imagenes_joya.es_principal IS 'True para la imagen principal que se muestra en listados';

-- 2. MIGRATE EXISTING DATA
-- Migrar imágenes existentes de joyas.imagen_url a imagenes_joya
INSERT INTO imagenes_joya (id_joya, imagen_url, orden_display, es_principal)
SELECT 
  id,
  imagen_url,
  0,
  true
FROM joyas
WHERE imagen_url IS NOT NULL AND imagen_url != ''
ON CONFLICT DO NOTHING;

-- 3. CREATE TRIGGER para mantener sincronizada joyas.imagen_url con la imagen principal
CREATE OR REPLACE FUNCTION actualizar_imagen_principal_joya()
RETURNS TRIGGER AS $$
BEGIN
  -- Al insertar o actualizar una imagen como principal, actualizar joyas.imagen_url
  IF NEW.es_principal = true THEN
    -- Desmarcar otras imágenes de esta joya como principales
    UPDATE imagenes_joya 
    SET es_principal = false 
    WHERE id_joya = NEW.id_joya AND id != NEW.id;
    
    -- Actualizar joyas.imagen_url con la nueva imagen principal
    UPDATE joyas 
    SET imagen_url = NEW.imagen_url 
    WHERE id = NEW.id_joya;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_imagen_principal
  AFTER INSERT OR UPDATE ON imagenes_joya
  FOR EACH ROW
  WHEN (NEW.es_principal = true)
  EXECUTE FUNCTION actualizar_imagen_principal_joya();

-- 4. TRIGGER para cuando se elimina una imagen principal
CREATE OR REPLACE FUNCTION manejar_eliminacion_imagen()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se elimina la imagen principal, asignar la siguiente como principal
  IF OLD.es_principal = true THEN
    UPDATE imagenes_joya 
    SET es_principal = true 
    WHERE id_joya = OLD.id_joya 
    AND id != OLD.id
    ORDER BY orden_display 
    LIMIT 1;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_manejar_eliminacion_imagen
  BEFORE DELETE ON imagenes_joya
  FOR EACH ROW
  WHEN (OLD.es_principal = true)
  EXECUTE FUNCTION manejar_eliminacion_imagen();
