const { validateLogin, validateRegister } = require('./auth.validator');
const { validateCustomer } = require('./customer.validator');
const { validateConnection } = require('./connection.validator');
const { validateRecharge } = require('./recharge.validator');
const { validateStock } = require('./stock.validator');
const { validateTransaction } = require('./transaction.validator');
const { validateUser } = require('./user.validator');

module.exports = {
  validateLogin,
  validateRegister,
  validateCustomer,
  validateConnection,
  validateRecharge,
  validateStock,
  validateTransaction,
  validateUser
};

