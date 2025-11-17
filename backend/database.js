const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'joyeria.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite.');
  }
});

// Función para inicializar las tablas
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Tabla de Joyas
      db.run(`
        CREATE TABLE IF NOT EXISTS joyas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          codigo TEXT UNIQUE NOT NULL,
          nombre TEXT NOT NULL,
          descripcion TEXT,
          categoria TEXT,
          tipo_metal TEXT,
          color_metal TEXT,
          piedras TEXT,
          peso_gramos REAL,
          talla TEXT,
          coleccion TEXT,
          proveedor TEXT,
          costo REAL NOT NULL,
          precio_venta REAL NOT NULL,
          moneda TEXT DEFAULT 'CRC',
          stock_actual INTEGER NOT NULL DEFAULT 0,
          stock_minimo INTEGER DEFAULT 5,
          ubicacion TEXT,
          estado TEXT DEFAULT 'Activo',
          fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
          fecha_ultima_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error al crear tabla joyas:', err.message);
          reject(err);
        } else {
          console.log('Tabla joyas creada o ya existe.');
        }
      });

      // Tabla de Movimientos de Inventario
      db.run(`
        CREATE TABLE IF NOT EXISTS movimientos_inventario (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          id_joya INTEGER NOT NULL,
          tipo_movimiento TEXT NOT NULL,
          cantidad INTEGER NOT NULL,
          motivo TEXT,
          fecha_movimiento DATETIME DEFAULT CURRENT_TIMESTAMP,
          usuario TEXT,
          stock_antes INTEGER NOT NULL,
          stock_despues INTEGER NOT NULL,
          FOREIGN KEY (id_joya) REFERENCES joyas(id)
        )
      `, (err) => {
        if (err) {
          console.error('Error al crear tabla movimientos_inventario:', err.message);
          reject(err);
        } else {
          console.log('Tabla movimientos_inventario creada o ya existe.');

          // Tabla de Usuarios
          db.run(`
            CREATE TABLE IF NOT EXISTS usuarios (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT UNIQUE NOT NULL,
              password_hash TEXT NOT NULL,
              role TEXT NOT NULL DEFAULT 'dependiente',
              full_name TEXT NOT NULL,
              fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) {
              console.error('Error al crear tabla usuarios:', err.message);
              reject(err);
            } else {
              console.log('Tabla usuarios creada o ya existe.');

              // Tabla de Ventas
              db.run(`
                CREATE TABLE IF NOT EXISTS ventas (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  id_usuario INTEGER NOT NULL,
                  metodo_pago TEXT NOT NULL,
                  subtotal REAL NOT NULL DEFAULT 0,
                  descuento REAL DEFAULT 0,
                  total REAL NOT NULL,
                  efectivo_recibido REAL,
                  cambio REAL,
                  notas TEXT,
                  fecha_venta DATETIME DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
                )
              `, (err) => {
                if (err) {
                  console.error('Error al crear tabla ventas:', err.message);
                  reject(err);
                } else {
                  console.log('Tabla ventas creada o ya existe.');

                  // Tabla de Items de Venta
                  db.run(`
                    CREATE TABLE IF NOT EXISTS items_venta (
                      id INTEGER PRIMARY KEY AUTOINCREMENT,
                      id_venta INTEGER NOT NULL,
                      id_joya INTEGER NOT NULL,
                      cantidad INTEGER NOT NULL,
                      precio_unitario REAL NOT NULL,
                      subtotal REAL NOT NULL,
                      FOREIGN KEY (id_venta) REFERENCES ventas(id),
                      FOREIGN KEY (id_joya) REFERENCES joyas(id)
                    )
                  `, (err) => {
                    if (err) {
                      console.error('Error al crear tabla items_venta:', err.message);
                      reject(err);
                    } else {
                      console.log('Tabla items_venta creada o ya existe.');

                      // Seed automático o no
                      if (process.env.SEED === 'true') {
                        const { insertarJoyasEjemplo } = require('./seed');
                        insertarJoyasEjemplo()
                          .then(() => {
                            // Crear usuarios iniciales después del seed
                            const { crearUsuariosIniciales } = require('./init-users');
                            return crearUsuariosIniciales();
                          })
                          .then(() => resolve())
                          .catch((err) => reject(err));
                      } else {
                        // Crear usuarios iniciales aunque no haya seed de joyas
                        const { crearUsuariosIniciales } = require('./init-users');
                        crearUsuariosIniciales()
                          .then(() => resolve())
                          .catch((err) => reject(err));
                      }
                    }
                  });
                }
              });
            }
          });
        }
      });
    });
  });
};

module.exports = { db, initDatabase };