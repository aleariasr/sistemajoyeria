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
  stock_reservado INTEGER DEFAULT 0,
  ubicacion TEXT,
  estado TEXT DEFAULT 'Activo',
  imagen_url TEXT,
  imagen_public_id TEXT,
  
  -- Campos adicionales para e-commerce
  peso_gramos NUMERIC(10, 2),
  ancho_cm NUMERIC(10, 2),
  alto_cm NUMERIC(10, 2),
  largo_cm NUMERIC(10, 2),
  sku TEXT,
  slug TEXT,
  meta_title TEXT,
  meta_description TEXT,
  visible_en_tienda BOOLEAN DEFAULT true,
  destacado BOOLEAN DEFAULT false,
  orden_tienda INTEGER DEFAULT 0,
  
  -- Control de versión para concurrencia
  version INTEGER DEFAULT 1,
  
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_ultima_modificacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- TABLA: clientes
-- =========================================
-- NOTA: telefono y cedula son opcionales desde make-cliente-fields-optional.sql
-- Para nuevas instalaciones, usar directamente la estructura actualizada
CREATE TABLE IF NOT EXISTS clientes (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT,
  cedula TEXT,
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
  usuario TEXT,
  cerrado BOOLEAN NOT NULL DEFAULT false,
  fecha_cierre TIMESTAMP WITH TIME ZONE
);

-- =========================================
-- TABLA: movimientos_cuenta (historial de movimientos en cuentas)
-- =========================================
CREATE TABLE IF NOT EXISTS movimientos_cuenta (
  id BIGSERIAL PRIMARY KEY,
  id_cuenta_por_cobrar BIGINT NOT NULL REFERENCES cuentas_por_cobrar(id) ON DELETE CASCADE,
  id_venta BIGINT REFERENCES ventas(id),
  tipo TEXT NOT NULL, -- 'venta_credito', 'abono', 'ajuste'
  monto NUMERIC(10, 2) NOT NULL,
  descripcion TEXT,
  fecha_movimiento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usuario TEXT
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_movimientos_cuenta_id_cuenta ON movimientos_cuenta(id_cuenta_por_cobrar);
CREATE INDEX IF NOT EXISTS idx_movimientos_cuenta_fecha ON movimientos_cuenta(fecha_movimiento);

-- Create unique index to prevent duplicate active accounts per client
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_cuenta_activa_por_cliente
ON cuentas_por_cobrar (id_cliente)
WHERE estado = 'Pendiente';

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
  id_joya BIGINT NOT NULL REFERENCES joyas(id),
  cantidad INTEGER NOT NULL,
  precio_unitario NUMERIC(10, 2) NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL
);

