# Sistema de Impresión de Tickets y Códigos de Barras

## 🖨️ Impresora Térmica 3nstar RPT008 (USB)

### Configuración para USB (Windows, Linux y macOS)

El sistema está configurado para trabajar directamente con la impresora térmica 3nstar RPT008 vía USB usando la API WebUSB. Esto permite:
- **Impresión directa** sin necesidad de drivers adicionales en la mayoría de los casos
- **Corte automático** del papel al final de cada ticket
- **Compatibilidad multiplataforma**: Windows, Linux y macOS
- **Fallback automático**: Si WebUSB no está disponible, se usa el diálogo de impresión del navegador

### Requisitos
1. **Navegador compatible con WebUSB**: Chrome, Edge, Opera (Firefox y Safari no soportan WebUSB)
2. **Conexión USB**: La impresora debe estar conectada por USB
3. **Permisos**: El navegador pedirá permiso la primera vez para acceder al dispositivo USB

### Cómo Imprimir

#### Impresión Térmica USB (Recomendado)
1. Al hacer click en "🖨️ Imprimir Ticket", el sistema intentará usar WebUSB
2. Si es la primera vez, se mostrará un diálogo para seleccionar la impresora
3. Selecciona "RPT008" o tu impresora térmica de la lista
4. El ticket se imprimirá directamente con corte automático

#### Impresión por Navegador (Alternativa)
Si WebUSB no está disponible o prefieres usar el diálogo de impresión:
1. Click en el botón "📄 Navegador"
2. Se abrirá el diálogo de impresión del sistema operativo
3. Selecciona tu impresora y configura las opciones

### Características de Impresión Térmica
- ✂️ **Corte automático** al final de cada ticket
- 📐 **Formato 80mm** optimizado para impresoras térmicas
- 🖨️ **Comandos ESC/POS** nativos para máxima compatibilidad
- 💾 **Sin drivers adicionales** gracias a WebUSB

---

## 🎫 Impresión de Tickets de Venta

### Características
- **Diseño elegante y profesional** optimizado para impresoras térmicas de 80mm
- **Logo del negocio** desde Cloudinary
- **Información completa del negocio**: Cuero y Perla, Grecia, Alajuela
- **Compatible con todos los dispositivos**: Windows, macOS, Linux y móviles
- **Selección de impresora** mediante el diálogo nativo del navegador

### Dónde Imprimir Tickets

#### 1. Al Realizar una Venta (Ventas.js)
Después de procesar una venta exitosamente:
- Aparece un mensaje de éxito con el botón "🖨️ Imprimir Ticket"
- Click en el botón para abrir la vista previa de impresión
- El ticket incluye todos los detalles de la venta recién realizada

#### 2. Desde el Detalle de Venta (DetalleVenta.js)
Para reimprimir tickets de ventas anteriores:
- Navega a **Historial de Ventas**
- Click en "Ver Detalle" de cualquier venta
- Click en el botón "🖨️ Imprimir Ticket" en la parte superior
- Se puede reimprimir en cualquier momento

### Contenido del Ticket
El ticket incluye:
- 🏢 **Logo y datos del negocio**
- 📅 **Fecha y hora de la transacción**
- 🆔 **Número de ticket/venta**
- 👤 **Vendedor y cliente (si aplica)**
- 💎 **Detalle de productos**: código, nombre, cantidad, precio
- 💰 **Resumen financiero**: subtotal, descuento, total
- 💳 **Información de pago**: método, efectivo recibido, cambio
- 📝 **Notas adicionales** (si las hay)
- ✨ **Pie de página** con slogan del negocio

### Tipos de Venta Soportados
- ✅ **Ventas de contado** (efectivo, tarjeta, transferencia)
- ✅ **Ventas a crédito** con información del cliente
- ✅ **Pagos mixtos** con desglose de montos

---

## 🏷️ Generación de Códigos de Barras

### Características
- **Generación automática** usando TEC-IT Barcode API
- **Etiquetas optimizadas** (50mm x 30mm) para fácil escaneo
- **Impresión múltiple** según stock o cantidad personalizada
- **Vista previa** antes de imprimir
- **Información completa** en cada etiqueta

