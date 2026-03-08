-- =========================================
-- MIGRACIÓN COMPLETA: Sistema de Pedidos Online
-- =========================================
-- Complementa la migración existente con campos adicionales
-- y tabla de historial de estados

-- =========================================
-- AGREGAR CAMPOS FALTANTES A pedidos_online
-- =========================================
-- Agregar notas_internas si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pedidos_online' 
    AND column_name = 'notas_internas'
  ) THEN
    ALTER TABLE pedidos_online ADD COLUMN notas_internas TEXT;
    RAISE NOTICE '✅ Campo notas_internas agregado';
  END IF;
END $$;

-- Agregar campos para snapshot de productos en items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items_pedido_online' 
    AND column_name = 'nombre_producto'
  ) THEN
    ALTER TABLE items_pedido_online ADD COLUMN nombre_producto TEXT;
    RAISE NOTICE '✅ Campo nombre_producto agregado a items';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items_pedido_online' 
    AND column_name = 'imagen_url'
  ) THEN
    ALTER TABLE items_pedido_online ADD COLUMN imagen_url TEXT;
    RAISE NOTICE '✅ Campo imagen_url agregado a items';
  END IF;
END $$;

-- =========================================
-- TABLA: historial_estado_pedidos
-- =========================================
CREATE TABLE IF NOT EXISTS historial_estado_pedidos (
  id BIGSERIAL PRIMARY KEY,
  id_pedido BIGINT NOT NULL REFERENCES pedidos_online(id) ON DELETE CASCADE,
  estado_anterior TEXT,
  estado_nuevo TEXT NOT NULL,
  usuario TEXT NOT NULL,
  notas TEXT,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- ÍNDICES ADICIONALES
-- =========================================
CREATE INDEX IF NOT EXISTS idx_historial_pedidos ON historial_estado_pedidos(id_pedido, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_online_email ON pedidos_online(email);
CREATE INDEX IF NOT EXISTS idx_pedidos_online_nombre ON pedidos_online(nombre_cliente);

-- =========================================
-- FUNCIÓN: Registrar cambio de estado
-- =========================================
CREATE OR REPLACE FUNCTION registrar_cambio_estado_pedido()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el estado cambió, registrar en historial
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    INSERT INTO historial_estado_pedidos (id_pedido, estado_anterior, estado_nuevo, usuario)
    VALUES (NEW.id, OLD.estado, NEW.estado, COALESCE(CURRENT_USER, 'Sistema'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- =========================================
-- TRIGGER: Auto-registrar cambios de estado
-- =========================================
DROP TRIGGER IF EXISTS trigger_cambio_estado_pedido ON pedidos_online;
CREATE TRIGGER trigger_cambio_estado_pedido
  AFTER UPDATE ON pedidos_online
  FOR EACH ROW
  EXECUTE FUNCTION registrar_cambio_estado_pedido();

-- =========================================
-- VALORES POR DEFECTO MEJORADOS
-- =========================================
-- Asegurar que los campos opcionales de dirección tienen valores por defecto
ALTER TABLE pedidos_online 
  ALTER COLUMN provincia DROP NOT NULL,
  ALTER COLUMN canton DROP NOT NULL,
  ALTER COLUMN distrito DROP NOT NULL,
  ALTER COLUMN direccion_linea1 DROP NOT NULL,
  ALTER COLUMN telefono_envio DROP NOT NULL;

-- =========================================
-- CONSTRAINTS MEJORADOS
-- =========================================
-- Validar que el total sea consistente
ALTER TABLE pedidos_online DROP CONSTRAINT IF EXISTS check_total_positivo;
ALTER TABLE pedidos_online ADD CONSTRAINT check_total_positivo CHECK (total >= 0);

-- Validar que los items tengan cantidades positivas
ALTER TABLE items_pedido_online DROP CONSTRAINT IF EXISTS check_cantidad_positiva;
ALTER TABLE items_pedido_online ADD CONSTRAINT check_cantidad_positiva CHECK (cantidad > 0);

-- =========================================
-- MENSAJE DE ÉXITO
-- =========================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migración completa de pedidos online finalizada';
  RAISE NOTICE '📝 Campos adicionales agregados';
  RAISE NOTICE '📋 Tabla historial_estado_pedidos creada';
  RAISE NOTICE '🔍 Índices adicionales creados';
  RAISE NOTICE '🔄 Trigger de historial configurado';
END $$;
