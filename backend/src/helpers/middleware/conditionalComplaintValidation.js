const { validationResult } = require('express-validator');
const { validateComplaint } = require('../validators/complaint.validator');
const { validateStatusUpdate } = require('../validators/complaintStatus.validator');

const conditionalComplaintValidation = async (req, res, next) => {
  // If only status is being updated, use status validator
  const bodyKeys = Object.keys(req.body);
  const isStatusOnlyUpdate = bodyKeys.length === 1 && bodyKeys.includes('status');
  
  if (isStatusOnlyUpdate) {
    // Use status validation
    const validators = validateStatusUpdate;
    await Promise.all(validators.map(validator => validator.run(req)));
  } else {
    // Use full complaint validation
    const validators = validateComplaint;
    await Promise.all(validators.map(validator => validator.run(req)));
  }
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => e.msg)
    });
  }
  
  next();
};

module.exports = {
  conditionalComplaintValidation
};