### Dónde Generar Códigos de Barras

#### 1. Desde el Listado de Joyas (ListadoJoyas.js)
En la columna de código de cada producto:
- Click en el botón 🏷️ junto al código
- Se abre un modal con vista previa
- Ajusta la cantidad de etiquetas a imprimir
- Click en "Imprimir"

#### 2. Desde el Detalle de Joya (DetalleJoya.js)
En la vista de detalle de cualquier producto:
- Click en "🏷️ Generar Código de Barras" en la parte superior
- Modal con vista previa y opciones
- Imprime las etiquetas necesarias

### Contenido de las Etiquetas
Cada etiqueta incluye:
- 🏢 **Nombre del negocio**: Cuero y Perla
- 💎 **Nombre del producto**
- 🔢 **Código del producto**
- 📊 **Código de barras** (formato Code128)
- 💰 **Precio de venta**
- 🔗 **Crédito**: TEC-IT (requerido por el servicio)

### Opciones de Impresión
- ➖➕ **Control de cantidad**: botones +/- o entrada manual
- 📦 **Usar stock**: botón para imprimir según stock actual
- 👁️ **Vista previa**: muestra cómo se verán las etiquetas
- 🖨️ **Impresión flexible**: 1-100 etiquetas

### Tamaño Optimizado
- **Dimensiones**: 50mm x 30mm
- **Formato**: Perfecto para lectores de códigos de barras
- **Diseño**: Compacto pero legible
- **Compatible**: Con impresoras de etiquetas estándar

---

## 🖨️ Cómo Imprimir

### Proceso General
1. **Click en el botón de impresión** (🖨️)
2. **Se abre la vista previa** del navegador
3. **Selecciona tu impresora**:
   - Impresora térmica de tickets (para tickets)
   - Impresora de etiquetas (para códigos de barras)
   - Impresora normal (funciona para ambos)
4. **Ajusta configuración** si es necesario
5. **Click en "Imprimir"**

### Configuración Recomendada

#### Para Tickets (80mm)
- **Tamaño de papel**: 80mm (personalizado si es necesario)
- **Orientación**: Vertical
- **Márgenes**: Mínimos o automáticos
- **Escala**: 100%

#### Para Códigos de Barras
- **Tamaño de papel**: 50mm x 30mm (o papel de etiquetas)
- **Orientación**: Horizontal
- **Márgenes**: Mínimos
- **Múltiples por página**: Si usas papel de etiquetas estándar

### Compatibilidad

#### Impresión Térmica USB (WebUSB)
- ✅ **Windows**: Chrome, Edge, Opera
- ✅ **macOS**: Chrome, Edge, Opera
- ✅ **Linux**: Chrome, Chromium
- ❌ **Firefox**: No soporta WebUSB (usar impresión por navegador)
- ❌ **Safari**: No soporta WebUSB (usar impresión por navegador)

#### Impresión por Navegador (Fallback)
- ✅ **Windows**: Chrome, Firefox, Edge
- ✅ **macOS**: Chrome, Firefox, Safari
- ✅ **Linux**: Chrome, Firefox
- ✅ **Android**: Chrome, Firefox
- ✅ **iOS**: Safari, Chrome

---

## 🎨 Diseño y Estilo

