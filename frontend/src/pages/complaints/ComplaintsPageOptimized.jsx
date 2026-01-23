import React, { useState } from 'react';
import { toast } from 'react-toastify';
import useAuthStore from '../../stores/authStore';
import { isManager } from '../../utils/permission.utils';
import Modal from '../../components/common/Modal';
import TablePagination from '../../components/common/TablePagination';
import Loader from '../../components/common/Loader';
import ComplaintForm from '../../components/complaints/ComplaintForm';
import ComplaintTable from '../../components/complaints/ComplaintTable';
import { STATUS_LABELS } from '../../constants/complaintConstants';
import { useComplaints } from '../../hooks/useComplaints';

const ComplaintsPage = () => {
  const { user } = useAuthStore();
  const canManage = isManager(user?.role);
  const [showModal, setShowModal] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const {
    complaints,
    customers,
    paginatedComplaints,
    loading,
    currentPage,
    pageSize,
    searchTerm,
    statusFilter,
    setCurrentPage,
    setPageSize,
    setSearchTerm,
    setStatusFilter,
    resetFilters,
    createComplaint,
    updateComplaint,
    isCreating,
    isUpdating
  } = useComplaints();

  const handleEdit = (complaint) => {
    setEditingComplaint(complaint);
    setShowModal(true);
  };

  const handleOpenModal = () => {
    setEditingComplaint(null);
    setSelectedCustomer(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingComplaint(null);
    setSelectedCustomer(null);
  };

  const onSubmit = async (data) => {
    if (editingComplaint) {
      updateComplaint({ id: editingComplaint.id, data });
    } else {
      createComplaint(data);
    }
    handleCloseModal();
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
        <ComplaintTable
          complaints={complaints}
          currentPage={currentPage}
          pageSize={pageSize}
          canManage={canManage}
          onEdit={handleEdit}
        />

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
              isFetching={false}
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
            customers={customers}
            selectedCustomer={selectedCustomer}
            editingComplaint={editingComplaint}
            onSubmit={onSubmit}
            onCancel={handleCloseModal}
          />
        </Modal>
      )}
    </div>
  );
};

export default ComplaintsPage;
