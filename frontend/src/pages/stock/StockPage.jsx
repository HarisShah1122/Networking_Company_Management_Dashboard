import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import useAuthStore from '../../stores/authStore';
import { isManager } from '../../utils/permission.utils';
import Modal from '../../components/common/Modal';
import TablePagination from '../../components/common/TablePagination';
import Loader from '../../components/common/Loader';
import { usePagination } from '../../hooks/usePagination';
import { useModal } from '../../hooks/useModal';
import { useStockList, useStockCategories, useCreateStock, useUpdateStock } from '../../hooks/queries/useStockQueries';

const StockPage = () => {
  const { user } = useAuthStore();
  const canManage = isManager(user?.role);

  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef(null);
  const [editingItem, setEditingItem] = useState(null);

  const { register, handleSubmit, reset, formState: { errors, touchedFields } } = useForm();

  // eslint-disable-next-line no-unused-vars
  const { pageSize, handlePageChange, handlePageSizeChange, resetPagination, getPaginatedData, getPaginationInfo } = usePagination();
  const editModal = useModal();

  const { data: stock = [], isLoading, isFetching } = useStockList({ 
    category: categoryFilter, 
    search: debouncedSearch 
  });
  const { data: categories = [] } = useStockCategories();
  const createMutation = useCreateStock();
  const updateMutation = useUpdateStock();

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      resetPagination();
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchTerm, resetPagination]);

  useEffect(() => {
    resetPagination();
  }, [categoryFilter, resetPagination]);

  const onSubmit = async (data) => {
    const submitData = {
      name: data.name?.trim() ?? '',
      category: data.category?.trim() ?? null,
      quantity_available: data.quantity_available ? parseInt(data.quantity_available, 10) : 0,
      quantity_used: data.quantity_used ? parseInt(data.quantity_used, 10) : 0,
      unit_price: data.unit_price ? parseFloat(data.unit_price) : 0,
      description: data.description?.trim() ?? null,
    };

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, data: submitData });
        toast.success('Stock item updated');
      } else {
        await createMutation.mutateAsync(submitData);
        toast.success('Stock item created');
      }
      reset();
      editModal.closeModal();
      setEditingItem(null);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save stock item');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    reset({
      name: item.name || '',
      category: item.category || '',
      quantity_available: item.quantity_available || 0,
      quantity_used: item.quantity_used || 0,
      unit_price: item.unit_price || 0,
      description: item.description || '',
    });
    editModal.openModal();
  };

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Stock Management</h1>
      </div>

      <div className="flex gap-4 mb-4 flex-wrap">
        <div className="flex-1 relative min-w-[280px]">
          <input
            type="text"
            placeholder="Search stock..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {isFetching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            </div>
          )}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[180px]"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {canManage && (
          <button
            onClick={() => { reset(); setEditingItem(null); editModal.openModal(); }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 whitespace-nowrap"
          >
            Add Stock Item
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Used</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stock.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No stock items found.
                </td>
              </tr>
            ) : (
              getPaginatedData(stock).map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.category || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.quantity_available || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.quantity_used || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap">RS {parseFloat(item.unit_price || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {canManage && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(item)}
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

        {stock.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t">
            <TablePagination
              pagination={getPaginationInfo(stock.length)}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              pageSize={pageSize}
              isFetching={isFetching}
            />
          </div>
        )}
      </div>

      {editModal.isOpen && canManage && (
        <Modal
          isOpen={editModal.isOpen}
          onClose={() => { editModal.closeModal(); reset(); setEditingItem(null); }}
          title={editingItem ? 'Edit Stock Item' : 'Add Stock Item'}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <input
                  {...register('category')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Cables, Equipment"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Unit Price</label>
                <input
                  {...register('unit_price', { valueAsNumber: true, min: 0 })}
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Available Quantity</label>
                <input
                  {...register('quantity_available', { valueAsNumber: true, min: 0 })}
                  type="number"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  defaultValue={0}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Used Quantity</label>
                <input
                  {...register('quantity_used', { valueAsNumber: true, min: 0 })}
                  type="number"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  defaultValue={0}
                />
              </div>
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

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => { editModal.closeModal(); reset(); setEditingItem(null); }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default StockPage;