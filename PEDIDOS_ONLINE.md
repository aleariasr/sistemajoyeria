# 📦 Sistema de Gestión de Pedidos Online

## Descripción

Sistema completo de gestión de pedidos recibidos desde la tienda web (storefront) con notificaciones automáticas por email, gestión de estados, control de inventario y panel administrativo.

## 🎯 Características Principales

### Para Clientes (Tienda Web)
- ✅ Crear pedidos desde el storefront sin autenticación
- ✅ Validación automática de stock y disponibilidad
- ✅ Confirmación por email con detalles del pedido
- ✅ Página de confirmación con resumen del pedido

### Para Administradores (Panel POS)
- ✅ Panel de gestión con filtros y búsqueda
- ✅ Vista de estadísticas en tiempo real
- ✅ Gestión completa del ciclo de vida del pedido
- ✅ Notas internas para cada pedido
- ✅ Historial automático de cambios de estado

### Automatizaciones
- ✅ Emails transaccionales automáticos
- ✅ Actualización de stock al confirmar pedidos
- ✅ Creación de venta en el sistema al confirmar
- ✅ Devolución de stock al cancelar pedidos confirmados
- ✅ Registro de movimientos de inventario

## 📊 Estados de Pedidos

| Estado | Descripción | Acciones Disponibles |
|--------|-------------|---------------------|
| **Pendiente** | Pedido recibido, esperando confirmación | Confirmar, Cancelar |
| **Confirmado** | Stock verificado, venta creada | Marcar como Enviado, Cancelar |
| **Enviado** | Pedido despachado al cliente | Marcar como Entregado, Cancelar |
| **Entregado** | Pedido recibido por el cliente | Ninguna (estado final) |
| **Cancelado** | Pedido cancelado | Ninguna (estado final) |

## 🔄 Flujo Completo de Pedido

```
1. CLIENTE CREA PEDIDO (Storefront)
   ↓
   - Validación de datos
   - Verificación de stock
   - Creación en base de datos
   - Email a cliente (confirmación)
   - Email a admin (notificación)
   ↓
2. ADMIN VE PEDIDO (Panel POS)
   ↓
   - Revisa detalles
   - Verifica disponibilidad
   - Puede agregar notas internas
   ↓
3. ADMIN CONFIRMA PEDIDO
   ↓
   - Verifica stock nuevamente
   - Crea venta en el sistema
   - Actualiza stock (descuenta)
   - Registra movimientos de inventario
   - Email a cliente (confirmación de pago)
   ↓
4. ADMIN MARCA COMO ENVIADO
   ↓
   - Actualiza estado
   - Email a cliente (notificación de envío)
   ↓
5. ADMIN MARCA COMO ENTREGADO
   ↓
   - Pedido completado
```

## 📧 Emails Automatizados

### 1. Confirmación de Pedido (Cliente)
**Cuándo:** Inmediatamente al crear el pedido  
**Destinatario:** Email del cliente  
**Contenido:**
- Número de pedido
- Detalles de productos
- Total a pagar
- Próximos pasos

### 2. Notificación de Nuevo Pedido (Admin)
**Cuándo:** Inmediatamente al crear el pedido  
**Destinatario:** Email del administrador (configurado en .env)  
**Contenido:**
- Información del cliente
- Productos solicitados
- Total del pedido
- Enlace al panel de administración

### 3. Confirmación de Pago (Cliente)
**Cuándo:** Cuando el admin confirma el pedido  
**Destinatario:** Email del cliente  
**Contenido:**
- Confirmación de pedido aprobado
- Productos confirmados
- Estado: En preparación

### 4. Notificación de Envío (Cliente)
**Cuándo:** Cuando el admin marca como enviado  
**Destinatario:** Email del cliente  
**Contenido:**
- Confirmación de envío
- Información de productos
- Tiempo estimado de entrega

### 5. Cancelación de Pedido (Cliente)
**Cuándo:** Cuando el admin cancela el pedido  
**Destinatario:** Email del cliente  
**Contenido:**
- Notificación de cancelación
- Motivo (si se proporcionó)
- Información de contacto

## 🛠️ Configuración

### Variables de Entorno Requeridas

Agregar al archivo `backend/.env`:

