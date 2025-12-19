-- MIGRATION: Product Variants, Composite Products, Push Notifications
-- Date: 2025-12-19

-- ============================================================
-- 1. VARIANTES DE PRODUCTO (Product Variants)
-- ============================================================

-- Add flag to joyas table to indicate if product has variants
ALTER TABLE joyas ADD COLUMN IF NOT EXISTS es_producto_variante BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_joyas_variante ON joyas(es_producto_variante) WHERE es_producto_variante = true;

-- Create table for product variants
CREATE TABLE IF NOT EXISTS variantes_producto (
  id SERIAL PRIMARY KEY,
  id_producto_padre INTEGER NOT NULL REFERENCES joyas(id) ON DELETE CASCADE,
  nombre_variante VARCHAR(200) NOT NULL,
  descripcion_variante TEXT,
  imagen_url TEXT NOT NULL,
  orden_display INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_variantes_producto_padre ON variantes_producto(id_producto_padre);
CREATE INDEX IF NOT EXISTS idx_variantes_activo ON variantes_producto(activo) WHERE activo = true;

-- ============================================================
-- 2. PRODUCTOS COMPUESTOS (Composite Products / Sets)
-- ============================================================

-- Add flag to joyas table to indicate if product is a set
ALTER TABLE joyas ADD COLUMN IF NOT EXISTS es_producto_compuesto BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_joyas_compuesto ON joyas(es_producto_compuesto) WHERE es_producto_compuesto = true;

-- Create table for composite product relationships
CREATE TABLE IF NOT EXISTS productos_compuestos (
  id SERIAL PRIMARY KEY,
  id_producto_set INTEGER NOT NULL REFERENCES joyas(id) ON DELETE CASCADE,
  id_producto_componente INTEGER NOT NULL REFERENCES joyas(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL DEFAULT 1,
  orden_display INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT cantidad_positiva CHECK (cantidad > 0),
  CONSTRAINT no_self_reference CHECK (id_producto_set != id_producto_componente)
);

CREATE INDEX IF NOT EXISTS idx_compuestos_set ON productos_compuestos(id_producto_set);
CREATE INDEX IF NOT EXISTS idx_compuestos_componente ON productos_compuestos(id_producto_componente);
CREATE UNIQUE INDEX IF NOT EXISTS idx_compuestos_unique ON productos_compuestos(id_producto_set, id_producto_componente);

-- ============================================================
-- 3. NOTIFICACIONES PUSH (Push Notifications)
-- ============================================================

-- Create table for push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  id_usuario INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_usuario ON push_subscriptions(id_usuario);

-- ============================================================
-- 4. TRIGGERS
-- ============================================================

-- Trigger to update updated_at timestamp on variantes_producto
CREATE OR REPLACE FUNCTION update_variantes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_variantes_updated_at ON variantes_producto;
CREATE TRIGGER trigger_update_variantes_updated_at
  BEFORE UPDATE ON variantes_producto
  FOR EACH ROW
  EXECUTE FUNCTION update_variantes_updated_at();

-- ============================================================
-- END OF MIGRATION
-- ============================================================
