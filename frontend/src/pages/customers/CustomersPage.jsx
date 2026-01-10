import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { customerService } from '../../services/customerService';
import useAuthStore from '../../stores/authStore';
import { isManager } from '../../utils/permission.utils';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';

const CustomersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const debounceTimer = useRef(null);
  const isInitialMount = useRef(true);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const loadCustomers = useCallback(async (search = '', status = '', isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setSearching(true);
      }
      const response = await customerService.getAll({ search, status });
      // Handle response structure: { customers: [...] } or { data: { customers: [...] } }
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
      setCustomers(customersList);
    } catch (error) {
      console.error('Error loading customers:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load customers';
      toast.error(errorMsg);
      setCustomers([]);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (isInitialMount.current) {
      loadCustomers('', '', true);
      isInitialMount.current = false;
    }
  }, [loadCustomers]);

  // Debounce search term and status filter
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      return;
    }

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Set searching state immediately for better UX
    if (searchTerm || statusFilter) {
      setSearching(true);
    }
    
    // Debounce the actual API call
    debounceTimer.current = setTimeout(() => {
      loadCustomers(searchTerm, statusFilter, false);
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchTerm, statusFilter, loadCustomers]);

  const onSubmit = async (data) => {
    try {
      if (editingCustomer) {
        await customerService.update(editingCustomer.id, data);
        toast.success('Customer updated successfully!');
      } else {
        await customerService.create(data);
        toast.success('Customer created successfully!');
      }
      reset();
      setShowModal(false);
      setEditingCustomer(null);
      // Reload with current search/filter values
      await loadCustomers(searchTerm, statusFilter, false);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to save customer';
      toast.error(errorMsg);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    reset(customer);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customerService.delete(id);
        toast.success('Customer deleted successfully!');
        // Reload with current search/filter values
        await loadCustomers(searchTerm, statusFilter, false);
      } catch (error) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to delete customer';
        toast.error(errorMsg);
      }
    }
  };

  const canManage = isManager(user?.role);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Customers</h1>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search customers..."
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
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        {canManage && (
          <button
            onClick={() => { reset(); setEditingCustomer(null); setShowModal(true); }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 whitespace-nowrap"
          >
            Add Customer
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No customers found. {canManage && 'Click "Add Customer" to create one.'}
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => navigate(`/customers/${customer.id}`)}
                      className="text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                      {customer.name}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{customer.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{customer.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                      customer.status === 'active' ? 'bg-green-600 text-white' :
                      customer.status === 'inactive' ? 'bg-gray-600 text-white' :
                      'bg-red-600 text-white'
                    }`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {canManage && (
                      <>
                        <button onClick={() => handleEdit(customer)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(customer.id)} className="text-red-600 hover:text-red-900">
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
          onClose={() => { setShowModal(false); reset(); setEditingCustomer(null); }}
          title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    className="mt-1 block w-full px-3 py-2 border rounded-md"
                  />
                  {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone *</label>
                  <input
                    {...register('phone', { required: 'Phone is required' })}
                    className="mt-1 block w-full px-3 py-2 border rounded-md"
                  />
                  {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    {...register('email', { pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })}
                    type="email"
                    className="mt-1 block w-full px-3 py-2 border rounded-md"
                  />
                  {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select {...register('status')} className="mt-1 block w-full px-3 py-2 border rounded-md">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea
                  {...register('address')}
                  className="mt-1 block w-full px-3 py-2 border rounded-md"
                  rows="3"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); reset(); setEditingCustomer(null); }}
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

export default CustomersPage;

