import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { transactionService } from '../../services/transactionService';
import useAuthStore from '../../stores/authStore';
import { isManager } from '../../utils/permission.utils';
import Modal from '../../components/common/Modal';
import TablePagination from '../../components/common/TablePagination';
import Loader from '../../components/common/Loader';

const AccountsPage = () => {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, profit_loss: 0 });
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const debounceTimer = useRef(null);
  const isInitialMount = useRef(true);

  const { register, handleSubmit, reset, control, formState: { errors }, setError } = useForm({ mode: 'onChange' });

  const canManage = isManager(user?.role);

  const loadTransactions = useCallback(async (search = '', type = '', isInitialLoad = false) => {
    try {
      if (isInitialLoad) setLoading(true);
      else setSearching(true);

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

      if (search && search.trim()) {
        const searchLower = search.toLowerCase();
        transactionsList = transactionsList.filter(transaction => 
          (transaction.category && transaction.category.toLowerCase().includes(searchLower)) ||
          (transaction.description && transaction.description.toLowerCase().includes(searchLower)) ||
          (transaction.amount && String(transaction.amount).includes(search)) ||
          (transaction.trx_id && transaction.trx_id.toLowerCase().includes(searchLower))
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

  useEffect(() => {
    if (isInitialMount.current) {
      loadTransactions('', '', true);
      loadSummary();
      isInitialMount.current = false;
    }
  }, [loadTransactions, loadSummary]);

  useEffect(() => {
    if (isInitialMount.current) return;

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

  const onSubmit = async (data) => {
    try {
      console.log('🔍 Original form data:', JSON.stringify(data, null, 2));
      
      let submitData;
      const hasFile = selectedImage instanceof File;
      const parsedDate = data.date && dayjs(data.date).isValid() ? dayjs(data.date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
      
      // IMPORTANT: Parse amount to number and ensure it's not a string
      let parsedAmount = parseFloat(data.amount);
      if (isNaN(parsedAmount)) {
        parsedAmount = 0;
      }
      
      console.log('🔢 Parsed amount:', parsedAmount, 'Type:', typeof parsedAmount);
      console.log('📅 Parsed date:', parsedDate);
      console.log('📁 Has file selected:', hasFile);

      // Create a completely clean data object - NEVER use original data values directly
      const cleanData = {
        type: data.type,
        amount: parsedAmount, // Ensure it's a number
        date: parsedDate,
        category: data.category?.trim() ?? null,
        description: data.description?.trim() ?? null,
        trx_id: data.trxId?.trim() ?? '', // Use trx_id to match backend validation
        // CRITICAL: NEVER include receiptImage in JSON payload
      };

      console.log('🧹 Clean data object:', JSON.stringify(cleanData, null, 2));
      console.log('🔍 Clean data keys:', Object.keys(cleanData));
      console.log('🔍 Has receiptImage in cleanData?', 'receiptImage' in cleanData);

      // CRITICAL: Handle file upload vs JSON submission
      if (hasFile) {
        // When uploading a file, use FormData with multipart/form-data
        const formData = new FormData();
        formData.append('type', cleanData.type);
        formData.append('amount', cleanData.amount.toString()); // FormData requires strings
        formData.append('date', cleanData.date);
        formData.append('category', cleanData.category ?? '');
        formData.append('description', cleanData.description ?? '');
        formData.append('trx_id', cleanData.trx_id);
        formData.append('receiptImage', selectedImage); // Only include when we have a real file
        
        submitData = formData;
        console.log('📁 FormData created (file upload)');
        console.log('📋 FormData contents:');
        for (let [key, value] of formData.entries()) {
          console.log(`  ${key}:`, value);
        }
      } else {
        // When not uploading a file, send JSON data WITHOUT receiptImage
        submitData = cleanData;
        console.log('📄 JSON data created (no file)');
        console.log('🚀 JSON payload:', JSON.stringify(submitData, null, 2));
      }

      console.log('🔍 Final payload type:', hasFile ? 'FormData (multipart/form-data)' : 'JSON');
      console.log('🔍 Final payload amount type:', typeof (hasFile && submitData instanceof FormData ? submitData.get('amount') : submitData.amount));

      if (editingTransaction) {
        console.log('📝 Sending UPDATE request...');
        await transactionService.update(editingTransaction.id, submitData);
        toast.success('Transaction updated successfully!');
      } else {
        console.log('📝 Sending CREATE request...');
        await transactionService.create(submitData);
        toast.success('Transaction created successfully!');
      }

      reset();
      setShowModal(false);
      setEditingTransaction(null);
      setSelectedImage(null);
      setImagePreview(null);
      await loadTransactions(searchTerm, typeFilter, false);
      await loadSummary();
    } catch (error) {
      console.error('❌ Error in onSubmit:', error);
      console.error('❌ Error response:', error.response?.data);
      
      // Show toast error for user feedback
      if (error.response?.status === 422) {
        const errorMsg = error.response?.data?.message || 'Validation failed. Please check your input.';
        toast.error(`❌ ${errorMsg}`);
      } else {
        const errorMsg = error.response?.data?.message ?? error.response?.data?.error ?? error.message ?? 'Failed to save transaction';
        toast.error(`❌ ${errorMsg}`);
      }
      
      // Log specific validation errors
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        console.error('❌ Validation errors:', error.response.data.errors);
        error.response.data.errors.forEach((err, index) => {
          console.error(`❌ Error ${index + 1}:`, err);
        });
        
        error.response.data.errors.forEach((err) => {
          if (err.param && err.msg) {
            setError(err.param, { type: 'server', message: err.msg });
          }
        });
      }
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    reset({
      type: transaction.type,
      amount: transaction.amount || '',
      category: transaction.category || '',
      description: transaction.description || '',
      date: transaction.date ? dayjs(transaction.date).toDate() : new Date(),
      trxId: transaction.trx_id || '',
    });
    if (transaction.receiptImage) {
      setImagePreview(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${transaction.receiptImage.startsWith('/') ? '' : '/'}${transaction.receiptImage}`);
    } else {
      setImagePreview(null);
    }
    setSelectedImage(null);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

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

      <div className="flex gap-4 mb-4 flex-wrap">
        <div className="flex-1 relative min-w-[280px]">
          <input
            type="text"
            placeholder="Search transactions by category, description, amount, trxId..."
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
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[160px]"
        >
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        {canManage && (
          <button
            onClick={() => { reset({ type: 'income', date: new Date(), trxId: '' }); setEditingTransaction(null); setSelectedImage(null); setImagePreview(null); setShowModal(true); }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 whitespace-nowrap"
          >
            Add Transaction
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="min-w-[1200px] w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TRX ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
                {canManage && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 8 : 7} className="px-6 py-8 text-center text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {transaction.date ? new Date(transaction.date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{transaction.trx_id || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                          transaction.type === 'income'
                            ? 'bg-green-600 text-white'
                            : 'bg-red-600 text-white'
                        }`}
                      >
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      {transaction.receiptImage ? (
                        <a
                          href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${transaction.receiptImage}`}
                          download={`receipt-${transaction.trx_id || transaction.id}.jpg`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">No receipt</span>
                      )}
                    </td>
                    {canManage && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
          onClose={() => { setShowModal(false); reset(); setEditingTransaction(null); setSelectedImage(null); setImagePreview(null); }}
          title={editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type *</label>
                <select
                  {...register('type', { required: 'Type is required' })}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md ${
                    errors.type ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
                {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">TRX ID *</label>
                <input
                  {...register('trxId', {
                    required: 'TRX ID is required',
                    minLength: { value: 1, message: 'TRX ID must be at least 1 character' },
                    maxLength: { value: 50, message: 'TRX ID must not exceed 50 characters' }
                  })}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md ${
                    errors.trxId ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.trxId && <p className="text-red-500 text-sm mt-1">{errors.trxId.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
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
                      clearable
                      valueFormat="DD/MM/YYYY"
                      dropdownType="popover"
                      popoverProps={{ withinPortal: true, zIndex: 12000 }}
                    />
                  )}
                />
                {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Amount *</label>
                <input
                  {...register('amount', { required: 'Amount is required', valueAsNumber: true, min: { value: 0.01, message: 'Amount must be greater than 0' } })}
                  type="number"
                  step="0.01"
                  className={`mt-1 block w-full px-3 py-2 border rounded-md ${
                    errors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <input
                  {...register('category')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Salary, Rent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  {...register('description')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                  placeholder="Optional description..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Receipt Image (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {imagePreview && (
                <div className="mt-3">
                  <img src={imagePreview} alt="Receipt preview" className="max-w-xs h-auto rounded shadow-sm" />
                  <button
                    type="button"
                    onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Remove Image
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => { setShowModal(false); reset(); setEditingTransaction(null); setSelectedImage(null); setImagePreview(null); }}
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

export default AccountsPage;
