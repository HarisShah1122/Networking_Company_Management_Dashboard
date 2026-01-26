import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
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
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paginationState, setPaginationState] = useState({ page: 1, pageSize: 10 });

  const debounceTimer = useRef(null);
  const isInitialMount = useRef(true);     
  const isManualReload = useRef(false);    

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, touchedFields } } = useForm();
 
  const formatPhone = (value) => {
    if (!value) return value;
    let clean = value.replace(/[^\d+]/g, '');
    if (clean.startsWith('+')) return clean;
    clean = clean.replace(/\D/g, '');
    if (clean.length > 11) clean = clean.slice(0, 11);
    if (clean.length > 4) return clean.slice(0, 4) + ' ' + clean.slice(4);
    return clean;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setValue('phone', formatted, { shouldValidate: true });
  };

  const handleWhatsappChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setValue('whatsapp_number', formatted, { shouldValidate: true });
  };

  const handleNumberInput = (e) => {
    const char = e.key;
    const value = e.target.value;
    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(char)) return;
    if (char === '+' && value.length === 0) return;
    if (!/[0-9]/.test(char)) e.preventDefault();
  };

  const loadAreas = useCallback(async () => {
    try {
      const list = await areaService.getAll();
      setAreas(Array.isArray(list) ? list : []);
    } catch {
      setAreas([]);
    }
  }, []);

  const loadCustomers = useCallback(async (search = '', status = '', page = 1, pageSize = 10, isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setSearching(true);

      const response = await customerService.getAll({ search, status, page, limit: pageSize });
      let data = response?.data?.customers || response?.customers || response?.data || response || [];

      // Enrich with real company name
      data = data.map(c => ({
        ...c,
        email: c.email ?? null,
        address: c.address ?? null,
      }));
      

      setCustomers(data);

      const backendPag = response?.pagination;
      setPagination(
        backendPag
          ? transformBackendPagination(backendPag, { fallbackPage: page, fallbackLimit: pageSize })
          : {
              currentPage: page,
              totalPages: Math.ceil(data.length / pageSize) || 1,
              totalCount: data.length,
              limit: pageSize,
            }
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load customers', { autoClose: 3000 });
      setCustomers([]);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, []);

  const loadConnections = useCallback(async () => {
    try {
      const res = await connectionService.getAll({});
      let list = res?.connections || res?.data?.connections || res?.data || res || [];
      setConnections(list);
    } catch {}
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      const init = async () => {
        await Promise.all([loadAreas()]);
        await loadCustomers('', '', 1, 10, true);
        await loadConnections();
      };
      init();
      isInitialMount.current = false;
    }
  }, [loadAreas, loadCustomers, loadConnections]);

  useEffect(() => {
    if (isInitialMount.current) return;
    setPaginationState(prev => ({ ...prev, page: 1 }));
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (isInitialMount.current) return;
    if (isManualReload.current) {
      isManualReload.current = false;
      return;
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      loadCustomers(searchTerm, statusFilter, paginationState.page, paginationState.pageSize);
    }, 500);
    return () => clearTimeout(debounceTimer.current);
  }, [searchTerm, statusFilter, paginationState.page, paginationState.pageSize, loadCustomers]);

  const getConnectionForCustomer = (customerId) => {
    return connections.find(c => String(c.customer_id) === String(customerId)) || {};
  };

  const onSubmit = async (data) => {
    if (!data.area_id || data.area_id === '') {
      toast.error("Please select a valid area from the dropdown", { autoClose: 3000 });
      return;
    }

    const cleanPhone = (data.phone || '').replace(/\s/g, '');
    const cleanWhatsapp = (data.whatsapp_number || '').replace(/\s/g, '');

    if (cleanPhone.length > 13) {
      toast.error("Too many digits - maximum 13 characters");
      return;
    }
    if (cleanWhatsapp.length > 13) {
      toast.error("Too many digits - maximum 13 characters");
      return;
    }

    try {
      const customerPayload = {
        pace_user_id: data.pace_user_id?.trim() || undefined,
        name: data.name.trim(),
        father_name: data.father_name?.trim() || undefined,
        area_id: data.area_id,
        gender: data.gender || undefined,
        whatsapp_number: cleanWhatsapp || undefined,
        phone: cleanPhone,
        email: data.email?.trim() || undefined,
        address: data.address?.trim() || undefined,
        status: data.status || 'active',
        company_id: user?.company_id || null,
      };

      let customerId;

      if (editingCustomer) {
        await customerService.update(editingCustomer.id, customerPayload);
        customerId = editingCustomer.id;
      } else {
        const response = await customerService.create(customerPayload);
        customerId = response?.id || response?.data?.id || response?.customer?.id;
      }

      if (data.connection_type?.trim()) {
        const connPayload = {
          customer_id: customerId,
          connection_type: data.connection_type.trim(),
          installation_date: data.installation_date
            ? dayjs(data.installation_date).format('YYYY-MM-DD')
            : undefined,
          activation_date: data.activation_date
            ? dayjs(data.activation_date).format('YYYY-MM-DD')
            : undefined,
          status: data.connection_status || 'pending',
          notes: data.connection_notes?.trim() || undefined,
        };

        const existing = getConnectionForCustomer(customerId);
        if (existing.id) {
          await connectionService.update(existing.id, connPayload);
        } else {
          await connectionService.create(connPayload);
        }
      }

      toast.success(editingCustomer ? 'Customer updated successfully!' : 'Customer created successfully!', { autoClose: 3000 });
      reset();
      setShowModal(false);
      setEditingCustomer(null);

      // Force full reload (companies + customers) to show correct company name
      isManualReload.current = true;
      await loadCustomers(searchTerm, statusFilter, paginationState.page, paginationState.pageSize);
      await loadConnections();
    } catch (err) {
      console.error('Full error:', err);
      let errorMsg = 'Failed to save customer';
      if (err.response?.status === 422) {
        const backendErrors = err.response.data?.errors;
        if (Array.isArray(backendErrors)) {
          errorMsg = backendErrors.map(e => e.msg || e.message || JSON.stringify(e)).join('\n');
        } else if (err.response.data?.message) {
          errorMsg = err.response.data.message;
        } else {
          errorMsg = 'Validation failed - check required fields (most likely area_id)';
        }
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      toast.error(errorMsg, { autoClose: 5000 });
    }
  };

  const handleEdit = (customer) => {
    const conn = getConnectionForCustomer(customer.id);
    reset({
      ...customer,
      area_id: customer.area_id || '',
      connection_type: conn.connection_type || '',
      installation_date: conn.installation_date ? dayjs(conn.installation_date).toDate() : null,
      activation_date: conn.activation_date ? dayjs(conn.activation_date).toDate() : null,
      connection_status: conn.status || 'pending',
      connection_notes: conn.notes || '',
      phone: formatPhone(customer.phone || ''),
      whatsapp_number: formatPhone(customer.whatsapp_number || ''),
    });
    setEditingCustomer(customer);
    setShowModal(true);
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
            placeholder="Search customers by name, phone, email..."
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
            onClick={() => {
              reset();
              setEditingCustomer(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 whitespace-nowrap"
          >
            Add Customer
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Connection Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conn. Status</th>
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
                customers.map((customer) => {
                  const conn = getConnectionForCustomer(customer.id);
                  return (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/customers/${customer.id}`)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          {customer.name}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{customer.phone || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{customer.email ?? '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {conn.connection_type || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {conn.status ? (
                          <span
                            className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                              conn.status === 'completed' ? 'bg-green-600 text-white' :
                              conn.status === 'pending' ? 'bg-yellow-600 text-white' :
                              'bg-red-600 text-white'
                            }`}
                          >
                            {conn.status}
                          </span>
                        ) : (
                          '—'
                        )}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t">
            <TablePagination
              pagination={pagination}
              onPageChange={(page) => setPaginationState(prev => ({ ...prev, page }))}
              onPageSizeChange={(size) => setPaginationState(prev => ({ ...prev, pageSize: size, page: 1 }))}
              pageSize={paginationState.pageSize}
              isFetching={searching}
            />
          </div>
        )}
      </div>

      {showModal && canManage && (
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            reset();
            setEditingCustomer(null);
          }}
          title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">PACE USER ID</label>
                <input {...register('pace_user_id')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.name && touchedFields.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.name && touchedFields.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Father Name</label>
                <input {...register('father_name')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Area <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('area_id', {
                    required: 'Area is required',
                    validate: value => !!value || 'Please select a valid area'
                  })}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.area_id && touchedFields.area_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Area</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}{a.code ? ` (${a.code})` : ''}
                    </option>
                  ))}
                </select>
                {errors.area_id && touchedFields.area_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.area_id.message}</p>
                )}
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
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('phone', { 
                    required: 'Phone number is required',
                    maxLength: {
                      value: 13,
                      message: 'Too many digits - maximum 13 characters'
                    }
                  })}
                  type="tel"
                  inputMode="numeric"
                  maxLength={13}
                  onKeyPress={handleNumberInput}
                  onChange={handlePhoneChange}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.phone && touchedFields.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0300XXXXXXX or +92300XXXXXXX"
                />
                {errors.phone && touchedFields.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">WhatsApp Number</label>
                <input
                  {...register('whatsapp_number', { 
                    maxLength: {
                      value: 13,
                      message: 'Too many digits - maximum 13 characters'
                    }
                  })}
                  type="tel"
                  inputMode="numeric"
                  maxLength={13}
                  onKeyPress={handleNumberInput}
                  onChange={handleWhatsappChange}
                  className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md ${
                    errors.whatsapp_number && touchedFields.whatsapp_number ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0300XXXXXXX or +92300XXXXXXX (optional)"
                />
                {errors.whatsapp_number && touchedFields.whatsapp_number && (
                  <p className="text-red-500 text-sm mt-1">{errors.whatsapp_number.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  {...register('email')}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.email && touchedFields.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && touchedFields.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea {...register('address')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer Status</label>
                <select {...register('status')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="pt-5 border-t">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Connection Details (optional)</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Connection Type</label>
                  <select
                    {...register('connection_type')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">No connection</option>
                    <option value="Fiber">Fiber</option>
                    <option value="Wireless">Wireless</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    {...register('connection_status')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-indigo-50 text-indigo-900 font-medium"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Registration Date</label>
                  <DatePickerInput
                    value={watch('installation_date') ? dayjs(watch('installation_date')).toDate() : null}
                    onChange={(date) => setValue('installation_date', date)}
                    placeholder="Select date"
                    className="w-full"
                    valueFormat="DD/MM/YYYY"
                    clearable
                    dropdownType="popover"
                    popoverProps={{ withinPortal: true, zIndex: 12000 }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Activation Date</label>
                  <DatePickerInput
                    value={watch('activation_date') ? dayjs(watch('activation_date')).toDate() : null}
                    onChange={(date) => setValue('activation_date', date)}
                    placeholder="Select date"
                    className="w-full"
                    valueFormat="DD/MM/YYYY"
                    clearable
                    dropdownType="popover"
                    popoverProps={{ withinPortal: true, zIndex: 12000 }}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  {...register('connection_notes')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  reset();
                  setEditingCustomer(null);
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
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