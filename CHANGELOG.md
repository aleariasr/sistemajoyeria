# Changelog

## [1.0.0] - 2025-11-17 - Versión de Producción

### 🎯 Cambios Principales
- Sistema listo para producción sin datos de prueba automáticos
- Base de datos limpia al iniciar por defecto
- Mejoras significativas en validación y seguridad
- Build de frontend optimizado y sin advertencias

### ✨ Agregado
- Script `load-sample-data.js` para cargar datos de ejemplo opcionalmente
- Utilidades de validación en `backend/utils/validaciones.js`
- Endpoint `/health` para monitoreo del servidor
- Endpoint raíz `/` con información de la API
- Archivos `.env.example` para configuración de backend y frontend
- Interceptor de errores en el servicio API del frontend
- Logging de peticiones en modo desarrollo
- Manejo de cierre graceful del servidor (SIGTERM)
- Sección de despliegue en producción en README
- Sección de gestión de base de datos en README
- Mejores mensajes de error y validación
- CHANGELOG.md para documentar cambios

### 🔧 Mejorado
- Validación de entrada de datos más robusta con funciones especializadas
- Manejo de errores en servidor con diferenciación por ambiente
- Validación de códigos con formato específico (letras, números, guiones)
- Validación de monedas, estados y tipos de movimiento
- Mensajes de error más descriptivos en validaciones
- Documentación más clara sobre uso en producción vs desarrollo
- Límites de tamaño para peticiones JSON (10mb)
- React Hooks con useCallback para evitar advertencias de ESLint
- Frontend compila sin errores ni advertencias

### 🗑️ Eliminado
- Script `clear-db.js` que no funcionaba correctamente
- Comando `npm run clear-db` de package.json
- Carga automática de datos de prueba al iniciar el servidor

### 🔒 Seguridad
- Sin vulnerabilidades detectadas por CodeQL
- Validación de entrada mejorada en todos los endpoints
- Sanitización de strings de entrada
- Validación de tipos de datos numéricos y enteros

### 📝 Documentación
- Guía completa de gestión de base de datos
- Instrucciones de despliegue en producción
- Solución de problemas ampliada
- Ejemplos de configuración con variables de entorno
- Mejores descripciones de características del sistema

### 🧪 Testing
- Verificado funcionamiento con base de datos limpia
- Probado script de carga de datos de ejemplo
- Validado prevención de carga duplicada de datos
- Testeados endpoints principales de la API
- Verificada validación de entrada de datos
- Frontend build exitoso sin advertencias

## [0.1.0] - 2025-11-13 - Versión Inicial

### Agregado
- Sistema completo de gestión de inventario de joyería
- CRUD completo para joyas
- Gestión de movimientos de inventario
- Sistema de reportes
- Interfaz React moderna y responsive
- API REST con Express y SQLite
- Búsqueda y filtros avanzados
- Alertas de stock bajo
- Exportación de reportes a CSV
