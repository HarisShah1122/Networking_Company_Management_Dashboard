const { Connection } = require('../models');
const QueryBuilder = require('../helpers/queryBuilder');
const { enrichWithCustomerData, fetchCustomerData } = require('../helpers/customerHelper');

const getAll = async (filters = {}) => {
  try {
    const { status, customer_id } = filters;
    
    const where = QueryBuilder.combineWhere(
      QueryBuilder.buildStatusFilter(status),
      customer_id ? { customer_id } : {}
    );

    const connections = await Connection.findAll({
      where,
      attributes: ['id', 'customer_id', 'connection_type', 'installation_date', 'activation_date', 'status', 'notes', 'createdAt', 'updatedAt'],
      order: [['created_at', 'DESC']]
    });

    return await enrichWithCustomerData(connections, 'customer_id');
  } catch (error) {
    if (error.message && (error.message.includes('Unknown column') || error.message.includes('doesn\'t exist') || error.message.includes('ER_BAD_FIELD_ERROR'))) {
      try {
        const { status, customer_id } = filters;
        const where = QueryBuilder.combineWhere(
          QueryBuilder.buildStatusFilter(status),
          customer_id ? { customer_id } : {}
        );
        const connections = await Connection.findAll({
          where,
          attributes: ['id', 'customer_id', 'connection_type', 'installation_date', 'activation_date', 'status', 'notes', 'createdAt', 'updatedAt'],
          order: [['created_at', 'DESC']]
        });
        
        return await enrichWithCustomerData(connections, 'customer_id');
      } catch (fallbackError) {
        throw fallbackError;
      }
    }
    throw error;
  }
};

const getById = async (id) => {
  try {
    const connection = await Connection.findByPk(id, {
      attributes: ['id', 'customer_id', 'connection_type', 'installation_date', 'activation_date', 'status', 'notes', 'createdAt', 'updatedAt']
    });

    if (!connection) return null;

    const connectionData = connection.toJSON ? connection.toJSON() : connection;
    const customerData = await fetchCustomerData(connectionData.customer_id);
    
    return {
      ...connectionData,
      customer_name: customerData.name,
      customer_phone: customerData.phone
    };
  } catch (error) {
    return null;
  }
};

const create = async (data) => {
  const connection = await Connection.create(data);
  return await getById(connection.id);
};

const update = async (id, data) => {
  const connection = await Connection.findByPk(id);
  if (!connection) return null;

  await connection.update(data);
  return await getById(id);
};

const deleteConnection = async (id) => {
  const connection = await Connection.findByPk(id);
  if (!connection) return false;

  await connection.destroy();
  return true;
};

const getStats = async () => {
  const [stats] = await Connection.findAll({
    attributes: [
      [Connection.sequelize.fn('COUNT', Connection.sequelize.col('id')), 'total'],
      [Connection.sequelize.fn('SUM', Connection.sequelize.literal("CASE WHEN status = 'pending' THEN 1 ELSE 0 END")), 'pending'],
      [Connection.sequelize.fn('SUM', Connection.sequelize.literal("CASE WHEN status = 'completed' THEN 1 ELSE 0 END")), 'completed'],
      [Connection.sequelize.fn('SUM', Connection.sequelize.literal("CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END")), 'cancelled']
    ],
    raw: true
  });

  return stats || { total: 0, pending: 0, completed: 0, cancelled: 0 };
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteConnection,
  getStats
};
