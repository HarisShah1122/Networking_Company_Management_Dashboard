const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');
const { enforceCompanyFiltering } = require('../middleware/companyIsolation.middleware');

// Staff list endpoint - accessible by Manager and CEO roles
router.get('/staff-list', authenticate, enforceCompanyFiltering, requireRole('Manager', 'CEO'), userController.getStaffList);

// All other routes require authentication and CEO role
router.use(authenticate);
router.use(requireRole('CEO'));
router.use(enforceCompanyFiltering);

router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.post(
  '/',
  userController.validateUser,
  handleValidationErrors,
  userController.create
);
router.put(
  '/:id',
  userController.validateUser,
  handleValidationErrors,
  userController.update
);
// router.delete(
//   '/:id',
//   userController.delete
// );

module.exports = router;

