import { COMPLAINT_STATUS, COMPLAINT_PRIORITY } from '../constants/complaintConstants';

export const transformComplaintData = (complaint, customers = []) => {
  const customer = customers.find(c => String(c.id) === String(complaint.customerId ?? complaint.customer_id)) ?? {};

  return {
    ...complaint,
    id: complaint.id ?? '',
    customerId: complaint.customerId ?? complaint.customer_id ?? '',
    name: complaint.name ?? customer.name ?? null,
    address: complaint.address ?? customer.address ?? null,
    whatsapp_number: complaint.whatsapp_number ?? customer.whatsapp_number ?? customer.phone ?? null,
    title: complaint.title ?? complaint.Title ?? '',
    description: complaint.description ?? complaint.Description ?? '',
    status: complaint.status ?? complaint.Status ?? COMPLAINT_STATUS.OPEN,
    priority: complaint.priority ?? complaint.Priority ?? COMPLAINT_PRIORITY.MEDIUM,
  };
};

export const filterComplaints = (complaints, searchTerm = '', statusFilter = '') => {
  let filtered = complaints;

  if (searchTerm?.trim()) {
    const term = searchTerm.toLowerCase().trim();
    filtered = filtered.filter(c =>
      (c.title ?? '').toLowerCase().includes(term) ||
      (c.description ?? '').toLowerCase().includes(term) ||
      (c.name ?? '').toLowerCase().includes(term)
    );
  }

  if (statusFilter) {
    filtered = filtered.filter(c => (c.status ?? '') === statusFilter);
  }

  return filtered;
};

export const validateComplaintForm = (data) => {
  const errors = {};

  if (!data.customerId) {
    errors.customerId = 'User ID is required';
  }

  if (!data.title?.trim()) {
    errors.title = 'Title is required';
  }

  if (!data.description?.trim() || data.description.trim().length < 10) {
    errors.description = 'Description is required and must be at least 10 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const prepareComplaintSubmitData = (data, selectedCustomer) => {
  const customerId = data.customerId || null;
  let name = null;
  let address = null;
  let whatsapp_number = null;

  if (customerId && selectedCustomer) {
    name = selectedCustomer.name || null;
    address = selectedCustomer.address || null;
    whatsapp_number = selectedCustomer.whatsapp_number || selectedCustomer.phone || null;
  }

  return {
    customerId,
    name,
    address,
    whatsapp_number,
    title: data.title.trim(),
    description: data.description.trim(),
    status: data.status || COMPLAINT_STATUS.OPEN,
    priority: data.priority || COMPLAINT_PRIORITY.MEDIUM,
  };
};
