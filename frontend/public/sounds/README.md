# Sonido de notificación

Se espera un archivo de sonido en la ruta:
`frontend/public/sounds/notification.mp3`

## Objetivo

Este recurso aporta una alerta auditiva para eventos del POS y mejora la confirmación de acciones en el flujo operativo.

## Cómo obtener el archivo

### Opción 1: Usar efectos de sonido libres
- https://freesound.org/
- https://www.zapsplat.com/
- Buscar términos como "notification" o "alert"
- Descargar en formato MP3

### Opción 2: Generar un sonido
- Utilizar un generador de tonos en línea
- Crear un beep o campanilla simple
- Exportar en MP3

## Especificaciones recomendadas

- Duración: 0,5 a 2 segundos
- Formato: MP3
- Volumen: moderado (la aplicación lo reproduce al 50%)
- Tipo: sonido claro y agradable, sin resultar invasivo

## Comportamiento si falta el archivo

- La notificación funcional se mantiene
- La aplicación registra un error en consola
- No se reproduce alerta de audio
- La notificación visual continúa activa

## Referencia de estilo sonoro

Se recomiendan sonidos:
- breves (menos de 2 segundos)
- agradables y no molestos
- nítidos y fáciles de identificar
- apropiados para uso profesional

Opciones habituales:
- beep simple
- campanilla
- timbre breve
- tono sutil
