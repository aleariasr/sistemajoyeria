const express = require('express');
const router = express.Router();
const jewelryController = require('../controllers/jewelryController');

router.get('/', jewelryController.getAll.bind(jewelryController));
router.get('/stats', jewelryController.getStats.bind(jewelryController));
router.get('/low-stock', jewelryController.getLowStock.bind(jewelryController));
router.get('/movements', jewelryController.getMovements.bind(jewelryController));
router.get('/:id', jewelryController.getById.bind(jewelryController));
router.post('/', jewelryController.create.bind(jewelryController));
router.put('/:id', jewelryController.update.bind(jewelryController));
router.delete('/:id', jewelryController.delete.bind(jewelryController));
router.post('/:id/adjust-stock', jewelryController.adjustStock.bind(jewelryController));

module.exports = router;
