# 📋 Guía de Migraciones de Base de Datos

## Resumen

Este documento explica cómo configurar la base de datos desde cero y aplicar todas las migraciones necesarias para que el sistema funcione correctamente.

## 🗄️ Orden de Ejecución de Migraciones

Para configurar la base de datos completa, ejecuta los scripts SQL en este orden:

### 1. Migración Base (OBLIGATORIA)
**Archivo:** `backend/supabase-migration.sql`  
**Descripción:** Crea todas las tablas básicas del sistema

```sql
-- Ejecutar en Supabase SQL Editor:
-- https://[tu-proyecto].supabase.co/project/_/sql
```

**Incluye:**
- ✅ Tabla `usuarios` - Usuarios del sistema
- ✅ Tabla `joyas` - Inventario de joyas
- ✅ Tabla `movimientos_inventario` - Historial de movimientos
- ✅ Tabla `ventas` - Registro de ventas
- ✅ Tabla `items_venta` - Detalles de cada venta
- ✅ Tabla `clientes` - Base de clientes
- ✅ Tabla `cuentas_por_cobrar` - Créditos
- ✅ Tabla `abonos` - Pagos de créditos
- ✅ Tabla `ingresos_extras` - Ingresos adicionales
- ✅ Tabla `devoluciones` - Devoluciones de productos
- ✅ Tabla `ventas_dia` - Resumen diario
- ✅ Tabla `items_venta_dia` - Items del día

### 2. Migración: Múltiples Imágenes (OPCIONAL)
**Archivo:** `backend/migrations/add-multiple-images-support.sql`  
**Descripción:** Agrega soporte para galería de imágenes por producto

```sql
-- Crea tabla imagenes_joya para almacenar múltiples imágenes por producto
```

**Funcionalidad:**
- 📸 Galería de hasta 10 imágenes por producto
- 🖼️ Orden personalizable
- ⭐ Imagen principal destacada

### 3. Migración: Pedidos Online (OPCIONAL - Para E-Commerce)
**Archivo:** `backend/migrations/create-pedidos-online.sql`  
**Descripción:** Sistema de pedidos online para el storefront

```sql
-- Crea tablas para gestionar pedidos del storefront
```

**Incluye:**
- 📦 Tabla `pedidos_online` - Pedidos del storefront
- 🛒 Tabla `items_pedido_online` - Items de cada pedido
- 📧 Sistema de notificaciones por email
- 📊 Estados: pendiente, confirmado, cancelado, completado

**Seguido por:**
**Archivo:** `backend/migrations/complete-pedidos-online.sql`  
**Descripción:** Completa la funcionalidad de pedidos online

```sql
-- Agrega campos adicionales y mejoras
```

### 4. Migración: Visibilidad en Storefront (OPCIONAL - Para E-Commerce)
**Archivo:** `backend/migrations/add-storefront-visibility.sql`  
**Descripción:** Control de visibilidad de productos en la tienda online

```sql
-- Agrega campo mostrar_en_storefront a la tabla joyas
```

**Funcionalidad:**
- 👁️ Control de qué productos se muestran en el storefront
- 🔒 Productos privados solo visibles en el POS

### 5. Migración: Items "Otros" (OPCIONAL)
**Archivo:** `backend/migrations/add-otros-item-support.sql`  
**Descripción:** Permite vender items sin inventario registrado

```sql
-- Permite items_venta.id_joya = NULL para ventas de "Otros"
```

**Funcionalidad:**
- 💼 Vender servicios o productos ocasionales
- 📝 Sin necesidad de crear SKU en inventario

### 6. Migración: Variantes, Productos Compuestos y Notificaciones Push (RECOMENDADA)
**Archivo:** `backend/migrations/add-variantes-compuestos-notifications.sql`  
**Descripción:** Funcionalidades avanzadas del sistema

```sql
-- Agrega tablas para variantes, sets y notificaciones push
```

**Incluye:**

#### 🔀 Variantes de Producto
- Múltiples diseños del mismo producto (ej: aretes con diferentes estilos)
- Comparten precio y stock del producto padre
- Hasta 100 variantes por producto
- Gestión de orden y activación/desactivación

#### 📦 Productos Compuestos (Sets)
- Conjuntos de múltiples productos (ej: trio de pulseras)
- Stock calculado automáticamente basado en componentes
- Prevención de referencias circulares
- Hasta 20 componentes por set

#### 🔔 Notificaciones Push
- Notificaciones en tiempo real en el navegador
- Sistema de suscripciones por usuario
- Integración con Web Push API
- Notificación de nuevos pedidos online

