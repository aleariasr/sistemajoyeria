-- =========================================
-- NUEVAS TABLAS - Sistema de Joyería v2.1
-- =========================================
-- Agregar estas tablas a la base de datos de Supabase
-- para soportar: ingresos extras y devoluciones

-- =========================================
-- TABLA: ingresos_extras
-- =========================================
-- Para registrar ingresos de dinero fuera de ventas
-- (ej: fondo de caja, préstamos, otros)
CREATE TABLE IF NOT EXISTS ingresos_extras (
  id BIGSERIAL PRIMARY KEY,
  tipo TEXT NOT NULL, -- 'Fondo de Caja', 'Prestamo', 'Devolucion', 'Otros'
  monto NUMERIC(10, 2) NOT NULL,
  metodo_pago TEXT NOT NULL, -- 'Efectivo', 'Tarjeta', 'Transferencia'
  descripcion TEXT NOT NULL,
  id_usuario BIGINT NOT NULL REFERENCES usuarios(id),
  usuario TEXT, -- username del usuario
  cerrado BOOLEAN DEFAULT FALSE, -- si ya fue incluido en cierre de caja
  fecha_cierre TIMESTAMP WITH TIME ZONE,
  fecha_ingreso TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notas TEXT
);

-- =========================================
-- TABLA: devoluciones
-- =========================================
-- Para registrar devoluciones y cambios de productos
CREATE TABLE IF NOT EXISTS devoluciones (
  id BIGSERIAL PRIMARY KEY,
  id_venta BIGINT NOT NULL REFERENCES ventas(id),
  id_joya BIGINT NOT NULL REFERENCES joyas(id),
  cantidad INTEGER NOT NULL,
  precio_unitario NUMERIC(10, 2) NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  motivo TEXT NOT NULL, -- 'Defecto', 'Cliente no satisfecho', 'Cambio', 'Otros'
  tipo_devolucion TEXT NOT NULL, -- 'Reembolso', 'Cambio', 'Nota de Credito'
  estado TEXT DEFAULT 'Pendiente', -- 'Pendiente', 'Aprobada', 'Rechazada', 'Procesada'
  monto_reembolsado NUMERIC(10, 2) DEFAULT 0,
  metodo_reembolso TEXT, -- 'Efectivo', 'Tarjeta', 'Transferencia', NULL si es cambio
  id_usuario BIGINT NOT NULL REFERENCES usuarios(id),
  usuario TEXT, -- username del usuario
  notas TEXT,
  fecha_devolucion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_procesada TIMESTAMP WITH TIME ZONE
);

-- =========================================
-- ÍNDICES para mejor rendimiento
-- =========================================
CREATE INDEX IF NOT EXISTS idx_ingresos_extras_usuario ON ingresos_extras(id_usuario);
CREATE INDEX IF NOT EXISTS idx_ingresos_extras_cerrado ON ingresos_extras(cerrado);
CREATE INDEX IF NOT EXISTS idx_ingresos_extras_fecha ON ingresos_extras(fecha_ingreso);
CREATE INDEX IF NOT EXISTS idx_ingresos_extras_tipo ON ingresos_extras(tipo);

CREATE INDEX IF NOT EXISTS idx_devoluciones_venta ON devoluciones(id_venta);
CREATE INDEX IF NOT EXISTS idx_devoluciones_joya ON devoluciones(id_joya);
CREATE INDEX IF NOT EXISTS idx_devoluciones_estado ON devoluciones(estado);
CREATE INDEX IF NOT EXISTS idx_devoluciones_fecha ON devoluciones(fecha_devolucion);

-- =========================================
-- COMENTARIOS para documentación
-- =========================================
COMMENT ON TABLE ingresos_extras IS 'Registra ingresos de dinero que no provienen de ventas de productos';
COMMENT ON COLUMN ingresos_extras.cerrado IS 'Indica si el ingreso ya fue incluido en un cierre de caja';
COMMENT ON COLUMN ingresos_extras.tipo IS 'Tipo de ingreso: Fondo de Caja, Prestamo, Devolucion, Otros';

COMMENT ON TABLE devoluciones IS 'Registra devoluciones y cambios de productos vendidos';
COMMENT ON COLUMN devoluciones.tipo_devolucion IS 'Reembolso (devolver dinero), Cambio (cambiar por otro producto), Nota de Credito';
COMMENT ON COLUMN devoluciones.estado IS 'Pendiente (recién creada), Aprobada (autorizada), Procesada (completada)';

-- =========================================
-- TABLA: cierres_caja
-- =========================================
-- Para registrar el resumen de cada cierre de caja realizado
CREATE TABLE IF NOT EXISTS cierres_caja (
  id BIGSERIAL PRIMARY KEY,
  fecha_cierre TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  id_usuario BIGINT REFERENCES usuarios(id),
  usuario TEXT,
  resumen JSONB,
  total_ventas INTEGER DEFAULT 0,
  total_ingresos NUMERIC(12, 2) DEFAULT 0,
  total_general NUMERIC(12, 2) DEFAULT 0,
  total_efectivo_combinado NUMERIC(12, 2) DEFAULT 0,
  total_transferencia_combinado NUMERIC(12, 2) DEFAULT 0,
  total_tarjeta_combinado NUMERIC(12, 2) DEFAULT 0,
  monto_total_abonos NUMERIC(12, 2) DEFAULT 0,
  monto_total_ingresos_extras NUMERIC(12, 2) DEFAULT 0,
  notas TEXT
);

CREATE INDEX IF NOT EXISTS idx_cierres_caja_fecha ON cierres_caja(fecha_cierre);
CREATE INDEX IF NOT EXISTS idx_cierres_caja_usuario ON cierres_caja(usuario);

COMMENT ON TABLE cierres_caja IS 'Histórico de cierres de caja con totales combinados y resumen completo';
COMMENT ON COLUMN cierres_caja.resumen IS 'Objeto JSON con el resumen completo del cierre inclusive de ventas, abonos e ingresos extras';
