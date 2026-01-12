import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { transactionService } from '../../services/transactionService';
import useAuthStore from '../../stores/authStore';
import { isManager } from '../../utils/permission.utils';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import TablePagination from '../../components/common/TablePagination';
import Loader from '../../components/common/Loader';

const AccountsPage = () => {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, profit_loss: 0 });
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const debounceTimer = useRef(null);
  const isInitialMount = useRef(true);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm();

  const loadTransactions = useCallback(async (search = '', type = '', isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setSearching(true);
      }
      const response = await transactionService.getAll({ type });
      let transactionsList = [];
      if (Array.isArray(response)) {
        transactionsList = response;
      } else if (response?.transactions && Array.isArray(response.transactions)) {
        transactionsList = response.transactions;
      } else if (response?.data?.transactions && Array.isArray(response.data.transactions)) {
        transactionsList = response.data.transactions;
      } else if (response?.data && Array.isArray(response.data)) {
        transactionsList = response.data;
      }
      
      // Filter by search term on frontend
      if (search && search.trim()) {
        const searchLower = search.toLowerCase();
        transactionsList = transactionsList.filter(transaction => 
          (transaction.category && transaction.category.toLowerCase().includes(searchLower)) ||
          (transaction.description && transaction.description.toLowerCase().includes(searchLower)) ||
          (transaction.amount && String(transaction.amount).includes(search))
        );
      }
      
      setTransactions(transactionsList);
    } catch (error) {
      const errorMsg = error.response?.data?.message ?? error.message ?? 'Failed to load transactions';
      toast.error(errorMsg);
      setTransactions([]);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      const response = await transactionService.getSummary();
      const summaryData = response?.summary ?? response?.data?.summary ?? {};
      setSummary(summaryData);
    } catch (error) {
      toast.error('Failed to load summary');
      setSummary({ total_income: 0, total_expense: 0, profit_loss: 0 });
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (isInitialMount.current) {
      loadTransactions('', '', true);
      loadSummary();
      isInitialMount.current = false;
    }
  }, [loadTransactions, loadSummary]);

  // Debounce search term and type filter
  useEffect(() => {
    if (isInitialMount.current) {
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    if (searchTerm || typeFilter) {
      setSearching(true);
    }
    
    debounceTimer.current = setTimeout(() => {
      loadTransactions(searchTerm, typeFilter, false);
      setCurrentPage(1);
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchTerm, typeFilter, loadTransactions]);

  // Reload summary when transactions change
  useEffect(() => {
    if (!isInitialMount.current) {
      loadSummary();
    }
  }, [transactions.length, loadSummary]);

  const onSubmit = async (data) => {
    try {
      // Prepare submit data
      const submitData = {
        type: data.type,
        amount: parseFloat(data.amount) ?? 0,
        category: data.category?.trim() ?? null,
        description: data.description?.trim() ?? null,
      };

      // Only include date if it has a valid value
      if (data.date && dayjs(data.date).isValid()) {
        submitData.date = dayjs(data.date).format('YYYY-MM-DD');
      } else {
        submitData.date = dayjs().format('YYYY-MM-DD');
      }

      if (editingTransaction) {
        await transactionService.update(editingTransaction.id, submitData);
        toast.success('Transaction updated successfully!');
      } else {
        await transactionService.create(submitData);
        toast.success('Transaction created successfully!');
      }
      reset();
      setShowModal(false);
      setEditingTransaction(null);
      await loadTransactions(searchTerm, typeFilter, false);
      await loadSummary();
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
        const errorMsg = error.response?.data?.error ?? error.message ?? 'Failed to save transaction';
        toast.error(errorMsg);
      }
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    reset({
      ...transaction,
      date: transaction.date ? dayjs(transaction.date).toDate() : new Date(),
    });
    setShowModal(true);
  };

  const handleDelete = (transaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;

    try {
      await transactionService.delete(transactionToDelete.id);
      toast.success('Transaction deleted successfully!');
      setShowDeleteModal(false);
      setTransactionToDelete(null);
      await loadTransactions(searchTerm, typeFilter, false);
      await loadSummary();
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to delete transaction';
      toast.error(errorMsg);
    }
  };

  const canManage = isManager(user?.role);

  if (loading) return <Loader />;

  const profitLoss = parseFloat(summary.profit_loss || 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Accounts</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Income</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">
            RS {parseFloat(summary.total_income || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Expenses</h3>
          <p className="text-2xl font-bold text-red-600 mt-2">
            RS {parseFloat(summary.total_expense || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Profit/Loss</h3>
          <p className={`text-2xl font-bold mt-2 ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            RS {profitLoss.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search transactions..."
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
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        {canManage && (
          <button
            onClick={() => { reset({ type: 'income', date: new Date() }); setEditingTransaction(null); setShowModal(true); }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 whitespace-nowrap"
          >
            Add Transaction
          </button>
        )}
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
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No transactions found.
                </td>
              </tr>
            ) : (
              transactions.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.date ? new Date(transaction.date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                      transaction.type === 'income' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap font-medium ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    RS {parseFloat(transaction.amount || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{transaction.category || '-'}</td>
                  <td className="px-6 py-4">{transaction.description || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {canManage && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(transaction)}
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
        {transactions.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t">
            <TablePagination
              pagination={{
                currentPage,
                totalPages: Math.ceil(transactions.length / pageSize),
                totalCount: transactions.length,
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
          onClose={() => { setShowModal(false); reset(); setEditingTransaction(null); }}
          title={editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <Controller
                    name="date"
                    control={control}
                    rules={{ required: 'Date is required' }}
                    render={({ field }) => (
                      <DatePickerInput
                        {...field}
                        value={field.value ? dayjs(field.value).toDate() : null}
                        onChange={(date) => field.onChange(date)}
                        placeholder="Select date"
                        className="w-full"
                      />
                    )}
                  />
                  {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <input
                    {...register('category')}
                    className="mt-1 block w-full px-3 py-2 border rounded-md"
                    placeholder="e.g., Salary, Rent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  {...register('description')}
                  className="mt-1 block w-full px-3 py-2 border rounded-md"
                  rows="3"
                  placeholder="Optional description..."
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
        </Modal>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setTransactionToDelete(null);
        }}
        title="Delete Transaction"
        itemName={transactionToDelete ? `${transactionToDelete.type} - RS ${parseFloat(transactionToDelete.amount || 0).toFixed(2)}` : ''}
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default AccountsPage;
