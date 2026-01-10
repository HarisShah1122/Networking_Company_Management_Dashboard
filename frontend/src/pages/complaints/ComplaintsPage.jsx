import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { complaintService } from '../../services/complaintService';
import { customerService } from '../../services/customerService';
import useAuthStore from '../../stores/authStore';
import { isManager } from '../../utils/permission.utils';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Loader from '../../components/common/Loader';

const ComplaintsPage = () => {
  const { user } = useAuthStore();
  const [complaints, setComplaints] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [complaintToDelete, setComplaintToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const debounceTimer = useRef(null);
  const isInitialMount = useRef(true);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();
  const watchedCustomerId = watch('customerId');

  const loadComplaints = useCallback(async (search = '', status = '', isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setSearching(true);
      }
      const response = await complaintService.getAll();
      let complaintsList = [];
      
      // Handle different response structures
      if (response?.data?.complaints && Array.isArray(response.data.complaints)) {
        complaintsList = response.data.complaints;
      } else if (response?.complaints && Array.isArray(response.complaints)) {
        complaintsList = response.complaints;
      } else if (Array.isArray(response)) {
        complaintsList = response;
      }
      
      // Ensure all complaints have required properties
      complaintsList = complaintsList.map(complaint => {
        // Extract name and whatsapp_number with multiple fallback options
        const name = complaint.name ?? complaint.Name ?? null;
        const whatsapp_number = complaint.whatsapp_number ?? complaint.whatsappNumber ?? null;
        
        return {
          ...complaint,
          id: complaint.id ?? '',
          customerId: complaint.customerId ?? complaint.customer_id ?? null,
          name: name,
          address: complaint.address ?? complaint.Address ?? null,
          whatsapp_number: whatsapp_number,
          title: complaint.title ?? complaint.Title ?? '',
          description: complaint.description ?? complaint.Description ?? '',
          status: complaint.status ?? complaint.Status ?? 'open',
          priority: complaint.priority ?? complaint.Priority ?? 'medium'
        };
      });
      
      if (search) {
        const searchLower = search.toLowerCase();
        complaintsList = complaintsList.filter(complaint => 
          (complaint.title ?? '').toLowerCase().includes(searchLower) ||
          (complaint.description ?? '').toLowerCase().includes(searchLower) ||
          (complaint.name ?? '').toLowerCase().includes(searchLower)
        );
      }
      
      if (status) {
        complaintsList = complaintsList.filter(complaint => (complaint.status ?? '') === status);
      }
      
      setComplaints(complaintsList);
    } catch (error) {
      const errorMsg = error.response?.data?.message ?? error.message ?? 'Failed to load complaints';
      toast.error(errorMsg);
      setComplaints([]);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      const response = await customerService.getAll();
      let customersList = [];
      if (response?.data && Array.isArray(response.data)) {
        customersList = response.data;
      } else if (Array.isArray(response)) {
        customersList = response;
      }
      setCustomers(customersList);
    } catch (error) {
      toast.error('Failed to load customers');
      setCustomers([]);
    }
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      loadComplaints('', '', true);
      loadCustomers();
      isInitialMount.current = false;
    }
  }, [loadComplaints, loadCustomers]);

  useEffect(() => {
    if (isInitialMount.current) {
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    if (searchTerm || statusFilter) {
      setSearching(true);
    }
    
    debounceTimer.current = setTimeout(() => {
      loadComplaints(searchTerm, statusFilter, false);
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchTerm, statusFilter, loadComplaints]);

  useEffect(() => {
    if (watchedCustomerId) {
      const customer = customers.find(c => String(c.id) === String(watchedCustomerId));
      if (customer) {
        setSelectedCustomer(customer);
        setValue('name', customer.name || '');
        setValue('address', customer.address || '');
        setValue('whatsapp_number', customer.whatsapp_number || customer.phone || '');
      } else {
        setSelectedCustomer(null);
        setValue('name', '');
        setValue('address', '');
        setValue('whatsapp_number', '');
      }
    } else {
      setSelectedCustomer(null);
      setValue('name', '');
      setValue('address', '');
      setValue('whatsapp_number', '');
    }
  }, [watchedCustomerId, customers, setValue]);

  const onSubmit = async (data) => {
    try {
      const customerId = data.customerId || null;
      let name = null;
      let address = null;
      let whatsapp_number = null;

      if (customerId && selectedCustomer) {
        name = selectedCustomer.name || null;
        address = selectedCustomer.address || null;
        whatsapp_number = selectedCustomer.whatsapp_number || selectedCustomer.phone || null;
      }

      // Validate required fields
      if (!data.title || !data.title.trim()) {
        toast.error('Title is required');
        return;
      }
      if (!data.description || data.description.trim().length < 10) {
        toast.error('Description is required and must be at least 10 characters');
        return;
      }

      const submitData = {
        customerId: customerId || null,
        name: name || null,
        address: address || null,
        whatsapp_number: whatsapp_number || null,
        title: data.title.trim(),
        description: data.description.trim(),
        status: data.status || 'open',
        priority: data.priority || 'medium',
      };

      if (editingComplaint) {
        await complaintService.update(editingComplaint.id, submitData);
        toast.success('Complaint updated successfully!');
        reset();
        setShowModal(false);
        setEditingComplaint(null);
        setSelectedCustomer(null);
        await loadComplaints(searchTerm, statusFilter, false);
      } else {
        await complaintService.create(submitData);
        toast.success('Complaint created successfully!');
        reset();
        setShowModal(false);
        setEditingComplaint(null);
        setSelectedCustomer(null);
        await loadComplaints(searchTerm, statusFilter, false);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message ?? error.response?.data?.error ?? 'Failed to save complaint';
      toast.error(errorMsg);
    }
  };

  const handleEdit = (complaint) => {
    if (!complaint || !complaint.id) {
      toast.error('Invalid complaint data');
      return;
    }
    setEditingComplaint(complaint);
    const customerId = complaint.customerId ?? complaint.customer_id ?? '';
    const customer = customers.find(c => String(c.id) === String(customerId));
    setSelectedCustomer(customer || null);
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

  const handleDelete = (complaint) => {
    setComplaintToDelete(complaint);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!complaintToDelete) return;

    try {
      await complaintService.delete(complaintToDelete.id);
      toast.success('Complaint deleted successfully!');
      setShowDeleteModal(false);
      setComplaintToDelete(null);
      await loadComplaints(searchTerm, statusFilter, false);
    } catch (error) {
      const errorMsg = error.response?.data?.message ?? error.response?.data?.error ?? 'Failed to delete complaint';
      toast.error(errorMsg);
    }
  };

  const canManage = isManager(user?.role);

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
            placeholder="Search complaints..."
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
          <option value="resolved">Resolved</option>
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
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No complaints found.
                </td>
              </tr>
            ) : (
              complaints.map((complaint) => {
                if (!complaint || !complaint.id) return null;
                return (
                  <tr key={complaint.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{complaint.name ?? '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{complaint.whatsapp_number ?? '-'}</td>
                    <td className="px-6 py-4">{complaint.title ?? '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                        complaint.status === 'resolved' ? 'bg-green-600 text-white' :
                        complaint.status === 'in_progress' ? 'bg-blue-600 text-white' :
                        complaint.status === 'closed' ? 'bg-gray-600 text-white' :
                        'bg-yellow-600 text-white'
                      }`}>
                        {complaint.status ?? 'open'}
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
                          <button
                            onClick={() => handleDelete(complaint)}
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
                );
              })
            )}
          </tbody>
        </table>
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
                    validate: (value) => {
                      if (!value || value === '' || value === 'undefined') {
                        return 'Please select a User ID';
                      }
                      return true;
                    }
                  })}
                  className="mt-1 block w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select User ID</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={String(customer.id)}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                {errors.customerId && <p className="text-red-500 text-sm mt-1">{errors.customerId.message}</p>}
              </div>
              {selectedCustomer && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">User Details</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600">User ID</label>
                      <p className="text-sm text-gray-900 font-mono">{selectedCustomer.id || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Name</label>
                      <p className="text-sm text-gray-900">{selectedCustomer.name || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">WhatsApp No</label>
                      <p className="text-sm text-gray-900">{selectedCustomer.whatsapp_number || selectedCustomer.phone || '-'}</p>
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs font-medium text-gray-600">Address</label>
                      <p className="text-sm text-gray-900">{selectedCustomer.address || '-'}</p>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Title *</label>
                <input
                  {...register('title', { required: 'Title is required' })}
                  className="mt-1 block w-full px-3 py-2 border rounded-md"
                  placeholder="Enter complaint title"
                />
                {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description *</label>
                <textarea
                  {...register('description', { required: 'Description is required' })}
                  className="mt-1 block w-full px-3 py-2 border rounded-md"
                  rows="4"
                  placeholder="Enter complaint description"
                />
                {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select {...register('status')} className="mt-1 block w-full px-3 py-2 border rounded-md">
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select {...register('priority')} className="mt-1 block w-full px-3 py-2 border rounded-md">
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

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setComplaintToDelete(null);
        }}
        title="Delete Complaint"
        itemName={complaintToDelete?.title}
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default ComplaintsPage;

