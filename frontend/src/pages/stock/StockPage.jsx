import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
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
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    loadData();
  }, [categoryFilter, searchTerm]);

  const loadData = async () => {
    try {
      const [stockData, categoriesData] = await Promise.all([
        stockService.getAll({ category: categoryFilter, search: searchTerm }),
        stockService.getCategories(),
      ]);
      setStock(stockData.stock || []);
      setCategories(categoriesData.categories || []);
    } catch (error) {
      console.error('Error loading stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (editingItem) {
        await stockService.update(editingItem.id, data);
      } else {
        await stockService.create(data);
      }
      reset();
      setShowModal(false);
      setEditingItem(null);
      loadData();
    } catch (error) {
      console.error('Error saving stock item:', error);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    reset(item);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this stock item?')) {
      try {
        await stockService.delete(id);
        loadData();
      } catch (error) {
        console.error('Error deleting stock item:', error);
      }
    }
  };

  const canManage = isManager(user?.role);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
        {canManage && (
          <button
            onClick={() => { reset(); setEditingItem(null); setShowModal(true); }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Add Stock Item
          </button>
        )}
      </div>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search stock..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
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
            {stock.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium">{item.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.category || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.quantity_available}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.quantity_used}</td>
                <td className="px-6 py-4 whitespace-nowrap">${parseFloat(item.unit_price || 0).toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {canManage && (
                    <>
                      <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">
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
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Used Quantity</label>
                  <input
                    {...register('quantity_used', { valueAsNumber: true, min: 0 })}
                    type="number"
                    className="mt-1 block w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit Price</label>
                  <input
                    {...register('unit_price', { valueAsNumber: true, min: 0 })}
                    type="number"
                    step="0.01"
                    className="mt-1 block w-full px-3 py-2 border rounded-md"
                  />
                </div>
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

