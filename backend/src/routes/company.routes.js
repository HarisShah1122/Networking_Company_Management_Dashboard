const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { authenticate } = require('../middleware/auth.middleware');

// Public route to get companies for login
router.get('/', companyController.getAll);

// Get company stats (for super admin)
router.get('/stats', authenticate, companyController.getStats);

module.exports = router;

