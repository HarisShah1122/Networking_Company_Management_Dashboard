const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const packageRenewalController = require('../controllers/packageRenewalController'); // You'll create this next

router.post('/', authenticate, packageRenewalController.createRenewal);
router.get('/', authenticate, packageRenewalController.getAllRenewals);
router.get('/connection/:connectionId', authenticate, packageRenewalController.getByConnectionId);

module.exports = router;