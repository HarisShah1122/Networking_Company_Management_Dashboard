const { Op } = require('sequelize');
const { Recharge } = require('../models');
const QueryBuilder = require('../helpers/queryBuilder');
const { enrichWithCustomerData, fetchCustomerData } = require('../helpers/customerHelper');

const getAll = async (filters = {}) => {
  try {
    const { status, customer_id } = filters;
    
    const where = QueryBuilder.combineWhere(
      QueryBuilder.buildStatusFilter(status),
      customer_id ? { customer_id } : {}
    );

    const recharges = await Recharge.findAll({
      where,
      attributes: ['id', 'customer_id', 'amount', 'payment_method', 'due_date', 'status', 'payment_date', 'notes', 'createdAt', 'updatedAt'],
      order: [['created_at', 'DESC']]
    });

    return await enrichWithCustomerData(recharges, 'customer_id');
  } catch (error) {
    if (error.message && (error.message.includes('Unknown column') || error.message.includes('doesn\'t exist') || error.message.includes('ER_BAD_FIELD_ERROR'))) {
      try {
        const { status, customer_id } = filters;
        const where = QueryBuilder.combineWhere(
          QueryBuilder.buildStatusFilter(status),
          customer_id ? { customer_id } : {}
        );
        const recharges = await Recharge.findAll({
          where,
          attributes: ['id', 'customer_id', 'amount', 'payment_method', 'due_date', 'status', 'payment_date', 'notes', 'createdAt', 'updatedAt'],
          order: [['created_at', 'DESC']]
        });
        
        return await enrichWithCustomerData(recharges, 'customer_id');
      } catch (finalError) {
        throw finalError;
      }
    }
    throw error;
  }
};

const getById = async (id) => {
  try {
    const recharge = await Recharge.findByPk(id, {
      attributes: ['id', 'customer_id', 'amount', 'payment_method', 'due_date', 'status', 'payment_date', 'notes', 'createdAt', 'updatedAt']
    });

    if (!recharge) return null;

    const rechargeData = recharge.toJSON ? recharge.toJSON() : recharge;
    const customerData = await fetchCustomerData(rechargeData.customer_id);
    
    return {
      ...rechargeData,
      customer_name: customerData.name,
      customer_phone: customerData.phone
    };
  } catch (error) {
    return null;
  }
};

const create = async (data) => {
  try {
    const { name, address, whatsapp_number, package: pkg, ...rechargeData } = data;
    
    const safeData = {
      customer_id: rechargeData.customer_id,
      amount: rechargeData.amount,
      payment_method: rechargeData.payment_method,
      due_date: rechargeData.due_date,
      status: rechargeData.status,
      payment_date: rechargeData.payment_date,
      notes: rechargeData.notes
    };
    
    const recharge = await Recharge.create(safeData);
    return await getById(recharge.id);
  } catch (error) {
    throw error;
  }
};

const update = async (id, data) => {
  try {
    const recharge = await Recharge.findByPk(id);
    if (!recharge) return null;

    const { name, address, whatsapp_number, package: pkg, ...rechargeData } = data;
    
    const safeData = {};
    if (rechargeData.customer_id !== undefined) safeData.customer_id = rechargeData.customer_id;
    if (rechargeData.amount !== undefined) safeData.amount = rechargeData.amount;
    if (rechargeData.payment_method !== undefined) safeData.payment_method = rechargeData.payment_method;
    if (rechargeData.due_date !== undefined) safeData.due_date = rechargeData.due_date;
    if (rechargeData.status !== undefined) safeData.status = rechargeData.status;
    if (rechargeData.payment_date !== undefined) safeData.payment_date = rechargeData.payment_date;
    if (rechargeData.notes !== undefined) safeData.notes = rechargeData.notes;
    
    await recharge.update(safeData);
    return await getById(id);
  } catch (error) {
    throw error;
  }
};

const deleteRecharge = async (id) => {
  const recharge = await Recharge.findByPk(id);
  if (!recharge) return false;

  await recharge.destroy();
  return true;
};

const getDuePayments = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const duePayments = await Recharge.findAll({
      where: {
        status: 'pending',
        due_date: {
          [Op.lte]: today
        }
      },
      attributes: ['id', 'customer_id', 'amount', 'payment_method', 'due_date', 'status', 'payment_date', 'notes', 'createdAt', 'updatedAt'],
      order: [['due_date', 'ASC']]
    });

    return await enrichWithCustomerData(duePayments, 'customer_id');
  } catch (error) {
    return [];
  }
};

const getStats = async () => {
  try {
    const sequelize = Recharge.sequelize;
    const [stats] = await Recharge.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'pending' THEN 1 ELSE 0 END")), 'pending'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'paid' THEN 1 ELSE 0 END")), 'paid'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'overdue' THEN 1 ELSE 0 END")), 'overdue'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'paid' THEN amount ELSE 0 END")), 'total_paid'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'pending' THEN amount ELSE 0 END")), 'total_pending']
      ],
      raw: true
    });

    return stats || { total: 0, pending: 0, paid: 0, overdue: 0, total_paid: 0, total_pending: 0 };
  } catch (error) {
    return { total: 0, pending: 0, paid: 0, overdue: 0, total_paid: 0, total_pending: 0 };
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteRecharge,
  getDuePayments,
  getStats
};
