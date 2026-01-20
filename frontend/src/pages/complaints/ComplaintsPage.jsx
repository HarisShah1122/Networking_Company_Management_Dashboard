import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { complaintService } from '../../services/complaintService';
import { customerService } from '../../services/customerService';
import useAuthStore from '../../stores/authStore';
import { isManager } from '../../utils/permission.utils';
import Modal from '../../components/common/Modal';
import TablePagination from '../../components/common/TablePagination';
import Loader from '../../components/common/Loader';

const ComplaintsPage = () => {
  const { user } = useAuthStore();
  const [complaints, setComplaints] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const debounceTimer = useRef(null);
  const isInitialMount = useRef(true);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, touchedFields } } = useForm();
  const watchedCustomerId = watch('customerId');

  const canManage = isManager(user?.role);

  const loadCustomers = useCallback(async () => {
    try {
      const response = await customerService.getAll();
      let list = Array.isArray(response) ? response : (response?.customers ?? response?.data?.customers ?? response?.data ?? []);
      list = list.filter(c => c?.id);
      setCustomers(list);
    } catch (error) {
      toast.error('Failed to load customers');
      setCustomers([]);
    }
  }, []);

  const loadComplaints = useCallback(async (search = '', status = '', isInitialLoad = false) => {
    try {
      if (isInitialLoad) setLoading(true);
      else setSearching(true);

      const response = await complaintService.getAll();
      let list = Array.isArray(response) ? response
                : (response?.complaints ?? response?.data?.complaints ?? response?.data ?? []);

      // Enrich complaints with customer data
      list = list.map(complaint => {
        const customerId = complaint.customerId ?? complaint.customer_id ?? null;
        const customer = customerId ? customers.find(c => String(c.id) === String(customerId)) : null;

        return {
          ...complaint,
          id: complaint.id ?? '',
          customerId: customerId,
          name: customer?.name ?? complaint.name ?? complaint.Name ?? '-',
          whatsapp_number: customer?.whatsapp_number ?? customer?.phone ?? complaint.whatsapp_number ?? complaint.whatsappNumber ?? '-',
          pace_user_id: customer?.pace_user_id ?? '-',
          address: customer?.address ?? complaint.address ?? complaint.Address ?? '-',
          title: complaint.title ?? complaint.Title ?? '',
          description: complaint.description ?? complaint.Description ?? '',
          status: complaint.status ?? complaint.Status ?? 'open',
          priority: complaint.priority ?? complaint.Priority ?? 'medium',
        };
      });

      // Search filtering
      if (search?.trim()) {
        const searchLower = search.toLowerCase().trim();
        list = list.filter(c =>
          (c.name ?? '').toLowerCase().includes(searchLower) ||
          (c.pace_user_id ?? '').toLowerCase().includes(searchLower) ||
          (c.title ?? '').toLowerCase().includes(searchLower) ||
          (c.description ?? '').toLowerCase().includes(searchLower) ||
          (c.whatsapp_number ?? '').includes(search)
        );
      }

      // Status filter
      if (status) {
        list = list.filter(c => (c.status ?? '') === status);
      }

      setComplaints(list);
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Failed to load complaints');
      setComplaints([]);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, [customers]);

  useEffect(() => {
    if (isInitialMount.current) {
      (async () => {
        await loadCustomers();
        await loadComplaints('', '', true);
      })();
      isInitialMount.current = false;
    }
  }, [loadCustomers, loadComplaints]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      loadComplaints(searchTerm, statusFilter, false);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(debounceTimer.current);
  }, [searchTerm, statusFilter, loadComplaints]);

  useEffect(() => {
    if (!watchedCustomerId) {
      setSelectedCustomer(null);
      setValue('name', '');
      setValue('address', '');
      setValue('whatsapp_number', '');
      return;
    }

    const customer = customers.find(c => String(c.id) === String(watchedCustomerId));
    setSelectedCustomer(customer ?? null);

    if (customer) {
      setValue('name', customer.name ?? '');
      setValue('address', customer.address ?? '');
      setValue('whatsapp_number', customer.whatsapp_number ?? customer.phone ?? '');
    } else {
      setValue('name', '');
      setValue('address', '');
      setValue('whatsapp_number', '');
    }
  }, [watchedCustomerId, customers, setValue]);

  const onSubmit = async (data) => {
    try {
      if (!data.title?.trim()) {
        toast.error('Title is required');
        return;
      }
      if (!data.description?.trim() || data.description.trim().length < 10) {
        toast.error('Description must be at least 10 characters');
        return;
      }

      const customer = selectedCustomer;

      const submitData = {
        customerId: data.customerId ?? null,
        name: customer?.name ?? null,
        address: customer?.address ?? null,
        whatsapp_number: customer?.whatsapp_number ?? customer?.phone ?? null,
        title: data.title.trim(),
        description: data.description.trim(),
        status: data.status ?? 'open',
        priority: data.priority ?? 'medium',
      };

      if (editingComplaint) {
        await complaintService.update(editingComplaint.id, submitData);
        toast.success('Complaint updated successfully!');
      } else {
        await complaintService.create(submitData);
        toast.success('Complaint created successfully!');
      }

      reset();
      setShowModal(false);
      setEditingComplaint(null);
      setSelectedCustomer(null);
      await loadComplaints(searchTerm, statusFilter, false);
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Failed to save complaint');
    }
  };

  const handleEdit = (complaint) => {
    if (!complaint?.id) return;

    setEditingComplaint(complaint);
    const customerId = complaint.customerId ?? complaint.customer_id ?? '';
    const customer = customers.find(c => String(c.id) === String(customerId));
    setSelectedCustomer(customer ?? null);

    reset({
      customerId: customerId,
      name: complaint.name ?? '',
      address: complaint.address ?? '',
      whatsapp_number: complaint.whatsapp_number ?? '',
      title: complaint.title ?? '',
      description: complaint.description ?? '',
      status: complaint.status ?? 'open',
      priority: complaint.priority ?? 'medium',
    });

    setShowModal(true);
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Complaints</h1>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by name, PACE ID, title, phone..."
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
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="on_hold">On Hold</option>
          <option value="closed">Closed</option>
        </select>

        {canManage && (
          <button
            onClick={() => { reset(); setEditingComplaint(null); setSelectedCustomer(null); setShowModal(true); }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 whitespace-nowrap"
          >
            Add Complaint
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PACE ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">WhatsApp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {complaints.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No complaints found.
                </td>
              </tr>
            ) : (
              complaints.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((complaint) => (
                <tr key={complaint.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{complaint.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono">{complaint.pace_user_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{complaint.whatsapp_number}</td>
                  <td className="px-6 py-4">{complaint.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                      complaint.status === 'on_hold' ? 'bg-orange-600 text-white' :
                      complaint.status === 'in_progress' ? 'bg-blue-600 text-white' :
                      complaint.status === 'closed' ? 'bg-gray-600 text-white' :
                      'bg-yellow-600 text-white'
                    }`}>
                      {complaint.status === 'on_hold' ? 'On Hold' : (complaint.status ?? 'open')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                      complaint.priority === 'urgent' ? 'bg-red-600 text-white' :
                      complaint.priority === 'high' ? 'bg-orange-600 text-white' :
                      complaint.priority === 'medium' ? 'bg-yellow-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {complaint.priority ?? 'medium'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {canManage && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(complaint)}
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

        {complaints.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t">
            <TablePagination
              pagination={{
                currentPage,
                totalPages: Math.ceil(complaints.length / pageSize),
                totalCount: complaints.length,
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
          onClose={() => { setShowModal(false); reset(); setEditingComplaint(null); setSelectedCustomer(null); }}
          title={editingComplaint ? 'Edit Complaint' : 'Add Complaint'}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">User ID *</label>
              <select
                {...register('customerId', {
                  required: 'User ID is required',
                  validate: (value) => (!value || value === 'undefined') ? 'Please select a User ID' : true
                })}
                className={`mt-1 block w-full px-3 py-2 border rounded-md ${
                  errors.customerId && touchedFields.customerId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select User</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={String(customer.id)}>
                    {customer.name} {customer.pace_user_id ? `(PACE: ${customer.pace_user_id})` : ''}
                  </option>
                ))}
              </select>
              {errors.customerId && touchedFields.customerId && (
                <p className="text-red-500 text-sm mt-1">{errors.customerId.message}</p>
              )}
            </div>

            {selectedCustomer && (
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-700 mb-3">User Details</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <label className="block text-xs font-medium text-gray-600">User ID</label>
                    <p className="font-mono">{selectedCustomer.id}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600">PACE ID</label>
                    <p className="font-mono">{selectedCustomer.pace_user_id ?? '-'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Name</label>
                    <p>{selectedCustomer.name ?? '-'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600">WhatsApp No</label>
                    <p>{selectedCustomer.whatsapp_number ?? selectedCustomer.phone ?? '-'}</p>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-gray-600">Address / Area</label>
                    <p>{selectedCustomer.address ?? selectedCustomer.area?.name ?? selectedCustomer.area_name ?? '-'}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Title *</label>
              <input
                {...register('title', { required: 'Title is required' })}
                className={`mt-1 block w-full px-3 py-2 border rounded-md ${
                  errors.title && touchedFields.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter complaint title"
              />
              {errors.title && touchedFields.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description *</label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                className={`mt-1 block w-full px-3 py-2 border rounded-md ${
                  errors.description && touchedFields.description ? 'border-red-500' : 'border-gray-300'
                }`}
                rows="4"
                placeholder="Enter complaint description"
              />
              {errors.description && touchedFields.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select {...register('status')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="on_hold">On Hold</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <select {...register('priority')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => { setShowModal(false); reset(); setEditingComplaint(null); setSelectedCustomer(null); }}
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

export default ComplaintsPage;