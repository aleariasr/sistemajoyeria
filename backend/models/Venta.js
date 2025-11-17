const { db } = require('../database');

class Venta {
  // Crear nueva venta
  static crear(ventaData) {
    return new Promise((resolve, reject) => {
      const {
        id_usuario, metodo_pago, subtotal, descuento, total,
        efectivo_recibido, cambio, notas
      } = ventaData;

      const sql = `
        INSERT INTO ventas (
          id_usuario, metodo_pago, subtotal, descuento, total,
          efectivo_recibido, cambio, notas
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(sql, [
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

  // Obtener todas las ventas con paginación y filtros
  static obtenerTodas(filtros = {}) {
    return new Promise((resolve, reject) => {
      const {
        fecha_desde, fecha_hasta, metodo_pago, id_usuario,
        pagina = 1, por_pagina = 50
      } = filtros;

      let sql = `
        SELECT v.*, u.username as usuario, u.full_name as nombre_usuario
        FROM ventas v
        LEFT JOIN usuarios u ON v.id_usuario = u.id
        WHERE 1=1
      `;
      const params = [];

      // Filtro por fecha desde
      if (fecha_desde) {
        sql += ' AND v.fecha_venta >= ?';
        params.push(fecha_desde);
      }

      // Filtro por fecha hasta
      if (fecha_hasta) {
        sql += ' AND v.fecha_venta <= ?';
        params.push(fecha_hasta);
      }

      // Filtro por método de pago
      if (metodo_pago) {
        sql += ' AND v.metodo_pago = ?';
        params.push(metodo_pago);
      }

      // Filtro por usuario
      if (id_usuario) {
        sql += ' AND v.id_usuario = ?';
        params.push(id_usuario);
      }

      // Contar total de registros
      const countSql = sql.replace(
        'SELECT v.*, u.username as usuario, u.full_name as nombre_usuario',
        'SELECT COUNT(*) as total'
      );
      db.get(countSql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          const total = row.total;
          const offset = (pagina - 1) * por_pagina;

          // Obtener registros con paginación
          sql += ' ORDER BY v.fecha_venta DESC LIMIT ? OFFSET ?';
          params.push(por_pagina, offset);

          db.all(sql, params, (err, rows) => {
            if (err) {
              reject(err);
            } else {
              resolve({
                ventas: rows,
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

  // Obtener una venta por ID
  static obtenerPorId(id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT v.*, u.username as usuario, u.full_name as nombre_usuario
        FROM ventas v
        LEFT JOIN usuarios u ON v.id_usuario = u.id
        WHERE v.id = ?
      `;
      db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Obtener ventas del día
  static obtenerVentasDelDia(fecha = null) {
    return new Promise((resolve, reject) => {
      const fechaConsulta = fecha || new Date().toISOString().split('T')[0];
      
      const sql = `
        SELECT v.*, u.username as usuario, u.full_name as nombre_usuario
        FROM ventas v
        LEFT JOIN usuarios u ON v.id_usuario = u.id
        WHERE DATE(v.fecha_venta) = ?
        ORDER BY v.fecha_venta DESC
      `;

      db.all(sql, [fechaConsulta], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Obtener resumen de ventas por periodo
  static obtenerResumen(filtros = {}) {
    return new Promise((resolve, reject) => {
      const { fecha_desde, fecha_hasta } = filtros;

      let sql = `
        SELECT 
          COUNT(*) as total_ventas,
          SUM(total) as total_ingresos,
          AVG(total) as promedio_venta,
          metodo_pago,
          COUNT(CASE WHEN metodo_pago = 'Efectivo' THEN 1 END) as ventas_efectivo,
          COUNT(CASE WHEN metodo_pago = 'Tarjeta' THEN 1 END) as ventas_tarjeta,
          COUNT(CASE WHEN metodo_pago = 'Transferencia' THEN 1 END) as ventas_transferencia,
          COUNT(CASE WHEN metodo_pago = 'Mixto' THEN 1 END) as ventas_mixto
        FROM ventas
        WHERE 1=1
      `;
      const params = [];

      if (fecha_desde) {
        sql += ' AND fecha_venta >= ?';
        params.push(fecha_desde);
      }

      if (fecha_hasta) {
        sql += ' AND fecha_venta <= ?';
        params.push(fecha_hasta);
      }

      db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }
}

module.exports = Venta;
