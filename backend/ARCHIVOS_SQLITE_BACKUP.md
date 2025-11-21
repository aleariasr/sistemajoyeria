# Archivos SQLite Movidos a Backup

## Archivos Renombrados

Los siguientes archivos del antiguo sistema SQLite han sido renombrados como backup:

1. `database.js` → `database.js.sqlite-backup`
2. `database-dia.js` → `database-dia.js.sqlite-backup`

## Razón del Cambio

Estos archivos contenían la configuración de conexión a SQLite y se ejecutaban automáticamente al ser importados, mostrando el mensaje "Conectado a la base de datos SQLite" incluso después de migrar a Supabase.

## Nuevos Archivos de Base de Datos

El sistema ahora usa:
- `supabase-db.js` - Conexión a Supabase (PostgreSQL)

## Archivos Actualizados

Los siguientes archivos fueron actualizados para usar Supabase:

### Rutas
- `routes/cierrecaja.js` - Actualizado de `db.run()` a consultas Supabase
- `routes/reportes.js` - Removida importación de SQLite (no se usaba)

### Scripts
- `load-sample-data.js` - Actualizado para mostrar mensaje informativo (ya no funcional con Supabase)

## Si Necesitas los Archivos Antiguos

Los archivos de backup (`.sqlite-backup`) se mantienen por si necesitas consultarlos. Para restaurarlos:

```bash
mv database.js.sqlite-backup database.js
mv database-dia.js.sqlite-backup database-dia.js
```

**Nota:** No restaures estos archivos a menos que sepas lo que estás haciendo, ya que el sistema está completamente migrado a Supabase.

## Eliminación Permanente

Si deseas eliminar los backups permanentemente:

```bash
rm backend/database.js.sqlite-backup
rm backend/database-dia.js.sqlite-backup
```

Los archivos `.sqlite-backup` están incluidos en `.gitignore` y no se subirán al repositorio.
