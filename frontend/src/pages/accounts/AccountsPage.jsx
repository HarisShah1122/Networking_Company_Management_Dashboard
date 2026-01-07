import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { transactionService } from '../../services/transactionService';
import useAuthStore from '../../stores/authStore';
import { isManager } from '../../utils/permission.utils';

const AccountsPage = () => {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, profit_loss: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    loadData();
  }, [typeFilter]);

  const loadData = async () => {
    try {
      const [transactionsData, summaryData] = await Promise.all([
        transactionService.getAll({ type: typeFilter }),
        transactionService.getSummary(),
      ]);
      setTransactions(transactionsData.transactions || []);
      setSummary(summaryData.summary || {});
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (editingTransaction) {
        await transactionService.update(editingTransaction.id, data);
      } else {
        await transactionService.create(data);
      }
      reset();
      setShowModal(false);
      setEditingTransaction(null);
      loadData();
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    reset({
      ...transaction,
      date: transaction.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await transactionService.delete(id);
        loadData();
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  const canManage = isManager(user?.role);

  if (loading) return <div className="text-center py-8">Loading...</div>;

  const profitLoss = parseFloat(summary.profit_loss || 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Accounts</h1>
        {canManage && (
          <button
            onClick={() => { reset({ type: 'income', date: new Date().toISOString().split('T')[0] }); setEditingTransaction(null); setShowModal(true); }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Add Transaction
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Income</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">
            ${parseFloat(summary.total_income || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Expenses</h3>
          <p className="text-2xl font-bold text-red-600 mt-2">
            ${parseFloat(summary.total_expense || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Profit/Loss</h3>
          <p className={`text-2xl font-bold mt-2 ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${profitLoss.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(transaction.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {transaction.type}
                  </span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap font-medium ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${parseFloat(transaction.amount).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{transaction.category || '-'}</td>
                <td className="px-6 py-4">{transaction.description || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {canManage && (
                    <>
                      <button onClick={() => handleEdit(transaction)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(transaction.id)} className="text-red-600 hover:text-red-900">
                        Delete
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
            <h2 className="text-xl font-bold mb-4">{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type *</label>
                <select
                  {...register('type', { required: 'Type is required' })}
                  className="mt-1 block w-full px-3 py-2 border rounded-md"
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
                {errors.type && <p className="text-red-500 text-sm">{errors.type.message}</p>}
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
                <label className="block text-sm font-medium text-gray-700">Date *</label>
                <input
                  {...register('date', { required: 'Date is required' })}
                  type="date"
                  className="mt-1 block w-full px-3 py-2 border rounded-md"
                />
                {errors.date && <p className="text-red-500 text-sm">{errors.date.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <input
                  {...register('category')}
                  className="mt-1 block w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  {...register('description')}
                  className="mt-1 block w-full px-3 py-2 border rounded-md"
                  rows="3"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); reset(); setEditingTransaction(null); }}
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

export default AccountsPage;

