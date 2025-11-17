const { db } = require('../database');

class ItemVenta {
  // Crear nuevo item de venta
  static crear(itemData) {
    return new Promise((resolve, reject) => {
      const {
        id_venta, id_joya, cantidad, precio_unitario, subtotal
      } = itemData;

      const sql = `
        INSERT INTO items_venta (
          id_venta, id_joya, cantidad, precio_unitario, subtotal
        ) VALUES (?, ?, ?, ?, ?)
      `;

      db.run(sql, [
        id_venta, id_joya, cantidad, precio_unitario, subtotal
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
  }

  // Obtener items de una venta
  static obtenerPorVenta(id_venta) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT iv.*, j.codigo, j.nombre, j.categoria, j.tipo_metal
        FROM items_venta iv
        LEFT JOIN joyas j ON iv.id_joya = j.id
        WHERE iv.id_venta = ?
        ORDER BY iv.id ASC
      `;

      db.all(sql, [id_venta], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Crear múltiples items de venta en una transacción
  static crearMultiples(items) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO items_venta (
          id_venta, id_joya, cantidad, precio_unitario, subtotal
        ) VALUES (?, ?, ?, ?, ?)
      `;

      db.serialize(() => {
        const stmt = db.prepare(sql);
        
        items.forEach(item => {
          stmt.run([
            item.id_venta,
            item.id_joya,
            item.cantidad,
            item.precio_unitario,
            item.subtotal
          ]);
        });

        stmt.finalize((err) => {
          if (err) {
            reject(err);
          } else {
            resolve({ count: items.length });
          }
        });
      });
    });
  }
}

module.exports = ItemVenta;
