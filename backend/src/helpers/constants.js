module.exports = {
  ROLES: {
    CEO: 'CEO',
    MANAGER: 'Manager',
    STAFF: 'Staff',
    TECHNICIAN: 'Technician'
  },

  USER_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive'
  },

  CUSTOMER_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended'
  },

  CONNECTION_STATUS: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },

  RECHARGE_STATUS: {
    PENDING: 'pending',
    PAID: 'paid',
    OVERDUE: 'overdue'
  },

  PAYMENT_METHODS: {
    CASH: 'cash',
    CARD: 'card',
    ONLINE: 'online',
    BANK_TRANSFER: 'bank_transfer'
  },

  TRANSACTION_TYPES: {
    INCOME: 'income',
    EXPENSE: 'expense'
  },

  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500
  },

  MESSAGES: {
    INVALID_CREDENTIALS: 'Invalid credentials',
    ACCOUNT_INACTIVE: 'Account is inactive',
    AUTHENTICATION_REQUIRED: 'Authentication required',
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
    NOT_FOUND: 'Resource not found',
    VALIDATION_FAILED: 'Validation failed',
    DUPLICATE_ENTRY: 'This record already exists',
    INVALID_REFERENCE: 'Referenced record does not exist'
  }
};

