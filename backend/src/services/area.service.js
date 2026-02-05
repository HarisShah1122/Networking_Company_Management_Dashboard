const { Area } = require('../models');

const getAll = async (companyId) => {
  const whereClause = companyId ? { company_id: companyId } : {};
  console.log('AreaService.getAll - companyId:', companyId, 'whereClause:', whereClause);
  return await Area.findAll({ 
    where: whereClause,
    order: [['name', 'ASC']] 
  });
};

const getById = async (id, companyId) => {
  return await Area.findOne({ 
    where: { 
      id, 
      company_id: companyId 
    } 
  });
};

const create = async (data, companyId) => {
  if (!companyId) {
    throw new Error('Company ID is required to create an area');
  }
  
  console.log('AreaService.create - companyId:', companyId, 'data:', data);
  
  return await Area.create({
    name: data.name.trim(),
    description: data.description?.trim(),
    code: data.code?.trim(),
    company_id: companyId
  });
};

const update = async (id, data, companyId) => {
  const area = await Area.findOne({ 
    where: { 
      id, 
      company_id: companyId 
    } 
  });
  if (!area) return null;
  
  if (data.name) area.name = data.name.trim();
  if (data.description !== undefined) area.description = data.description?.trim();
  if (data.code !== undefined) area.code = data.code?.trim();

  await area.save();
  return area;
};

module.exports = { getAll, getById, create, update };
