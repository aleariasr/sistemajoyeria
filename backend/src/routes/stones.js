const express = require('express');
const router = express.Router();
const stoneController = require('../controllers/stoneController');

router.get('/', stoneController.getAll.bind(stoneController));
router.get('/:id', stoneController.getById.bind(stoneController));
router.post('/', stoneController.create.bind(stoneController));
router.put('/:id', stoneController.update.bind(stoneController));
router.delete('/:id', stoneController.delete.bind(stoneController));

module.exports = router;
