# Guía Rápida de Pruebas - Sistema Cuero y Perla

## 🚀 Inicio Rápido

### 1. Iniciar el Sistema

```bash
# Terminal 1 - Backend
cd backend
npm install
npm start

# Terminal 2 - Frontend  
cd frontend
npm install
npm start
```

El sistema estará disponible en:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

### 2. Login Inicial

**Administrador**:
- Usuario: `admin`
- Contraseña: `admin123`

**Dependiente**:
- Usuario: `dependiente`
- Contraseña: `dependiente123`

---

## 📋 Lista de Verificación Rápida

### ✅ Inventario
1. Ir a "Inventario"
2. Click en "Nueva Joya"
3. Completar formulario:
   - Código: `JOY-001`
   - Nombre: `Anillo de Oro 18K`
   - Categoría: `Anillos`
   - Precio: `150000`
   - Stock: `5`
4. Guardar
5. **Click en botón 🏷️** junto al código
6. Generar 5 códigos de barras
7. Imprimir etiquetas

### ✅ Venta en Efectivo
1. Ir a "Nueva Venta"
2. Buscar producto: `JOY-001`
3. Agregar al carrito
4. Método de pago: "Efectivo"
5. Efectivo recibido: `200000`
6. Completar venta
7. **Click en "🖨️ Imprimir Ticket"**
8. Verificar ticket impreso:
   - ✓ Logo en blanco y negro
   - ✓ "Cuero y Perla"
   - ✓ "Grecia, Alajuela"
   - ✓ Productos con códigos
   - ✓ Total y cambio
   - ✓ Sin colores

### ✅ Venta a Crédito
1. Crear cliente:
   - Nombre: `María Rodríguez`
   - Tel: `8888-8888`
2. Nueva venta
3. Tipo: "Crédito"
4. Buscar cliente y seleccionar
5. Agregar productos
6. Fecha vencimiento: 30 días
7. Completar venta
8. **Imprimir ticket**
9. Verificar info de cliente en ticket

### ✅ Pago Mixto
1. Nueva venta con total de `100000`
2. Método: "Mixto"
3. Definir:
   - Efectivo: `50000`
   - Tarjeta: `30000`
   - Transferencia: `20000`
4. Completar venta
5. **Imprimir ticket**
6. Verificar desglose en ticket

### ✅ Reimpresión
1. Ir a "Historial de Ventas"
2. Click en cualquier venta
3. Click "Ver Detalle"
4. Click "🖨️ Imprimir Ticket"
5. Verificar reimpresión correcta

---

## 🎯 Puntos Clave a Verificar

