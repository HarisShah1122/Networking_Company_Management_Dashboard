import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { stockService } from '../../services/stockService';
import useAuthStore from '../../stores/authStore';
import { isManager } from '../../utils/permission.utils';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';

const StockPage = () => {
  const { user } = useAuthStore();
  const [stock, setStock] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const debounceTimer = useRef(null);
  const isInitialMount = useRef(true);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const loadStock = useCallback(async (search = '', category = '', isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setSearching(true);
      }
      const response = await stockService.getAll({ category, search });
      let stockList = [];
      if (Array.isArray(response)) {
        stockList = response;
      } else if (response?.stock && Array.isArray(response.stock)) {
        stockList = response.stock;
      } else if (response?.data?.stock && Array.isArray(response.data.stock)) {
        stockList = response.data.stock;
      } else if (response?.data && Array.isArray(response.data)) {
        stockList = response.data;
      }
      setStock(stockList);
    } catch (error) {
      const errorMsg = error.response?.data?.message ?? error.message ?? 'Failed to load stock';
      toast.error(errorMsg);
      setStock([]);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const response = await stockService.getCategories();
      let categoriesList = [];
      if (Array.isArray(response)) {
        categoriesList = response;
      } else if (response?.categories && Array.isArray(response.categories)) {
        categoriesList = response.categories;
      } else if (response?.data?.categories && Array.isArray(response.data.categories)) {
        categoriesList = response.data.categories;
      } else if (response?.data && Array.isArray(response.data)) {
        categoriesList = response.data;
      }
      setCategories(categoriesList);
    } catch (error) {
      toast.error('Failed to load categories');
      setCategories([]);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (isInitialMount.current) {
      loadStock('', '', true);
      loadCategories();
      isInitialMount.current = false;
    }
  }, [loadStock, loadCategories]);

  // Debounce search term and category filter
  useEffect(() => {
    if (isInitialMount.current) {
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    if (searchTerm || categoryFilter) {
      setSearching(true);
    }
    
    debounceTimer.current = setTimeout(() => {
      loadStock(searchTerm, categoryFilter, false);
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchTerm, categoryFilter, loadStock]);

  const onSubmit = async (data) => {
    try {
      // Prepare submit data
      const submitData = {
        name: data.name?.trim() ?? '',
        category: data.category?.trim() ?? null,
        quantity_available: data.quantity_available ? parseInt(data.quantity_available, 10) : 0,
        quantity_used: data.quantity_used ? parseInt(data.quantity_used, 10) : 0,
        unit_price: data.unit_price ? parseFloat(data.unit_price) : 0,
        description: data.description?.trim() ?? null,
      };

      if (editingItem) {
        await stockService.update(editingItem.id, submitData);
        toast.success('Stock item updated successfully!');
      } else {
        await stockService.create(submitData);
        toast.success('Stock item created successfully!');
      }
      reset();
      setShowModal(false);
      setEditingItem(null);
      await loadStock(searchTerm, categoryFilter, false);
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
        const errorMsg = error.response?.data?.error ?? error.message ?? 'Failed to save stock item';
        toast.error(errorMsg);
      }
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    reset({
      ...item,
      quantity_available: item.quantity_available || 0,
      quantity_used: item.quantity_used || 0,
      unit_price: item.unit_price || 0,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this stock item?')) {
      try {
        await stockService.delete(id);
        toast.success('Stock item deleted successfully!');
        await loadStock(searchTerm, categoryFilter, false);
      } catch (error) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to delete stock item';
        toast.error(errorMsg);
      }
    }
  };

  const canManage = isManager(user?.role);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Stock Management</h1>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search stock..."
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
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {canManage && (
          <button
            onClick={() => { reset(); setEditingItem(null); setShowModal(true); }}
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
              stock.map((item) => (
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
                        <button
                          onClick={() => handleDelete(item.id)}
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
      </div>

      {showModal && canManage && (
        <Modal
          isOpen={showModal}
          onClose={() => { setShowModal(false); reset(); setEditingItem(null); }}
          title={editingItem ? 'Edit Stock Item' : 'Add Stock Item'}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    className="mt-1 block w-full px-3 py-2 border rounded-md"
                  />
                  {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <input
                    {...register('category')}
                    className="mt-1 block w-full px-3 py-2 border rounded-md"
                    placeholder="e.g., Cables, Equipment"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Available Quantity</label>
                  <input
                    {...register('quantity_available', { valueAsNumber: true, min: 0 })}
                    type="number"
                    className="mt-1 block w-full px-3 py-2 border rounded-md"
                    defaultValue={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Used Quantity</label>
                  <input
                    {...register('quantity_used', { valueAsNumber: true, min: 0 })}
                    type="number"
                    className="mt-1 block w-full px-3 py-2 border rounded-md"
                    defaultValue={0}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Unit Price</label>
                <input
                  {...register('unit_price', { valueAsNumber: true, min: 0 })}
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  {...register('location')}
                  className="mt-1 block w-full px-3 py-2 border rounded-md"
                  placeholder="Storage location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Unit Price</label>
                <input
                  {...register('unit_price', { valueAsNumber: true, min: 0 })}
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full px-3 py-2 border rounded-md"
                  defaultValue={0}
                />
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
                  onClick={() => { setShowModal(false); reset(); setEditingItem(null); }}
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

export default StockPage;