```env
# Configuración de Email (Gmail SMTP)
EMAIL_USER=tu-email@gmail.com
EMAIL_APP_PASSWORD=contraseña-de-aplicación-gmail
EMAIL_FROM_NAME=Cuero&Perla
ADMIN_EMAIL=admin@tudominio.com

# Configuración de Tienda (para emails)
STORE_NAME=Cuero&Perla
STORE_URL=https://tudominio.com
STORE_PHONE=+506-1234-5678
```

### Generar Contraseña de Aplicación de Gmail

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Ve a "Seguridad"
3. Habilita "Verificación en 2 pasos" si no está habilitada
4. Busca "Contraseñas de aplicaciones"
5. Genera una nueva contraseña para "Correo"
6. Copia la contraseña generada a `EMAIL_APP_PASSWORD`

### Migración de Base de Datos

Ejecutar la migración completa:

```bash
# Conectarse a Supabase y ejecutar
backend/migrations/complete-pedidos-online.sql
```

Esto creará/actualizará:
- Tabla `pedidos_online` con campos adicionales
- Tabla `items_pedido_online` con snapshot de productos
- Tabla `historial_estado_pedidos` para auditoría
- Índices optimizados
- Triggers automáticos

## 🔌 API Endpoints

### Rutas Públicas (Sin Autenticación)

#### POST `/api/public/orders`
Crear un nuevo pedido desde el storefront.

**Request Body:**
```json
{
  "customer": {
    "nombre": "Juan Pérez",
    "telefono": "88881234",
    "email": "juan@example.com",
    "direccion": "San José, Costa Rica"
  },
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    }
  ],
  "notes": "Por favor, entregar en horario de tarde"
}
```

**Validaciones:**
- ✅ Nombre: máximo 100 caracteres
- ✅ Email: formato válido
- ✅ Teléfono: 6-20 dígitos
- ✅ Items: mínimo 1, máximo 100
- ✅ Cantidad: mayor a 0, máximo 1000 por item
- ✅ Stock: verifica disponibilidad
- ✅ Rate Limiting: máximo 10 pedidos por hora por IP

**Response:**
```json
{
  "success": true,
  "message": "Pedido creado exitosamente",
  "order": {
    "id": 123,
    "total": 50000,
    "items_count": 2,
    "customer_name": "Juan Pérez"
  }
}
```

#### GET `/api/public/orders/:id`
Ver detalles de un pedido (para página de confirmación).

**Response:**
```json
{
  "id": 123,
  "date": "2024-12-12T10:30:00Z",
  "total": 50000,
  "subtotal": 50000,
  "estado": "pendiente",
  "items": [...]
}
```

### Rutas Administrativas (Requieren Autenticación)

#### GET `/api/pedidos-online`
Listar pedidos con filtros y paginación.

**Query Parameters:**
- `estado`: Filtrar por estado
- `busqueda`: Buscar por nombre, email o teléfono
- `fecha_desde`: Fecha inicio (YYYY-MM-DD)
- `fecha_hasta`: Fecha fin (YYYY-MM-DD)
- `pagina`: Número de página (default: 1)
- `por_pagina`: Items por página (default: 20)

#### GET `/api/pedidos-online/:id`
Ver detalles completos de un pedido con items.

#### PATCH `/api/pedidos-online/:id/estado`
Cambiar estado de un pedido.

**Request Body:**
```json
{
  "estado": "Confirmado",
  "motivo": "Stock verificado" // opcional, requerido para cancelaciones
}
```

**Estados válidos:** Pendiente, Confirmado, Enviado, Entregado, Cancelado

**Acciones automáticas por estado:**
- **Confirmado**: Crea venta, actualiza stock, envía email
- **Enviado**: Envía email de notificación
- **Entregado**: Marca como completado
- **Cancelado**: Devuelve stock (si fue confirmado), envía email

#### PATCH `/api/pedidos-online/:id`
Actualizar notas internas del pedido.

**Request Body:**
```json
{
  "notas_internas": "Cliente confirmó pago por Sinpe"
}
```

#### GET `/api/pedidos-online/resumen/stats`
Obtener estadísticas de pedidos.

**Response:**
```json
{
  "total_pedidos": 150,
  "pendientes_pago": 5,
  "en_proceso": 10,
  "enviados": 8,
  "entregados": 120,
  "cancelados": 7,
  "monto_total": 5000000
}
```

## 💻 Panel de Administración

### Acceso
- **URL:** `/pedidos-online`
- **Permisos:** Solo administradores
- **Navegación:** Menú lateral → "Pedidos Online"

### Funcionalidades