### Tickets de Venta
- **Diseño elegante** con gradientes sutiles
- **Tipografía profesional**: Courier New (monospace)
- **Iconos descriptivos**: 💰 💳 📝 ✨
- **Colores corporativos**: Morado/azul (#667eea, #764ba2)
- **Separadores visuales**: Líneas punteadas para claridad

### Códigos de Barras
- **Diseño minimalista** para máxima legibilidad
- **Información clara** y concisa
- **Alto contraste** para mejor escaneo
- **Tamaño optimizado** para manipulación fácil

---

## 🔧 Implementación Técnica

### Librerías y Tecnologías Utilizadas
- **react-to-print**: Manejo de impresión desde React (fallback)
- **WebUSB API**: Comunicación directa con impresoras USB
- **ESC/POS Commands**: Comandos nativos para impresoras térmicas
- **TEC-IT Barcode API**: Generación de códigos de barras

### Componentes y Servicios Creados
1. **thermalPrinterService.js**: Servicio de impresión térmica USB con ESC/POS
2. **TicketPrint.js**: Componente de ticket + hook `useThermalPrint()`
3. **TicketPrint.css**: Estilos optimizados para impresión
4. **BarcodePrint.js**: Componente de etiquetas de código de barras
5. **BarcodePrint.css**: Estilos para etiquetas
6. **BarcodeModal.js**: Modal de configuración de códigos de barras
7. **BarcodeModal.css**: Estilos del modal

### Comandos ESC/POS Implementados
- **Inicialización**: ESC @ (0x1B 0x40)
- **Alineación**: ESC a (centro, izquierda, derecha)
- **Estilos**: Negrita, doble altura, doble ancho
- **Corte de papel**: GS V A 3 (0x1D 0x56 0x41 0x03)
- **Alimentación**: ESC d n (alimentar n líneas)

### Archivos Modificados
- **Ventas.js**: Añadido soporte para impresión térmica USB
- **DetalleVenta.js**: Añadido soporte para impresión térmica USB
- **ListadoJoyas.js**: Añadido botón de código de barras
- **DetalleJoya.js**: Añadido botón de código de barras

---

## 📝 Notas Importantes

### Para Tickets
- Los tickets se imprimen inmediatamente después de una venta exitosa
- Se pueden reimprimir desde el historial en cualquier momento
- Los datos se guardan en el estado de la aplicación temporalmente
- El logo se carga desde Cloudinary (requiere conexión a internet)

### Para Códigos de Barras
- Los códigos de barras se generan usando el servicio TEC-IT
- Requiere conexión a internet para generar los códigos
- El formato Code128 es compatible con la mayoría de lectores
- El crédito a TEC-IT es obligatorio por los términos del servicio
- Los códigos son únicos basados en el código del producto

### Privacidad
- No se envían datos sensibles a servicios externos
- Solo el código del producto se envía al generador de códigos de barras
- Los tickets se generan localmente en el navegador

---

## 🆘 Solución de Problemas

### Impresora Térmica RPT008

#### La impresora no aparece en la lista de dispositivos USB
- Verifica que la impresora esté encendida y conectada por USB
- Prueba con otro puerto USB
- En Linux, puede ser necesario dar permisos al usuario:
  ```bash
  sudo usermod -a -G lp $USER
  ```
- Reinicia el navegador después de conectar la impresora

#### El navegador no pide permiso para acceder al USB
- Verifica que estés usando Chrome, Edge u Opera (Firefox/Safari no soportan WebUSB)
- Asegúrate de que el sitio se sirve por HTTPS (o localhost para desarrollo)
- Revisa que no hayas bloqueado el permiso previamente

#### La impresión sale en blanco o no corta
- Verifica que la impresora tenga papel
- Revisa la configuración de calor de la impresora
- Asegúrate de que sea una impresora compatible con ESC/POS

#### El ticket no se imprime correctamente
- Usa el botón "📄 Navegador" como alternativa
- Configura el tamaño de papel a 80mm en el diálogo de impresión

### El botón de impresión no aparece
- Verifica que la venta se haya completado exitosamente
- Revisa la consola del navegador por errores

### La impresión se ve cortada
- Ajusta los márgenes en la configuración de impresión
- Verifica que el tamaño de papel sea correcto
- Prueba con "Ajustar a la página" desactivado

### El código de barras no se genera
- Verifica la conexión a internet
- Revisa que el código del producto sea válido
- Prueba con otro navegador

### La imagen del logo no aparece
- Verifica la conexión a internet
- Confirma que la URL de Cloudinary sea accesible
- Revisa la consola por errores de CORS

---

## 📞 Soporte

Para problemas o sugerencias, contacta al equipo de desarrollo.

---

**Cuero y Perla** - Belleza y Elegancia en Cada Detalle
Grecia, Alajuela, Costa Rica
