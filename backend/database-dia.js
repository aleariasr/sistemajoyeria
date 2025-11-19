const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbDiaPath = path.join(__dirname, 'ventas_dia.db');

const dbDia = new sqlite3.Database(dbDiaPath, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos del día:', err.message);
  } else {
    console.log('Conectado a la base de datos de ventas del día.');
  }
});

// Función para inicializar las tablas del día
const initDatabaseDia = () => {
  return new Promise((resolve, reject) => {
    dbDia.serialize(() => {
      // Tabla de Ventas del día
      dbDia.run(`
        CREATE TABLE IF NOT EXISTS ventas_dia (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          id_usuario INTEGER NOT NULL,
          metodo_pago TEXT NOT NULL,
          subtotal REAL NOT NULL DEFAULT 0,
          descuento REAL DEFAULT 0,
          total REAL NOT NULL,
          efectivo_recibido REAL,
          cambio REAL,
          notas TEXT,
          tipo_venta TEXT DEFAULT 'Contado',
          id_cliente INTEGER,
          fecha_venta DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error al crear tabla ventas_dia:', err.message);
          reject(err);
        } else {
          console.log('Tabla ventas_dia creada o ya existe.');
          
          // Migrar tabla ventas_dia existente si no tiene las columnas nuevas
          dbDia.all("PRAGMA table_info(ventas_dia)", [], (err, columns) => {
            if (err) {
              console.error('Error al verificar columnas de ventas_dia:', err.message);
              return;
            }
            
            const columnNames = columns.map(col => col.name);
            const needsMigration = !columnNames.includes('tipo_venta') || !columnNames.includes('id_cliente') ||
                                   !columnNames.includes('monto_efectivo') || !columnNames.includes('monto_tarjeta') || 
                                   !columnNames.includes('monto_transferencia');
            
            if (needsMigration) {
              console.log('Migrando tabla ventas_dia...');
              
              if (!columnNames.includes('tipo_venta')) {
                dbDia.run(`ALTER TABLE ventas_dia ADD COLUMN tipo_venta TEXT DEFAULT 'Contado'`, (err) => {
                  if (err) {
                    console.error('Error al agregar columna tipo_venta a ventas_dia:', err.message);
                  } else {
                    console.log('✅ Columna tipo_venta agregada a ventas_dia.');
                  }
                });
              }
              
              if (!columnNames.includes('id_cliente')) {
                dbDia.run(`ALTER TABLE ventas_dia ADD COLUMN id_cliente INTEGER`, (err) => {
                  if (err) {
                    console.error('Error al agregar columna id_cliente a ventas_dia:', err.message);
                  } else {
                    console.log('✅ Columna id_cliente agregada a ventas_dia.');
                  }
                });
              }
              
              // Agregar columnas para pagos mixtos
              if (!columnNames.includes('monto_efectivo')) {
                dbDia.run(`ALTER TABLE ventas_dia ADD COLUMN monto_efectivo REAL DEFAULT 0`, (err) => {
                  if (err) {
                    console.error('Error al agregar columna monto_efectivo a ventas_dia:', err.message);
                  } else {
                    console.log('✅ Columna monto_efectivo agregada a ventas_dia para pagos mixtos.');
                  }
                });
              }
              
              if (!columnNames.includes('monto_tarjeta')) {
                dbDia.run(`ALTER TABLE ventas_dia ADD COLUMN monto_tarjeta REAL DEFAULT 0`, (err) => {
                  if (err) {
                    console.error('Error al agregar columna monto_tarjeta a ventas_dia:', err.message);
                  } else {
                    console.log('✅ Columna monto_tarjeta agregada a ventas_dia para pagos mixtos.');
                  }
                });
              }
              
              if (!columnNames.includes('monto_transferencia')) {
                dbDia.run(`ALTER TABLE ventas_dia ADD COLUMN monto_transferencia REAL DEFAULT 0`, (err) => {
                  if (err) {
                    console.error('Error al agregar columna monto_transferencia a ventas_dia:', err.message);
                  } else {
                    console.log('✅ Columna monto_transferencia agregada a ventas_dia para pagos mixtos.');
                  }
                });
              }
            }
          });
        }
      });

      // Tabla de Items de Venta del día
      dbDia.run(`
        CREATE TABLE IF NOT EXISTS items_venta_dia (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          id_venta_dia INTEGER NOT NULL,
          id_joya INTEGER NOT NULL,
          cantidad INTEGER NOT NULL,
          precio_unitario REAL NOT NULL,
          subtotal REAL NOT NULL,
          FOREIGN KEY (id_venta_dia) REFERENCES ventas_dia(id)
        )
      `, (err) => {
        if (err) {
          console.error('Error al crear tabla items_venta_dia:', err.message);
          reject(err);
        } else {
          console.log('Tabla items_venta_dia creada o ya existe.');
          console.log('Base de datos de ventas del día lista.');
          resolve();
        }
      });
    });
  });
};

module.exports = { dbDia, initDatabaseDia };
