# Ejemplos de Uso - Rutas por Categoría y Persistencia de Estado

## 🎯 Casos de Uso Prácticos

### 1. Navegación por Categoría

#### Antes de esta Implementación
```
Usuario visita: https://sitio.com/catalog
↓
Ve todos los productos mezclados
↓
Filtra por "Anillos" usando el botón
↓
URL sigue siendo: https://sitio.com/catalog ❌
↓
Comparte el enlace con amigo
↓
Amigo ve TODOS los productos (pierde el filtro) 😞
```

#### Después de esta Implementación
```
Usuario visita: https://sitio.com/catalog/anillos
↓
Ve solo anillos automáticamente
↓
URL es: https://sitio.com/catalog/anillos ✅
↓
Comparte el enlace con amigo
↓
Amigo ve directamente anillos (filtro preservado) 😊
```

### 2. Persistencia de Estado al Navegar

#### Flujo Típico del Usuario

```
PASO 1: Usuario en catálogo
┌─────────────────────────────────────────┐
│ /catalog/anillos                        │
│ Búsqueda: "oro"                         │
│ Scroll: 800px (viendo productos 11-20) │
└─────────────────────────────────────────┘

PASO 2: Ve un producto interesante
┌─────────────────────────────────────────┐
│ Hace clic en "Anillo de Oro 18k"       │
└─────────────────────────────────────────┘

PASO 3: Página de detalle del producto
┌─────────────────────────────────────────┐
│ /product/123                            │
│ Ve fotos, precio, descripción           │
│ "No es lo que busco..."                 │
└─────────────────────────────────────────┘

PASO 4: Vuelve al catálogo
┌─────────────────────────────────────────┐
│ Hace clic en "Volver al catálogo"      │
└─────────────────────────────────────────┘

PASO 5: ¡Estado restaurado! ✨
┌─────────────────────────────────────────┐
│ /catalog/anillos                        │
│ Búsqueda: "oro" ← RESTAURADO            │
│ Scroll: 800px ← RESTAURADO              │
│ (viendo productos 11-20 otra vez)       │
└─────────────────────────────────────────┘
```

### 3. Búsqueda Extendida

#### Búsqueda por Nombre
```
Usuario busca: "collar"

Resultados encontrados:
✓ Collar de Plata 925
✓ Collar Perlas Naturales
✓ Collar Cadena Oro 18k
```

#### Búsqueda por Descripción
```
Usuario busca: "boda"

Resultados encontrados (por descripción):
✓ Aretes de Perla - "Perfectos para bodas"
✓ Anillo Solitario - "Ideal para compromiso y bodas"
✓ Collar Elegante - "Para eventos especiales como bodas"
```

#### Búsqueda Combinada
```
Usuario busca: "oro rosa"

Resultados encontrados:
Por nombre:
✓ Anillo Oro Rosa 14k

Por descripción:
✓ Pulsera Delicada - "Enchapado en oro rosa"
✓ Aretes Modernos - "Con detalles en oro rosa"
```

## 🌐 URLs Disponibles

### Rutas de Categoría

```
/catalog/todos          → Todos los productos
/catalog/anillos        → Solo anillos
/catalog/aretes         → Solo aretes
/catalog/collares       → Solo collares
/catalog/pulseras       → Solo pulseras
/catalog/dijes          → Solo dijes
/catalog/pendientes     → Solo pendientes
/catalog/sets           → Solo sets/conjuntos
```

### Ejemplos de URLs Compartibles

#### Marketing en Redes Sociales
```
Instagram Post:
"¡Nueva colección de anillos! 💍
👉 https://cueroysperla.com/catalog/anillos"

Cliente hace clic → Ve directamente anillos ✨
```

#### Email Marketing
```
Asunto: Descuento 20% en Aretes

Enlace en email:
https://cueroysperla.com/catalog/aretes?utm_source=email

Cliente hace clic → Ve solo aretes con descuento ✨
```

