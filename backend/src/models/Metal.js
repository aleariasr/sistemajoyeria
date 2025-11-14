const db = require('../../config/database');

class Metal {
  static async getAll() {
    return await db.query('SELECT * FROM metals ORDER BY name');
  }

  static async getById(id) {
    return await db.get('SELECT * FROM metals WHERE id = ?', [id]);
  }

  static async create(data) {
    const result = await db.run(
      'INSERT INTO metals (name, purity) VALUES (?, ?)',
      [data.name, data.purity]
    );
    return result.id;
  }

  static async update(id, data) {
    await db.run(
      'UPDATE metals SET name = ?, purity = ? WHERE id = ?',
      [data.name, data.purity, id]
    );
    return true;
  }

  static async delete(id) {
    await db.run('DELETE FROM metals WHERE id = ?', [id]);
    return true;
  }
}

module.exports = Metal;
