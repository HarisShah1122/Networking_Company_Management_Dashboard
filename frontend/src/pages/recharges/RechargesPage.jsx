import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { rechargeService } from '../../services/rechargeService';
import { customerService } from '../../services/customerService';
import useAuthStore from '../../stores/authStore';
import { isManager } from '../../utils/permission.utils';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Loader from '../../components/common/Loader';

const RechargesPage = () => {
  const { user } = useAuthStore();
  const [recharges, setRecharges] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [duePayments, setDuePayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingRecharge, setEditingRecharge] = useState(null);
  const [rechargeToDelete, setRechargeToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const debounceTimer = useRef(null);
  const isInitialMount = useRef(true);

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm();
  const watchedCustomerId = watch('customer_id');

  const loadRecharges = useCallback(async (search = '', status = '', isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setSearching(true);
      }
      const response = await rechargeService.getAll({ status });
      let rechargesList = [];
      
      // Handle different response structures
      if (Array.isArray(response)) {
        rechargesList = response;
      } else if (response?.recharges && Array.isArray(response.recharges)) {
        rechargesList = response.recharges;
      } else if (response?.data?.recharges && Array.isArray(response.data.recharges)) {
        rechargesList = response.data.recharges;
      } else if (response?.data && Array.isArray(response.data)) {
        rechargesList = response.data;
      }
      
      // Ensure customer_name is properly set for each recharge
      rechargesList = rechargesList.map(recharge => {
        // If customer_name is missing but we have customer_id, try to find customer from local list
        let customerName = recharge.customer_name || null;
        let customerPhone = recharge.customer_phone || null;
        
        // If customer_name is not set from backend, try to get it from local customers list
        if ((!customerName || customerName === null || customerName === '') && recharge.customer_id) {
          if (customers.length > 0) {
            const customer = customers.find(c => String(c.id) === String(recharge.customer_id));
            if (customer && customer.name) {
              customerName = customer.name;
              customerPhone = customer.whatsapp_number || customer.phone || null;
            }
          }
        }
        
        return {
          ...recharge,
          customer_name: customerName,
          customer_phone: customerPhone
        };
      });
      
      // Filter by search term on frontend
      if (search && search.trim()) {
        const searchLower = search.toLowerCase();
        rechargesList = rechargesList.filter(recharge => 
          (recharge.customer_name && recharge.customer_name.toLowerCase().includes(searchLower)) ||
          (recharge.customer_phone && recharge.customer_phone.includes(search)) ||
          (recharge.amount && String(recharge.amount).includes(search))
        );
      }
      
      setRecharges(rechargesList);
    } catch (error) {
      const errorMsg = error.response?.data?.message ?? error.message ?? 'Failed to load recharges';
      toast.error(errorMsg);
      setRecharges([]);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, [customers]);

  const loadCustomers = useCallback(async () => {
    try {
      const response = await customerService.getAll();
      let customersList = [];
      if (Array.isArray(response)) {
        customersList = response;
      } else if (response?.customers && Array.isArray(response.customers)) {
        customersList = response.customers;
      } else if (response?.data?.customers && Array.isArray(response.data.customers)) {
        customersList = response.data.customers;
      } else if (response?.data && Array.isArray(response.data)) {
        customersList = response.data;
      }
      
      customersList = customersList.filter(customer => customer && customer.id);
      setCustomers(customersList);
    } catch (error) {
      toast.error('Failed to load customers');
      setCustomers([]);
    }
  }, []);

  const loadDuePayments = useCallback(async () => {
    try {
      const response = await rechargeService.getDuePayments();
      const dueList = response?.duePayments ?? response?.data?.duePayments ?? [];
      setDuePayments(dueList);
    } catch (error) {
      setDuePayments([]);
    }
  }, []);

  // Initial load - load customers first, then recharges
  useEffect(() => {
    if (isInitialMount.current) {
      const initializeData = async () => {
        await loadCustomers();
        await loadRecharges('', '', true);
        loadDuePayments();
      };
      initializeData();
      isInitialMount.current = false;
    }
  }, [loadRecharges, loadCustomers, loadDuePayments]);

  // Debounce search term and status filter
  useEffect(() => {
    if (isInitialMount.current) {
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    if (searchTerm || statusFilter) {
      setSearching(true);
    }
    
    debounceTimer.current = setTimeout(() => {
      loadRecharges(searchTerm, statusFilter, false);
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchTerm, statusFilter, loadRecharges]);

  useEffect(() => {
    if (watchedCustomerId) {
      const customer = customers.find(c => String(c.id) === String(watchedCustomerId));
      setSelectedCustomer(customer || null);
    } else {
      setSelectedCustomer(null);
    }
  }, [watchedCustomerId, customers]);

  const onSubmit = async (data) => {
    try {
      // Validate customer_id
      const customerId = data.customer_id;
      const customerIdStr = String(customerId ?? '').trim();
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (!customerIdStr || !uuidRegex.test(customerIdStr)) {
        toast.error('Invalid customer ID. Please select a customer again.');
        return;
      }

      // Get customer details from selectedCustomer
      let name = null;
      let address = null;
      let whatsapp_number = null;

      if (selectedCustomer) {
        name = selectedCustomer.name || null;
        address = selectedCustomer.address || null;
        whatsapp_number = selectedCustomer.whatsapp_number || selectedCustomer.phone || null;
      }

      // Prepare submit data
      const submitData = {
        customer_id: customerIdStr,
        amount: parseFloat(data.amount) ?? 0,
        payment_method: data.payment_method ?? 'cash',
        status: data.status ?? 'pending',
        package: data.package?.trim() || null,
        name: name,
        address: address,
        whatsapp_number: whatsapp_number,
      };

      // Only include dates if they have valid values
      if (data.due_date && dayjs(data.due_date).isValid()) {
        submitData.due_date = dayjs(data.due_date).format('YYYY-MM-DD');
      }
      if (data.payment_date && dayjs(data.payment_date).isValid()) {
        submitData.payment_date = dayjs(data.payment_date).format('YYYY-MM-DD');
      }

      // Only include notes if provided
      if (data.notes && data.notes.trim()) {
        submitData.notes = data.notes.trim();
      }

      if (editingRecharge) {
        await rechargeService.update(editingRecharge.id, submitData);
        toast.success('Recharge updated successfully!');
      } else {
        await rechargeService.create(submitData);
        toast.success('Recharge created successfully!');
      }
      reset();
      setShowModal(false);
      setEditingRecharge(null);
      setSelectedCustomer(null);
      await loadRecharges(searchTerm, statusFilter, false);
      await loadDuePayments();
    } catch (error) {
      console.error('Error saving recharge:', error);
      
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const validationErrors = error.response.data.errors
          .map(err => err.msg || err.message || JSON.stringify(err))
          .filter((msg, index, self) => self.indexOf(msg) === index)
          .join(', ');
        toast.error(`Validation Error: ${validationErrors}`, { autoClose: 5000 });
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        const errorMsg = error.response?.data?.error ?? error.message ?? 'Failed to save recharge';
        toast.error(errorMsg);
      }
    }
  };

  const handleEdit = (recharge) => {
    setEditingRecharge(recharge);
    const customerId = recharge.customer_id ?? recharge.customer?.id;
    const customer = customers.find(c => String(c.id) === String(customerId));
    setSelectedCustomer(customer || null);
    reset({
      ...recharge,
      customer_id: customerId,
      due_date: recharge.due_date ? dayjs(recharge.due_date).toDate() : null,
      payment_date: recharge.payment_date ? dayjs(recharge.payment_date).toDate() : null,
    });
    setShowModal(true);
  };

  const handleDelete = (recharge) => {
    setRechargeToDelete(recharge);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!rechargeToDelete) return;

    try {
      await rechargeService.delete(rechargeToDelete.id);
      toast.success('Recharge deleted successfully!');
      setShowDeleteModal(false);
      setRechargeToDelete(null);
      await loadRecharges(searchTerm, statusFilter, false);
      await loadDuePayments();
    } catch (error) {
      const errorMsg = error.response?.data?.message ?? error.response?.data?.error ?? 'Failed to delete recharge';
      toast.error(errorMsg);
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      // First get the recharge to include all required fields
      const rechargeResponse = await rechargeService.getById(id);
      
      // Handle different response structures
      let recharge = null;
      if (rechargeResponse?.recharge) {
        recharge = rechargeResponse.recharge;
      } else if (rechargeResponse?.data?.recharge) {
        recharge = rechargeResponse.data.recharge;
      } else if (rechargeResponse?.id) {
        recharge = rechargeResponse;
      } else {
        recharge = rechargeResponse;
      }
      
      if (!recharge || !recharge.id) {
        toast.error('Recharge not found or invalid data structure');
        return;
      }

      // Get customer_id - ensure it's a valid UUID string
      const customerId = recharge.customer_id ?? recharge.customer?.id;
      if (!customerId) {
        toast.error('Customer ID not found in recharge data');
        return;
      }
      const customerIdStr = String(customerId).trim();

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(customerIdStr)) {
        toast.error('Invalid customer ID format');
        return;
      }

      // Get amount - ensure it's a valid number
      const amountValue = recharge.amount;
      const amount = typeof amountValue === 'string' ? parseFloat(amountValue) : parseFloat(amountValue ?? 0);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Invalid amount in recharge data');
        return;
      }

      // Update with all required fields plus the status and payment_date
      const updateData = {
        customer_id: customerIdStr,
        amount: amount,
        payment_method: recharge.payment_method ?? 'cash',
        status: 'paid',
        payment_date: dayjs().format('YYYY-MM-DD'),
      };

      // Include optional fields if they exist
      if (recharge.due_date) {
        updateData.due_date = recharge.due_date;
      }
      if (recharge.notes) {
        updateData.notes = recharge.notes;
      }

      await rechargeService.update(id, updateData);
      toast.success('Recharge marked as paid!');
      await loadRecharges(searchTerm, statusFilter, false);
      await loadDuePayments();
    } catch (error) {
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const validationErrors = error.response.data.errors
          .map(err => err.msg ?? err.message ?? JSON.stringify(err))
          .filter((msg, index, self) => self.indexOf(msg) === index)
          .join(', ');
        toast.error(`Validation Error: ${validationErrors}`, { autoClose: 5000 });
      } else {
        const errorMsg = error.response?.data?.message ?? error.response?.data?.error ?? 'Failed to update recharge';
        toast.error(errorMsg);
      }
    }
  };

  const canManage = isManager(user?.role);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Recharges</h1>
      </div>

      {duePayments.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="font-semibold text-yellow-800 mb-2">Due Payments ({duePayments.length})</h2>
          <div className="space-y-2">
            {duePayments.slice(0, 5).map((payment) => (
              <div key={payment.id} className="flex justify-between text-sm">
                <span>{payment.customer_name} - RS {parseFloat(payment.amount).toFixed(2)}</span>
                <span className="text-yellow-700">Due: {new Date(payment.due_date).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search recharges..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            </div>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
        {canManage && (
          <button
            onClick={() => { reset(); setEditingRecharge(null); setSelectedCustomer(null); setShowModal(true); }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 whitespace-nowrap"
          >
            Add Recharge
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {recharges.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No recharges found.
                </td>
              </tr>
            ) : (
              recharges.map((recharge) => (
                <tr key={recharge.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{recharge.customer_name ?? '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">RS {parseFloat(recharge.amount).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{recharge.payment_method}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                      recharge.status === 'paid' ? 'bg-green-600 text-white' :
                      recharge.status === 'pending' ? 'bg-yellow-600 text-white' :
                      'bg-red-600 text-white'
                    }`}>
                      {recharge.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {recharge.due_date ? new Date(recharge.due_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {canManage && (
                      <div className="flex items-center justify-end gap-2">
                        {recharge.status === 'pending' && (
                          <button
                            onClick={() => handleMarkPaid(recharge.id)}
                            className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                            title="Mark Paid"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(recharge)}
                          className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(recharge)}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && canManage && (
        <Modal
          isOpen={showModal}
          onClose={() => { setShowModal(false); reset(); setEditingRecharge(null); setSelectedCustomer(null); }}
          title={editingRecharge ? 'Edit Recharge' : 'Add Recharge'}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">User ID *</label>
                <select
                  {...register('customer_id', { 
                    required: 'User ID is required',
                    validate: (value) => {
                      if (!value || value === '' || value === 'undefined') {
                        return 'Please select a User ID';
                      }
                      return true;
                    }
                  })}
                  className="mt-1 block w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select User ID</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={String(customer.id)}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                {errors.customer_id && <p className="text-red-500 text-sm mt-1">{errors.customer_id.message}</p>}
              </div>
              {selectedCustomer && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">User Details</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600">User ID</label>
                      <p className="text-sm text-gray-900 font-mono">{selectedCustomer.id || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Name</label>
                      <p className="text-sm text-gray-900">{selectedCustomer.name || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">WhatsApp No</label>
                      <p className="text-sm text-gray-900">{selectedCustomer.whatsapp_number || selectedCustomer.phone || '-'}</p>
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs font-medium text-gray-600">Address</label>
                      <p className="text-sm text-gray-900">{selectedCustomer.address || '-'}</p>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Package</label>
                <input
                  {...register('package')}
                  className="mt-1 block w-full px-3 py-2 border rounded-md"
                  placeholder="Enter package name"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount *</label>
                  <input
                    {...register('amount', { required: 'Amount is required', valueAsNumber: true, min: 0.01 })}
                    type="number"
                    step="0.01"
                    className="mt-1 block w-full px-3 py-2 border rounded-md"
                  />
                  {errors.amount && <p className="text-red-500 text-sm">{errors.amount.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <select {...register('payment_method')} className="mt-1 block w-full px-3 py-2 border rounded-md">
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="online">Online</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select {...register('status')} className="mt-1 block w-full px-3 py-2 border rounded-md">
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <Controller
                    name="due_date"
                    control={control}
                    render={({ field }) => (
                      <DatePickerInput
                        {...field}
                        value={field.value ? dayjs(field.value).toDate() : null}
                        onChange={(date) => field.onChange(date)}
                        placeholder="Select due date"
                        className="w-full"
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                  <Controller
                    name="payment_date"
                    control={control}
                    render={({ field }) => (
                      <DatePickerInput
                        {...field}
                        value={field.value ? dayjs(field.value).toDate() : null}
                        onChange={(date) => field.onChange(date)}
                        placeholder="Select payment date"
                        className="w-full"
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    {...register('notes')}
                    className="mt-1 block w-full px-3 py-2 border rounded-md"
                    rows="3"
                    placeholder="Enter notes"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); reset(); setEditingRecharge(null); setSelectedCustomer(null); }}
                  className="flex-1 px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg">
                  Save
                </button>
              </div>
            </form>
        </Modal>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setRechargeToDelete(null);
        }}
        title="Delete Recharge"
        itemName={rechargeToDelete ? `${rechargeToDelete.customer_name ?? 'Recharge'} - RS ${parseFloat(rechargeToDelete.amount || 0).toFixed(2)}` : ''}
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default RechargesPage;
