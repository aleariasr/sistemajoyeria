const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'joyeria.db');

async function clearDatabase() {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error al abrir la base de datos:', err.message);
      process.exit(1);
    }
  });

  db.serialize(() => {
    console.log('Iniciando limpieza de datos de ejemplo...');

    db.run('BEGIN TRANSACTION;');

    // Borramos primero movimientos (porque referencia joyas)
    db.run('DELETE FROM movimientos_inventario;', function(err) {
      if (err) {
        console.error('Error al borrar movimientos_inventario:', err.message);
      } else {
        console.log(`movimientos_inventario borrados.`);
      }
    });

    // Luego borramos las joyas
    db.run('DELETE FROM joyas;', function(err) {
      if (err) {
        console.error('Error al borrar joyas:', err.message);
      } else {
        console.log(`joyas borradas.`);
      }
    });

    db.run('COMMIT;', function(err) {
      if (err) {
        console.error('Error al hacer commit:', err.message);
      } else {
        // Compactamos el fichero
        db.run('VACUUM;', function(err) {
          if (err) {
            console.error('Error al ejecutar VACUUM:', err.message);
          } else {
            console.log('VACUUM completado. Base de datos compactada.');
          }
          db.close();
        });
      }
    });
  });
}

clearDatabase().catch((err) => {
  console.error('Error inesperado:', err);
  process.exit(1);
});