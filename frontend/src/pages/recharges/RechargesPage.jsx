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
import Loader from '../../components/common/Loader';

const RechargesPage = () => {
  const { user } = useAuthStore();
  const [recharges, setRecharges] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [duePayments, setDuePayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRecharge, setEditingRecharge] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const debounceTimer = useRef(null);
  const isInitialMount = useRef(true);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm();

  const loadRecharges = useCallback(async (search = '', status = '', isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setSearching(true);
      }
      const response = await rechargeService.getAll({ status });
      let rechargesList = [];
      if (Array.isArray(response)) {
        rechargesList = response;
      } else if (response?.recharges && Array.isArray(response.recharges)) {
        rechargesList = response.recharges;
      } else if (response?.data?.recharges && Array.isArray(response.data.recharges)) {
        rechargesList = response.data.recharges;
      } else if (response?.data && Array.isArray(response.data)) {
        rechargesList = response.data;
      }
      
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
  }, []);

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

  // Initial load
  useEffect(() => {
    if (isInitialMount.current) {
      loadRecharges('', '', true);
      loadCustomers();
      loadDuePayments();
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

      // Prepare submit data
      const submitData = {
        customer_id: customerIdStr,
        amount: parseFloat(data.amount) ?? 0,
        payment_method: data.payment_method ?? 'cash',
        status: data.status ?? 'pending',
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
    reset({
      ...recharge,
      customer_id: recharge.customer_id ?? recharge.customer?.id,
      due_date: recharge.due_date ? dayjs(recharge.due_date).toDate() : null,
      payment_date: recharge.payment_date ? dayjs(recharge.payment_date).toDate() : null,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this recharge?')) {
      try {
        await rechargeService.delete(id);
        toast.success('Recharge deleted successfully!');
        await loadRecharges(searchTerm, statusFilter, false);
        await loadDuePayments();
      } catch (error) {
        const errorMsg = error.response?.data?.message ?? error.response?.data?.error ?? 'Failed to delete recharge';
        toast.error(errorMsg);
      }
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
            onClick={() => { reset(); setEditingRecharge(null); setShowModal(true); }}
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
                  No recharges found. {canManage && 'Click "Add Recharge" to create one.'}
                </td>
              </tr>
            ) : (
              recharges.map((recharge) => (
                <tr key={recharge.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{recharge.customer_name ?? recharge.customer_id}</td>
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
                      <>
                        {recharge.status === 'pending' && (
                          <button
                            onClick={() => handleMarkPaid(recharge.id)}
                            className="text-green-600 hover:text-green-900 mr-4"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button onClick={() => handleEdit(recharge)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(recharge.id)} className="text-red-600 hover:text-red-900">
                          Delete
                        </button>
                      </>
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
          onClose={() => { setShowModal(false); reset(); setEditingRecharge(null); }}
          title={editingRecharge ? 'Edit Recharge' : 'Add Recharge'}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer *</label>
                  <select
                    {...register('customer_id', { 
                      required: 'Customer is required',
                      validate: (value) => {
                        if (!value || value === '' || value === 'undefined') {
                          return 'Please select a customer';
                        }
                        return true;
                      }
                    })}
                    className="mt-1 block w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={String(customer.id)}>{customer.name}</option>
                    ))}
                  </select>
                  {errors.customer_id && <p className="text-red-500 text-sm">{errors.customer_id.message}</p>}
                </div>
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
              </div>
              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-4">
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
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  {...register('notes')}
                  className="mt-1 block w-full px-3 py-2 border rounded-md"
                  rows="3"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); reset(); setEditingRecharge(null); }}
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
    </div>
  );
};

export default RechargesPage;
