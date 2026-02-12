const { Connection } = require('../models');
const QueryBuilder = require('../helpers/queryBuilder');
const { enrichWithCustomerData, fetchCustomerData } = require('../helpers/customerHelper');

// Performance constants
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 1000;
const QUERY_TIMEOUT_MS = 5000; // 5 second query timeout

const getAll = async (filters = {}, companyId, skipEnrichment = false) => {
  const startTime = Date.now();
  console.log('🔗 Connection service called:', { filters, companyId, skipEnrichment });
  
  try {
    // Extract and validate pagination parameters
    const { 
      status, 
      customer_id, 
      limit = DEFAULT_PAGE_SIZE, 
      offset = 0,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = filters;

    // Validate and sanitize pagination parameters
    const validLimit = Math.min(Math.max(parseInt(limit) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
    const validOffset = Math.max(parseInt(offset) || 0, 0);
    
    console.log('🔗 Pagination params:', { limit: validLimit, offset: validOffset, sort_by, sort_order });

    // Build optimized where clause
    const where = QueryBuilder.combineWhere(
      QueryBuilder.buildStatusFilter(status),
      customer_id ? { customer_id } : {},
      companyId ? { company_id: companyId } : {}
    );

    console.log('🔗 Query where clause:', where);
    const queryStartTime = Date.now();

    // Optimized database query with pagination and indexing-friendly ordering
    const connections = await Connection.findAll({
      where,
      attributes: ['id', 'customer_id', 'connection_type', 'installation_date', 'activation_date', 'status', 'notes', 'createdAt', 'updatedAt'],
      order: [[sort_by, sort_order.toUpperCase()]],
      limit: validLimit,
      offset: validOffset,
      // Add query timeout for safety
      benchmark: true,
      logging: process.env.NODE_ENV === 'development' ? (sql, timing) => {
        console.log('🔗 Query executed in', timing, 'ms');
      } : false
    });

    const queryTime = Date.now() - queryStartTime;
    console.log('🔗 Database query completed in', queryTime, 'ms, found', connections.length, 'connections');

    // Performance safeguard
    if (queryTime > QUERY_TIMEOUT_MS) {
      console.warn('⚠️ Query exceeded performance threshold:', queryTime, 'ms');
    }

    // Skip enrichment for performance-critical operations
    if (skipEnrichment) {
      const result = connections.map(conn => conn.toJSON ? conn.toJSON() : conn);
      const totalTime = Date.now() - startTime;
      console.log('🔗 Connection service completed (skip enrichment) in', totalTime, 'ms');
      return result;
    }

    // Only enrich if we have a reasonable number of records
    if (connections.length <= 100) {
      const enrichmentStartTime = Date.now();
      const enrichedResult = await enrichWithCustomerData(connections, 'customer_id');
      const enrichmentTime = Date.now() - enrichmentStartTime;
      const totalTime = Date.now() - startTime;
      
      console.log('🔗 Enrichment completed in', enrichmentTime, 'ms');
      console.log('🔗 Connection service completed (with enrichment) in', totalTime, 'ms');
      return enrichedResult;
    } else {
      console.warn('⚠️ Skipping enrichment for large dataset:', connections.length, 'records');
      const result = connections.map(conn => conn.toJSON ? conn.toJSON() : conn);
      const totalTime = Date.now() - startTime;
      console.log('🔗 Connection service completed (large dataset, no enrichment) in', totalTime, 'ms');
      return result;
    }

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('🔗 Connection service failed after', totalTime, 'ms:', error);
    
    // Fallback for column errors
    if (error.message && (error.message.includes('Unknown column') || error.message.includes('doesn\'t exist') || error.message.includes('ER_BAD_FIELD_ERROR'))) {
      try {
        const { status, customer_id, limit = DEFAULT_PAGE_SIZE, offset = 0 } = filters;
        const validLimit = Math.min(Math.max(parseInt(limit) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
        const validOffset = Math.max(parseInt(offset) || 0, 0);
        
        const where = QueryBuilder.combineWhere(
          QueryBuilder.buildStatusFilter(status),
          customer_id ? { customer_id } : {},
          companyId ? { company_id: companyId } : {}
        );
        
        const connections = await Connection.findAll({
          where,
          attributes: ['id', 'customer_id', 'connection_type', 'installation_date', 'activation_date', 'status', 'notes', 'createdAt', 'updatedAt'],
          order: [['created_at', 'DESC']],
          limit: validLimit,
          offset: validOffset
        });
        
        return connections.map(conn => conn.toJSON ? conn.toJSON() : conn);
      } catch (fallbackError) {
        console.error('🔗 Fallback query also failed:', fallbackError);
        throw fallbackError;
      }
    }
    throw error;
  }
};

// Get total count for pagination
const getCount = async (filters = {}, companyId) => {
  try {
    const { status, customer_id } = filters;
    
    const where = QueryBuilder.combineWhere(
      QueryBuilder.buildStatusFilter(status),
      customer_id ? { customer_id } : {},
      companyId ? { company_id: companyId } : {}
    );

    const count = await Connection.count({ where });
    return count;
  } catch (error) {
    console.error('🔗 Failed to get connection count:', error);
    return 0;
  }
};

const getById = async (id, companyId) => {
  try {
    const whereClause = companyId ? { id, company_id: companyId } : { id };
    
    const connection = await Connection.findOne({
      where: whereClause,
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

const create = async (data, companyId) => {
  const connectionData = {
    ...data,
    company_id: companyId
  };
  const connection = await Connection.create(connectionData);
  return await getById(connection.id, companyId);
};

const update = async (id, data, companyId) => {
  const whereClause = companyId ? { id, company_id: companyId } : { id };
  const connection = await Connection.findOne({ where: whereClause });
  if (!connection) return null;

  await connection.update(data);
  return await getById(id, companyId);
};

const deleteConnection = async (id, companyId) => {
  const whereClause = companyId ? { id, company_id: companyId } : { id };
  const connection = await Connection.findOne({ where: whereClause });
  if (!connection) return false;

  await connection.destroy();
  return true;
};

const getStats = async (companyId) => {
  const whereClause = companyId ? { company_id: companyId } : {};
  
  const [stats] = await Connection.findAll({
    where: whereClause,
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
  getCount,
  getById,
  create,
  update,
  delete: deleteConnection,
  getStats
};
