# Migración a Supabase + Cloudinary + E-commerce Ready

## 🎯 Objetivos Completados

✅ **Migración de SQLite a Supabase (PostgreSQL)**
✅ **Integración con Cloudinary para imágenes**
✅ **Sistema preparado para e-commerce futuro**
✅ **Control de concurrencia para inventario compartido**
✅ **Sistema de auditoría completo**

---

## 📋 Pasos de Migración

### 1. Instalar Dependencias

```bash
cd backend
npm install
```

Las nuevas dependencias ya están en `package.json`:
- `@supabase/supabase-js` - Cliente de Supabase
- `cloudinary` - Manejo de imágenes
- `multer` - Carga de archivos

### 2. Ejecutar Script SQL en Supabase

**IMPORTANTE:** Antes de iniciar el servidor, debes ejecutar el script de migración SQL en Supabase:

1. Abre tu proyecto Supabase: https://mvujkbpbqyihixkbzthe.supabase.co
2. Ve a **SQL Editor**
3. Abre el archivo `backend/supabase-migration.sql`
4. Copia todo el contenido
5. Pégalo en el SQL Editor de Supabase
6. Haz clic en **RUN**

Este script creará:
- ✅ Todas las tablas necesarias
- ✅ Índices para optimizar consultas
- ✅ Triggers para fechas automáticas
- ✅ Funciones para control de concurrencia
- ✅ Tablas adicionales para e-commerce
- ✅ Sistema de auditoría

### 3. Configurar Variables de Entorno

El archivo `.env` ya está configurado con las credenciales proporcionadas:

```env
SUPABASE_URL=https://mvujkbpbqyihixkbzthe.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
CLOUDINARY_CLOUD_NAME=dekqptpft
CLOUDINARY_API_KEY=127388563365697
CLOUDINARY_API_SECRET=GNr2ei6MF0Z_0hUsMHN-6ivTXbg
```

### 4. Iniciar el Servidor

```bash
cd backend
npm start
```

Deberías ver:
```
🚀 Servidor corriendo en http://localhost:3001
📊 Ambiente: development
✅ Conexión a Supabase establecida
```

---

## 🆕 Nuevas Características

### 1. **Imágenes de Joyas con Cloudinary**

Cada joya ahora puede tener una imagen:
- `imagen_url`: URL pública de la imagen en Cloudinary
- `imagen_public_id`: ID para eliminar/actualizar la imagen

### 2. **Campos E-commerce en Joyas**

Nuevos campos preparados para tienda online:
- `peso_gramos`: Peso del producto para envíos
- `ancho_cm`, `alto_cm`, `largo_cm`: Dimensiones
- `sku`: Código alternativo
- `slug`: URL amigable (ej: `anillo-oro-18k`)
- `meta_title`, `meta_description`: SEO
- `visible_en_tienda`: Boolean para mostrar en tienda online
- `destacado`: Boolean para productos destacados
- `orden_tienda`: Orden de visualización
- `stock_reservado`: Stock reservado en carritos

### 3. **Control de Concurrencia**

Sistema robusto para evitar sobreventa cuando múltiples usuarios/sistemas actualizan el inventario:

```javascript
// Función PostgreSQL para actualizar stock de forma atómica
SELECT * FROM actualizar_stock_atomico(
  p_id_joya := 123,
  p_cantidad := 2,
  p_tipo_operacion := 'decrementar', -- o 'incrementar', 'reservar', 'liberar_reserva'
  p_version_esperada := 5 -- opcional, para control optimista
);
```

### 4. **Sistema de Reservas de Inventario**

Tabla `reservas_inventario` para manejar carritos de compra online:
- Reserva temporal de stock (ej: 30 minutos)
- Auto-limpieza de reservas expiradas
- Trazabilidad completa

```sql
-- Limpiar reservas expiradas (ejecutar periódicamente)
SELECT limpiar_reservas_expiradas();
```

### 5. **Auditoría Completa**

Tabla `auditoria_inventario` que registra automáticamente:
- Todos los cambios en el stock
- Usuario que hizo el cambio
- Origen (tienda_fisica, tienda_online, admin)
- Stock antes y después
- Timestamp preciso
- Información adicional en JSON

### 6. **Configuración Compartida**

Tabla `configuracion_tienda` para parámetros globales:
```javascript
{
  tiempo_reserva_minutos: 30,
  stock_minimo_alerta: 5,
  permitir_venta_sin_stock: false,
  sincronizacion_automatica: true
}
```

---

## 🔧 Uso de las Nuevas Características

### Subir Imagen de Joya

```javascript
const { uploadImage } = require('./cloudinary-config');

// En tu ruta de joyas
const resultado = await uploadImage(req.file.path, 'joyas');
// resultado.url -> URL de la imagen
// resultado.publicId -> ID para eliminarla después

await Joya.crear({
  ...datosJoya,
  imagen_url: resultado.url,
  imagen_public_id: resultado.publicId
});
```

### Actualizar Stock con Control de Concurrencia

