const db = require('../../config/database');

class Stone {
  static async getAll() {
    return await db.query('SELECT * FROM stones ORDER BY name');
  }

  static async getById(id) {
    return await db.get('SELECT * FROM stones WHERE id = ?', [id]);
  }

  static async create(data) {
    const result = await db.run(
      'INSERT INTO stones (name, type, carat) VALUES (?, ?, ?)',
      [data.name, data.type, data.carat]
    );
    return result.id;
  }

  static async update(id, data) {
    await db.run(
      'UPDATE stones SET name = ?, type = ?, carat = ? WHERE id = ?',
      [data.name, data.type, data.carat, id]
    );
    return true;
  }

  static async delete(id) {
    await db.run('DELETE FROM stones WHERE id = ?', [id]);
    return true;
  }
}

module.exports = Stone;
