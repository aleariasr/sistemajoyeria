const express = require('express');
const router = express.Router();
const metalController = require('../controllers/metalController');

router.get('/', metalController.getAll.bind(metalController));
router.get('/:id', metalController.getById.bind(metalController));
router.post('/', metalController.create.bind(metalController));
router.put('/:id', metalController.update.bind(metalController));
router.delete('/:id', metalController.delete.bind(metalController));

module.exports = router;
