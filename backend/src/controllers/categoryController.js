const Category = require('../models/Category');

class CategoryController {
  async getAll(req, res) {
    try {
      const categories = await Category.getAll();
      res.json({ success: true, data: categories });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const category = await Category.getById(req.params.id);
      if (!category) {
        return res.status(404).json({ success: false, error: 'Categoría no encontrada' });
      }
      res.json({ success: true, data: category });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async create(req, res) {
    try {
      const id = await Category.create(req.body);
      const category = await Category.getById(id);
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async update(req, res) {
    try {
      await Category.update(req.params.id, req.body);
      const category = await Category.getById(req.params.id);
      res.json({ success: true, data: category });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async delete(req, res) {
    try {
      await Category.delete(req.params.id);
      res.json({ success: true, message: 'Categoría eliminada' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new CategoryController();
