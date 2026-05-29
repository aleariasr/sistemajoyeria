# Security Policy

## Reporte de vulnerabilidades

Si identifica una vulnerabilidad que afecte ejecución en producción, repórtela de forma privada mediante:

1. Security Advisory en GitHub
2. Contacto directo con mantenedores del repositorio

Incluya pasos de reproducción, impacto y propuesta de mitigación.

## Prácticas de seguridad del proyecto

- Variables sensibles fuera del repositorio (`.env` no versionado)
- Validación de variables de entorno al iniciar backend
- Control de acceso por sesión/roles en la API
- Consultas a base de datos parametrizadas
- CORS restringido por `FRONTEND_URL` en producción

## Recomendaciones de operación

- Usar HTTPS en todos los entornos públicos
- Rotar credenciales periódicamente
- Mantener dependencias de producción actualizadas
- Revisar regularmente alertas de seguridad del repositorio
