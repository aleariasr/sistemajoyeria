const { dbDia } = require('../database-dia');

class ItemVentaDia {
  // Crear nuevo item de venta del día
  static crear(itemData) {
    return new Promise((resolve, reject) => {
      const { id_venta_dia, id_joya, cantidad, precio_unitario, subtotal } = itemData;

      const sql = `
        INSERT INTO items_venta_dia (
          id_venta_dia, id_joya, cantidad, precio_unitario, subtotal
        ) VALUES (?, ?, ?, ?, ?)
      `;

      dbDia.run(sql, [
        id_venta_dia, id_joya, cantidad, precio_unitario, subtotal
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
  }

  // Obtener items de una venta del día
  static obtenerPorVenta(idVentaDia) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT iv.*, j.codigo, j.nombre, j.moneda
        FROM items_venta_dia iv
        LEFT JOIN joyas j ON iv.id_joya = j.id
        WHERE iv.id_venta_dia = ?
      `;

      // Importamos db desde database.js para acceder a la tabla joyas
      const { db } = require('../database');
      
      dbDia.all(sql.replace('LEFT JOIN joyas', 'LEFT JOIN main.joyas'), [idVentaDia], (err, rows) => {
        if (err) {
          // Si falla el JOIN con la DB principal, intenta sin información de joya
          dbDia.all(`
            SELECT * FROM items_venta_dia WHERE id_venta_dia = ?
          `, [idVentaDia], (err2, rows2) => {
            if (err2) {
              reject(err2);
            } else {
              resolve(rows2);
            }
          });
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Obtener todos los items del día
  static obtenerTodos() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM items_venta_dia';
      dbDia.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = ItemVentaDia;
