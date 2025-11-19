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
      // Tabla de Usuarios
      db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL,
          full_name TEXT NOT NULL,
          fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error al crear tabla usuarios:', err.message);
          reject(err);
        } else {
          console.log('Tabla usuarios creada o ya existe.');
        }
      });

      // Tabla de Joyas
      db.run(`
        CREATE TABLE IF NOT EXISTS joyas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          codigo TEXT UNIQUE NOT NULL,
          nombre TEXT NOT NULL,
          descripcion TEXT,
          categoria TEXT,
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
          
          // Migrar tabla existente si tiene columnas antiguas
          db.all("PRAGMA table_info(joyas)", [], (err, columns) => {
            if (err) {
              console.error('Error al verificar columnas:', err.message);
              return;
            }
            
            const columnNames = columns.map(col => col.name);
            const hasOldColumns = columnNames.includes('tipo_metal') || 
                                  columnNames.includes('color_metal') || 
                                  columnNames.includes('piedras') ||
                                  columnNames.includes('peso_gramos') ||
                                  columnNames.includes('talla') ||
                                  columnNames.includes('coleccion');
            
            if (hasOldColumns) {
              console.log('Detectadas columnas antiguas. Ejecutando migración...');
              
              // Crear tabla temporal con nueva estructura
              db.run(`
                CREATE TABLE joyas_new (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  codigo TEXT UNIQUE NOT NULL,
                  nombre TEXT NOT NULL,
                  descripcion TEXT,
                  categoria TEXT,
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
                  console.error('Error al crear tabla temporal:', err.message);
                  return;
                }
                
                // Copiar datos de la tabla antigua a la nueva
                db.run(`
                  INSERT INTO joyas_new (
                    id, codigo, nombre, descripcion, categoria, proveedor,
                    costo, precio_venta, moneda, stock_actual, stock_minimo,
                    ubicacion, estado, fecha_creacion, fecha_ultima_modificacion
                  )
                  SELECT 
                    id, codigo, nombre, descripcion, categoria, proveedor,
                    costo, precio_venta, moneda, stock_actual, stock_minimo,
                    ubicacion, estado, fecha_creacion, fecha_ultima_modificacion
                  FROM joyas
                `, (err) => {
                  if (err) {
                    console.error('Error al copiar datos:', err.message);
                    return;
                  }
                  
                  // Eliminar tabla antigua
                  db.run('DROP TABLE joyas', (err) => {
                    if (err) {
                      console.error('Error al eliminar tabla antigua:', err.message);
                      return;
                    }
                    
                    // Renombrar tabla nueva
                    db.run('ALTER TABLE joyas_new RENAME TO joyas', (err) => {
                      if (err) {
                        console.error('Error al renombrar tabla:', err.message);
                      } else {
                        console.log('✅ Migración completada: columnas de características eliminadas.');
                      }
                    });
                  });
                });
              });
            }
          });
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
        }
      });

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
          tipo_venta TEXT DEFAULT 'Contado',
          id_cliente INTEGER,
          fecha_venta DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (id_usuario) REFERENCES usuarios(id),
          FOREIGN KEY (id_cliente) REFERENCES clientes(id)
        )
      `, (err) => {
        if (err) {
          console.error('Error al crear tabla ventas:', err.message);
          reject(err);
        } else {
          console.log('Tabla ventas creada o ya existe.');
          
          // Migrar tabla ventas existente si no tiene las columnas nuevas
          db.all("PRAGMA table_info(ventas)", [], (err, columns) => {
            if (err) {
              console.error('Error al verificar columnas de ventas:', err.message);
              return;
            }
            
            const columnNames = columns.map(col => col.name);
            const needsMigration = !columnNames.includes('tipo_venta') || !columnNames.includes('id_cliente') ||
                                   !columnNames.includes('monto_efectivo') || !columnNames.includes('monto_tarjeta') || 
                                   !columnNames.includes('monto_transferencia');
            
            if (needsMigration) {
              console.log('Migrando tabla ventas...');
              
              if (!columnNames.includes('tipo_venta')) {
                db.run(`ALTER TABLE ventas ADD COLUMN tipo_venta TEXT DEFAULT 'Contado'`, (err) => {
                  if (err) {
                    console.error('Error al agregar columna tipo_venta:', err.message);
                  } else {
                    console.log('✅ Columna tipo_venta agregada.');
                  }
                });
              }
              
              if (!columnNames.includes('id_cliente')) {
                db.run(`ALTER TABLE ventas ADD COLUMN id_cliente INTEGER`, (err) => {
                  if (err) {
                    console.error('Error al agregar columna id_cliente:', err.message);
                  } else {
                    console.log('✅ Columna id_cliente agregada.');
                  }
                });
              }
              
              // Agregar columnas para pagos mixtos
              if (!columnNames.includes('monto_efectivo')) {
                db.run(`ALTER TABLE ventas ADD COLUMN monto_efectivo REAL DEFAULT 0`, (err) => {
                  if (err) {
                    console.error('Error al agregar columna monto_efectivo:', err.message);
                  } else {
                    console.log('✅ Columna monto_efectivo agregada para pagos mixtos.');
                  }
                });
              }
              
              if (!columnNames.includes('monto_tarjeta')) {
                db.run(`ALTER TABLE ventas ADD COLUMN monto_tarjeta REAL DEFAULT 0`, (err) => {
                  if (err) {
                    console.error('Error al agregar columna monto_tarjeta:', err.message);
                  } else {
                    console.log('✅ Columna monto_tarjeta agregada para pagos mixtos.');
                  }
                });
              }
              
              if (!columnNames.includes('monto_transferencia')) {
                db.run(`ALTER TABLE ventas ADD COLUMN monto_transferencia REAL DEFAULT 0`, (err) => {
                  if (err) {
                    console.error('Error al agregar columna monto_transferencia:', err.message);
                  } else {
                    console.log('✅ Columna monto_transferencia agregada para pagos mixtos.');
                  }
                });
              }
            }
          });
        }
      });

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
        }
      });

      // Tabla de Clientes
      db.run(`
        CREATE TABLE IF NOT EXISTS clientes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL,
          telefono TEXT NOT NULL,
          cedula TEXT UNIQUE NOT NULL,
          direccion TEXT,
          email TEXT,
          notas TEXT,
          fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
          fecha_ultima_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error al crear tabla clientes:', err.message);
          reject(err);
        } else {
          console.log('Tabla clientes creada o ya existe.');
        }
      });

      // Tabla de Cuentas por Cobrar
      db.run(`
        CREATE TABLE IF NOT EXISTS cuentas_por_cobrar (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          id_venta INTEGER NOT NULL,
          id_cliente INTEGER NOT NULL,
          monto_total REAL NOT NULL,
          monto_pagado REAL DEFAULT 0,
          saldo_pendiente REAL NOT NULL,
          estado TEXT DEFAULT 'Pendiente',
          fecha_vencimiento DATE,
          fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
          fecha_ultima_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (id_venta) REFERENCES ventas(id),
          FOREIGN KEY (id_cliente) REFERENCES clientes(id)
        )
      `, (err) => {
        if (err) {
          console.error('Error al crear tabla cuentas_por_cobrar:', err.message);
          reject(err);
        } else {
          console.log('Tabla cuentas_por_cobrar creada o ya existe.');
        }
      });

      // Tabla de Abonos
      db.run(`
        CREATE TABLE IF NOT EXISTS abonos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          id_cuenta_por_cobrar INTEGER NOT NULL,
          monto REAL NOT NULL,
          metodo_pago TEXT NOT NULL,
          notas TEXT,
          fecha_abono DATETIME DEFAULT CURRENT_TIMESTAMP,
          usuario TEXT,
          FOREIGN KEY (id_cuenta_por_cobrar) REFERENCES cuentas_por_cobrar(id)
        )
      `, (err) => {
        if (err) {
          console.error('Error al crear tabla abonos:', err.message);
          reject(err);
        } else {
          console.log('Tabla abonos creada o ya existe.');
          console.log('Base de datos lista. Comienza con una base limpia (sin datos de prueba).');
          console.log('Nota: Para cargar datos de ejemplo, ejecuta: SEED=true npm start');
          resolve();
        }
      });
    });
  });
};

module.exports = { db, initDatabase };