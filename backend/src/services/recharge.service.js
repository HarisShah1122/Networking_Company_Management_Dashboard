const { Op } = require('sequelize');
const { Recharge, Customer } = require('../models');
const QueryBuilder = require('../helpers/queryBuilder');

class RechargeService {
  static async getAll(filters = {}) {
    const { status, customer_id } = filters;
    
    const where = QueryBuilder.combineWhere(
      QueryBuilder.buildStatusFilter(status),
      customer_id ? { customer_id } : {}
    );

    const recharges = await Recharge.findAll({
      where,
      include: [{
        model: Customer,
        as: 'customer',
        attributes: ['id', 'name', 'phone']
      }],
      order: [['created_at', 'DESC']]
    });

    return this.formatRecharges(recharges);
  }

  static async getById(id) {
    const recharge = await Recharge.findByPk(id, {
      include: [{
        model: Customer,
        as: 'customer',
        attributes: ['id', 'name', 'phone', 'email']
      }]
    });

    if (!recharge) return null;

    return this.formatRecharge(recharge);
  }

  static async create(data) {
    const recharge = await Recharge.create(data);
    return await this.getById(recharge.id);
  }

  static async update(id, data) {
    const recharge = await Recharge.findByPk(id);
    if (!recharge) return null;

    await recharge.update(data);
    return await this.getById(id);
  }

  static async delete(id) {
    const recharge = await Recharge.findByPk(id);
    if (!recharge) return false;

    await recharge.destroy();
    return true;
  }

  static async getDuePayments() {
    const today = new Date().toISOString().split('T')[0];
    
    const duePayments = await Recharge.findAll({
      where: {
        status: 'pending',
        due_date: {
          [Op.lte]: today
        }
      },
      include: [{
        model: Customer,
        as: 'customer',
        attributes: ['id', 'name', 'phone']
      }],
      order: [['due_date', 'ASC']]
    });

    return this.formatRecharges(duePayments);
  }

  static async getStats() {
    const [stats] = await Recharge.findAll({
      attributes: [
        [Recharge.sequelize.fn('COUNT', Recharge.sequelize.col('id')), 'total'],
        [Recharge.sequelize.fn('SUM', Recharge.sequelize.literal("CASE WHEN status = 'pending' THEN 1 ELSE 0 END")), 'pending'],
        [Recharge.sequelize.fn('SUM', Recharge.sequelize.literal("CASE WHEN status = 'paid' THEN 1 ELSE 0 END")), 'paid'],
        [Recharge.sequelize.fn('SUM', Recharge.sequelize.literal("CASE WHEN status = 'overdue' THEN 1 ELSE 0 END")), 'overdue'],
        [Recharge.sequelize.fn('SUM', Recharge.sequelize.literal("CASE WHEN status = 'paid' THEN amount ELSE 0 END")), 'total_paid'],
        [Recharge.sequelize.fn('SUM', Recharge.sequelize.literal("CASE WHEN status = 'pending' THEN amount ELSE 0 END")), 'total_pending']
      ],
      raw: true
    });

    return stats || { total: 0, pending: 0, paid: 0, overdue: 0, total_paid: 0, total_pending: 0 };
  }

  static formatRecharge(recharge) {
    const formatted = recharge.toJSON();
    return {
      ...formatted,
      customer_name: recharge.customer?.name,
      customer_phone: recharge.customer?.phone,
      customer_email: recharge.customer?.email
    };
  }

  static formatRecharges(recharges) {
    return recharges.map(recharge => ({
      ...recharge.toJSON(),
      customer_name: recharge.customer?.name,
      customer_phone: recharge.customer?.phone
    }));
  }
}

module.exports = RechargeService;

