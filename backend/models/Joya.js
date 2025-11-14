const { db } = require('../database');

class Joya {
  // Crear nueva joya
  static crear(joyaData) {
    return new Promise((resolve, reject) => {
      const {
        codigo, nombre, descripcion, categoria, tipo_metal, color_metal,
        piedras, peso_gramos, talla, coleccion, proveedor, costo,
        precio_venta, moneda, stock_actual, stock_minimo, ubicacion, estado
      } = joyaData;

      const sql = `
        INSERT INTO joyas (
          codigo, nombre, descripcion, categoria, tipo_metal, color_metal,
          piedras, peso_gramos, talla, coleccion, proveedor, costo,
          precio_venta, moneda, stock_actual, stock_minimo, ubicacion, estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(sql, [
        codigo, nombre, descripcion, categoria, tipo_metal, color_metal,
        piedras, peso_gramos, talla, coleccion, proveedor, costo,
        precio_venta, moneda || 'CRC', stock_actual, stock_minimo || 5, ubicacion, estado || 'Activo'
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
  }

  // Obtener todas las joyas con paginación y filtros
  static obtenerTodas(filtros = {}) {
    return new Promise((resolve, reject) => {
      const {
        busqueda, categoria, tipo_metal, precio_min, precio_max,
        stock_bajo, sin_stock, estado, pagina = 1, por_pagina = 20
      } = filtros;

      let sql = 'SELECT * FROM joyas WHERE 1=1';
      const params = [];

      // Búsqueda general
      if (busqueda) {
        sql += ` AND (
          codigo LIKE ? OR 
          nombre LIKE ? OR 
          descripcion LIKE ? OR 
          categoria LIKE ? OR 
          tipo_metal LIKE ? OR 
          proveedor LIKE ?
        )`;
        const searchPattern = `%${busqueda}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      }

      // Filtro por categoría
      if (categoria) {
        sql += ' AND categoria = ?';
        params.push(categoria);
      }

      // Filtro por tipo de metal
      if (tipo_metal) {
        sql += ' AND tipo_metal = ?';
        params.push(tipo_metal);
      }

      // Filtro por rango de precios
      if (precio_min !== undefined) {
        sql += ' AND precio_venta >= ?';
        params.push(precio_min);
      }
      if (precio_max !== undefined) {
        sql += ' AND precio_venta <= ?';
        params.push(precio_max);
      }

      // Filtro por stock bajo
      if (stock_bajo === 'true') {
        sql += ' AND stock_actual <= stock_minimo';
      }

      // Filtro por sin stock
      if (sin_stock === 'true') {
        sql += ' AND stock_actual = 0';
      }

      // Filtro por estado
      if (estado) {
        sql += ' AND estado = ?';
        params.push(estado);
      }

      // Contar total de registros
      const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
      db.get(countSql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          const total = row.total;
          const offset = (pagina - 1) * por_pagina;

          // Obtener registros con paginación
          sql += ' ORDER BY fecha_creacion DESC LIMIT ? OFFSET ?';
          params.push(por_pagina, offset);

          db.all(sql, params, (err, rows) => {
            if (err) {
              reject(err);
            } else {
              resolve({
                joyas: rows,
                total: total,
                pagina: parseInt(pagina),
                por_pagina: parseInt(por_pagina),
                total_paginas: Math.ceil(total / por_pagina)
              });
            }
          });
        }
      });
    });
  }

  // Obtener una joya por ID
  static obtenerPorId(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM joyas WHERE id = ?';
      db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Obtener una joya por código
  static obtenerPorCodigo(codigo) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM joyas WHERE codigo = ?';
      db.get(sql, [codigo], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Actualizar joya
  static actualizar(id, joyaData) {
    return new Promise((resolve, reject) => {
      const {
        codigo, nombre, descripcion, categoria, tipo_metal, color_metal,
        piedras, peso_gramos, talla, coleccion, proveedor, costo,
        precio_venta, moneda, stock_actual, stock_minimo, ubicacion, estado
      } = joyaData;

      const sql = `
        UPDATE joyas SET
          codigo = ?, nombre = ?, descripcion = ?, categoria = ?, tipo_metal = ?,
          color_metal = ?, piedras = ?, peso_gramos = ?, talla = ?, coleccion = ?,
          proveedor = ?, costo = ?, precio_venta = ?, moneda = ?, stock_actual = ?,
          stock_minimo = ?, ubicacion = ?, estado = ?,
          fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      db.run(sql, [
        codigo, nombre, descripcion, categoria, tipo_metal, color_metal,
        piedras, peso_gramos, talla, coleccion, proveedor, costo,
        precio_venta, moneda, stock_actual, stock_minimo, ubicacion, estado, id
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // Actualizar solo el stock
  static actualizarStock(id, nuevoStock) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE joyas SET
          stock_actual = ?,
          fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      db.run(sql, [nuevoStock, id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // Eliminar (marcar como descontinuado)
  static eliminar(id) {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE joyas SET estado = ?, fecha_ultima_modificacion = CURRENT_TIMESTAMP WHERE id = ?';
      db.run(sql, ['Descontinuado', id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // Obtener joyas con stock bajo
  static obtenerStockBajo() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM joyas WHERE stock_actual <= stock_minimo AND estado = "Activo"';
      db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Obtener categorías únicas
  static obtenerCategorias() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT DISTINCT categoria FROM joyas WHERE categoria IS NOT NULL ORDER BY categoria';
      db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => row.categoria));
        }
      });
    });
  }

  // Obtener tipos de metal únicos
  static obtenerTiposMetal() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT DISTINCT tipo_metal FROM joyas WHERE tipo_metal IS NOT NULL ORDER BY tipo_metal';
      db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => row.tipo_metal));
        }
      });
    });
  }
}

module.exports = Joya;