```javascript
// Opción 1: Usando la función de PostgreSQL (recomendado)
const { data } = await supabase.rpc('actualizar_stock_atomico', {
  p_id_joya: 123,
  p_cantidad: 2,
  p_tipo_operacion: 'decrementar',
  p_version_esperada: versionActual
});

// Opción 2: Control optimista manual
const joya = await Joya.obtenerPorId(123);
const versionActual = joya.version;

await supabase
  .from('joyas')
  .update({ 
    stock_actual: joya.stock_actual - 2,
    version: versionActual + 1
  })
  .eq('id', 123)
  .eq('version', versionActual); // Solo actualiza si la versión no cambió
```

### Reservar Stock para Carrito de Compra

```javascript
// Reservar stock
await supabase.from('reservas_inventario').insert({
  id_joya: 123,
  cantidad: 1,
  tipo_reserva: 'carrito',
  referencia_externa: carritoId,
  usuario_reserva: userId,
  fecha_expiracion: new Date(Date.now() + 30*60*1000), // 30 min
  origen: 'tienda_online'
});

// Actualizar stock reservado en joya
await supabase.rpc('actualizar_stock_atomico', {
  p_id_joya: 123,
  p_cantidad: 1,
  p_tipo_operacion: 'reservar'
});
```

---

## 🏗️ Arquitectura para E-commerce

### Flujo de Compra Online

```
1. Cliente agrega producto al carrito
   ↓
2. Sistema reserva el stock (tabla reservas_inventario)
   ↓
3. Stock se marca como reservado en la joya
   ↓
4. Cliente tiene 30 minutos para completar compra
   ↓
5. Si completa: stock se descuenta definitivamente
   Si no: reserva expira y stock se libera automáticamente
```

### Sincronización Tienda Física ↔ Online

Ambas comparten:
- **Misma base de datos** (Supabase)
- **Mismo inventario** (tabla joyas)
- **Control de concurrencia** automático
- **Auditoría** de todos los cambios

```
Tienda Física (actual)  →  Supabase PostgreSQL  ← Tienda Online (futura)
                              ↓
                         Stock único y sincronizado
                              ↓
                    Actualizaciones en tiempo real
```

---

## 📊 Monitoreo y Mantenimiento

### Tareas Periódicas Recomendadas

1. **Limpiar reservas expiradas** (cada 5-10 minutos):
```sql
SELECT limpiar_reservas_expiradas();
```

Puedes configurar esto como un **Cron Job** en Supabase:
- Ve a Database → Cron Jobs
- Crea un nuevo job con la consulta anterior
- Schedule: `*/10 * * * *` (cada 10 minutos)

2. **Revisar auditoría de inventario**:
```sql
SELECT * FROM auditoria_inventario 
WHERE fecha_auditoria >= NOW() - INTERVAL '24 hours'
ORDER BY fecha_auditoria DESC;
```

3. **Alertas de stock bajo**:
```sql
SELECT * FROM joyas 
WHERE stock_actual - stock_reservado <= stock_minimo
AND estado = 'Activo';
```

---

## 🔐 Seguridad

### Row Level Security (RLS)

Para producción, habilita RLS en Supabase:

```sql
-- Ejemplo para tabla joyas
ALTER TABLE joyas ENABLE ROW LEVEL SECURITY;

-- Política: todos pueden leer joyas activas
CREATE POLICY "Joyas públicas" ON joyas
  FOR SELECT USING (estado = 'Activo' AND visible_en_tienda = true);

-- Política: solo usuarios autenticados pueden modificar
CREATE POLICY "Solo autenticados modifican" ON joyas
  FOR ALL USING (auth.role() = 'authenticated');
```

### API Keys

Las claves en el código son para desarrollo. Para producción:
1. Usa variables de entorno
2. Nunca commites las claves reales
3. Usa el Service Role Key solo en backend

---

## 🚀 Próximos Pasos para E-commerce

1. **Frontend de Tienda Online**:
   - Catálogo de productos con imágenes
   - Carrito de compras con reservas
   - Checkout y pasarela de pagos

2. **API REST para E-commerce**:
   - GET `/api/tienda/productos` - Catálogo público
   - POST `/api/tienda/carrito/agregar` - Agregar al carrito
   - POST `/api/tienda/checkout` - Procesar compra

3. **Notificaciones**:
   - Email cuando stock está bajo
   - Notificaciones push para pedidos

4. **Analytics**:
   - Dashboard de ventas online vs física
   - Productos más vendidos
   - Análisis de abandono de carritos

---

## 📞 Soporte

Si encuentras algún problema:
1. Verifica que ejecutaste el SQL en Supabase
2. Revisa las credenciales en `.env`
3. Consulta los logs del servidor
4. Revisa la tabla `auditoria_inventario` para debugging

---

## 📝 Checklist de Migración

- [ ] Dependencias instaladas (`npm install`)
- [ ] Script SQL ejecutado en Supabase
- [ ] Variables de entorno configuradas
- [ ] Servidor iniciado correctamente
- [ ] Usuarios iniciales creados
- [ ] Cron job de limpieza de reservas configurado (opcional)
- [ ] RLS configurado para producción (opcional)

---

**Sistema desarrollado con:**
- Backend: Node.js + Express
- Base de datos: Supabase (PostgreSQL)
- Imágenes: Cloudinary
- Control de concurrencia: Bloqueos optimistas
- Preparado para: E-commerce multi-canal
