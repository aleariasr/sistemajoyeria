# Migración: Campos Opcionales de Cliente

## Descripción
Esta migración actualiza la tabla `clientes` para hacer que solo el campo `nombre` sea obligatorio, mientras que `telefono` y `cedula` son ahora opcionales.

## Cambios Realizados

### Base de Datos
- ✅ **Columna `telefono`**: Ahora permite NULL
- ✅ **Columna `cedula`**: Ahora permite NULL
- ✅ **Restricción UNIQUE**: Eliminada de la columna `cedula`

### Backend
- ✅ **Validación POST `/api/clientes`**: Solo requiere `nombre`
- ✅ **Validación PUT `/api/clientes/:id`**: Solo requiere `nombre`
- ✅ **Modelo `Cliente.crear()`**: Maneja valores NULL para telefono y cedula
- ✅ **Modelo `Cliente.actualizar()`**: Maneja valores NULL para telefono y cedula
- ✅ **Validación de cédula duplicada**: Solo se ejecuta si se proporciona una cédula

### Frontend
- ✅ **Formulario de cliente**: Solo marca `nombre` como obligatorio (*)
- ✅ **Validación del formulario**: Solo requiere `nombre`
- ✅ **Validación de teléfono**: Solo se ejecuta si se proporciona
- ✅ **Etiquetas de campos**: Removido asterisco (*) de `cedula` y `telefono`

## Instrucciones de Migración

### Para bases de datos existentes:

1. Ejecutar el archivo de migración en Supabase:
   ```sql
   -- Ubicación: backend/migrations/make-cliente-fields-optional.sql
   ```

2. En el SQL Editor de Supabase (https://[tu-proyecto].supabase.co/project/_/sql):
   - Copiar y pegar el contenido del archivo de migración
   - Ejecutar el script
   - Verificar que aparezcan los mensajes de éxito

### Para nuevas instalaciones:

El archivo `backend/supabase-migration.sql` ya incluye la estructura actualizada con campos opcionales.

## Validación de la Migración

### Verificar en Base de Datos:
```sql
-- Verificar estructura de la tabla
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'clientes'
ORDER BY ordinal_position;
```

Resultado esperado:
- `nombre`: `is_nullable = 'NO'`
- `telefono`: `is_nullable = 'YES'`
- `cedula`: `is_nullable = 'YES'`

### Verificar restricciones:
```sql
-- Verificar que no exista restricción UNIQUE en cedula
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'clientes';
```

No debe aparecer `clientes_cedula_key` en los resultados.

## Tests

Se incluye un archivo de tests automatizado:
```bash
# Ubicación: backend/tests/test-cliente-optional-fields.js

# Ejecutar tests (requiere backend corriendo):
cd backend
node tests/test-cliente-optional-fields.js
```

Los tests validan:
1. ✅ Crear cliente solo con nombre
2. ✅ Crear cliente sin nombre (debe fallar)
3. ✅ Crear cliente con nombre y teléfono
4. ✅ Crear cliente con nombre y cédula
5. ✅ Actualizar cliente eliminando teléfono y cédula
6. ✅ Validación de cédulas duplicadas (a nivel backend)

## Impacto en Datos Existentes

⚠️ **IMPORTANTE**: Esta migración NO modifica los datos existentes. Todos los clientes actuales mantienen sus valores de `telefono` y `cedula`.

- Los registros existentes con datos completos permanecen intactos
- Los nuevos registros pueden omitir `telefono` y `cedula`
- Los registros existentes pueden ser actualizados para remover `telefono` y `cedula` si es necesario

## Compatibilidad

### Backend
- ✅ Compatible con Node.js 20+
- ✅ Compatible con Supabase PostgreSQL

### Frontend
- ✅ Compatible con React 18+
- ✅ No requiere cambios en otras partes del sistema

## Revertir la Migración (Rollback)

Si necesitas revertir estos cambios:

```sql
-- ADVERTENCIA: Esto fallará si existen registros con telefono o cedula NULL
ALTER TABLE clientes 
  ALTER COLUMN telefono SET NOT NULL;

ALTER TABLE clientes 
  ALTER COLUMN cedula SET NOT NULL;

ALTER TABLE clientes 
  ADD CONSTRAINT clientes_cedula_key UNIQUE (cedula);
```

**Nota**: Antes de revertir, debes asegurarte de que todos los registros tengan valores en `telefono` y `cedula`.

## Soporte

Si encuentras problemas con la migración:
1. Verificar que el archivo SQL se ejecutó completamente
2. Revisar los logs de Supabase para errores
3. Ejecutar las consultas de validación mencionadas arriba
4. Ejecutar los tests automatizados
