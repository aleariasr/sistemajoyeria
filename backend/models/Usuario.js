const { db } = require('../database');
const bcrypt = require('bcryptjs');

class Usuario {
  // Crear nuevo usuario
  static async crear(usuarioData) {
    const { username, password, role, full_name } = usuarioData;

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO usuarios (username, password_hash, role, full_name)
        VALUES (?, ?, ?, ?)
      `;

      db.run(sql, [username, passwordHash, role || 'dependiente', full_name], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
  }

  // Obtener usuario por username
  static obtenerPorUsername(username) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM usuarios WHERE username = ?';
      db.get(sql, [username], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Obtener usuario por ID
  static obtenerPorId(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id, username, role, full_name, fecha_creacion FROM usuarios WHERE id = ?';
      db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Verificar contraseña
  static async verificarPassword(password, passwordHash) {
    return await bcrypt.compare(password, passwordHash);
  }

  // Obtener todos los usuarios (sin contraseñas)
  static obtenerTodos() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id, username, role, full_name, fecha_creacion FROM usuarios ORDER BY fecha_creacion DESC';
      db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Actualizar usuario
  static async actualizar(id, usuarioData) {
    const { username, password, role, full_name } = usuarioData;

    let sql, params;

    if (password) {
      // Si se proporciona nueva contraseña, actualizarla
      const passwordHash = await bcrypt.hash(password, 10);
      sql = `
        UPDATE usuarios SET
          username = ?, password_hash = ?, role = ?, full_name = ?
        WHERE id = ?
      `;
      params = [username, passwordHash, role, full_name, id];
    } else {
      // Si no hay nueva contraseña, no actualizarla
      sql = `
        UPDATE usuarios SET
          username = ?, role = ?, full_name = ?
        WHERE id = ?
      `;
      params = [username, role, full_name, id];
    }

    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // Eliminar usuario
  static eliminar(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM usuarios WHERE id = ?';
      db.run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }
}

module.exports = Usuario;
