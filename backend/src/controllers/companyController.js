const { Company } = require('../models');
const ApiResponse = require('../helpers/responses');

const getAll = async (req, res, next) => {
  try {
    const companies = await Company.findAll({
      attributes: ['id', 'company_id', 'name', 'email', 'status'],
      where: { status: 'active' },
      order: [['name', 'ASC']]
    });
    return ApiResponse.success(res, { companies }, 'Companies fetched');
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const { User } = require('../models');
    const totalCompanies = await Company.count();
    const activeCompanies = await Company.count({ where: { status: 'active' } });
    const totalCEOs = await User.count({ where: { role: 'CEO' } });
    
    return ApiResponse.success(res, {
      stats: {
        total_companies: totalCompanies,
        active_companies: activeCompanies,
        total_ceos: totalCEOs
      }
    }, 'Company stats fetched');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getStats
};

