const { validationResult } = require('express-validator');

/**
 * Custom middleware to handle file upload validation
 * This runs after multer middleware to validate file properties
 */
const validateFileUpload = (req, res, next) => {
  try {
    // Check if there are any validation errors from express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        error: 'Validation failed',
        errors: errors.array()
      });
    }

    // Validate file upload if present
    if (req.file) {
      // Check file size (5MB limit)
      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(422).json({
          error: 'File too large',
          message: 'File size must be less than 5MB'
        });
      }

      // Check file type
      const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimes.includes(req.file.mimetype)) {
        return res.status(422).json({
          error: 'Invalid file type',
          message: 'Only image files are allowed (JPG, PNG, GIF, WebP)'
        });
      }
    }

    // Ensure receiptImage is not sent as array/object in req.body
    if (req.body && req.body.receiptImage) {
      if (Array.isArray(req.body.receiptImage) || typeof req.body.receiptImage === 'object') {
        return res.status(422).json({
          error: 'Invalid receiptImage format',
          message: 'receiptImage cannot be an array or an object'
        });
      }
    }

    next();
  } catch (error) {
    console.error('File validation error:', error);
    return res.status(500).json({
      error: 'Validation error',
      message: 'An error occurred during file validation'
    });
  }
};

module.exports = { validateFileUpload };
