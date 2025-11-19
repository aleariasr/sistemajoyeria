const { db } = require('../database');

class Abono {
  // Crear nuevo abono
  static crear(abonoData) {
    return new Promise((resolve, reject) => {
      const { id_cuenta_por_cobrar, monto, metodo_pago, notas, usuario } = abonoData;

      const sql = `
        INSERT INTO abonos (id_cuenta_por_cobrar, monto, metodo_pago, notas, usuario)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.run(sql, [id_cuenta_por_cobrar, monto, metodo_pago, notas || null, usuario || null], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
  }

  // Obtener todos los abonos de una cuenta
  static obtenerPorCuenta(id_cuenta_por_cobrar) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM abonos 
        WHERE id_cuenta_por_cobrar = ?
        ORDER BY fecha_abono DESC
      `;
      db.all(sql, [id_cuenta_por_cobrar], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Obtener un abono por ID
  static obtenerPorId(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM abonos WHERE id = ?';
      db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Obtener todos los abonos con información de cuenta y cliente
  static obtenerTodos(filtros = {}) {
    return new Promise((resolve, reject) => {
      const { id_cliente, fecha_desde, fecha_hasta, pagina = 1, por_pagina = 50 } = filtros;

      let sql = `
        SELECT 
          a.*,
          c.id_cliente,
          c.monto_total as monto_cuenta,
          c.saldo_pendiente,
          cl.nombre as nombre_cliente,
          cl.cedula as cedula_cliente,
          v.id as id_venta
        FROM abonos a
        LEFT JOIN cuentas_por_cobrar c ON a.id_cuenta_por_cobrar = c.id
        LEFT JOIN clientes cl ON c.id_cliente = cl.id
        LEFT JOIN ventas v ON c.id_venta = v.id
        WHERE 1=1
      `;
      const params = [];

      // Filtro por cliente
      if (id_cliente) {
        sql += ' AND c.id_cliente = ?';
        params.push(id_cliente);
      }

      // Filtro por fecha desde
      if (fecha_desde) {
        sql += ' AND a.fecha_abono >= ?';
        params.push(fecha_desde);
      }

      // Filtro por fecha hasta
      if (fecha_hasta) {
        sql += ' AND a.fecha_abono <= ?';
        params.push(fecha_hasta);
      }

      // Contar total de registros
      const countSql = sql.replace(
        'SELECT a.*, c.id_cliente, c.monto_total as monto_cuenta, c.saldo_pendiente, cl.nombre as nombre_cliente, cl.cedula as cedula_cliente, v.id as id_venta',
        'SELECT COUNT(*) as total'
      );
      db.get(countSql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          const total = row ? row.total : 0;
          const offset = (pagina - 1) * por_pagina;

          // Obtener registros con paginación
          sql += ' ORDER BY a.fecha_abono DESC LIMIT ? OFFSET ?';
          params.push(por_pagina, offset);

          db.all(sql, params, (err, rows) => {
            if (err) {
              reject(err);
            } else {
              resolve({
                abonos: rows,
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

  // Obtener resumen de abonos por periodo
  static obtenerResumen(filtros = {}) {
    return new Promise((resolve, reject) => {
      const { fecha_desde, fecha_hasta } = filtros;

      let sql = `
        SELECT 
          COUNT(*) as total_abonos,
          SUM(monto) as monto_total_abonos,
          AVG(monto) as promedio_abono,
          metodo_pago,
          COUNT(CASE WHEN metodo_pago = 'Efectivo' THEN 1 END) as abonos_efectivo,
          COUNT(CASE WHEN metodo_pago = 'Tarjeta' THEN 1 END) as abonos_tarjeta,
          COUNT(CASE WHEN metodo_pago = 'Transferencia' THEN 1 END) as abonos_transferencia
        FROM abonos
        WHERE 1=1
      `;
      const params = [];

      if (fecha_desde) {
        sql += ' AND fecha_abono >= ?';
        params.push(fecha_desde);
      }

      if (fecha_hasta) {
        sql += ' AND fecha_abono <= ?';
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

module.exports = Abono;
