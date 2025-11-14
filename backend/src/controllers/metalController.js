const Metal = require('../models/Metal');

class MetalController {
  async getAll(req, res) {
    try {
      const metals = await Metal.getAll();
      res.json({ success: true, data: metals });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const metal = await Metal.getById(req.params.id);
      if (!metal) {
        return res.status(404).json({ success: false, error: 'Metal no encontrado' });
      }
      res.json({ success: true, data: metal });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async create(req, res) {
    try {
      const id = await Metal.create(req.body);
      const metal = await Metal.getById(id);
      res.status(201).json({ success: true, data: metal });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async update(req, res) {
    try {
      await Metal.update(req.params.id, req.body);
      const metal = await Metal.getById(req.params.id);
      res.json({ success: true, data: metal });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async delete(req, res) {
    try {
      await Metal.delete(req.params.id);
      res.json({ success: true, message: 'Metal eliminado' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new MetalController();
