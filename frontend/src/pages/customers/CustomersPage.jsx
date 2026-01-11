import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { customerService } from '../../services/customerService';
import useAuthStore from '../../stores/authStore';
import { isManager } from '../../utils/permission.utils';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import TablePagination from '../../components/common/TablePagination';
import { transformBackendPagination } from '../../utils/pagination.utils';
import Loader from '../../components/common/Loader';

const CustomersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paginationState, setPaginationState] = useState({ page: 1, pageSize: 10 });
  const debounceTimer = useRef(null);
  const isInitialMount = useRef(true);
  const isManualReload = useRef(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const loadCustomers = useCallback(async (search = '', status = '', page = 1, pageSize = 10, isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setSearching(true);
      }
      
      const response = await customerService.getAll({ search, status, page, limit: pageSize });
      
      let customersData = [];
      let backendPagination = null;
      
      if (response) {
        if (response.data && Array.isArray(response.data)) {
          customersData = response.data;
          backendPagination = response.pagination;
        } else if (Array.isArray(response)) {
          customersData = response;
        }
      }
      
      // Ensure email and address are properly mapped - preserve existing values
      customersData = customersData.map(customer => {
        // Preserve email and address if they exist, otherwise set to null
        const email = customer.email ?? customer.Email ?? customer.email_address ?? null;
        const address = customer.address ?? customer.Address ?? customer.customer_address ?? null;
        
        return {
          ...customer,
          email: email,
          address: address
        };
      });
      
      setCustomers(customersData);

      if (backendPagination) {
        const transformedPagination = transformBackendPagination(backendPagination, {
          fallbackPage: page,
          fallbackLimit: pageSize,
        });
        setPagination(transformedPagination);
      } else {
        setPagination({
          currentPage: page,
          totalPages: Math.ceil(customersData.length / pageSize) || 1,
          totalCount: customersData.length,
          limit: pageSize,
        });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message ?? error.message ?? 'Failed to load customers';
      toast.error(errorMsg);
      setCustomers([]);
      setPagination({
        currentPage: page,
        totalPages: 1,
        totalCount: 0,
        limit: pageSize,
      });
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      loadCustomers('', '', 1, 10, true);
      isInitialMount.current = false;
    }
  }, [loadCustomers]);

  useEffect(() => {
    if (isInitialMount.current) {
      return;
    }
    setPaginationState(prev => ({ ...prev, page: 1 }));
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (isInitialMount.current) {
      return;
    }

    if (isManualReload.current) {
      isManualReload.current = false;
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    if (searchTerm || statusFilter) {
      setSearching(true);
    }
    
    debounceTimer.current = setTimeout(() => {
      loadCustomers(searchTerm, statusFilter, paginationState.page, paginationState.pageSize, false);
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchTerm, statusFilter, paginationState.page, paginationState.pageSize, loadCustomers]);

  const handlePageChange = useCallback((page) => {
    setPaginationState(prev => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((pageSize) => {
    setPaginationState(prev => ({
      ...prev,
      pageSize,
      page: 1,
    }));
  }, []);

  const onSubmit = async (data) => {
    try {
      if (editingCustomer) {
        await customerService.update(editingCustomer.id, data);
        toast.success('Customer updated successfully!');
        reset();
        setShowModal(false);
        setEditingCustomer(null);
        isManualReload.current = true;
        await loadCustomers(searchTerm, statusFilter, paginationState.page, paginationState.pageSize, false);
      } else {
        await customerService.create(data);
        toast.success('Customer created successfully!');
        reset();
        setShowModal(false);
        setEditingCustomer(null);
        isManualReload.current = true;
        setPaginationState(prev => ({ ...prev, page: 1 }));
        await loadCustomers(searchTerm, statusFilter, 1, paginationState.pageSize, false);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message ?? error.response?.data?.error ?? 'Failed to save customer';
      toast.error(errorMsg);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    reset(customer);
    setShowModal(true);
  };

  const handleDelete = (customer) => {
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;

    try {
      await customerService.delete(customerToDelete.id);
      toast.success('Customer deleted successfully!');
      setShowDeleteModal(false);
      setCustomerToDelete(null);
      isManualReload.current = true;
      await loadCustomers(searchTerm, statusFilter, paginationState.page, paginationState.pageSize, false);
    } catch (error) {
      const errorMsg = error.response?.data?.message ?? error.response?.data?.error ?? 'Failed to delete customer';
      toast.error(errorMsg);
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No customers found.
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
                  <td className="px-6 py-4 whitespace-nowrap">{customer.email ?? '-'}</td>
                  <td className="px-6 py-4">{customer.address ?? '-'}</td>
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
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(customer)}
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
        
        {pagination && pagination.totalPages > 0 && (
          <TablePagination
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSize={paginationState.pageSize}
            isFetching={searching}
          />
        )}
      </div>

      {showModal && canManage && (
        <Modal
          isOpen={showModal}
          onClose={() => { setShowModal(false); reset(); setEditingCustomer(null); }}
          title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    className="mt-1 block w-full px-3 py-2 border rounded-md"
                  />
                  {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Father Name</label>
                  <input
                    {...register('father_name')}
                    className="mt-1 block w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <select {...register('gender')} className="mt-1 block w-full px-3 py-2 border rounded-md">
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone *</label>
                  <input
                    {...register('phone', { required: 'Phone is required' })}
                    className="mt-1 block w-full px-3 py-2 border rounded-md"
                  />
                  {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">WhatsApp Number</label>
                  <input
                    {...register('whatsapp_number')}
                    className="mt-1 block w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    {...register('email', { pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })}
                    type="email"
                    className="mt-1 block w-full px-3 py-2 border rounded-md"
                  />
                  {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    {...register('address')}
                    className="mt-1 block w-full px-3 py-2 border rounded-md"
                    rows="3"
                  />
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

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCustomerToDelete(null);
        }}
        title="Delete Customer"
        itemName={customerToDelete?.name}
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default CustomersPage;
