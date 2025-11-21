# 🚀 Guía Completa del Sistema - Joyería v2.0

## ✅ Sistema Completamente Migrado

- **Base de datos:** Supabase (PostgreSQL)
- **Imágenes:** Cloudinary
- **Multi-dispositivo:** Sí
- **E-commerce ready:** Sí

---

## 📋 INICIO RÁPIDO (3 Pasos)

### 1. Ejecutar SQL en Supabase (PRIMERA VEZ ÚNICAMENTE)

1. Abre: https://mvujkbpbqyihixkbzthe.supabase.co
2. Ve a **SQL Editor**
3. Abre `backend/supabase-migration.sql`
4. Copia TODO el contenido y pégalo
5. Click en **RUN**

Esto crea:
- ✅ Todas las tablas
- ✅ Funciones de control de concurrencia  
- ✅ Triggers automáticos
- ✅ Índices optimizados
- ✅ Sistema de auditoría

### 2. Iniciar Backend

```bash
cd backend
npm install
npm start
```

Verás:
```
🚀 Servidor corriendo en http://localhost:3001
✅ Conexión a Supabase establecida
```

**Usuarios creados automáticamente:**
- Admin: `admin` / `admin123`
- Dependiente: `dependiente` / `dependiente123`

### 3. Iniciar Frontend

```bash
cd frontend
npm install
npm start
```

Se abrirá en: http://localhost:3000

---

## 🆕 NUEVAS FUNCIONALIDADES

### 1. Imágenes de Productos
- Sube una imagen por joya (JPG, PNG, GIF, WEBP)
- Máximo 5MB
- Almacenadas en Cloudinary

### 2. Multi-Dispositivo
Usa el sistema desde múltiples dispositivos simultáneamente:
- 💻 Computadoras
- 📱 Celulares  
- 📲 Tablets

**Todos comparten la misma base de datos en tiempo real.**

#### Acceso desde Red Local (Misma WiFi)

1. En la computadora del servidor, obtén la IP:
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```
   Ejemplo: `192.168.1.100`

2. En otros dispositivos, abre: `http://192.168.1.100:3000`

#### Acceso desde Internet

Despliega en la nube (Railway, Heroku):
```bash
# Railway
npm install -g @railway/cli
railway login
cd backend
railway init
railway up
```

### 3. E-commerce Ready

El sistema está preparado para tienda online:

**Nuevos campos en joyas:**
- `peso_gramos` - Para envíos
- `dimensiones` (ancho, alto, largo)
- `sku` - Código alternativo
- `slug` - URL amigable
- `meta_title`, `meta_description` - SEO
- `visible_en_tienda` - Mostrar/ocultar online
- `stock_reservado` - Stock en carritos

**Sistema de reservas:**
- Reserva automática cuando alguien agrega al carrito (30 min)
- Limpieza automática de reservas expiradas
- Evita sobreventa entre tienda física y online

**Control de concurrencia:**
- Actualizaciones atómicas de stock
- Bloqueo optimista con campo `version`
- Sin conflictos entre múltiples usuarios

---

## 📊 ESTRUCTURA DEL SISTEMA

### Tablas Principales

1. **usuarios** - Control de acceso (admin/dependiente)
2. **joyas** - Inventario de productos
3. **clientes** - Base de clientes
4. **ventas** - Registro de transacciones
5. **items_venta** - Detalle de productos vendidos
6. **cuentas_por_cobrar** - Créditos
7. **abonos** - Pagos a créditos
8. **movimientos_inventario** - Historial de cambios
9. **ventas_dia** - Ventas temporales (para cierre de caja)
10. **items_venta_dia** - Detalle temporal

### Tablas E-commerce

11. **reservas_inventario** - Carritos de compra online
12. **auditoria_inventario** - Trazabilidad completa
13. **configuracion_tienda** - Parámetros globales

---

## 🔧 FUNCIONALIDADES

### Autenticación
- Login seguro con bcrypt
- Sesiones independientes por dispositivo
- Control de acceso por roles

### Ventas
**Métodos de pago:**
- Efectivo
- Tarjeta
- Transferencia
- Mixto (combina los anteriores)

**Tipos:**
- Contado
- Crédito (requiere cliente)

### Cuentas por Cobrar
- Registro de ventas a crédito
- Abonos con múltiples métodos de pago
- Estado automático (Pagada cuando saldo = 0)
- Alertas de vencimiento

### Inventario
- Movimientos automáticos en ventas
- Registro manual (entrada/salida/ajuste)
- Historial completo
- Alertas de stock bajo

### Cierre de Caja
- Resumen del día
- Transferir ventas temporales a permanentes
- Reporte de ingresos por método de pago

### Reportes
- Inventario actual con valorización
- Stock bajo
- Movimientos financieros
- Historial unificado
- Exportación a CSV

---

## 🔐 CONFIGURACIÓN DE PRODUCCIÓN

### Variables de Entorno

Crea `.env` con:
```env
PORT=3001
NODE_ENV=production
SUPABASE_URL=https://mvujkbpbqyihixkbzthe.supabase.co
SUPABASE_KEY=tu_key_aqui
CLOUDINARY_CLOUD_NAME=dekqptpft
CLOUDINARY_API_KEY=127388563365697
CLOUDINARY_API_SECRET=tu_secret_aqui
FRONTEND_URL=https://tu-dominio.com
```

