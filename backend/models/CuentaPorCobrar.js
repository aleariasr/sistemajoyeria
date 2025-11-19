const { db } = require('../database');

class CuentaPorCobrar {
  // Crear nueva cuenta por cobrar
  static crear(cuentaData) {
    return new Promise((resolve, reject) => {
      const { 
        id_venta, id_cliente, monto_total, monto_pagado = 0, 
        saldo_pendiente, estado = 'Pendiente', fecha_vencimiento 
      } = cuentaData;

      const sql = `
        INSERT INTO cuentas_por_cobrar (
          id_venta, id_cliente, monto_total, monto_pagado, 
          saldo_pendiente, estado, fecha_vencimiento
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(sql, [
        id_venta, id_cliente, monto_total, monto_pagado, 
        saldo_pendiente, estado, fecha_vencimiento || null
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
  }

  // Obtener todas las cuentas por cobrar con filtros
  static obtenerTodas(filtros = {}) {
    return new Promise((resolve, reject) => {
      const { estado, id_cliente, pagina = 1, por_pagina = 50 } = filtros;

      let sql = `
        SELECT 
          c.*, 
          cl.nombre as nombre_cliente,
          cl.telefono as telefono_cliente,
          cl.cedula as cedula_cliente,
          v.fecha_venta,
          v.total as total_venta
        FROM cuentas_por_cobrar c
        LEFT JOIN clientes cl ON c.id_cliente = cl.id
        LEFT JOIN ventas v ON c.id_venta = v.id
        WHERE 1=1
      `;
      const params = [];

      // Filtro por estado
      if (estado) {
        sql += ' AND c.estado = ?';
        params.push(estado);
      }

      // Filtro por cliente
      if (id_cliente) {
        sql += ' AND c.id_cliente = ?';
        params.push(id_cliente);
      }

      // Contar total de registros
      const countSql = sql.replace(
        'SELECT c.*, cl.nombre as nombre_cliente, cl.telefono as telefono_cliente, cl.cedula as cedula_cliente, v.fecha_venta, v.total as total_venta',
        'SELECT COUNT(*) as total'
      );
      db.get(countSql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          const total = row.total;
          const offset = (pagina - 1) * por_pagina;

          // Obtener registros con paginación
          sql += ' ORDER BY c.fecha_creacion DESC LIMIT ? OFFSET ?';
          params.push(por_pagina, offset);

          db.all(sql, params, (err, rows) => {
            if (err) {
              reject(err);
            } else {
              resolve({
                cuentas: rows,
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

  // Obtener una cuenta por cobrar por ID
  static obtenerPorId(id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          c.*, 
          cl.nombre as nombre_cliente,
          cl.telefono as telefono_cliente,
          cl.cedula as cedula_cliente,
          v.fecha_venta,
          v.total as total_venta,
          v.metodo_pago
        FROM cuentas_por_cobrar c
        LEFT JOIN clientes cl ON c.id_cliente = cl.id
        LEFT JOIN ventas v ON c.id_venta = v.id
        WHERE c.id = ?
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

  // Obtener cuentas por cobrar de un cliente
  static obtenerPorCliente(id_cliente) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          c.*, 
          v.fecha_venta,
          v.total as total_venta
        FROM cuentas_por_cobrar c
        LEFT JOIN ventas v ON c.id_venta = v.id
        WHERE c.id_cliente = ?
        ORDER BY c.fecha_creacion DESC
      `;
      db.all(sql, [id_cliente], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Obtener cuenta por venta
  static obtenerPorVenta(id_venta) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          c.*, 
          cl.nombre as nombre_cliente,
          cl.telefono as telefono_cliente,
          cl.cedula as cedula_cliente
        FROM cuentas_por_cobrar c
        LEFT JOIN clientes cl ON c.id_cliente = cl.id
        WHERE c.id_venta = ?
      `;
      db.get(sql, [id_venta], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Actualizar monto pagado y saldo
  static actualizarPago(id, monto_abono) {
    return new Promise((resolve, reject) => {
      // Primero obtener la cuenta actual
      this.obtenerPorId(id).then(cuenta => {
        if (!cuenta) {
          reject(new Error('Cuenta no encontrada'));
          return;
        }

        const nuevoMontoPagado = parseFloat(cuenta.monto_pagado) + parseFloat(monto_abono);
        const nuevoSaldoPendiente = parseFloat(cuenta.monto_total) - nuevoMontoPagado;
        const nuevoEstado = nuevoSaldoPendiente <= 0.01 ? 'Pagada' : 'Pendiente';

        const sql = `
          UPDATE cuentas_por_cobrar 
          SET monto_pagado = ?, 
              saldo_pendiente = ?, 
              estado = ?,
              fecha_ultima_modificacion = CURRENT_TIMESTAMP
          WHERE id = ?
        `;

        db.run(sql, [nuevoMontoPagado, nuevoSaldoPendiente, nuevoEstado, id], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ 
              changes: this.changes,
              monto_pagado: nuevoMontoPagado,
              saldo_pendiente: nuevoSaldoPendiente,
              estado: nuevoEstado
            });
          }
        });
      }).catch(reject);
    });
  }

  // Obtener resumen de cuentas por cobrar
  static obtenerResumen() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          COUNT(*) as total_cuentas,
          COUNT(CASE WHEN estado = 'Pendiente' THEN 1 END) as cuentas_pendientes,
          COUNT(CASE WHEN estado = 'Pagada' THEN 1 END) as cuentas_pagadas,
          SUM(monto_total) as monto_total_general,
          SUM(monto_pagado) as monto_pagado_general,
          SUM(saldo_pendiente) as saldo_pendiente_general,
          COUNT(CASE WHEN fecha_vencimiento < DATE('now') AND estado = 'Pendiente' THEN 1 END) as cuentas_vencidas,
          SUM(CASE WHEN fecha_vencimiento < DATE('now') AND estado = 'Pendiente' THEN saldo_pendiente ELSE 0 END) as monto_vencido
        FROM cuentas_por_cobrar
      `;
      db.get(sql, [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }
}

module.exports = CuentaPorCobrar;
