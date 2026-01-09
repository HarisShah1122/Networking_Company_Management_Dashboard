import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { connectionService } from '../../services/connectionService';
import { customerService } from '../../services/customerService';
import useAuthStore from '../../stores/authStore';
import { isManager } from '../../utils/permission.utils';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';

const ConnectionsPage = () => {
  const { user } = useAuthStore();
  const [connections, setConnections] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConnection, setEditingConnection] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm();

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      const [connectionsData, customersData] = await Promise.all([
        connectionService.getAll({ status: statusFilter }),
        customerService.getAll(),
      ]);
      setConnections(connectionsData.connections || []);
      setCustomers(customersData.customers || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      const submitData = {
        ...data,
        installation_date: data.installation_date ? dayjs(data.installation_date).format('YYYY-MM-DD') : null,
        activation_date: data.activation_date ? dayjs(data.activation_date).format('YYYY-MM-DD') : null,
      };
      if (editingConnection) {
        await connectionService.update(editingConnection.id, submitData);
      } else {
        await connectionService.create(submitData);
      }
      reset();
      setShowModal(false);
      setEditingConnection(null);
      loadData();
    } catch (error) {
      console.error('Error saving connection:', error);
    }
  };

  const handleEdit = (connection) => {
    setEditingConnection(connection);
    reset({
      ...connection,
      installation_date: connection.installation_date ? dayjs(connection.installation_date).toDate() : null,
      activation_date: connection.activation_date ? dayjs(connection.activation_date).toDate() : null,
    });
    setShowModal(true);
  };

  const canManage = isManager(user?.role);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Connections</h1>
        {canManage && (
          <button
            onClick={() => { reset(); setEditingConnection(null); setShowModal(true); }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Add Connection
          </button>
        )}
      </div>

      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Installation Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activation Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {connections.map((connection) => (
              <tr key={connection.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">{connection.customer_name || connection.customer_id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{connection.connection_type}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    connection.status === 'completed' ? 'bg-green-100 text-green-800' :
                    connection.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
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
                    <button onClick={() => handleEdit(connection)} className="text-indigo-600 hover:text-indigo-900">
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
                    {...register('customer_id', { required: 'Customer is required', valueAsNumber: true })}
                    className="mt-1 block w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                  {errors.customer_id && <p className="text-red-500 text-sm">{errors.customer_id.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Connection Type *</label>
                  <input
                    {...register('connection_type', { required: 'Connection type is required' })}
                    className="mt-1 block w-full px-3 py-2 border rounded-md"
                  />
                  {errors.connection_type && <p className="text-red-500 text-sm">{errors.connection_type.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Installation Date</label>
                  <Controller
                    name="installation_date"
                    control={control}
                    render={({ field }) => (
                      <DatePickerInput
                        {...field}
                        value={field.value ? dayjs(field.value).toDate() : null}
                        onChange={(date) => field.onChange(date)}
                        placeholder="Select installation date"
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
                <select {...register('status')} className="mt-1 block w-full px-3 py-2 border rounded-md">
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
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

