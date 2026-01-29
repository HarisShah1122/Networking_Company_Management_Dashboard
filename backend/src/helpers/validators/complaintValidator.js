const Joi = require('joi');

const complaintQuerySchema = Joi.object({
  branch: Joi.string().optional().valid('all', 'mardan', 'katlang', 'peshawar', 'islamabad', 'rawalpindi'),
  district: Joi.string().optional().valid('all', 'mardan', 'peshawar', 'islamabad', 'rawalpindi'),
  source: Joi.string().optional().valid('all', 'internal', 'external'),
  page: Joi.number().integer().min(1).optional().default(1),
  pageSize: Joi.number().integer().min(1).max(100).optional().default(10)
});

const createComplaintSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  whatsapp_number: Joi.string().required().pattern(/^\+?[1-9]\d{1,14}$/),
  title: Joi.string().required().min(5).max(200),
  description: Joi.string().required().min(10).max(1000),
  address: Joi.string().optional().max(500),
  priority: Joi.string().optional().valid('urgent', 'high', 'medium', 'low').default('medium'),
  branch: Joi.string().optional(),
  district: Joi.string().optional(),
  area: Joi.string().optional(),
  source: Joi.string().optional().valid('internal', 'external').default('external')
});

const validateQuery = (req, res, next) => {
  const { error, value } = complaintQuerySchema.validate(req.query);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }
  req.query = value;
  next();
};

const validateCreateComplaint = (req, res, next) => {
  const { error, value } = createComplaintSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }
  req.body = value;
  next();
};

module.exports = {
  validateQuery,
  validateCreateComplaint
};