-- =========================================
-- TABLA: reservas_inventario (para e-commerce)
-- =========================================
CREATE TABLE IF NOT EXISTS reservas_inventario (
  id BIGSERIAL PRIMARY KEY,
  id_joya BIGINT NOT NULL REFERENCES joyas(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL,
  tipo_reserva TEXT NOT NULL, -- 'carrito', 'pedido', 'temporal'
  referencia_externa TEXT, -- ID del carrito o pedido
  usuario_reserva TEXT,
  fecha_reserva TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_expiracion TIMESTAMP WITH TIME ZONE, -- Para limpiar reservas viejas
  estado TEXT DEFAULT 'activa', -- 'activa', 'completada', 'cancelada', 'expirada'
  origen TEXT DEFAULT 'tienda_fisica' -- 'tienda_fisica', 'tienda_online'
);

-- =========================================
-- TABLA: auditoria_inventario (para trazabilidad completa)
-- =========================================
CREATE TABLE IF NOT EXISTS auditoria_inventario (
  id BIGSERIAL PRIMARY KEY,
  id_joya BIGINT NOT NULL REFERENCES joyas(id),
  accion TEXT NOT NULL, -- 'crear', 'actualizar', 'venta', 'devolucion', 'ajuste', 'reserva'
  stock_anterior INTEGER,
  stock_nuevo INTEGER,
  cantidad_cambio INTEGER,
  usuario TEXT,
  origen TEXT, -- 'tienda_fisica', 'tienda_online', 'admin', 'sistema'
  referencia TEXT, -- ID de venta, movimiento, etc.
  detalles JSONB, -- Información adicional en formato JSON
  ip_address TEXT,
  fecha_auditoria TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- TABLA: configuracion_tienda (para parámetros compartidos)
-- =========================================
CREATE TABLE IF NOT EXISTS configuracion_tienda (
  id BIGSERIAL PRIMARY KEY,
  clave TEXT UNIQUE NOT NULL,
  valor TEXT,
  tipo_dato TEXT DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
  descripcion TEXT,
  categoria TEXT, -- 'general', 'inventario', 'ventas', 'ecommerce'
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- ÍNDICES para mejorar el rendimiento
-- =========================================
CREATE INDEX IF NOT EXISTS idx_joyas_codigo ON joyas(codigo);
CREATE INDEX IF NOT EXISTS idx_joyas_categoria ON joyas(categoria);
CREATE INDEX IF NOT EXISTS idx_joyas_estado ON joyas(estado);
CREATE INDEX IF NOT EXISTS idx_joyas_visible_tienda ON joyas(visible_en_tienda);
CREATE INDEX IF NOT EXISTS idx_joyas_slug ON joyas(slug);
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
CREATE INDEX IF NOT EXISTS idx_abonos_cerrado ON abonos(cerrado);
CREATE INDEX IF NOT EXISTS idx_reservas_joya ON reservas_inventario(id_joya);
CREATE INDEX IF NOT EXISTS idx_reservas_estado ON reservas_inventario(estado);
CREATE INDEX IF NOT EXISTS idx_reservas_referencia ON reservas_inventario(referencia_externa);
CREATE INDEX IF NOT EXISTS idx_auditoria_joya ON auditoria_inventario(id_joya);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria_inventario(fecha_auditoria);

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
-- FUNCIÓN: Incrementar versión para control de concurrencia
-- =========================================
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- =========================================
-- FUNCIÓN: Actualizar stock con control de concurrencia (para e-commerce)
-- =========================================
CREATE OR REPLACE FUNCTION actualizar_stock_atomico(
  p_id_joya BIGINT,
  p_cantidad INTEGER,
  p_tipo_operacion TEXT, -- 'decrementar', 'incrementar', 'reservar', 'liberar_reserva'
  p_version_esperada INTEGER DEFAULT NULL
)
RETURNS TABLE(exito BOOLEAN, stock_nuevo INTEGER, mensaje TEXT) AS $$
DECLARE
  v_stock_actual INTEGER;
  v_stock_reservado INTEGER;
  v_stock_disponible INTEGER;
  v_version_actual INTEGER;
BEGIN
  -- Bloquear la fila para evitar race conditions
  SELECT stock_actual, stock_reservado, version
  INTO v_stock_actual, v_stock_reservado, v_version_actual
  FROM joyas
  WHERE id = p_id_joya
  FOR UPDATE;
  
  -- Verificar versión si se proporciona (control optimista)
  IF p_version_esperada IS NOT NULL AND v_version_actual != p_version_esperada THEN
    RETURN QUERY SELECT FALSE, v_stock_actual, 'Conflicto de concurrencia: el stock fue modificado por otro usuario';
    RETURN;
  END IF;
  
  v_stock_disponible := v_stock_actual - v_stock_reservado;
  
  -- Procesar según tipo de operación
  CASE p_tipo_operacion
    WHEN 'decrementar' THEN
      -- Verificar stock disponible
      IF v_stock_disponible < p_cantidad THEN
        RETURN QUERY SELECT FALSE, v_stock_actual, 'Stock insuficiente';
        RETURN;
      END IF;
      
      -- Decrementar stock
      UPDATE joyas 
      SET stock_actual = stock_actual - p_cantidad,
          version = version + 1
      WHERE id = p_id_joya;
      
      RETURN QUERY SELECT TRUE, v_stock_actual - p_cantidad, 'Stock decrementado exitosamente';
      
    WHEN 'incrementar' THEN
      -- Incrementar stock
      UPDATE joyas 
      SET stock_actual = stock_actual + p_cantidad,
          version = version + 1
      WHERE id = p_id_joya;
      
      RETURN QUERY SELECT TRUE, v_stock_actual + p_cantidad, 'Stock incrementado exitosamente';
      
    WHEN 'reservar' THEN
      -- Verificar stock disponible para reservar
      IF v_stock_disponible < p_cantidad THEN
        RETURN QUERY SELECT FALSE, v_stock_actual, 'Stock insuficiente para reservar';
        RETURN;
      END IF;
      
      -- Incrementar stock reservado
      UPDATE joyas 
      SET stock_reservado = stock_reservado + p_cantidad,
          version = version + 1
      WHERE id = p_id_joya;
      
      RETURN QUERY SELECT TRUE, v_stock_actual, 'Stock reservado exitosamente';
      
    WHEN 'liberar_reserva' THEN
      -- Liberar reserva
      UPDATE joyas 
      SET stock_reservado = GREATEST(0, stock_reservado - p_cantidad),
          version = version + 1
      WHERE id = p_id_joya;
      
      RETURN QUERY SELECT TRUE, v_stock_actual, 'Reserva liberada exitosamente';
      
    ELSE
      RETURN QUERY SELECT FALSE, v_stock_actual, 'Tipo de operación no válido';
  END CASE;
  
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- FUNCIÓN: Limpiar reservas expiradas (ejecutar periódicamente)
-- =========================================
CREATE OR REPLACE FUNCTION limpiar_reservas_expiradas()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Marcar reservas expiradas
  UPDATE reservas_inventario
  SET estado = 'expirada'
  WHERE estado = 'activa'
    AND fecha_expiracion < NOW();
    
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Liberar stock reservado
  UPDATE joyas j
  SET stock_reservado = (
    SELECT COALESCE(SUM(r.cantidad), 0)
    FROM reservas_inventario r
    WHERE r.id_joya = j.id AND r.estado = 'activa'
  );
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- FUNCIÓN: Registrar auditoría automática en cambios de stock
-- =========================================
CREATE OR REPLACE FUNCTION trigger_auditoria_inventario()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD.stock_actual != NEW.stock_actual OR OLD.stock_reservado != NEW.stock_reservado) THEN
    INSERT INTO auditoria_inventario (
      id_joya, accion, stock_anterior, stock_nuevo, 
      cantidad_cambio, usuario, origen, detalles
    ) VALUES (
      NEW.id, 
      'actualizar_stock',
      OLD.stock_actual,
      NEW.stock_actual,
      NEW.stock_actual - OLD.stock_actual,
      current_user,
      'sistema',
      jsonb_build_object(
        'stock_reservado_anterior', OLD.stock_reservado,
        'stock_reservado_nuevo', NEW.stock_reservado,
        'version_anterior', OLD.version,
        'version_nueva', NEW.version
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
-- TRIGGER: Auditoría automática de cambios de inventario
-- =========================================
CREATE TRIGGER trigger_auditoria_stock
  AFTER UPDATE ON joyas
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auditoria_inventario();

-- =========================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- =========================================
-- Nota: Por ahora deshabilitado para desarrollo
-- En producción, habilitar y configurar políticas apropiadas
-- ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE joyas ENABLE ROW LEVEL SECURITY;
-- etc.

-- =========================================
-- CONFIGURACIÓN INICIAL DE LA TIENDA
-- =========================================
INSERT INTO configuracion_tienda (clave, valor, tipo_dato, descripcion, categoria) VALUES
  ('tiempo_reserva_minutos', '30', 'number', 'Tiempo en minutos que dura una reserva de inventario en carrito', 'inventario'),
  ('stock_minimo_alerta', '5', 'number', 'Cantidad mínima de stock para generar alertas', 'inventario'),
  ('permitir_venta_sin_stock', 'false', 'boolean', 'Permitir ventas cuando no hay stock disponible', 'inventario'),
  ('sincronizacion_automatica', 'true', 'boolean', 'Sincronización automática entre tienda física y online', 'ecommerce'),
  ('nombre_tienda', 'Joyería', 'string', 'Nombre de la tienda', 'general'),
  ('moneda_predeterminada', 'CRC', 'string', 'Moneda predeterminada del sistema', 'general')
ON CONFLICT (clave) DO NOTHING;

-- =========================================
-- MENSAJE DE ÉXITO
-- =========================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migración completada exitosamente';
  RAISE NOTICE '📊 Todas las tablas han sido creadas';
  RAISE NOTICE '🔍 Índices creados para optimizar consultas';
  RAISE NOTICE '⏰ Triggers configurados para actualizar fechas';
  RAISE NOTICE '🛒 Sistema preparado para e-commerce';
  RAISE NOTICE '🔒 Funciones de control de concurrencia implementadas';
  RAISE NOTICE '📝 Sistema de auditoría activado';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ IMPORTANTE: Ejecuta periódicamente:';
  RAISE NOTICE '   SELECT limpiar_reservas_expiradas();';
  RAISE NOTICE '   (o configura un cron job en Supabase)';
END $$;
