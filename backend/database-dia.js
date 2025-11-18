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
          fecha_venta DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error al crear tabla ventas_dia:', err.message);
          reject(err);
        } else {
          console.log('Tabla ventas_dia creada o ya existe.');
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
