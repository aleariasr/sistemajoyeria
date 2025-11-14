const { db } = require('../database');

class MovimientoInventario {
  // Crear nuevo movimiento
  static crear(movimientoData) {
    return new Promise((resolve, reject) => {
      const {
        id_joya, tipo_movimiento, cantidad, motivo,
        usuario, stock_antes, stock_despues
      } = movimientoData;

      const sql = `
        INSERT INTO movimientos_inventario (
          id_joya, tipo_movimiento, cantidad, motivo,
          usuario, stock_antes, stock_despues
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(sql, [
        id_joya, tipo_movimiento, cantidad, motivo,
        usuario || 'Sistema', stock_antes, stock_despues
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
  }

  // Obtener todos los movimientos con filtros
  static obtenerTodos(filtros = {}) {
    return new Promise((resolve, reject) => {
      const {
        id_joya, tipo_movimiento, fecha_desde, fecha_hasta,
        pagina = 1, por_pagina = 50
      } = filtros;

      let sql = `
        SELECT m.*, j.codigo, j.nombre
        FROM movimientos_inventario m
        LEFT JOIN joyas j ON m.id_joya = j.id
        WHERE 1=1
      `;
      const params = [];

      // Filtro por joya
      if (id_joya) {
        sql += ' AND m.id_joya = ?';
        params.push(id_joya);
      }

      // Filtro por tipo de movimiento
      if (tipo_movimiento) {
        sql += ' AND m.tipo_movimiento = ?';
        params.push(tipo_movimiento);
      }

      // Filtro por fecha desde
      if (fecha_desde) {
        sql += ' AND m.fecha_movimiento >= ?';
        params.push(fecha_desde);
      }

      // Filtro por fecha hasta
      if (fecha_hasta) {
        sql += ' AND m.fecha_movimiento <= ?';
        params.push(fecha_hasta);
      }

      // Contar total de registros
      const countSql = sql.replace('SELECT m.*, j.codigo, j.nombre', 'SELECT COUNT(*) as total');
      db.get(countSql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          const total = row.total;
          const offset = (pagina - 1) * por_pagina;

          // Obtener registros con paginación
          sql += ' ORDER BY m.fecha_movimiento DESC LIMIT ? OFFSET ?';
          params.push(por_pagina, offset);

          db.all(sql, params, (err, rows) => {
            if (err) {
              reject(err);
            } else {
              resolve({
                movimientos: rows,
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

  // Obtener movimientos de una joya específica
  static obtenerPorJoya(id_joya, limite = 10) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM movimientos_inventario
        WHERE id_joya = ?
        ORDER BY fecha_movimiento DESC
        LIMIT ?
      `;

      db.all(sql, [id_joya, limite], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = MovimientoInventario;