### Cron Job (Limpieza de Reservas)

En Supabase → Database → Cron Jobs:
```sql
SELECT limpiar_reservas_expiradas();
```
Schedule: `*/10 * * * *` (cada 10 minutos)

### CORS Multi-Dispositivo

El sistema ya está configurado para aceptar conexiones de:
- localhost
- IPs locales (192.168.x.x, 10.x.x.x)
- Dominio configurado en `FRONTEND_URL`

---

## 🧪 PRUEBAS

### Prueba Manual Completa

1. **Autenticación**
   - Login como admin
   - Login como dependiente
   - Verificar permisos

2. **Gestión de Joyas**
   - Crear joya con imagen
   - Editar joya
   - Listar con filtros
   - Ver detalle

3. **Clientes**
   - Crear cliente
   - Buscar por cédula/nombre

4. **Ventas de Contado**
   - Venta en efectivo con cambio
   - Venta con tarjeta
   - Venta con transferencia
   - Venta mixta

5. **Ventas a Crédito**
   - Crear venta a crédito
   - Registrar primer abono
   - Registrar abono final
   - Verificar estado "Pagada"

6. **Inventario**
   - Verificar movimientos automáticos
   - Registrar entrada manual
   - Ver historial

7. **Cierre de Caja**
   - Ver resumen del día
   - Ejecutar cierre
   - Verificar que ventas se transfirieron

8. **Reportes**
   - Inventario completo
   - Stock bajo
   - Movimientos financieros

### Tests Automatizados

```bash
cd backend/tests
node comprehensive-test.js
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### "No se conecta a Supabase"
- ✓ Verifica que ejecutaste el SQL
- ✓ Revisa credenciales en `.env`
- ✓ Verifica conexión a internet

### "Error al subir imagen"
- ✓ Verifica credenciales de Cloudinary
- ✓ Archivo debe ser imagen (JPG, PNG, GIF, WEBP)
- ✓ Tamaño máximo 5MB

### "No funciona desde otro dispositivo"
- ✓ Verifica que están en la misma red
- ✓ Revisa firewall
- ✓ Usa la IP correcta
- ✓ Backend debe estar corriendo

### Vulnerabilidades en Frontend
```bash
cd frontend
npm audit fix
```

---

## 📚 ARQUITECTURA E-COMMERCE

### Flujo de Compra Online (Futuro)

```
1. Cliente agrega al carrito
   ↓
2. Sistema reserva stock (tabla reservas_inventario)
   ↓
3. Cliente tiene 30 min para pagar
   ↓
4. Si paga: stock se descuenta, reserva se completa
   Si no: reserva expira, stock se libera automáticamente
```

### Sincronización Tienda Física ↔ Online

```
Tienda Física  →  Supabase PostgreSQL  ←  Tienda Online
                         ↓
                  Stock único
                         ↓
               Sincronización en tiempo real
```

**Ventajas:**
- ✅ Inventario unificado
- ✅ No hay duplicación de datos
- ✅ Actualizaciones instantáneas
- ✅ Control de concurrencia automático

---

## 🎯 PRÓXIMOS PASOS (Opcional)

### Para Tienda Online

1. **Frontend de Tienda:**
   - Catálogo de productos
   - Carrito de compras
   - Checkout

2. **API REST:**
   - `GET /api/tienda/productos` - Catálogo público
   - `POST /api/tienda/carrito/agregar` - Agregar al carrito
   - `POST /api/tienda/checkout` - Procesar compra

3. **Pasarela de Pagos:**
   - Integrar Stripe, PayPal, etc.
   - Webhooks para confirmación

4. **Notificaciones:**
   - Email de confirmación
   - Email cuando stock está bajo
   - SMS para abonos

---

## ✅ CHECKLIST

Marca cuando completes:

**Setup Inicial:**
- [ ] SQL ejecutado en Supabase
- [ ] Backend iniciado correctamente
- [ ] Frontend iniciado correctamente
- [ ] Login funciona

**Pruebas Básicas:**
- [ ] Crear joya con imagen
- [ ] Crear cliente
- [ ] Venta de contado
- [ ] Venta a crédito
- [ ] Registrar abono
- [ ] Cierre de caja

**Multi-Dispositivo:**
- [ ] Acceso desde segundo dispositivo
- [ ] Cambios se ven en ambos

**Opcional:**
- [ ] Cron job configurado
- [ ] Desplegado en la nube
- [ ] Dominio personalizado

---

## 📞 SOPORTE

**Documentación adicional:**
- `README.md` - Información general del proyecto
- `CHANGELOG.md` - Historial de cambios
- `AUDITORIA_COMPLETA.md` - Revisión de código completa

**Tests:**
- `backend/tests/` - Tests automatizados

**Archivos SQL:**
- `backend/supabase-migration.sql` - Migración completa

---

**Versión:** 2.0  
**Estado:** ✅ PRODUCCIÓN READY  
**Base de datos:** Supabase (PostgreSQL)  
**Imágenes:** Cloudinary  
**Multi-dispositivo:** Sí  
**E-commerce:** Ready
