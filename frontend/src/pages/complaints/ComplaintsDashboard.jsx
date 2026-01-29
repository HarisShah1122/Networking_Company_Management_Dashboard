import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { complaintService } from '../../services/complaintService';
import { 
  STAFF_MEMBERS, 
  BRANCHES, 
  SOURCES, 
  getStatusColor, 
  getPriorityColor, 
  getSourceColor,
  DEFAULT_PAGE_SIZE
} from '../../constants/complaintConstants';
import Modal from '../../components/common/Modal';
import TablePagination from '../../components/common/TablePagination';
import { transformBackendPagination } from '../../utils/pagination.utils';

const ComplaintsDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pagination, setPagination] = useState(null);
  const [paginationState, setPaginationState] = useState({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    closed: 0
  });

  const calculateStats = (complaintsList) => {
    const newStats = {
      total: complaintsList.length,
      open: complaintsList.filter(c => c.status === 'open').length,
      inProgress: complaintsList.filter(c => c.status === 'in_progress').length,
      closed: complaintsList.filter(c => c.status === 'closed').length
    };
    setStats(newStats);
  };

  const calculateTimeRemaining = (assignedAt) => {
    if (!assignedAt) return null;
    const now = currentTime; // Use current time state instead of new Date()
    const assigned = new Date(assignedAt);
    const timeDiff = 24 * 60 * 60 * 1000 - (now - assigned); // 24 hours in milliseconds
    return timeDiff > 0 ? timeDiff : 0;
  };

  const formatTimeRemaining = (milliseconds) => {
    if (!milliseconds) return 'Overdue';
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const loadComplaints = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch complaints from the database with pagination
      const response = await complaintService.getAll({
        page: paginationState.page,
        pageSize: paginationState.pageSize
      });
      
      const allComplaints = response?.complaints || response || [];
      const paginationData = response?.pagination ? transformBackendPagination(response.pagination) : null;
      
      setComplaints(allComplaints);
      setPagination(paginationData);
      calculateStats(allComplaints);
    } catch (error) {
      console.error('Error loading complaints:', error);
      toast.error('Failed to load complaints', { autoClose: 3000 });
      setComplaints([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [paginationState.page, paginationState.pageSize]);

  const filterComplaints = useCallback(() => {
    let filtered = complaints;
    
    // For now, since we don't have branch/district/source in DB, just show all
    setFilteredComplaints(filtered);
  }, [complaints]);

  const handlePageChange = useCallback((newPage) => {
    setPaginationState(prev => ({ ...prev, page: newPage }));
  }, []);

  const handlePageSizeChange = useCallback((newPageSize) => {
    setPaginationState(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
  }, []);

  const assignComplaint = (complaintId, staffId) => {
    const staffMember = STAFF_MEMBERS.find(s => s.id === staffId);
    const updatedComplaints = complaints.map(complaint => {
      if (complaint.id === complaintId) {
        return {
          ...complaint,
          assignedTo: staffId,
          assignedAt: new Date().toISOString(),
          status: 'in_progress',
          fine: 0
        };
      }
      return complaint;
    });
    setComplaints(updatedComplaints);
    setFilteredComplaints(updatedComplaints);
    
    // Show success toast
    toast.success(`Complaint assigned to ${staffMember?.name || 'Staff Member'} successfully!`, {
      autoClose: 3000,
      position: 'top-right'
    });
  };

  const updateComplaintStatus = (complaintId, newStatus) => {
    const updatedComplaints = complaints.map(complaint => {
      if (complaint.id === complaintId) {
        return {
          ...complaint,
          status: newStatus,
          resolvedAt: newStatus === 'closed' ? new Date().toISOString() : null
        };
      }
      return complaint;
    });
    setComplaints(updatedComplaints);
    setFilteredComplaints(updatedComplaints);
    
    // Show success toast
    if (newStatus === 'closed') {
      toast.success('Complaint resolved successfully!', {
        autoClose: 3000,
        position: 'top-right'
      });
    } else if (newStatus === 'in_progress') {
      toast.success('Complaint status updated to In Progress!', {
        autoClose: 3000,
        position: 'top-right'
      });
    }
  };

  const checkOverdueComplaints = useCallback(() => {
    const updatedComplaints = complaints.map(complaint => {
      if (complaint.assignedAt && complaint.status !== 'closed') {
        const timeRemaining = calculateTimeRemaining(complaint.assignedAt);
        if (timeRemaining === 0 && !complaint.fine) {
          return {
            ...complaint,
            status: 'overdue',
            fine: 500
          };
        }
      }
      return complaint;
    });
    setComplaints(updatedComplaints);
    setFilteredComplaints(updatedComplaints);
  }, [complaints, calculateTimeRemaining]);

  const openComplaintModal = (complaint) => {
    setSelectedComplaint(complaint);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedComplaint(null);
  };

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  useEffect(() => {
    filterComplaints();
  }, [complaints, filterComplaints]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date()); // Update current time every second
    }, 1000); // Check every second for real-time updates
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 mb-4"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">🎯 Complaints Dashboard</h1>
          <p className="text-gray-600 mt-2">Branch-wise complaint management</p>
        </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Complaints</div>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-6 border border-red-200">
          <div className="text-2xl font-bold text-red-600">{stats.open}</div>
          <div className="text-sm text-red-600">Open</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-6 border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          <div className="text-sm text-blue-600">In Progress</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200">
          <div className="text-2xl font-bold text-green-600">{stats.closed}</div>
          <div className="text-sm text-green-600">Closed</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🔍 Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {BRANCHES.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {BRANCHES.find(b => b.id === selectedBranch)?.district === 'all' ? (
                <option value="all">All Districts</option>
              ) : (
                BRANCHES.filter(b => b.id === 'all' || b.district === BRANCHES.find(br => br.id === selectedBranch)?.district)
                  .map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SOURCES.map(source => (
                <option key={source.id} value={source.id}>{source.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredComplaints.map((complaint) => (
                <tr key={complaint.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{complaint.name}</div>
                      <div className="text-sm text-gray-500">💬 {complaint.whatsapp_number}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{complaint.title}</div>
                      <div className="text-xs text-gray-500 mt-1">{complaint.description?.substring(0, 50)}...</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {complaint.address || 'No address'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-500 text-white">
                      Internal App
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(complaint.priority)}`}>
                      {complaint.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(complaint.status)}`}>
                      {complaint.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => openComplaintModal(complaint)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination */}
          {pagination && (
            <div className="mt-4">
              <TablePagination
                pagination={pagination}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                pageSize={paginationState.pageSize}
                isFetching={loading}
              />
            </div>
          )}
          
          {filteredComplaints.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500">No complaints found matching the selected filters.</div>
            </div>
          )}
        </div>
      </div>

      {/* Complaint View Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title="Complaint Details"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Complaint Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Complaint ID</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedComplaint?.id?.substring(0, 8) || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedComplaint?.name || 'Unknown'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">💬 {selectedComplaint?.whatsapp_number || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {selectedComplaint?.address || 'No address provided'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-500 text-white">
                  Internal App
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time Created</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {new Date(selectedComplaint?.createdAt || selectedComplaint?.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Right Column - Status & Assignment */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                <span className={`inline-flex px-3 py-2 text-sm font-semibold rounded-full ${getStatusColor(selectedComplaint?.status)}`}>
                  {selectedComplaint?.status?.replace('_', ' ').toUpperCase() || 'OPEN'}
                </span>
              </div>

              {!selectedComplaint?.assignedTo ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign Staff Member</label>
                  <select
                    onChange={(e) => assignComplaint(selectedComplaint.id, parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue=""
                  >
                    <option value="" disabled>Select staff member</option>
                    {STAFF_MEMBERS.map(staff => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name} - {staff.role}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Staff Member</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {STAFF_MEMBERS.find(s => s.id === selectedComplaint.assignedTo)?.name || 'Unknown Staff'}
                  </p>
                </div>
              )}

              {/* Timer Section */}
              {selectedComplaint?.assignedAt && selectedComplaint?.status !== 'closed' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Remaining</label>
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className={`h-4 rounded-full transition-all duration-1000 ${
                          calculateTimeRemaining(selectedComplaint.assignedAt) === 0 ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{
                          width: `${Math.max(0, (calculateTimeRemaining(selectedComplaint.assignedAt) / (24 * 60 * 60 * 1000)) * 100)}%`
                        }}
                      ></div>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatTimeRemaining(calculateTimeRemaining(selectedComplaint.assignedAt))}
                    </p>
                  </div>
                </div>
              )}

              {/* Fine Section */}
              {selectedComplaint?.fine > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fine Applied</label>
                  <p className="text-sm font-bold text-red-600 bg-red-50 p-2 rounded">
                    ₹{selectedComplaint.fine}
                  </p>
                </div>
              )}

              {/* Status Update */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateComplaintStatus(selectedComplaint.id, 'in_progress')}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                    disabled={selectedComplaint?.status === 'in_progress'}
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => updateComplaintStatus(selectedComplaint.id, 'closed')}
                    className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                    disabled={selectedComplaint?.status === 'closed'}
                  >
                    Resolved
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Complaint Description</label>
            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded min-h-[100px]">
              {selectedComplaint?.description || 'No description provided'}
            </p>
          </div>

          {/* Progress Tracking */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Progress Tracking</label>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-3 ${
                  selectedComplaint?.status === 'open' ? 'bg-red-500' : 'bg-green-500'
                }`}></div>
                <span className="text-sm text-gray-700">Complaint Received</span>
              </div>
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-3 ${
                  selectedComplaint?.assignedTo ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <span className="text-sm text-gray-700">Staff Assigned</span>
              </div>
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-3 ${
                  selectedComplaint?.status === 'in_progress' || selectedComplaint?.status === 'closed' ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <span className="text-sm text-gray-700">In Progress</span>
              </div>
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-3 ${
                  selectedComplaint?.status === 'closed' ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <span className="text-sm text-gray-700">Resolved</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
    </div>
  );
};

export default ComplaintsDashboard;