### Tickets Monocromáticos ✓
- [ ] Logo aparece en escala de grises
- [ ] Todo el texto es negro (#000)
- [ ] Sin gradientes ni colores
- [ ] Divisores con líneas punteadas negras
- [ ] Fondo completamente blanco
- [ ] Legible en impresora térmica

### Códigos de Barras ✓
- [ ] Botón 🏷️ visible junto a cada código
- [ ] Modal muestra vista previa
- [ ] Control de cantidad funciona (1-100)
- [ ] Botón "Usar Stock" funciona
- [ ] Etiquetas son 50mm × 30mm
- [ ] Códigos son escaneables

### Todas las Opciones de Venta ✓
- [ ] Efectivo (con cambio)
- [ ] Tarjeta
- [ ] Transferencia
- [ ] Mixto (desglose)
- [ ] Crédito (con cliente)
- [ ] Con descuento
- [ ] Con notas

---

## 🖨️ Prueba de Impresión Real

### Configuración de Impresora Térmica
1. Conectar impresora térmica 80mm
2. En Windows: Configurar como "Thermal Printer"
3. En macOS: Agregar en "Impresoras y escáneres"
4. En Linux: Configurar con CUPS

### Imprimir Ticket
1. Completar una venta
2. Click en "🖨️ Imprimir Ticket"
3. En diálogo de impresión:
   - Seleccionar impresora térmica
   - Papel: 80mm
   - Orientación: Vertical
   - Márgenes: Mínimos
4. Imprimir
5. Verificar calidad

### Imprimir Códigos de Barras
1. Click en 🏷️ junto a producto
2. Ajustar cantidad
3. Click "Imprimir"
4. En diálogo:
   - Seleccionar impresora de etiquetas
   - Papel: Etiquetas 50×30mm
   - Múltiples por página si aplica
5. Imprimir
6. Escanear con lector para verificar

---

## 📱 Prueba Multi-Dispositivo

### Desde PC/Laptop
```
1. Abrir Chrome/Firefox
2. Navegar a http://localhost:3000
3. Realizar todas las pruebas
```

### Desde Móvil/Tablet (misma red WiFi)
```
1. Verificar IP del servidor (ej: 192.168.1.100)
2. Abrir navegador en dispositivo móvil
3. Navegar a http://192.168.1.100:3000
4. Probar funcionalidad responsive
5. Intentar imprimir (puede usar compartir/PDF)
```

---

## ⚡ Prueba Rápida de 5 Minutos

```
✓ Login como admin
✓ Crear 1 producto
✓ Generar código de barras
✓ Hacer 1 venta en efectivo
✓ Imprimir ticket
✓ Verificar diseño blanco y negro
✓ Listo! ✅
```

---

## 🔍 Qué Buscar en Ticket Impreso

### Debe tener:
- ✅ Logo (escala de grises)
- ✅ Nombre: "Cuero y Perla"
- ✅ Ubicación: "Grecia, Alajuela, Costa Rica"
- ✅ Fecha y hora
- ✅ Número de ticket
- ✅ Vendedor
- ✅ Lista de productos con códigos
- ✅ Cantidades y precios
- ✅ Subtotal
- ✅ Descuento (si aplica)
- ✅ TOTAL destacado
- ✅ Método de pago
- ✅ Efectivo recibido y cambio (si efectivo)
- ✅ Desglose (si mixto)
- ✅ Cliente (si crédito)
- ✅ Notas (si hay)
- ✅ Mensaje "¡Gracias por su compra!"
- ✅ Slogan: "Belleza y Elegancia en Cada Detalle"

### NO debe tener:
- ❌ Colores (excepto logo en escala de grises)
- ❌ Gradientes
- ❌ Fondos de color
- ❌ Tonos grises en texto

---

## 🐛 Solución de Problemas

### El ticket tiene colores
- ✅ Ya resuelto en commit d5c9d70
- ✅ Actualizar código y rebuildar

### No se puede imprimir
- Verificar que impresora esté conectada
- Verificar permisos en sistema operativo
- Probar con "Guardar como PDF" primero

### Código de barras no se escanea
- Verificar que etiqueta esté limpia
- Ajustar distancia de escaneo
- Verificar que lector esté configurado para Code128

### No aparece logo
- Verificar conexión a internet (logo en Cloudinary)
- Verificar URL del logo en código
- Revisar consola del navegador por errores

---

## ✅ Lista de Verificación Final

Antes de marcar como listo:
- [ ] Backend inicia sin errores
- [ ] Frontend compila correctamente
- [ ] Login funciona
- [ ] Puede crear productos
- [ ] Puede generar códigos de barras
- [ ] Puede hacer ventas de todos los tipos
- [ ] Tickets se imprimen correctamente
- [ ] Tickets son 100% blanco y negro
- [ ] Logo se ve bien en escala de grises
- [ ] Códigos de barras se escanean
- [ ] Reimpresión funciona
- [ ] Funciona en diferentes navegadores
- [ ] Responsive en móviles

---

**Si todos los checkboxes están marcados:**
## ✨ ¡SISTEMA LISTO PARA PRODUCCIÓN! ✨

**Cuero y Perla**
Grecia, Alajuela, Costa Rica
