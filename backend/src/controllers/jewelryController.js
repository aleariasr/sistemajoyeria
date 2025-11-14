const Jewelry = require('../models/Jewelry');

class JewelryController {
  // Obtener todas las joyas
  async getAll(req, res) {
    try {
      const filters = {
        search: req.query.search,
        category_id: req.query.category_id,
        metal_id: req.query.metal_id,
        status: req.query.status,
        low_stock: req.query.low_stock
      };
      
      const jewelry = await Jewelry.getAll(filters);
      res.json({ success: true, data: jewelry });
    } catch (error) {
      console.error('Error al obtener joyas:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Obtener una joya por ID
  async getById(req, res) {
    try {
      const jewelry = await Jewelry.getById(req.params.id);
      if (!jewelry) {
        return res.status(404).json({ success: false, error: 'Joya no encontrada' });
      }
      res.json({ success: true, data: jewelry });
    } catch (error) {
      console.error('Error al obtener joya:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Crear nueva joya
  async create(req, res) {
    try {
      const id = await Jewelry.create(req.body);
      const jewelry = await Jewelry.getById(id);
      res.status(201).json({ success: true, data: jewelry });
    } catch (error) {
      console.error('Error al crear joya:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Actualizar joya
  async update(req, res) {
    try {
      await Jewelry.update(req.params.id, req.body);
      const jewelry = await Jewelry.getById(req.params.id);
      res.json({ success: true, data: jewelry });
    } catch (error) {
      console.error('Error al actualizar joya:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Eliminar joya
  async delete(req, res) {
    try {
      await Jewelry.delete(req.params.id);
      res.json({ success: true, message: 'Joya eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar joya:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Obtener joyas con stock bajo
  async getLowStock(req, res) {
    try {
      const jewelry = await Jewelry.getLowStock();
      res.json({ success: true, data: jewelry });
    } catch (error) {
      console.error('Error al obtener joyas con stock bajo:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Ajustar stock
  async adjustStock(req, res) {
    try {
      const { quantity, type, reason, created_by } = req.body;
      const result = await Jewelry.adjustStock(
        req.params.id,
        parseInt(quantity),
        type,
        reason,
        created_by
      );
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Error al ajustar stock:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Obtener movimientos
  async getMovements(req, res) {
    try {
      const jewelryId = req.query.jewelry_id;
      const limit = req.query.limit || 100;
      const movements = await Jewelry.getMovements(jewelryId, limit);
      res.json({ success: true, data: movements });
    } catch (error) {
      console.error('Error al obtener movimientos:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Obtener estadísticas
  async getStats(req, res) {
    try {
      const stats = await Jewelry.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new JewelryController();
