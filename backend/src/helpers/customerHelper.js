const { Customer } = require('../models');

const fetchCustomerData = async (customerId) => {
  if (!customerId) {
    return { name: null, phone: null, whatsapp_number: null, address: null };
  }

  try {
    const customer = await Customer.findByPk(customerId, {
      attributes: ['name', 'phone', 'whatsapp_number', 'address'],
      raw: true
    });

    if (customer) {
      return {
        name: customer.name ?? null,
        phone: customer.whatsapp_number ?? customer.phone ?? null,
        whatsapp_number: customer.whatsapp_number ?? customer.phone ?? null,
        address: customer.address ?? null
      };
    }
  } catch (err) {
  }

  return { name: null, phone: null, whatsapp_number: null, address: null };
};

const enrichWithCustomerData = async (items, customerIdField = 'customer_id') => {
  return Promise.all(items.map(async (item) => {
    const itemData = item.toJSON ? item.toJSON() : item;
    const customerId = itemData[customerIdField] || itemData.customerId;
    
    const customerData = await fetchCustomerData(customerId);
    
    return {
      ...itemData,
      customer_name: customerData.name,
      customer_phone: customerData.phone,
      customer_address: customerData.address
    };
  }));
};

module.exports = {
  fetchCustomerData,
  enrichWithCustomerData
};

