import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { areaService } from '../../services/areaService';
import useAuthStore from '../../stores/authStore';
import { isManager } from '../../utils/permission.utils';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import TablePagination from '../../components/common/TablePagination';
import Loader from '../../components/common/Loader';

const AreasPage = () => {
  const { user } = useAuthStore();

  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [areaToDelete, setAreaToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const debounceTimer = useRef(null);
  const isInitialMount = useRef(true);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const loadAreas = useCallback(async (search = '', isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setSearching(true);

      const data = await areaService.getAll();

      let filtered = data;
      if (search.trim()) {
        const term = search.toLowerCase();
        filtered = data.filter(area =>
          area.name.toLowerCase().includes(term) ||
          (area.description && area.description.toLowerCase().includes(term)) ||
          (area.code && area.code.toLowerCase().includes(term))
        );
      }

      setAreas(filtered);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load areas');
      setAreas([]);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      loadAreas('', true);
      isInitialMount.current = false;
    }
  }, [loadAreas]);

  useEffect(() => {
    if (isInitialMount.current) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      loadAreas(searchTerm);
      setCurrentPage(1);
    }, 450);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchTerm, loadAreas]);

  const onSubmit = async (formData) => {
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        code: formData.code?.trim() || undefined,
      };

      if (editingArea) {
        await areaService.update(editingArea.id, payload);
        toast.success('Area updated successfully');
      } else {
        await areaService.create(payload);
        toast.success('Area created successfully');
      }

      reset();
      setShowModal(false);
      setEditingArea(null);
      await loadAreas(searchTerm);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save area');
    }
  };

  const handleEdit = (area) => {
    setEditingArea(area);
    reset({
      name: area.name,
      description: area.description || '',
      code: area.code || '',
    });
    setShowModal(true);
  };

  const handleDelete = (area) => {
    setAreaToDelete(area);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!areaToDelete) return;
    toast.info('Delete endpoint not implemented yet. Area remains in list.');
    setShowDeleteModal(false);
    setAreaToDelete(null);
  };

  const canManage = isManager(user?.role);

  if (loading) return <Loader />;

  const paginatedAreas = areas.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold text-gray-900">Areas</h1>

      {/* Search and Add */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search areas (name, code, description)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />}
        </div>

        {canManage && (
          <button
            onClick={() => { reset({ name: '', description: '', code: '' }); setEditingArea(null); setShowModal(true); }}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 whitespace-nowrap"
          >
            Add Area
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              {canManage && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedAreas.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 4 : 3} className="px-6 py-10 text-center text-gray-500">No areas found.</td>
              </tr>
            ) : (
              paginatedAreas.map(area => (
                <tr key={area.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{area.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{area.code || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{area.description || '-'}</td>
                  {canManage && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => handleEdit(area)} className="text-indigo-600 hover:text-indigo-900" title="Edit">Edit</button>
                        <button onClick={() => handleDelete(area)} className="text-red-600 hover:text-red-900" title="Delete">Delete</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {areas.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t">
            <TablePagination
              pagination={{ currentPage, totalPages: Math.ceil(areas.length / pageSize), totalCount: areas.length }}
              onPageChange={setCurrentPage}
              onPageSizeChange={size => { setPageSize(size); setCurrentPage(1); }}
              pageSize={pageSize}
              isFetching={searching}
            />
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && canManage && (
        <Modal isOpen={showModal} onClose={() => { setShowModal(false); reset(); setEditingArea(null); }} title={editingArea ? 'Edit Area' : 'Add New Area'}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
              <input {...register('name', { required: 'Name is required' })} className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Code</label>
              <input {...register('code')} className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea {...register('description')} rows={3} className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => { setShowModal(false); reset(); setEditingArea(null); }} className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">{editingArea ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      <ConfirmModal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setAreaToDelete(null); }} title="Delete Area" itemName={areaToDelete?.name} onConfirm={handleConfirmDelete} confirmText="Delete" cancelText="Cancel" />
    </div>
  );
};

export default AreasPage;
