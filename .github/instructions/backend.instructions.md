---
applyTo: "backend/**/*.js"
---

# Backend JavaScript Guidelines

Al escribir código backend en Node.js/Express, sigue estas convenciones:

## Estructura de Código

1. **Rutas API**: Organizar por recurso en `routes/`
2. **Modelos**: Lógica de datos en `models/`
3. **Middleware**: Autenticación y validación en `middleware/`
4. **Utilidades**: Funciones helper en `utils/`

## Convenciones

1. **Manejo de errores**: Usar try/catch con respuestas JSON consistentes
   ```javascript
   try {
     // código
     res.json({ success: true, data: result });
   } catch (error) {
     console.error('Error:', error);
     res.status(500).json({ success: false, message: error.message });
   }
   ```

2. **Validación de entrada**: Validar datos antes de procesar

3. **Autenticación**: Usar middleware `requireAuth` para rutas protegidas

4. **Async/await**: Preferir sobre callbacks y promises encadenadas

5. **Logging**: El proyecto usa console.log/error con emojis descriptivos. Para producción, considerar Winston o Pino para logging estructurado

## Testing

- Tests en `backend/tests/`
- Ejecutar con: `npm run test:backend`

## Base de Datos

- Cliente Supabase en `supabase-db.js`
- Migraciones en `migrations/`
