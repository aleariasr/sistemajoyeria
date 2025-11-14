const db = require('../../config/database');

class Jewelry {
  // Crear una nueva joya
  static async create(jewelryData) {
    const {
      code, name, description, category_id, metal_id, size,
      sale_price, cost, current_stock, minimum_stock, location, status, stones
    } = jewelryData;

    const result = await db.run(
      `INSERT INTO jewelry (code, name, description, category_id, metal_id, size, sale_price, cost, current_stock, minimum_stock, location, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, name, description, category_id, metal_id, size, sale_price, cost, current_stock || 0, minimum_stock || 0, location, status || 'active']
    );

    // Agregar piedras si las hay
    if (stones && stones.length > 0) {
      for (const stone of stones) {
        await db.run(
          'INSERT INTO jewelry_stones (jewelry_id, stone_id, quantity) VALUES (?, ?, ?)',
          [result.id, stone.stone_id, stone.quantity || 1]
        );
      }
    }

    // Registrar movimiento inicial si hay stock
    if (current_stock > 0) {
      await db.run(
        `INSERT INTO inventory_movements (jewelry_id, type, quantity, previous_stock, new_stock, reason)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [result.id, 'entrada', current_stock, 0, current_stock, 'Stock inicial']
      );
    }

    return result.id;
  }

  // Obtener todas las joyas con información relacionada
  static async getAll(filters = {}) {
    let sql = `
      SELECT 
        j.*,
        c.name as category_name,
        m.name as metal_name,
        m.purity as metal_purity
      FROM jewelry j
      LEFT JOIN categories c ON j.category_id = c.id
      LEFT JOIN metals m ON j.metal_id = m.id
      WHERE 1=1
    `;
    
    const params = [];

    if (filters.search) {
      sql += ` AND (j.code LIKE ? OR j.name LIKE ? OR j.description LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.category_id) {
      sql += ` AND j.category_id = ?`;
      params.push(filters.category_id);
    }

    if (filters.metal_id) {
      sql += ` AND j.metal_id = ?`;
      params.push(filters.metal_id);
    }

    if (filters.status) {
      sql += ` AND j.status = ?`;
      params.push(filters.status);
    }

    if (filters.low_stock === 'true') {
      sql += ` AND j.current_stock <= j.minimum_stock`;
    }

    sql += ` ORDER BY j.created_at DESC`;

    const jewelry = await db.query(sql, params);

    // Obtener piedras para cada joya
    for (let item of jewelry) {
      item.stones = await db.query(
        `SELECT s.*, js.quantity 
         FROM stones s
         JOIN jewelry_stones js ON s.id = js.stone_id
         WHERE js.jewelry_id = ?`,
        [item.id]
      );
    }

    return jewelry;
  }

  // Obtener una joya por ID
  static async getById(id) {
    const jewelry = await db.get(
      `SELECT 
        j.*,
        c.name as category_name,
        m.name as metal_name,
        m.purity as metal_purity
       FROM jewelry j
       LEFT JOIN categories c ON j.category_id = c.id
       LEFT JOIN metals m ON j.metal_id = m.id
       WHERE j.id = ?`,
      [id]
    );

    if (jewelry) {
      jewelry.stones = await db.query(
        `SELECT s.*, js.quantity 
         FROM stones s
         JOIN jewelry_stones js ON s.id = js.stone_id
         WHERE js.jewelry_id = ?`,
        [id]
      );
    }

    return jewelry;
  }

  // Actualizar una joya
  static async update(id, jewelryData) {
    const {
      code, name, description, category_id, metal_id, size,
      sale_price, cost, location, status, stones
    } = jewelryData;

    await db.run(
      `UPDATE jewelry 
       SET code = ?, name = ?, description = ?, category_id = ?, metal_id = ?, 
           size = ?, sale_price = ?, cost = ?, location = ?, status = ?, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [code, name, description, category_id, metal_id, size, sale_price, cost, location, status, id]
    );

    // Actualizar piedras
    if (stones !== undefined) {
      await db.run('DELETE FROM jewelry_stones WHERE jewelry_id = ?', [id]);
      
      if (stones && stones.length > 0) {
        for (const stone of stones) {
          await db.run(
            'INSERT INTO jewelry_stones (jewelry_id, stone_id, quantity) VALUES (?, ?, ?)',
            [id, stone.stone_id, stone.quantity || 1]
          );
        }
      }
    }

    return true;
  }

  // Eliminar una joya
  static async delete(id) {
    await db.run('DELETE FROM jewelry WHERE id = ?', [id]);
    return true;
  }

  // Obtener joyas con stock bajo
  static async getLowStock() {
    const jewelry = await db.query(
      `SELECT 
        j.*,
        c.name as category_name,
        m.name as metal_name
       FROM jewelry j
       LEFT JOIN categories c ON j.category_id = c.id
       LEFT JOIN metals m ON j.metal_id = m.id
       WHERE j.current_stock <= j.minimum_stock AND j.status = 'active'
       ORDER BY (j.current_stock - j.minimum_stock) ASC`
    );

    return jewelry;
  }

  // Ajustar stock
  static async adjustStock(id, quantity, type, reason, createdBy = 'sistema') {
    const jewelry = await this.getById(id);
    if (!jewelry) {
      throw new Error('Joya no encontrada');
    }

    const previousStock = jewelry.current_stock;
    let newStock;

    if (type === 'entrada') {
      newStock = previousStock + quantity;
    } else if (type === 'salida') {
      newStock = previousStock - quantity;
      if (newStock < 0) {
        throw new Error('Stock insuficiente');
      }
    } else if (type === 'ajuste') {
      newStock = quantity;
    } else {
      throw new Error('Tipo de movimiento inválido');
    }

    // Actualizar stock
    await db.run(
      'UPDATE jewelry SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStock, id]
    );

    // Registrar movimiento
    await db.run(
      `INSERT INTO inventory_movements (jewelry_id, type, quantity, previous_stock, new_stock, reason, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, type, quantity, previousStock, newStock, reason, createdBy]
    );

    return { previousStock, newStock };
  }

  // Obtener historial de movimientos
  static async getMovements(jewelryId = null, limit = 100) {
    let sql = `
      SELECT 
        im.*,
        j.code as jewelry_code,
        j.name as jewelry_name
      FROM inventory_movements im
      JOIN jewelry j ON im.jewelry_id = j.id
    `;

    const params = [];
    
    if (jewelryId) {
      sql += ' WHERE im.jewelry_id = ?';
      params.push(jewelryId);
    }

    sql += ' ORDER BY im.created_at DESC LIMIT ?';
    params.push(limit);

    return await db.query(sql, params);
  }

  // Obtener estadísticas
  static async getStats() {
    const totalJewelry = await db.get('SELECT COUNT(*) as count FROM jewelry WHERE status = "active"');
    const totalValue = await db.get('SELECT SUM(current_stock * sale_price) as value FROM jewelry WHERE status = "active"');
    const lowStock = await db.get('SELECT COUNT(*) as count FROM jewelry WHERE current_stock <= minimum_stock AND status = "active"');
    const totalStock = await db.get('SELECT SUM(current_stock) as total FROM jewelry WHERE status = "active"');

    return {
      totalJewelry: totalJewelry.count,
      totalValue: totalValue.value || 0,
      lowStockCount: lowStock.count,
      totalStock: totalStock.total || 0
    };
  }
}

module.exports = Jewelry;
