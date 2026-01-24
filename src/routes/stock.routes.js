const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');

router.use(authenticate);

router.get('/', stockController.getAll);
router.get('/categories', stockController.getCategories);
router.get('/stats', stockController.getStats);
router.get('/:id', stockController.getById);
router.post(
  '/',
  requireRole('CEO', 'Manager'),
  stockController.validateStock,
  handleValidationErrors,
  stockController.create
);
router.put(
  '/:id',
  requireRole('CEO', 'Manager'),
  stockController.validateStock,
  handleValidationErrors,
  stockController.update
);
// router.delete(
//   '/:id',
//   requireRole('CEO', 'Manager'),
//   stockController.delete
// );

module.exports = router;