#### 1. Vista de Lista
- Tabla con todos los pedidos
- Filtros por estado, fecha, búsqueda
- Paginación automática
- Tarjetas de estadísticas en tiempo real

#### 2. Vista de Detalle (Modal)
- Información completa del cliente
- Lista de productos con imágenes
- Estado actual del pedido
- Comentarios del cliente
- Notas internas (editables)
- Botones de acción según estado

#### 3. Acciones Disponibles
- **Confirmar Pedido:** Verifica stock y crea venta
- **Marcar como Enviado:** Actualiza estado y envía email
- **Marcar como Entregado:** Completa el pedido
- **Cancelar:** Con opción de agregar motivo
- **Guardar Notas:** Para uso interno del equipo

## 🔒 Seguridad

### Validaciones Implementadas
- ✅ Sanitización de inputs (previene XSS)
- ✅ Validación de formato de email y teléfono
- ✅ Límite de caracteres en campos de texto
- ✅ Validación de tipos de datos
- ✅ Rate limiting en rutas públicas (10/hora por IP)
- ✅ Autenticación requerida para rutas admin
- ✅ Verificación de permisos de administrador
- ✅ Prevención de SQL injection (Supabase prepared statements)

### Manejo de Errores
- ✅ Try-catch en todas las operaciones críticas
- ✅ Mensajes de error claros para usuarios
- ✅ Logs detallados en consola del servidor
- ✅ No expone información sensible en errores públicos

## 📊 Base de Datos

### Tabla: `pedidos_online`

Campos principales:
- `id`: ID único del pedido
- `nombre_cliente`, `telefono`, `email`: Información del cliente
- `subtotal`, `total`: Montos del pedido
- `notas`: Comentarios del cliente
- `notas_internas`: Notas del administrador
- `estado`: Estado actual del pedido
- `id_venta`: Referencia a venta creada (cuando se confirma)
- `fecha_creacion`, `fecha_actualizacion`: Timestamps

### Tabla: `items_pedido_online`

Campos principales:
- `id`: ID único del item
- `id_pedido`: Referencia al pedido
- `id_joya`: Referencia al producto
- `nombre_producto`: Snapshot del nombre
- `precio_unitario`: Precio al momento de compra
- `cantidad`: Cantidad solicitada
- `subtotal`: Total del item
- `imagen_url`: Snapshot de imagen

### Tabla: `historial_estado_pedidos`

Auditoría automática:
- `id_pedido`: Pedido auditado
- `estado_anterior`: Estado previo
- `estado_nuevo`: Nuevo estado
- `usuario`: Quién hizo el cambio
- `fecha`: Cuándo se hizo el cambio
- `notas`: Comentarios adicionales

## 🧪 Testing

### Casos de Prueba Críticos

1. **Creación de Pedido**
   - ✅ Con datos válidos
   - ✅ Con email inválido (debe rechazar)
   - ✅ Con stock insuficiente (debe rechazar)
   - ✅ Con cantidad excesiva (debe rechazar)
   - ✅ Rate limiting (más de 10 pedidos/hora)

2. **Confirmación de Pedido**
   - ✅ Stock disponible (debe confirmar)
   - ✅ Stock insuficiente (debe rechazar)
   - ✅ Verificar creación de venta
   - ✅ Verificar actualización de stock
   - ✅ Verificar envío de email

3. **Cancelación de Pedido**
   - ✅ Pedido pendiente (solo cancela)
   - ✅ Pedido confirmado (devuelve stock)
   - ✅ Pedido entregado (debe rechazar)

4. **Emails**
   - ✅ Envío correcto de confirmación
   - ✅ Envío correcto de notificación admin
   - ✅ Manejo de errores de SMTP

### Ejecutar Tests

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 🚀 Próximas Mejoras

- [ ] Integración con pasarelas de pago (Tilopay, Stripe)
- [ ] Seguimiento de envíos con tracking number
- [ ] Notificaciones en tiempo real (WebSockets)
- [ ] Dashboard con gráficos de ventas
- [ ] Exportación de reportes (PDF, Excel)
- [ ] Sistema de calificaciones y reviews
- [ ] Cupones de descuento para tienda online
- [ ] Integración con WhatsApp Business API

## 📞 Soporte

Para consultas o reportar problemas:
- Revisar logs del servidor: `console.log` en backend
- Revisar consola del navegador para errores frontend
- Verificar configuración de variables de entorno
- Confirmar que las migraciones se ejecutaron correctamente

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles
