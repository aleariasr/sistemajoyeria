const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../database/joyeria.db');

class Database {
  constructor() {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error al conectar con la base de datos:', err);
      } else {
        console.log('Conectado a la base de datos SQLite');
        this.initTables();
      }
    });
  }

  initTables() {
    this.db.serialize(() => {
      // Tabla de categorías
      this.db.run(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabla de metales
      this.db.run(`
        CREATE TABLE IF NOT EXISTS metals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          purity TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabla de piedras
      this.db.run(`
        CREATE TABLE IF NOT EXISTS stones (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          type TEXT,
          carat REAL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabla principal de joyas
      this.db.run(`
        CREATE TABLE IF NOT EXISTS jewelry (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          description TEXT,
          category_id INTEGER,
          metal_id INTEGER,
          size TEXT,
          sale_price REAL NOT NULL,
          cost REAL NOT NULL,
          current_stock INTEGER DEFAULT 0,
          minimum_stock INTEGER DEFAULT 0,
          location TEXT,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id),
          FOREIGN KEY (metal_id) REFERENCES metals(id)
        )
      `);

      // Tabla relación joyas-piedras (muchos a muchos)
      this.db.run(`
        CREATE TABLE IF NOT EXISTS jewelry_stones (
          jewelry_id INTEGER,
          stone_id INTEGER,
          quantity INTEGER DEFAULT 1,
          PRIMARY KEY (jewelry_id, stone_id),
          FOREIGN KEY (jewelry_id) REFERENCES jewelry(id) ON DELETE CASCADE,
          FOREIGN KEY (stone_id) REFERENCES stones(id)
        )
      `);

      // Tabla de movimientos de inventario
      this.db.run(`
        CREATE TABLE IF NOT EXISTS inventory_movements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          jewelry_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          previous_stock INTEGER,
          new_stock INTEGER,
          reason TEXT,
          created_by TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (jewelry_id) REFERENCES jewelry(id)
        )
      `);

      // Insertar datos iniciales
      this.insertInitialData();
    });
  }

  insertInitialData() {
    // Categorías iniciales
    const categories = [
      ['Anillos', 'Anillos de diversos estilos'],
      ['Collares', 'Collares y cadenas'],
      ['Pulseras', 'Pulseras y brazaletes'],
      ['Aretes', 'Aretes y pendientes'],
      ['Relojes', 'Relojes de joyería']
    ];

    const insertCategory = this.db.prepare('INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)');
    categories.forEach(cat => insertCategory.run(cat));
    insertCategory.finalize();

    // Metales iniciales
    const metals = [
      ['Oro 18K', '75% pureza'],
      ['Oro 14K', '58.5% pureza'],
      ['Plata 925', 'Sterling Silver'],
      ['Platino', '95% pureza'],
      ['Oro Blanco', 'Oro con aleación']
    ];

    const insertMetal = this.db.prepare('INSERT OR IGNORE INTO metals (name, purity) VALUES (?, ?)');
    metals.forEach(metal => insertMetal.run(metal));
    insertMetal.finalize();

    // Piedras iniciales
    const stones = [
      ['Diamante', 'Precious', 0.5],
      ['Esmeralda', 'Precious', 1.0],
      ['Rubí', 'Precious', 0.75],
      ['Zafiro', 'Precious', 1.0],
      ['Topacio', 'Semi-precious', 2.0]
    ];

    const insertStone = this.db.prepare('INSERT OR IGNORE INTO stones (name, type, carat) VALUES (?, ?, ?)');
    stones.forEach(stone => insertStone.run(stone));
    insertStone.finalize();
  }

  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
}

module.exports = new Database();
