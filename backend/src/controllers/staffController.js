const { User } = require('../models');
const ApiResponse = require('../helpers/responses');

const getAllStaff = async (req, res) => {
  try {
    const staff = await User.findAll({
      where: {
        role: 'Staff',
        status: 'active'
      },
      attributes: ['id', 'username', 'email', 'phone', 'role', 'status'],
      order: [['username', 'ASC']]
    });

    return ApiResponse.success(res, staff, 'Staff members retrieved successfully');
  } catch (error) {
    console.error('Error fetching staff:', error);
    return ApiResponse.error(res, 'Failed to fetch staff members', 500);
  }
};

module.exports = {
  getAllStaff
};
