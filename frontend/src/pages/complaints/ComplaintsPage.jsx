import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { complaintService } from '../../services/complaintService';
import { customerService } from '../../services/customerService';
import useAuthStore from '../../stores/authStore';
import { isManager } from '../../utils/permission.utils';
import Modal from '../../components/common/Modal';
import TablePagination from '../../components/common/TablePagination';
import Loader from '../../components/common/Loader';
import ComplaintForm from '../../components/complaints/ComplaintForm';
import ComplaintTable from '../../components/complaints/ComplaintTable';
import { 
  STATUS_LABELS, 
  DEFAULT_PAGE_SIZE, 
  DEBOUNCE_DELAY 
} from '../../constants/complaintConstants';
import { transformComplaintData, filterComplaints } from '../../utils/complaintHelpers';
import { useComplaintForm } from '../../hooks/useComplaintForm';

const ComplaintsPage = () => {
  const { user } = useAuthStore();
  const canManage = isManager(user?.role);

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
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const debounceTimer = useRef(null);
  const isInitialMount = useRef(true);

  const {
    register,
    handleSubmit,
    errors,
    touchedFields,
    initializeForm,
    resetForm,
    validateAndPrepareData
  } = useComplaintForm(customers, editingComplaint, selectedCustomer, setSelectedCustomer);

  const loadCustomers = useCallback(async () => {
    try {
      const response = await customerService.getAll();
      let list = Array.isArray(response) ? response : (response?.customers ?? response?.data ?? []);
      setCustomers(list.filter(c => c?.id));
    } catch {
      toast.error('Failed to load customers');
      setCustomers([]);
    }
  }, []);

  const loadComplaints = useCallback(async (search = '', status = '', isInitialLoad = false) => {
    try {
      if (isInitialLoad) setLoading(true);
      else setSearching(true);

      const response = await complaintService.getAll();
      let complaintsList = Array.isArray(response) ? response
        : (response?.data?.complaints ?? response?.complaints ?? []);

      complaintsList = complaintsList.map(complaint => 
        transformComplaintData(complaint, customers)
      );

      complaintsList = filterComplaints(complaintsList, search, status);
      setComplaints(complaintsList);
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
        await Promise.all([
          loadCustomers(),
        ]);
        await loadComplaints('', '', true);
      })();
      isInitialMount.current = false;
    }
  }, [loadCustomers, loadComplaints]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      loadComplaints(searchTerm, statusFilter);
      setCurrentPage(1);
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(debounceTimer.current);
  }, [searchTerm, statusFilter, loadComplaints]);

  const onSubmit = async (data) => {
    try {
      const submitData = validateAndPrepareData(data);
      if (!submitData) return;

      if (editingComplaint) {
        await complaintService.update(editingComplaint.id, submitData);
        toast.success('Complaint updated successfully!');
      } else {
        await complaintService.create(submitData);
        toast.success('Complaint created successfully!');
      }

      handleCloseModal();
      await loadComplaints(searchTerm, statusFilter);
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Failed to save complaint');
    }
  };

  const handleEdit = (complaint) => {
    setEditingComplaint(complaint);
    initializeForm(complaint);
    setShowModal(true);
  };

  const handleOpenModal = () => {
    resetForm();
    setEditingComplaint(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
    setEditingComplaint(null);
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Complaints</h1>
      </div>

      <div className="flex gap-4 mb-4 flex-wrap">
        <div className="flex-1 relative min-w-[280px]">
          <input
            type="text"
            placeholder="Search complaints by title, description, name..."
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
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[160px]"
        >
          <option value="">All Status</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {canManage && (
          <button
            onClick={handleOpenModal}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 whitespace-nowrap"
          >
            Add Complaint
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <ComplaintTable
            complaints={complaints}
            currentPage={currentPage}
            pageSize={pageSize}
            canManage={canManage}
            onEdit={handleEdit}
          />
        </div>

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
          onClose={handleCloseModal}
          title={editingComplaint ? 'Edit Complaint' : 'Add Complaint'}
        >
          <ComplaintForm
            register={register}
            errors={errors}
            touchedFields={touchedFields}
            customers={customers}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            editingComplaint={editingComplaint}
            onSubmit={handleSubmit(onSubmit)}
            onCancel={handleCloseModal}
          />
        </Modal>
      )}
    </div>
  );
};

export default ComplaintsPage;
