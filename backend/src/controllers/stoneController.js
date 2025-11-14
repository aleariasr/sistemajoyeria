const Stone = require('../models/Stone');

class StoneController {
  async getAll(req, res) {
    try {
      const stones = await Stone.getAll();
      res.json({ success: true, data: stones });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const stone = await Stone.getById(req.params.id);
      if (!stone) {
        return res.status(404).json({ success: false, error: 'Piedra no encontrada' });
      }
      res.json({ success: true, data: stone });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async create(req, res) {
    try {
      const id = await Stone.create(req.body);
      const stone = await Stone.getById(id);
      res.status(201).json({ success: true, data: stone });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async update(req, res) {
    try {
      await Stone.update(req.params.id, req.body);
      const stone = await Stone.getById(req.params.id);
      res.json({ success: true, data: stone });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async delete(req, res) {
    try {
      await Stone.delete(req.params.id);
      res.json({ success: true, message: 'Piedra eliminada' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new StoneController();
