import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { rechargeService } from '../../services/rechargeService';
import { customerService } from '../../services/customerService';
import useAuthStore from '../../stores/authStore';
import { isManager } from '../../utils/permission.utils';
import Modal from '../../components/common/Modal';
import TablePagination from '../../components/common/TablePagination';
import Loader from '../../components/common/Loader';
import apiClient from '../../services/api/apiClient';

const RechargesPage = () => {
  const { user } = useAuthStore();
  const [recharges, setRecharges] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [duePayments, setDuePayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRecharge, setEditingRecharge] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const debounceTimer = useRef(null);
  const isInitialMount = useRef(true);

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm();
  const watchedCustomerId = watch('customer_id');

  const canManage = isManager(user?.role);

  // Load Customers
  const loadCustomers = useCallback(async () => {
    try {
      const response = await customerService.getAll();
      let list = Array.isArray(response) ? response : (response?.customers ?? response?.data ?? []);
      setCustomers(list.filter(c => c?.id));
    } catch {
      toast.error('Failed to load customers');
      setCustomers([]);
    }
  }, []);

  // Load Companies
  const loadCompanies = useCallback(async () => {
    try {
      const response = await apiClient.get('/companies');
      const data = response.data;
      const list = Array.isArray(data) ? data : (data?.companies ?? data?.data?.companies ?? []);
      setCompanies(list.filter(c => c?.id && c.status === 'active'));
    } catch {
      toast.error('Failed to load companies');
      setCompanies([]);
    }
  }, []);

  // Load Recharges + enrich + filter in one go
  const loadRecharges = useCallback(async (search = '', status = '', isInitial = false) => {
    if (isInitial) setLoading(true);
    else setSearching(true);

    try {
      const response = await rechargeService.getAll({ status });
      let list = Array.isArray(response) ? response : (response?.recharges ?? response?.data ?? []);

      // Enrich with customer & company names
      list = list.map(r => {
        const customer = customers.find(c => String(c.id) === String(r.customer_id)) ?? {};
        const company = companies.find(c => String(c.id) === String(r.company_id)) ?? {};
        return {
          ...r,
          customer_name: customer.name ?? r.customer_name ?? '-',
          customer_phone: customer.whatsapp_number ?? customer.phone ?? '-',
          pace_user_id: customer.pace_user_id ?? '-',
          company_name: company.name ?? company.company_id ?? '-',
        };
      });

      // Client-side search
      if (search?.trim()) {
        const term = search.toLowerCase().trim();
        list = list.filter(r =>
          r.customer_name.toLowerCase().includes(term) ||
          r.pace_user_id.toLowerCase().includes(term) ||
          r.company_name.toLowerCase().includes(term) ||
          String(r.amount ?? '').includes(term) ||
          (r.customer_phone && r.customer_phone.includes(term))
        );
      }

      setRecharges(list);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to load recharges');
      setRecharges([]);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, [customers, companies]);

  const loadDuePayments = useCallback(async () => {
    try {
      const response = await rechargeService.getDuePayments();
      setDuePayments(response?.duePayments ?? response?.data?.duePayments ?? []);
    } catch {
      setDuePayments([]);
    }
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      (async () => {
        await loadCustomers();
        await loadCompanies();
        await loadRecharges('', '', true);
        await loadDuePayments();
      })();
      isInitialMount.current = false;
    }
  }, [loadCustomers, loadCompanies, loadRecharges, loadDuePayments]);

  useEffect(() => {
    if (isInitialMount.current) return;

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      loadRecharges(searchTerm, statusFilter);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(debounceTimer.current);
  }, [searchTerm, statusFilter, loadRecharges]);

  useEffect(() => {
    if (!watchedCustomerId) return setSelectedCustomer(null);
    const c = customers.find(c => String(c.id) === String(watchedCustomerId));
    setSelectedCustomer(c ?? null);
  }, [watchedCustomerId, customers]);

  const onSubmit = async (data) => {
    try {
      if (!data.customer_id) {
        toast.error('Please select a customer');
        return;
      }

      const customer = customers.find(c => String(c.id) === String(data.customer_id));
      if (!customer) {
        toast.error('Customer not found');
        return;
      }

      const submitData = {
        customer_id: String(data.customer_id),
        company_id: data.company_id || null,
        amount: parseFloat(data.amount) || 0,
        package: data.package?.trim() ?? null,
        payment_method: data.payment_method ?? 'cash',
        status: data.status ?? 'pending',
        name: customer.name ?? null,
        address: customer.address ?? null,
        whatsapp_number: customer.whatsapp_number ?? customer.phone ?? null,
        due_date: data.due_date ? dayjs(data.due_date).format('YYYY-MM-DD') : undefined,
        payment_date: data.payment_date ? dayjs(data.payment_date).format('YYYY-MM-DD') : undefined,
        notes: data.notes?.trim() ?? undefined,
      };

      if (editingRecharge) {
        await rechargeService.update(editingRecharge.id, submitData);
        toast.success('Recharge updated!');
      } else {
        await rechargeService.create(submitData);
        toast.success('Recharge created!');
      }

      reset();
      setShowModal(false);
      setEditingRecharge(null);
      setSelectedCustomer(null);
      await loadRecharges(searchTerm, statusFilter);
      await loadDuePayments();
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Failed to save recharge');
    }
  };

  const handleEdit = (recharge) => {
    const customer = customers.find(c => String(c.id) === String(recharge.customer_id));
    setSelectedCustomer(customer ?? null);
    setEditingRecharge(recharge);

    reset({
      customer_id: recharge.customer_id ?? '',
      company_id: recharge.company_id ?? '',
      amount: recharge.amount ?? '',
      package: recharge.package ?? '',
      payment_method: recharge.payment_method ?? 'cash',
      status: recharge.status ?? 'pending',
      due_date: recharge.due_date ? dayjs(recharge.due_date).toDate() : null,
      payment_date: recharge.payment_date ? dayjs(recharge.payment_date).toDate() : null,
      notes: recharge.notes ?? '',
    });

    setShowModal(true);
  };

  const handleMarkPaid = async (id) => {
    try {
      const resp = await rechargeService.getById(id);
      const recharge = resp?.recharge ?? resp?.data?.recharge ?? resp;

      if (!recharge?.id) throw new Error('Recharge not found');

      await rechargeService.update(id, {
        ...recharge,
        customer_id: recharge.customer_id,
        amount: recharge.amount,
        status: 'paid',
        payment_date: dayjs().format('YYYY-MM-DD'),
      });

      toast.success('Marked as paid!');
      await loadRecharges(searchTerm, statusFilter);
      await loadDuePayments();
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to mark as paid');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Recharges</h1>

      {duePayments.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="font-semibold text-yellow-800 mb-2">Due Payments ({duePayments.length})</h2>
          <div className="space-y-2">
            {duePayments.slice(0, 5).map((p) => (
              <div key={p.id} className="flex justify-between text-sm">
                <span>{p.customer_name} - RS {parseFloat(p.amount).toFixed(2)}</span>
                <span className="text-yellow-700">Due: {new Date(p.due_date).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Search by name, PACE ID, amount, phone, company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[300px] px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>

        {canManage && (
          <button
            onClick={() => { reset(); setEditingRecharge(null); setSelectedCustomer(null); setShowModal(true); }}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 whitespace-nowrap"
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PACE ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {recharges.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center text-gray-500">No recharges found.</td>
              </tr>
            ) : (
              recharges.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{r.customer_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono">{r.pace_user_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{r.company_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">RS {parseFloat(r.amount).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{r.payment_method ?? '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                      r.status === 'paid' ? 'bg-green-600 text-white' :
                      r.status === 'pending' ? 'bg-yellow-600 text-white' :
                      'bg-red-600 text-white'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {r.due_date ? new Date(r.due_date).toLocaleDateString('en-PK') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {canManage && (
                      <div className="flex items-center justify-end gap-2">
                        {r.status === 'pending' && (
                          <button
                            onClick={() => handleMarkPaid(r.id)}
                            className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                            title="Mark Paid"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(r)}
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

        {recharges.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t">
            <TablePagination
              pagination={{ currentPage, totalPages: Math.ceil(recharges.length / pageSize), totalCount: recharges.length }}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
              pageSize={pageSize}
              isFetching={searching}
            />
          </div>
        )}
      </div>

      {showModal && canManage && (
        <Modal
          isOpen={showModal}
          onClose={() => { setShowModal(false); reset(); setEditingRecharge(null); setSelectedCustomer(null); }}
          title={editingRecharge ? 'Edit Recharge' : 'Add Recharge'}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company *</label>
              <select
                {...register('company_id', { required: 'Company is required' })}
                className={`mt-1 block w-full px-3 py-2 border rounded-md ${errors.company_id ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select Company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.company_id})
                  </option>
                ))}
              </select>
              {errors.company_id && <p className="text-red-500 text-sm mt-1">{errors.company_id.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">User *</label>
              <select
                {...register('customer_id', { required: 'Customer is required' })}
                className={`mt-1 block w-full px-3 py-2 border rounded-md ${errors.customer_id ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select User</option>
                {customers.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name} {c.pace_user_id ? `(PACE: ${c.pace_user_id})` : ''}
                  </option>
                ))}
              </select>
              {errors.customer_id && <p className="text-red-500 text-sm mt-1">{errors.customer_id.message}</p>}
            </div>

            {selectedCustomer && (
              <div className="bg-gray-50 p-4 rounded-md text-sm">
                <h3 className="font-medium mb-3">User Details</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-xs text-gray-600">ID</span>
                    <p className="font-mono">{selectedCustomer.id}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600">PACE ID</span>
                    <p>{selectedCustomer.pace_user_id ?? '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600">WhatsApp</span>
                    <p>{selectedCustomer.whatsapp_number ?? selectedCustomer.phone ?? '-'}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Package</label>
                <input
                  {...register('package')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g. 10 Mbps"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Amount (PKR) *</label>
                <input
                  {...register('amount', { required: true, valueAsNumber: true, min: 0.01 })}
                  type="number"
                  step="0.01"
                  className={`mt-1 block w-full px-3 py-2 border rounded-md ${errors.amount ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="0.00"
                />
                {errors.amount && <p className="text-red-500 text-sm mt-1">Amount is required</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <select {...register('payment_method')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="online">Online</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select {...register('status')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      clearable
                      valueFormat="DD/MM/YYYY"
                      dropdownType="popover"
                      popoverProps={{ withinPortal: true, zIndex: 12000 }}
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
                      clearable
                      valueFormat="DD/MM/YYYY"
                      dropdownType="popover"
                      popoverProps={{ withinPortal: true, zIndex: 12000 }}
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  {...register('notes')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Optional notes"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => { setShowModal(false); reset(); setEditingRecharge(null); setSelectedCustomer(null); }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                {editingRecharge ? 'Update Recharge' : 'Save Recharge'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default RechargesPage;