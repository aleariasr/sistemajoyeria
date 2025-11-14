const db = require('../../config/database');

class Category {
  static async getAll() {
    return await db.query('SELECT * FROM categories ORDER BY name');
  }

  static async getById(id) {
    return await db.get('SELECT * FROM categories WHERE id = ?', [id]);
  }

  static async create(data) {
    const result = await db.run(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [data.name, data.description]
    );
    return result.id;
  }

  static async update(id, data) {
    await db.run(
      'UPDATE categories SET name = ?, description = ? WHERE id = ?',
      [data.name, data.description, id]
    );
    return true;
  }

  static async delete(id) {
    await db.run('DELETE FROM categories WHERE id = ?', [id]);
    return true;
  }
}

module.exports = Category;
