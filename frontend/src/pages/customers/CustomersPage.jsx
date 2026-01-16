import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { customerService } from '../../services/customerService';
import { areaService } from '../../services/areaService';
import { connectionService } from '../../services/connectionService';
import useAuthStore from '../../stores/authStore';
import { isManager } from '../../utils/permission.utils';
import Modal from '../../components/common/Modal';
import TablePagination from '../../components/common/TablePagination';
import { transformBackendPagination } from '../../utils/pagination.utils';
import Loader from '../../components/common/Loader';

const CustomersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [customers, setCustomers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [connections, setConnections] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [connectionPagination, setConnectionPagination] = useState({ page: 1, pageSize: 10 });
  const [loading, setLoading] = useState(true);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [connectionsSearching, setConnectionsSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingConnection, setEditingConnection] = useState(null);
  const [activeTab, setActiveTab] = useState('customers');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [connectionSearchTerm, setConnectionSearchTerm] = useState('');
  const [connectionStatusFilter, setConnectionStatusFilter] = useState('');
  const [paginationState, setPaginationState] = useState({ page: 1, pageSize: 10 });
  const debounceTimer = useRef(null);
  const connectionDebounceTimer = useRef(null);
  const isInitialMount = useRef(true);
  const isManualReload = useRef(false);

  const { register, handleSubmit, reset, formState: { errors, touchedFields } } = useForm();
  const { register: registerConnection, handleSubmit: handleSubmitConnection, reset: resetConnection, control: controlConnection, formState: { errors: connectionErrors, touchedFields: connectionTouchedFields } } = useForm();

  const loadAreas = useCallback(async () => {
    try {
      const list = await areaService.getAll();
      setAreas(Array.isArray(list) ? list : []);
    } catch (e) {
      setAreas([]);
    }
  }, []);

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

  const loadConnections = useCallback(async (search = '', status = '', page = 1, pageSize = 10, isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setConnectionsLoading(true);
      } else {
        setConnectionsSearching(true);
      }
      
      const response = await connectionService.getAll({ status });
      let connectionsList = [];
      
      if (Array.isArray(response)) {
        connectionsList = response;
      } else if (response?.connections && Array.isArray(response.connections)) {
        connectionsList = response.connections;
      } else if (response?.data?.connections && Array.isArray(response.data.connections)) {
        connectionsList = response.data.connections;
      } else if (response?.data && Array.isArray(response.data)) {
        connectionsList = response.data;
      }
      
      // Ensure customer_name is properly set
      connectionsList = connectionsList.map(connection => {
        let customerName = connection.customer_name || null;
        let customerPhone = connection.customer_phone || null;
        
        if ((!customerName || customerName === null || customerName === '') && connection.customer_id) {
          if (customers.length > 0) {
            const customer = customers.find(c => String(c.id) === String(connection.customer_id));
            if (customer && customer.name) {
              customerName = customer.name;
              customerPhone = customer.whatsapp_number || customer.phone || null;
            }
          }
        }
        
        return {
          ...connection,
          customer_name: customerName,
          customer_phone: customerPhone
        };
      });
      
      // Filter by search term
      if (search && search.trim()) {
        const searchLower = search.toLowerCase();
        connectionsList = connectionsList.filter(conn => 
          (conn.customer_name && conn.customer_name.toLowerCase().includes(searchLower)) ||
          (conn.connection_type && conn.connection_type.toLowerCase().includes(searchLower)) ||
          (conn.customer_phone && conn.customer_phone.includes(search))
        );
      }
      
      setConnections(connectionsList);
    } catch (error) {
      const errorMsg = error.response?.data?.message ?? error.message ?? 'Failed to load connections';
      toast.error(errorMsg);
      setConnections([]);
    } finally {
      setConnectionsLoading(false);
      setConnectionsSearching(false);
    }
  }, [customers]);

  useEffect(() => {
    if (isInitialMount.current) {
      const initializeData = async () => {
        await loadAreas();
        await loadCustomers('', '', 1, 10, true);
        // Load connections after customers are loaded so customer names can be resolved
        await loadConnections('', '', 1, 10, true);
      };
      initializeData();
      isInitialMount.current = false;
    }
  }, [loadCustomers, loadAreas, loadConnections]);

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

  useEffect(() => {
    if (isInitialMount.current) {
      return;
    }

    if (connectionDebounceTimer.current) {
      clearTimeout(connectionDebounceTimer.current);
    }
    
    if (connectionSearchTerm || connectionStatusFilter) {
      setConnectionsSearching(true);
    }
    
    connectionDebounceTimer.current = setTimeout(() => {
      loadConnections(connectionSearchTerm, connectionStatusFilter, connectionPagination.page, connectionPagination.pageSize, false);
    }, 500);

    return () => {
      if (connectionDebounceTimer.current) {
        clearTimeout(connectionDebounceTimer.current);
      }
    };
  }, [connectionSearchTerm, connectionStatusFilter, connectionPagination.page, connectionPagination.pageSize, loadConnections]);

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
    // Ensure areaId is present for the select
    reset({
      ...customer,
      areaId: customer.areaId ?? customer.area_id ?? customer.AreaId ?? '',
    });
    setShowModal(true);
  };

  const handleEditConnection = (connection) => {
    setEditingConnection(connection);
    resetConnection({
      ...connection,
      customer_id: connection.customer_id || connection.customer?.id,
      installation_date: connection.installation_date ? dayjs(connection.installation_date).toDate() : null,
      activation_date: connection.activation_date ? dayjs(connection.activation_date).toDate() : null,
    });
    setShowConnectionModal(true);
  };

  const onSubmitConnection = async (data) => {
    try {
      const customerId = data.customer_id;
      const customerIdStr = String(customerId ?? '').trim();
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (!customerIdStr || !uuidRegex.test(customerIdStr)) {
        toast.error('Invalid customer ID. Please select a customer again.');
        return;
      }

      const submitData = {
        customer_id: customerIdStr,
        connection_type: data.connection_type?.trim() ?? '',
        status: data.status ?? 'pending',
      };

      if (data.notes && data.notes.trim()) {
        submitData.notes = data.notes.trim();
      }

      if (data.installation_date && dayjs(data.installation_date).isValid()) {
        submitData.installation_date = dayjs(data.installation_date).format('YYYY-MM-DD');
      }
      if (data.activation_date && dayjs(data.activation_date).isValid()) {
        submitData.activation_date = dayjs(data.activation_date).format('YYYY-MM-DD');
      }

      if (editingConnection) {
        await connectionService.update(editingConnection.id, submitData);
        toast.success('Connection updated successfully!');
      } else {
        await connectionService.create(submitData);
        toast.success('Connection created successfully!');
      }
      resetConnection();
      setShowConnectionModal(false);
      setEditingConnection(null);
      await loadConnections(connectionSearchTerm, connectionStatusFilter, connectionPagination.page, connectionPagination.pageSize, false);
    } catch (error) {
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const validationErrors = error.response.data.errors
          .map(err => err.msg ?? err.message ?? JSON.stringify(err))
          .filter((msg, index, self) => self.indexOf(msg) === index)
          .join(', ');
        toast.error(`Validation Error: ${validationErrors}`, { autoClose: 5000 });
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        const errorMsg = error.response?.data?.error ?? error.message ?? 'Failed to save connection';
        toast.error(errorMsg);
      }
    }
  };

  const canManage = isManager(user?.role);

  if (loading && activeTab === 'customers') return <Loader />;
  if (connectionsLoading && activeTab === 'connections') return <Loader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Customers & Connections</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('customers')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'customers'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Customers
          </button>
          <button
            onClick={() => setActiveTab('connections')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'connections'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Connections
          </button>
        </nav>
      </div>

      {activeTab === 'customers' && (
        <>
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
        <div 
          className="overflow-x-auto hide-scrollbar" 
          style={{ 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
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
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
        
        {pagination && pagination.totalPages > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t">
            <TablePagination
              pagination={pagination}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              pageSize={paginationState.pageSize}
              isFetching={searching}
            />
          </div>
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
                  <label className="block text-sm font-medium text-gray-700">PACE USER ID</label>
                  <input
                    {...register('pace_user_id')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., PACE-12345"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md ${
                      errors.name && touchedFields.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && touchedFields.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Father Name</label>
                  <input
                    {...register('father_name')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Area *</label>
                  <select
                    {...register('areaId', { required: 'Area is required' })}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md ${
                      errors.areaId && touchedFields.areaId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    defaultValue=""
                  >
                    <option value="">Select Area</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}{a.code ? ` (${a.code})` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.areaId && touchedFields.areaId && <p className="text-red-500 text-sm mt-1">{errors.areaId.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <select {...register('gender')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">WhatsApp Number</label>
                  <input
                    {...register('whatsapp_number')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone *</label>
                  <input
                    {...register('phone', { required: 'Phone is required' })}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md ${
                      errors.phone && touchedFields.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.phone && touchedFields.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    {...register('email', { pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })}
                    type="email"
                    className={`mt-1 block w-full px-3 py-2 border rounded-md ${
                      errors.email && touchedFields.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && touchedFields.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    {...register('address')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select {...register('status')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
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
      </>
      )}

      {activeTab === 'connections' && (
        <>
      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search connections..."
            value={connectionSearchTerm}
            onChange={(e) => setConnectionSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {connectionsSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            </div>
          )}
        </div>
        <select
          value={connectionStatusFilter}
          onChange={(e) => setConnectionStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {canManage && (
          <button
            onClick={() => { resetConnection(); setEditingConnection(null); setShowConnectionModal(true); }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 whitespace-nowrap"
          >
            Add Connection
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div 
          className="overflow-x-auto hide-scrollbar" 
          style={{ 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registration Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activation Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {connections.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No connections found.
                </td>
              </tr>
            ) : (
              connections.slice((connectionPagination.page - 1) * connectionPagination.pageSize, connectionPagination.page * connectionPagination.pageSize).map((connection) => (
                <tr key={connection.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{connection.customer_name ?? '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{connection.connection_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                      connection.status === 'completed' ? 'bg-green-600 text-white' :
                      connection.status === 'pending' ? 'bg-yellow-600 text-white' :
                      'bg-red-600 text-white'
                    }`}>
                      {connection.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {connection.installation_date ? new Date(connection.installation_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {connection.activation_date ? new Date(connection.activation_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {canManage && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditConnection(connection)}
                          className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
        
        {connections.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t">
            <TablePagination
              pagination={{
                currentPage: connectionPagination.page,
                totalPages: Math.ceil(connections.length / connectionPagination.pageSize),
                totalCount: connections.length,
                limit: connectionPagination.pageSize,
              }}
              onPageChange={(page) => setConnectionPagination(prev => ({ ...prev, page }))}
              onPageSizeChange={(size) => {
                setConnectionPagination(prev => ({ ...prev, pageSize: size, page: 1 }));
              }}
              pageSize={connectionPagination.pageSize}
              isFetching={connectionsSearching}
            />
          </div>
        )}
      </div>

      {showConnectionModal && canManage && (
        <Modal
          isOpen={showConnectionModal}
          onClose={() => { setShowConnectionModal(false); resetConnection(); setEditingConnection(null); }}
          title={editingConnection ? 'Edit Connection' : 'Add Connection'}
        >
          <form onSubmit={handleSubmitConnection(onSubmitConnection)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer *</label>
                  <select
                    {...registerConnection('customer_id', { 
                      required: 'Customer is required',
                      validate: (value) => {
                        if (!value || value === '' || value === 'undefined') {
                          return 'Please select a customer';
                        }
                        return true;
                      }
                    })}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md ${
                      connectionErrors.customer_id && connectionTouchedFields.customer_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={String(customer.id)}>{customer.name}</option>
                    ))}
                  </select>
                  {connectionErrors.customer_id && connectionTouchedFields.customer_id && <p className="text-red-500 text-sm mt-1">{connectionErrors.customer_id.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Connection Type *</label>
                  <select
                    {...registerConnection('connection_type', { required: 'Connection type is required' })}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md ${
                      connectionErrors.connection_type && connectionTouchedFields.connection_type ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Connection Type</option>
                    <option value="Fiber">Fiber</option>
                    <option value="Wireless">Wireless</option>
                  </select>
                  {connectionErrors.connection_type && connectionTouchedFields.connection_type && <p className="text-red-500 text-sm mt-1">{connectionErrors.connection_type.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Date</label>
                  <Controller
                    name="installation_date"
                    control={controlConnection}
                    render={({ field }) => (
                      <div className="w-full" style={{ minWidth: 0 }}>
                        <DatePickerInput
                          {...field}
                          value={field.value ? dayjs(field.value).toDate() : null}
                          onChange={(date) => field.onChange(date)}
                          placeholder="Select registration date"
                          className="w-full"
                          style={{ width: '100%' }}
                          dropdownType="popover"
                          clearable
                          valueFormat="DD/MM/YYYY"
                          popoverProps={{ withinPortal: true, zIndex: 12000 }}
                        />
                      </div>
                    )}
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Activation Date</label>
                  <Controller
                    name="activation_date"
                    control={controlConnection}
                    render={({ field }) => (
                      <div className="w-full" style={{ minWidth: 0 }}>
                        <DatePickerInput
                          {...field}
                          value={field.value ? dayjs(field.value).toDate() : null}
                          onChange={(date) => field.onChange(date)}
                          placeholder="Select activation date"
                          className="w-full"
                          style={{ width: '100%' }}
                          dropdownType="popover"
                          clearable
                          valueFormat="DD/MM/YYYY"
                          popoverProps={{ withinPortal: true, zIndex: 12000 }}
                        />
                      </div>
                    )}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select {...registerConnection('status')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  {...registerConnection('notes')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => { setShowConnectionModal(false); resetConnection(); setEditingConnection(null); }}
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
      </>
      )}

    </div>
  );
};

export default CustomersPage;
