const { Connection, Customer } = require('../models');
const QueryBuilder = require('../helpers/queryBuilder');

class ConnectionService {
  static async getAll(filters = {}) {
    const { status, customer_id } = filters;
    
    const where = QueryBuilder.combineWhere(
      QueryBuilder.buildStatusFilter(status),
      customer_id ? { customer_id } : {}
    );

    const connections = await Connection.findAll({
      where,
      include: [{
        model: Customer,
        as: 'customer',
        attributes: ['id', 'name', 'phone']
      }],
      order: [['created_at', 'DESC']]
    });

    return this.formatConnections(connections);
  }

  static async getById(id) {
    const connection = await Connection.findByPk(id, {
      include: [{
        model: Customer,
        as: 'customer',
        attributes: ['id', 'name', 'phone', 'email']
      }]
    });

    if (!connection) return null;

    return this.formatConnection(connection);
  }

  static async create(data) {
    const connection = await Connection.create(data);
    return await this.getById(connection.id);
  }

  static async update(id, data) {
    const connection = await Connection.findByPk(id);
    if (!connection) return null;

    await connection.update(data);
    return await this.getById(id);
  }

  static async getStats() {
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
  }

  static formatConnection(connection) {
    const formatted = connection.toJSON();
    return {
      ...formatted,
      customer_name: connection.customer?.name,
      customer_phone: connection.customer?.phone,
      customer_email: connection.customer?.email
    };
  }

  static formatConnections(connections) {
    return connections.map(conn => ({
      ...conn.toJSON(),
      customer_name: conn.customer?.name,
      customer_phone: conn.customer?.phone
    }));
  }
}

module.exports = ConnectionService;

