const express = require('express');
const router = express.Router();
const connectionController = require('../controllers/connectionController');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');

router.use(authenticate);

router.get('/', connectionController.getAll);
router.get('/stats', connectionController.getStats);
router.get('/:id', connectionController.getById);
router.post(
  '/',
  requireRole('CEO', 'Manager'),
  connectionController.validateConnection,
  handleValidationErrors,
  connectionController.create
);
router.put(
  '/:id',
  requireRole('CEO', 'Manager'),
  connectionController.validateConnection,
  handleValidationErrors,
  connectionController.update
);
router.delete(
  '/:id',
  requireRole('CEO', 'Manager'),
  connectionController.delete
);

module.exports = router;

