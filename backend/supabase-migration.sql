-- =========================================
-- MIGRACIÓN SUPABASE - Sistema de Joyería
-- =========================================
-- Ejecutar este script en el SQL Editor de Supabase
-- URL: https://mvujkbpbqyihixkbzthe.supabase.co/project/_/sql

-- IMPORTANTE: Este script crea todas las tablas necesarias
-- para el sistema de joyería en Supabase (PostgreSQL)

-- =========================================
-- TABLA: usuarios
-- =========================================
CREATE TABLE IF NOT EXISTS usuarios (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  full_name TEXT NOT NULL,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- TABLA: joyas
-- =========================================
CREATE TABLE IF NOT EXISTS joyas (
  id BIGSERIAL PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT,
  proveedor TEXT,
  costo NUMERIC(10, 2) NOT NULL,
  precio_venta NUMERIC(10, 2) NOT NULL,
  moneda TEXT DEFAULT 'CRC',
  stock_actual INTEGER NOT NULL DEFAULT 0,
  stock_minimo INTEGER DEFAULT 5,
  ubicacion TEXT,
  estado TEXT DEFAULT 'Activo',
  imagen_url TEXT,
  imagen_public_id TEXT,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_ultima_modificacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- TABLA: clientes
-- =========================================
CREATE TABLE IF NOT EXISTS clientes (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  cedula TEXT UNIQUE NOT NULL,
  direccion TEXT,
  email TEXT,
  notas TEXT,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_ultima_modificacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- TABLA: ventas
-- =========================================
CREATE TABLE IF NOT EXISTS ventas (
  id BIGSERIAL PRIMARY KEY,
  id_usuario BIGINT NOT NULL REFERENCES usuarios(id),
  metodo_pago TEXT NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  descuento NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,
  efectivo_recibido NUMERIC(10, 2),
  cambio NUMERIC(10, 2),
  notas TEXT,
  tipo_venta TEXT DEFAULT 'Contado',
  id_cliente BIGINT REFERENCES clientes(id),
  monto_efectivo NUMERIC(10, 2) DEFAULT 0,
  monto_tarjeta NUMERIC(10, 2) DEFAULT 0,
  monto_transferencia NUMERIC(10, 2) DEFAULT 0,
  fecha_venta TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- TABLA: items_venta
-- =========================================
CREATE TABLE IF NOT EXISTS items_venta (
  id BIGSERIAL PRIMARY KEY,
  id_venta BIGINT NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  id_joya BIGINT NOT NULL REFERENCES joyas(id),
  cantidad INTEGER NOT NULL,
  precio_unitario NUMERIC(10, 2) NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL
);

-- =========================================
-- TABLA: movimientos_inventario
-- =========================================
CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id BIGSERIAL PRIMARY KEY,
  id_joya BIGINT NOT NULL REFERENCES joyas(id),
  tipo_movimiento TEXT NOT NULL,
  cantidad INTEGER NOT NULL,
  motivo TEXT,
  fecha_movimiento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usuario TEXT,
  stock_antes INTEGER NOT NULL,
  stock_despues INTEGER NOT NULL
);

-- =========================================
-- TABLA: cuentas_por_cobrar
-- =========================================
CREATE TABLE IF NOT EXISTS cuentas_por_cobrar (
  id BIGSERIAL PRIMARY KEY,
  id_venta BIGINT NOT NULL REFERENCES ventas(id),
  id_cliente BIGINT NOT NULL REFERENCES clientes(id),
  monto_total NUMERIC(10, 2) NOT NULL,
  monto_pagado NUMERIC(10, 2) DEFAULT 0,
  saldo_pendiente NUMERIC(10, 2) NOT NULL,
  estado TEXT DEFAULT 'Pendiente',
  fecha_vencimiento DATE,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_ultima_modificacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- TABLA: abonos
-- =========================================
CREATE TABLE IF NOT EXISTS abonos (
  id BIGSERIAL PRIMARY KEY,
  id_cuenta_por_cobrar BIGINT NOT NULL REFERENCES cuentas_por_cobrar(id) ON DELETE CASCADE,
  monto NUMERIC(10, 2) NOT NULL,
  metodo_pago TEXT NOT NULL,
  notas TEXT,
  fecha_abono TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usuario TEXT
);

-- =========================================
-- TABLA: ventas_dia (base de datos temporal)
-- =========================================
CREATE TABLE IF NOT EXISTS ventas_dia (
  id BIGSERIAL PRIMARY KEY,
  id_usuario BIGINT NOT NULL,
  metodo_pago TEXT NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  descuento NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,
  efectivo_recibido NUMERIC(10, 2),
  cambio NUMERIC(10, 2),
  notas TEXT,
  tipo_venta TEXT DEFAULT 'Contado',
  id_cliente BIGINT,
  monto_efectivo NUMERIC(10, 2) DEFAULT 0,
  monto_tarjeta NUMERIC(10, 2) DEFAULT 0,
  monto_transferencia NUMERIC(10, 2) DEFAULT 0,
  fecha_venta TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- TABLA: items_venta_dia
-- =========================================
CREATE TABLE IF NOT EXISTS items_venta_dia (
  id BIGSERIAL PRIMARY KEY,
  id_venta_dia BIGINT NOT NULL REFERENCES ventas_dia(id) ON DELETE CASCADE,
  id_joya BIGINT NOT NULL,
  cantidad INTEGER NOT NULL,
  precio_unitario NUMERIC(10, 2) NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL
);

-- =========================================
-- ÍNDICES para mejorar el rendimiento
-- =========================================
CREATE INDEX IF NOT EXISTS idx_joyas_codigo ON joyas(codigo);
CREATE INDEX IF NOT EXISTS idx_joyas_categoria ON joyas(categoria);
CREATE INDEX IF NOT EXISTS idx_joyas_estado ON joyas(estado);
CREATE INDEX IF NOT EXISTS idx_clientes_cedula ON clientes(cedula);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha_venta);
CREATE INDEX IF NOT EXISTS idx_ventas_usuario ON ventas(id_usuario);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas(id_cliente);
CREATE INDEX IF NOT EXISTS idx_items_venta_venta ON items_venta(id_venta);
CREATE INDEX IF NOT EXISTS idx_items_venta_joya ON items_venta(id_joya);
CREATE INDEX IF NOT EXISTS idx_movimientos_joya ON movimientos_inventario(id_joya);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_inventario(fecha_movimiento);
CREATE INDEX IF NOT EXISTS idx_cuentas_cliente ON cuentas_por_cobrar(id_cliente);
CREATE INDEX IF NOT EXISTS idx_cuentas_estado ON cuentas_por_cobrar(estado);
CREATE INDEX IF NOT EXISTS idx_abonos_cuenta ON abonos(id_cuenta_por_cobrar);

-- =========================================
-- FUNCIÓN: Actualizar fecha de modificación
-- =========================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_ultima_modificacion = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- =========================================
-- TRIGGERS para actualizar automáticamente fecha_ultima_modificacion
-- =========================================
CREATE TRIGGER update_joyas_modtime
  BEFORE UPDATE ON joyas
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_clientes_modtime
  BEFORE UPDATE ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_cuentas_modtime
  BEFORE UPDATE ON cuentas_por_cobrar
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- =========================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- =========================================
-- Nota: Por ahora deshabilitado para desarrollo
-- En producción, habilitar y configurar políticas apropiadas
-- ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE joyas ENABLE ROW LEVEL SECURITY;
-- etc.

-- =========================================
-- MENSAJE DE ÉXITO
-- =========================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migración completada exitosamente';
  RAISE NOTICE '📊 Todas las tablas han sido creadas';
  RAISE NOTICE '🔍 Índices creados para optimizar consultas';
  RAISE NOTICE '⏰ Triggers configurados para actualizar fechas';
END $$;
