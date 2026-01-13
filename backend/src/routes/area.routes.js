const express = require('express');
const router = express.Router();
const areaController = require('../controllers/area.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { body } = require('express-validator');

// Validation rules
const validateArea = [
  body('name').notEmpty().withMessage('Name is required'),
  body('code').optional().isLength({ max: 20 }).withMessage('Code max length is 20'),
  body('description').optional(),
];

// Routes
router.get('/', authenticate, areaController.getAll);
router.get('/:id', authenticate, areaController.getById);
router.post('/', authenticate, requireRole('CEO', 'Manager'), validateArea, areaController.create);
router.put('/:id', authenticate, requireRole('CEO', 'Manager'), validateArea, areaController.update);

module.exports = router;
