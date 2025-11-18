const { dbDia } = require('../database-dia');

class VentaDia {
  // Crear nueva venta del día
  static crear(ventaData) {
    return new Promise((resolve, reject) => {
      const {
        id_usuario, metodo_pago, subtotal, descuento, total,
        efectivo_recibido, cambio, notas
      } = ventaData;

      const sql = `
        INSERT INTO ventas_dia (
          id_usuario, metodo_pago, subtotal, descuento, total,
          efectivo_recibido, cambio, notas
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      dbDia.run(sql, [
        id_usuario, metodo_pago, subtotal || 0, descuento || 0, total,
        efectivo_recibido || null, cambio || null, notas || null
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
  }

  // Obtener todas las ventas del día
  static obtenerTodas() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM ventas_dia
        ORDER BY fecha_venta DESC
      `;

      dbDia.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Obtener una venta por ID
  static obtenerPorId(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM ventas_dia WHERE id = ?';
      dbDia.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Obtener resumen de ventas del día
  static obtenerResumen() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          COUNT(*) as total_ventas,
          SUM(total) as total_ingresos,
          SUM(CASE WHEN metodo_pago = 'Efectivo' THEN total ELSE 0 END) as total_efectivo,
          SUM(CASE WHEN metodo_pago = 'Transferencia' THEN total ELSE 0 END) as total_transferencia,
          COUNT(CASE WHEN metodo_pago = 'Efectivo' THEN 1 END) as ventas_efectivo,
          COUNT(CASE WHEN metodo_pago = 'Transferencia' THEN 1 END) as ventas_transferencia
        FROM ventas_dia
      `;

      dbDia.get(sql, [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Limpiar todas las ventas del día (después del cierre)
  static limpiar() {
    return new Promise((resolve, reject) => {
      dbDia.run('DELETE FROM items_venta_dia', [], (err) => {
        if (err) {
          reject(err);
        } else {
          dbDia.run('DELETE FROM ventas_dia', [], (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        }
      });
    });
  }
}

module.exports = VentaDia;
