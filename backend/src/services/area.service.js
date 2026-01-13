const { Area } = require('../models');

const getAll = async () => {
  return await Area.findAll({ order: [['name', 'ASC']] });
};

const getById = async (id) => {
  return await Area.findByPk(id);
};

const create = async (data) => {
  return await Area.create({
    name: data.name.trim(),
    description: data.description?.trim(),
    code: data.code?.trim()
  });
};

const update = async (id, data) => {
  const area = await Area.findByPk(id);
  if (!area) return null;

  if (data.name) area.name = data.name.trim();
  if (data.description !== undefined) area.description = data.description?.trim();
  if (data.code !== undefined) area.code = data.code?.trim();

  await area.save();
  return area;
};

module.exports = { getAll, getById, create, update };