#### WhatsApp
```
Vendedor a cliente:
"Mira nuestra colección de collares:
https://cueroysperla.com/catalog/collares"

Cliente abre link → Encuentra fácilmente lo que busca ✨
```

## 💾 Gestión de Estado (sessionStorage)

### Qué se Guarda

```javascript
sessionStorage = {
  "catalog_scroll_position": "850",     // Posición de scroll en píxeles
  "catalog_search_term": "oro 18k",     // Término de búsqueda actual
  "catalog_last_category": "anillos"    // Última categoría visitada
}
```

### Cuándo se Guarda

```
1. Al salir del componente del catálogo
   ↓
2. Al navegar a página de producto
   ↓
3. Estado guardado en sessionStorage
```

### Cuándo se Restaura

```
1. Al volver al catálogo
   ↓
2. Si la categoría coincide con la guardada
   ↓
3. Estado restaurado automáticamente
```

### Cuándo se Limpia

```
CASO 1: Usuario cierra pestaña
→ sessionStorage se limpia automáticamente ✨

CASO 2: Usuario cambia de categoría
→ sessionStorage se limpia (nuevo contexto) ✨

CASO 3: Usuario hace clic en "Limpiar filtros"
→ sessionStorage se limpia explícitamente ✨
```

## 🔍 Comparación Antes/Después

### Experiencia del Usuario

#### ANTES ❌
```
1. Busca "anillo oro" en /catalog
2. Encuentra un anillo interesante (scroll: 500px)
3. Entra a ver detalles
4. Vuelve al catálogo
5. 😞 Perdió su búsqueda
6. 😞 Volvió al inicio (scroll: 0px)
7. 😞 Tiene que buscar de nuevo
8. 😞 Tiene que scrollear de nuevo
```

#### DESPUÉS ✅
```
1. Busca "anillo oro" en /catalog/anillos
2. Encuentra un anillo interesante (scroll: 500px)
3. Entra a ver detalles
4. Vuelve al catálogo
5. 😊 Búsqueda "anillo oro" intacta
6. 😊 Scroll en 500px (donde estaba)
7. 😊 Sigue viendo los mismos productos
8. 😊 Continúa navegando cómodamente
```

## 📱 Comportamiento en Móvil

### Scroll Persistence
```
Usuario en móvil:
1. Scrollea mucho (pequeña pantalla)
2. Ve producto #20
3. Toca el producto
4. Lee detalles
5. Toca "Volver"
6. ✨ Automáticamente vuelve al producto #20
   (No tiene que scrollear de nuevo)
```

### Touch Gestures
```
Gesto de "Atrás":
Usuario → Swipe desde borde izquierdo
Resultado → Vuelve al catálogo con estado preservado ✨

Botón "Atrás" del navegador:
Usuario → Toca botón atrás
Resultado → Vuelve al catálogo con estado preservado ✨
```

## 🎨 Elementos Visuales

### Botones de Categoría

```
┌────────────────────────────────────────────────────┐
│  [Todos]  [Anillos]  [Aretes]  [Collares]  ...    │
│   ◯        ●          ◯          ◯                 │
│  inactivo activo    inactivo   inactivo            │
└────────────────────────────────────────────────────┘

El botón activo muestra:
- Fondo oscuro (bg-primary-900)
- Texto blanco (text-white)
- Peso de fuente medium
```

### Filtros Activos

```
┌────────────────────────────────────────────────────┐
│ Filtros activos:                                   │
│  [Búsqueda: oro ✕]  [Limpiar todo]                │
└────────────────────────────────────────────────────┘

Funcionalidad:
- ✕ → Elimina ese filtro específico
- "Limpiar todo" → Elimina todos los filtros
```

### Contador de Resultados

```
┌────────────────────────────────────────────────────┐
│ Mostrando 12 de 45 productos en anillos           │
└────────────────────────────────────────────────────┘

Información mostrada:
- Productos cargados actualmente (12)
- Total de productos que coinciden (45)
- Categoría actual (anillos)
```