### 7. Migración: Nuevas Características (OPCIONAL)
**Archivo:** `backend/migrations/add-new-features.sql`  
**Descripción:** Mejoras adicionales del sistema

```sql
-- Funcionalidades adicionales variadas
```

## 🚀 Instalación Rápida (Todo en uno)

Para instalar todas las migraciones en orden:

```bash
# 1. Copia el contenido de supabase-migration.sql
cat backend/supabase-migration.sql

# 2. Ejecuta en Supabase SQL Editor

# 3. Luego ejecuta las migraciones adicionales que necesites:
cat backend/migrations/add-multiple-images-support.sql
cat backend/migrations/create-pedidos-online.sql
cat backend/migrations/complete-pedidos-online.sql
cat backend/migrations/add-storefront-visibility.sql
cat backend/migrations/add-otros-item-support.sql
cat backend/migrations/add-variantes-compuestos-notifications.sql
cat backend/migrations/add-new-features.sql
```

## 🎯 Configuraciones Recomendadas

### Para Tienda Física + POS Únicamente
```
✅ supabase-migration.sql (obligatorio)
✅ add-multiple-images-support.sql (recomendado)
✅ add-variantes-compuestos-notifications.sql (recomendado)
```

### Para Tienda Física + E-Commerce
```
✅ supabase-migration.sql (obligatorio)
✅ add-multiple-images-support.sql (obligatorio para galería)
✅ create-pedidos-online.sql (obligatorio)
✅ complete-pedidos-online.sql (obligatorio)
✅ add-storefront-visibility.sql (obligatorio)
✅ add-otros-item-support.sql (opcional)
✅ add-variantes-compuestos-notifications.sql (recomendado)
✅ add-new-features.sql (opcional)
```

## ✅ Verificación Post-Migración

Después de ejecutar las migraciones, verifica que todo esté correcto:

```sql
-- Verificar que todas las tablas existan
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Debería incluir:
-- ✅ usuarios
-- ✅ joyas
-- ✅ movimientos_inventario
-- ✅ ventas
-- ✅ items_venta
-- ✅ clientes
-- ✅ cuentas_por_cobrar
-- ✅ abonos
-- ✅ ingresos_extras
-- ✅ devoluciones
-- ✅ ventas_dia
-- ✅ items_venta_dia
-- ✅ imagenes_joya (si instalaste múltiples imágenes)
-- ✅ pedidos_online (si instalaste e-commerce)
-- ✅ items_pedido_online (si instalaste e-commerce)
-- ✅ variantes_producto (si instalaste variantes)
-- ✅ productos_compuestos (si instalaste sets)
-- ✅ push_subscriptions (si instalaste notificaciones)
```

## 🔧 Solución de Problemas

### Error: "relation already exists"
**Causa:** Intentaste ejecutar una migración que ya fue aplicada.  
**Solución:** Ignora el error, la tabla ya existe y está lista.

### Error: "column already exists"
**Causa:** El campo ya fue agregado en una migración anterior.  
**Solución:** Ignora el error, el campo ya existe.

### Error: "foreign key constraint fails"
**Causa:** Las migraciones se ejecutaron en el orden incorrecto.  
**Solución:** 
1. Verifica que ejecutaste `supabase-migration.sql` primero
2. Ejecuta las demás migraciones en el orden especificado arriba

## 📚 Documentación Adicional

- [DEPLOY.md](./DEPLOY.md) - Guía completa de deployment
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Guía de desarrollo
- [PRODUCTOS_COMPUESTOS.md](./PRODUCTOS_COMPUESTOS.md) - Documentación de sets
- [VARIANTES_PRODUCTO.md](./VARIANTES_PRODUCTO.md) - Documentación de variantes
- [NOTIFICACIONES_PUSH.md](./NOTIFICACIONES_PUSH.md) - Documentación de notificaciones

## 🆘 Ayuda

Si encuentras problemas:
1. Revisa los logs de Supabase en el SQL Editor
2. Verifica que todas las tablas padre existan antes de crear relaciones
3. Asegúrate de que el orden de ejecución sea correcto
4. Consulta la documentación específica de cada funcionalidad

## 📝 Notas Importantes

- ⚠️ **Backup:** Siempre haz un backup de tu base de datos antes de ejecutar migraciones
- 🔐 **Seguridad:** Nunca ejecutes migraciones en producción sin probarlas en desarrollo primero
- 📊 **Datos:** Las migraciones no eliminan datos existentes, solo agregan o modifican estructura
- 🔄 **Idempotencia:** La mayoría de las migraciones usan `IF NOT EXISTS` para ser seguras de re-ejecutar
