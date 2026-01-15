import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { connectionService } from '../../services/connectionService';
import { customerService } from '../../services/customerService';
import useAuthStore from '../../stores/authStore';
import { isManager } from '../../utils/permission.utils';
import Modal from '../../components/common/Modal';
import TablePagination from '../../components/common/TablePagination';
import Loader from '../../components/common/Loader';

const ConnectionsPage = () => {
  const { user } = useAuthStore();
  const [connections, setConnections] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingConnection, setEditingConnection] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const debounceTimer = useRef(null);
  const isInitialMount = useRef(true);

  const { register, handleSubmit, reset, control, formState: { errors, touchedFields } } = useForm();

  const loadConnections = useCallback(async (search = '', status = '', isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setSearching(true);
      }
      const response = await connectionService.getAll({ status });
      let connectionsList = [];
      
      // Handle different response structures
      if (Array.isArray(response)) {
        connectionsList = response;
      } else if (response?.connections && Array.isArray(response.connections)) {
        connectionsList = response.connections;
      } else if (response?.data?.connections && Array.isArray(response.data.connections)) {
        connectionsList = response.data.connections;
      } else if (response?.data && Array.isArray(response.data)) {
        connectionsList = response.data;
      }
      
      // Ensure customer_name is properly set for each connection
      connectionsList = connectionsList.map(connection => {
        // If customer_name is missing but we have customer_id, try to find customer from local list
        let customerName = connection.customer_name || null;
        let customerPhone = connection.customer_phone || null;
        
        // If customer_name is not set from backend, try to get it from local customers list
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
      
      // Filter by search term on frontend if needed (or implement backend search)
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
      
      // Ensure all customers have valid UUID IDs
      customersList = customersList.filter(customer => customer && customer.id);
      
      setCustomers(customersList);
    } catch (error) {
      toast.error('Failed to load customers');
      setCustomers([]);
    }
  }, []);

  // Initial load - load customers first, then connections
  useEffect(() => {
    if (isInitialMount.current) {
      const initializeData = async () => {
        await loadCustomers();
        await loadConnections('', '', true);
      };
      initializeData();
      isInitialMount.current = false;
    }
  }, [loadConnections, loadCustomers]);

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
      loadConnections(searchTerm, statusFilter, false);
      setCurrentPage(1);
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchTerm, statusFilter, loadConnections]);

  const onSubmit = async (data) => {
    try {
      // react-hook-form already validates required fields, so if we get here, customer_id should be present
      // But let's still validate the format
      const customerId = data.customer_id;
      const customerIdStr = String(customerId ?? '').trim();
      
      // Validate customer_id is a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (!customerIdStr || !uuidRegex.test(customerIdStr)) {
        toast.error('Invalid customer ID. Please select a customer again.');
        return;
      }

      // Prepare submit data - ensure customer_id is UUID string, dates are ISO8601 format
      const submitData = {
        customer_id: customerIdStr,
        connection_type: data.connection_type?.trim() ?? '',
        status: data.status ?? 'pending',
      };

      // Only include notes if provided
      if (data.notes && data.notes.trim()) {
        submitData.notes = data.notes.trim();
      }

      // Only include dates if they have valid values (ISO8601 format)
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
      reset();
      setShowModal(false);
      setEditingConnection(null);
      await loadConnections(searchTerm, statusFilter, false);
    } catch (error) {
      // Handle validation errors - show all validation messages
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const validationErrors = error.response.data.errors
          .map(err => err.msg ?? err.message ?? JSON.stringify(err))
          .filter((msg, index, self) => self.indexOf(msg) === index) // Remove duplicates
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

  const handleEdit = (connection) => {
    setEditingConnection(connection);
    reset({
      ...connection,
      customer_id: connection.customer_id || connection.customer?.id,
      installation_date: connection.installation_date ? dayjs(connection.installation_date).toDate() : null,
      activation_date: connection.activation_date ? dayjs(connection.activation_date).toDate() : null,
    });
    setShowModal(true);
  };


  const canManage = isManager(user?.role);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Connections</h1>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search connections..."
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
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {canManage && (
          <button
            onClick={() => { reset(); setEditingConnection(null); setShowModal(true); }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 whitespace-nowrap"
          >
            Add Connection
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
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
              connections.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((connection) => (
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
                          onClick={() => handleEdit(connection)}
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
        {connections.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t">
            <TablePagination
              pagination={{
                currentPage,
                totalPages: Math.ceil(connections.length / pageSize),
                totalCount: connections.length,
              }}
              onPageChange={(page) => setCurrentPage(page)}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              pageSize={pageSize}
              isFetching={searching}
            />
          </div>
        )}
      </div>

      {showModal && canManage && (
        <Modal
          isOpen={showModal}
          onClose={() => { setShowModal(false); reset(); setEditingConnection(null); }}
          title={editingConnection ? 'Edit Connection' : 'Add Connection'}
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
                    className={`mt-1 block w-full px-3 py-2 border rounded-md ${
                      errors.customer_id && touchedFields.customer_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={String(customer.id)}>{customer.name}</option>
                    ))}
                  </select>
                  {errors.customer_id && touchedFields.customer_id && <p className="text-red-500 text-sm mt-1">{errors.customer_id.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Connection Type *</label>
                  <select
                    {...register('connection_type', { required: 'Connection type is required' })}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md ${
                      errors.connection_type && touchedFields.connection_type ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Connection Type</option>
                    <option value="Fiber">Fiber</option>
                    <option value="Wireless">Wireless</option>
                  </select>
                  {errors.connection_type && touchedFields.connection_type && <p className="text-red-500 text-sm mt-1">{errors.connection_type.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Date</label>
                  <Controller
                    name="installation_date"
                    control={control}
                    render={({ field }) => (
                      <DatePickerInput
                        {...field}
                        value={field.value ? dayjs(field.value).toDate() : null}
                        onChange={(date) => field.onChange(date)}
                        placeholder="Select registration date"
                        className="w-full"
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Activation Date</label>
                  <Controller
                    name="activation_date"
                    control={control}
                    render={({ field }) => (
                      <DatePickerInput
                        {...field}
                        value={field.value ? dayjs(field.value).toDate() : null}
                        onChange={(date) => field.onChange(date)}
                        placeholder="Select activation date"
                        className="w-full"
                      />
                    )}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select {...register('status')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  {...register('notes')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); reset(); setEditingConnection(null); }}
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

export default ConnectionsPage;

