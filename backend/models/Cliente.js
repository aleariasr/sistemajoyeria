const { db } = require('../database');

class Cliente {
  // Crear nuevo cliente
  static crear(clienteData) {
    return new Promise((resolve, reject) => {
      const { nombre, telefono, cedula, direccion, email, notas } = clienteData;

      const sql = `
        INSERT INTO clientes (nombre, telefono, cedula, direccion, email, notas)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.run(sql, [nombre, telefono, cedula, direccion || null, email || null, notas || null], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
  }

  // Obtener todos los clientes con filtros
  static obtenerTodos(filtros = {}) {
    return new Promise((resolve, reject) => {
      const { busqueda, pagina = 1, por_pagina = 50 } = filtros;

      let sql = `SELECT * FROM clientes WHERE 1=1`;
      const params = [];

      // Filtro de búsqueda por nombre, cédula o teléfono
      if (busqueda) {
        sql += ` AND (nombre LIKE ? OR cedula LIKE ? OR telefono LIKE ?)`;
        const busquedaParam = `%${busqueda}%`;
        params.push(busquedaParam, busquedaParam, busquedaParam);
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
          sql += ' ORDER BY nombre ASC LIMIT ? OFFSET ?';
          params.push(por_pagina, offset);

          db.all(sql, params, (err, rows) => {
            if (err) {
              reject(err);
            } else {
              resolve({
                clientes: rows,
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

  // Obtener un cliente por ID
  static obtenerPorId(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM clientes WHERE id = ?';
      db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Obtener un cliente por cédula
  static obtenerPorCedula(cedula) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM clientes WHERE cedula = ?';
      db.get(sql, [cedula], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Actualizar cliente
  static actualizar(id, clienteData) {
    return new Promise((resolve, reject) => {
      const { nombre, telefono, cedula, direccion, email, notas } = clienteData;

      const sql = `
        UPDATE clientes 
        SET nombre = ?, telefono = ?, cedula = ?, direccion = ?, email = ?, notas = ?,
            fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      db.run(sql, [nombre, telefono, cedula, direccion, email, notas, id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // Eliminar cliente
  static eliminar(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM clientes WHERE id = ?';
      db.run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // Buscar clientes por nombre o cédula
  static buscar(termino) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM clientes 
        WHERE nombre LIKE ? OR cedula LIKE ? OR telefono LIKE ?
        ORDER BY nombre ASC
        LIMIT 10
      `;
      const param = `%${termino}%`;
      db.all(sql, [param, param, param], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = Cliente;