## 🚀 Performance

### Infinite Scroll Optimizado

```
Carga inicial: 20 productos
   ↓
Usuario scrollea
   ↓
200px antes del final → Pre-carga siguiente página
   ↓
Carga automática: +20 productos
   ↓
Usuario no nota la carga (seamless)
```

### Debouncing en Búsqueda

```
Usuario escribe: "a"
→ Espera 300ms

Usuario escribe: "an"
→ Espera 300ms

Usuario escribe: "ani"
→ Espera 300ms

Usuario escribe: "anil"
→ Espera 300ms

Usuario deja de escribir (300ms pasados)
→ ¡AHORA sí busca "anil" en el servidor! ✨

Beneficio: Solo 1 request en lugar de 4
```

## 🎯 Mejores Prácticas

### Para Usuarios

1. **Compartir Enlaces**
   ```
   ✅ Correcto: Copiar URL completa
   /catalog/anillos → Amigo ve anillos

   ❌ Incorrecto: "Ve al catálogo y busca anillos"
   Más pasos, menos eficiente
   ```

2. **Buscar Productos**
   ```
   ✅ Eficiente:
   1. Seleccionar categoría (anillos)
   2. Buscar término específico (oro)
   3. Resultado: Solo anillos de oro

   ❌ Ineficiente:
   1. Ver todos los productos
   2. Scrollear manualmente
   3. Buscar visualmente
   ```

3. **Navegar de Vuelta**
   ```
   ✅ Usar: "Volver al catálogo" del breadcrumb
   → Preserva todo el estado

   ✅ Usar: Botón atrás del navegador
   → También preserva el estado

   ⚠️  Evitar: Hacer clic en logo/home y volver
   → Pierde el estado
   ```

## 📊 Casos de Uso Reales

### Caso 1: Cliente Indeciso
```
María busca un anillo para su compromiso:

1. Va a /catalog/anillos
2. Busca "oro blanco"
3. Ve 15 opciones, le gustan 3
4. Entra a ver el primero → No convence
5. VUELVE → Aún en /catalog/anillos con "oro blanco"
6. Entra a ver el segundo → Le gusta más
7. VUELVE → Aún en misma posición
8. Entra a ver el tercero → ¡Perfecto!

Sin persistencia: María tendría que buscar "oro blanco"
y scrollear cada vez = 😞

Con persistencia: María navega cómodamente = 😊
```

### Caso 2: Vendedor Asesorando
```
Juan asesora a cliente por WhatsApp:

Cliente: "Quiero ver collares de perla"
Juan: "Claro, mira este link: /catalog/collares"
Cliente: *Entra y ve SOLO collares*
Cliente: "Este me gusta" *envía foto*
Juan: "Perfecto, es el modelo CP-123"
Cliente: *Entra a detalles, vuelve al catálogo*
Cliente: *Sigue viendo más collares sin problema*

Resultado: Venta exitosa ✨
```

### Caso 3: Campaña de Marketing
```
Campaña: "20% OFF en Aretes"

1. Crea anuncio con link: /catalog/aretes
2. Publica en redes sociales
3. Clientes hacen clic
4. Ven SOLO aretes (lo que les interesa)
5. Mayor tasa de conversión 📈

Resultado: ROI mejorado ✨
```

## ✨ Conclusión

Esta implementación transforma la experiencia del catálogo de:

**Antes**: Navegación básica con filtros temporales ❌
**Después**: Sistema inteligente que "recuerda" el contexto del usuario ✅

Beneficios medibles:
- 📈 Menor bounce rate
- 🔗 Más enlaces compartidos
- 🎯 Mejor SEO
- 😊 Usuarios más felices
- 💰 Mayor conversión

**¡Todo funciona automáticamente!** El usuario no tiene que hacer nada especial. 🎉
