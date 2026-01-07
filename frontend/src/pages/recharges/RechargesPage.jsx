import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { rechargeService } from '../../services/rechargeService';
import { customerService } from '../../services/customerService';
import useAuthStore from '../../stores/authStore';
import { isManager } from '../../utils/permission.utils';

const RechargesPage = () => {
  const { user } = useAuthStore();
  const [recharges, setRecharges] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [duePayments, setDuePayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecharge, setEditingRecharge] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      const [rechargesData, customersData, dueData] = await Promise.all([
        rechargeService.getAll({ status: statusFilter }),
        customerService.getAll(),
        rechargeService.getDuePayments(),
      ]);
      setRecharges(rechargesData.recharges || []);
      setCustomers(customersData.customers || []);
      setDuePayments(dueData.duePayments || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (editingRecharge) {
        await rechargeService.update(editingRecharge.id, data);
      } else {
        await rechargeService.create(data);
      }
      reset();
      setShowModal(false);
      setEditingRecharge(null);
      loadData();
    } catch (error) {
      console.error('Error saving recharge:', error);
    }
  };

  const handleEdit = (recharge) => {
    setEditingRecharge(recharge);
    reset({
      ...recharge,
      due_date: recharge.due_date ? recharge.due_date.split('T')[0] : '',
      payment_date: recharge.payment_date ? recharge.payment_date.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleMarkPaid = async (id) => {
    try {
      await rechargeService.update(id, { status: 'paid', payment_date: new Date().toISOString().split('T')[0] });
      loadData();
    } catch (error) {
      console.error('Error updating recharge:', error);
    }
  };

  const canManage = isManager(user?.role);

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Recharges</h1>
        {canManage && (
          <button
            onClick={() => { reset(); setEditingRecharge(null); setShowModal(true); }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Add Recharge
          </button>
        )}
      </div>

      {duePayments.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="font-semibold text-yellow-800 mb-2">Due Payments ({duePayments.length})</h2>
          <div className="space-y-2">
            {duePayments.slice(0, 5).map((payment) => (
              <div key={payment.id} className="flex justify-between text-sm">
                <span>{payment.customer_name} - ${parseFloat(payment.amount).toFixed(2)}</span>
                <span className="text-yellow-700">Due: {new Date(payment.due_date).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
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
            {recharges.map((recharge) => (
              <tr key={recharge.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">{recharge.customer_name || recharge.customer_id}</td>
                <td className="px-6 py-4 whitespace-nowrap font-medium">${parseFloat(recharge.amount).toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{recharge.payment_method}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    recharge.status === 'paid' ? 'bg-green-100 text-green-800' :
                    recharge.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
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
                      <button onClick={() => handleEdit(recharge)} className="text-indigo-600 hover:text-indigo-900">
                        Edit
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && canManage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingRecharge ? 'Edit Recharge' : 'Add Recharge'}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <input
                  {...register('due_date')}
                  type="date"
                  className="mt-1 block w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select {...register('status')} className="mt-1 block w-full px-3 py-2 border rounded-md">
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default RechargesPage;

