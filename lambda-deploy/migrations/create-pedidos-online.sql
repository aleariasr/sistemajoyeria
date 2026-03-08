-- =========================================
-- MIGRACIÓN: Pedidos Online
-- =========================================
-- Tabla para gestionar pedidos realizados desde la tienda web
-- con aprobación manual para pagos Sinpe Móvil

-- =========================================
-- TABLA: pedidos_online
-- =========================================
CREATE TABLE IF NOT EXISTS pedidos_online (
  id BIGSERIAL PRIMARY KEY,
  
  -- Información del cliente (NO incluye cédula)
  nombre_cliente TEXT NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT NOT NULL,
  
  -- Dirección de envío
  provincia TEXT NOT NULL,
  canton TEXT NOT NULL,
  distrito TEXT NOT NULL,
  direccion_linea1 TEXT NOT NULL,
  direccion_linea2 TEXT,
  codigo_postal TEXT,
  telefono_envio TEXT NOT NULL,
  
  -- Información del pedido
  subtotal NUMERIC(10, 2) NOT NULL,
  costo_envio NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,
  notas TEXT,
  
  -- Información de pago
  metodo_pago TEXT NOT NULL, -- 'sinpe_movil', 'tilopay', 'pendiente'
  comprobante_url TEXT, -- URL de la imagen del comprobante Sinpe
  comprobante_public_id TEXT, -- Para eliminar de Cloudinary si es necesario
  
  -- Estado del pedido
  estado TEXT DEFAULT 'pendiente', -- 'pendiente', 'pago_verificado', 'en_proceso', 'enviado', 'entregado', 'cancelado'
  estado_pago TEXT DEFAULT 'pendiente', -- 'pendiente', 'verificando', 'aprobado', 'rechazado'
  
  -- Trazabilidad
  id_usuario_aprobacion BIGINT REFERENCES usuarios(id),
  fecha_aprobacion TIMESTAMP WITH TIME ZONE,
  id_venta BIGINT REFERENCES ventas(id), -- Referencia a la venta creada tras aprobación
  
  -- Timestamps
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- TABLA: items_pedido_online
-- =========================================
CREATE TABLE IF NOT EXISTS items_pedido_online (
  id BIGSERIAL PRIMARY KEY,
  id_pedido BIGINT NOT NULL REFERENCES pedidos_online(id) ON DELETE CASCADE,
  id_joya BIGINT NOT NULL REFERENCES joyas(id),
  cantidad INTEGER NOT NULL,
  precio_unitario NUMERIC(10, 2) NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL
);

-- =========================================
-- ÍNDICES
-- =========================================
CREATE INDEX IF NOT EXISTS idx_pedidos_online_estado ON pedidos_online(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_online_estado_pago ON pedidos_online(estado_pago);
CREATE INDEX IF NOT EXISTS idx_pedidos_online_fecha ON pedidos_online(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_items_pedido_online_pedido ON items_pedido_online(id_pedido);

-- =========================================
-- TRIGGER: Actualizar fecha_actualizacion
-- =========================================
CREATE OR REPLACE FUNCTION update_pedido_online_modtime()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pedidos_online_modtime
  BEFORE UPDATE ON pedidos_online
  FOR EACH ROW
  EXECUTE FUNCTION update_pedido_online_modtime();

-- =========================================
-- MENSAJE DE ÉXITO
-- =========================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migración de pedidos online completada';
  RAISE NOTICE '📦 Tabla pedidos_online creada';
  RAISE NOTICE '📋 Tabla items_pedido_online creada';
  RAISE NOTICE '🔍 Índices creados';
END $$;
