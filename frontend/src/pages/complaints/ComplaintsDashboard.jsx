import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { complaintService } from '../../services/complaintService';
import { userService } from '../../services/userService';
import useAuthStore from '../../stores/authStore';
import { 
  AREAS,
  SOURCES, 
  getStatusColor, 
  getPriorityColor, 
  DEFAULT_PAGE_SIZE
} from '../../constants/complaintConstants';
import Modal from '../../components/common/Modal';
import TablePagination from '../../components/common/TablePagination';
import { transformBackendPagination } from '../../utils/pagination.utils';

const ComplaintsDashboard = () => {
  const { user } = useAuthStore();
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [loading, setLoading] = useState(true);
  const [techniciansLoading, setTechniciansLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [paginationState, setPaginationState] = useState({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    closed: 0,
    overdue: 0,
    penalties: 0
  });
  const [slaStats, setSlaStats] = useState({
    total_assigned: 0,
    sla_met: 0,
    sla_breached: 0,
    compliance_rate: 0,
    total_penalties: 0
  });

  const calculateStats = (complaintsList) => {
    const newStats = {
      total: complaintsList.length,
      open: complaintsList.filter(c => c.status === 'open').length,
      inProgress: complaintsList.filter(c => c.status === 'in_progress').length,
      closed: complaintsList.filter(c => c.status === 'closed').length,
      overdue: complaintsList.filter(c => 
        c.assigned_at && 
        c.status !== 'closed' && 
        new Date() > new Date(c.sla_deadline)
      ).length,
      penalties: complaintsList.reduce((sum, c) => sum + (parseFloat(c.penalty_amount) || 0), 0)
    };
    setStats(newStats);
  };

  const calculateTimeRemaining = (slaDeadline) => {
    if (!slaDeadline) return null;
    const now = new Date();
    const deadline = new Date(slaDeadline);
    const timeDiff = deadline - now;
    return timeDiff > 0 ? timeDiff : 0;
  };

  const formatTimeRemaining = (milliseconds) => {
    if (!milliseconds || milliseconds <= 0) return 'Overdue';
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const getSLAStatusColor = (slaStatus, assignedAt, slaDeadline) => {
    if (!assignedAt || !slaDeadline) return 'bg-gray-100 text-gray-800';
    
    const now = new Date();
    const deadline = new Date(slaDeadline);
    const isOverdue = now > deadline;
    
    switch (slaStatus) {
      case 'met':
        return 'bg-green-100 text-green-800';
      case 'breached':
        return 'bg-red-100 text-red-800';
      case 'pending_penalty':
        return 'bg-orange-100 text-orange-800';
      case 'pending':
        return isOverdue ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSLAStatusText = (slaStatus, assignedAt, slaDeadline) => {
    if (!assignedAt || !slaDeadline) return 'Not Assigned';
    
    const now = new Date();
    const deadline = new Date(slaDeadline);
    const isOverdue = now > deadline;
    
    switch (slaStatus) {
      case 'met':
        return 'SLA Met';
      case 'breached':
        return 'SLA Breached';
      case 'pending_penalty':
        return 'Penalty Pending';
      case 'pending':
        return isOverdue ? 'Overdue' : 'In Progress';
      default:
        return 'Unknown';
    }
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
      
      console.log('🔍 Loaded complaints:', allComplaints.length);
      console.log('📊 Sample complaint data:', allComplaints[0]);
      
      setComplaints(allComplaints);
      setPagination(paginationData);
      calculateStats(allComplaints);
      
      // Load SLA stats
      if (user?.company_id) {
        try {
          const slaData = await complaintService.getSLAStats(user.company_id);
          console.log('📈 SLA Stats:', slaData);
          setSlaStats(slaData);
        } catch (slaError) {
          console.error('Error loading SLA stats:', slaError);
        }
      }
    } catch (error) {
      console.error('Error loading complaints:', error);
      toast.error('Failed to load complaints', { autoClose: 3000 });
      setComplaints([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [paginationState.page, paginationState.pageSize, user?.company_id]);

  const loadTechnicians = useCallback(async () => {
    try {
      setTechniciansLoading(true);
      console.log('🔧 Loading technicians...');
      const techniciansData = await userService.getTechnicians();
      console.log('👨‍🔧 Technicians loaded:', techniciansData);
      setTechnicians(techniciansData);
    } catch (error) {
      console.error('Error loading technicians:', error);
      toast.error('Failed to load technicians', { autoClose: 3000 });
      setTechnicians([]);
    } finally {
      setTechniciansLoading(false);
    }
  }, []);

  const filterComplaints = useCallback(() => {
    let filtered = complaints;
    
    // Filter by area
    if (selectedArea !== 'all') {
      filtered = filtered.filter(complaint => 
        complaint.address && complaint.address.toLowerCase().includes(selectedArea.toLowerCase())
      );
    }
    
    // Filter by district
    if (selectedDistrict !== 'all') {
      filtered = filtered.filter(complaint => 
        complaint.address && complaint.address.toLowerCase().includes(selectedDistrict.toLowerCase())
      );
    }
    
    // Filter by source
    if (selectedSource !== 'all') {
      filtered = filtered.filter(complaint => complaint.source === selectedSource);
    }
    
    setFilteredComplaints(filtered);
  }, [complaints, selectedArea, selectedDistrict, selectedSource]);

  const handlePageChange = useCallback((newPage) => {
    setPaginationState(prev => ({ ...prev, page: newPage }));
  }, []);

  const handlePageSizeChange = useCallback((newPageSize) => {
    setPaginationState(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
  }, []);

  const assignComplaint = async (complaintId, technicianId) => {
    try {
      await complaintService.assignToTechnician(complaintId, technicianId);
      
      // Refresh complaints list
      await loadComplaints();
      
      const technician = technicians.find(t => t.id === technicianId);
      const technicianName = technician?.username || technician?.name || 'Staff Member';
      
      toast.success(`Complaint assigned to ${technicianName}! SLA timer started.`, {
        autoClose: 3000,
        position: 'top-right'
      });
      
      // Send email notification to technician
      if (technician?.email) {
        try {
          await complaintService.sendAssignmentNotification(technician.email, {
            complaintId,
            technicianName,
            assignedBy: user?.username,
            message: `You have been assigned a new complaint (ID: ${complaintId}). Please check your dashboard for details.`
          });
          console.log('📧 Assignment notification sent to:', technician.email);
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
          toast.warning('Complaint assigned but email notification failed', { autoClose: 3000 });
        }
      }
    } catch (error) {
      console.error('Error assigning complaint:', error);
      toast.error('Failed to assign complaint', { autoClose: 3000 });
    }
  };

  const updateComplaintStatus = async (complaintId, newStatus) => {
    try {
      await complaintService.update(complaintId, { status: newStatus }, user?.id, user?.company_id, user?.id);
      
      // Refresh complaints list
      await loadComplaints();
      
      if (newStatus === 'closed') {
        toast.success('Complaint resolved successfully! SLA status updated.', {
          autoClose: 3000,
          position: 'top-right'
        });
      } else if (newStatus === 'in_progress') {
        toast.success('Complaint status updated to In Progress!', {
          autoClose: 3000,
          position: 'top-right'
        });
      }
    } catch (error) {
      console.error('Error updating complaint status:', error);
      toast.error('Failed to update complaint status', { autoClose: 3000 });
    }
  };

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
    loadTechnicians();
  }, [loadComplaints, loadTechnicians]);

  useEffect(() => {
    filterComplaints();
  }, [complaints, filterComplaints]);

  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
  <>
  <div className="min-h-screen bg-gray-50">
    {/* Header */}
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900 tracking-wider" style={{ fontFamily: "'Poppins', 'Montserrat', system-ui, sans-serif", textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              <span 
                className="text-blue-600 inline-block animate-pulse cursor-default"
                style={{
                  animation: 'glow 2s linear infinite alternate, slideInLeft 0.8s linear'
                }}
              >
                📊 Complaints Dashboard
              </span>
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <nav className="flex space-x-4">
              <Link 
                to="/dashboard" 
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                ← Back to Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </div>

    {/* Main Content */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Statistics Cards */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Complaints</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200">
          <div className="text-2xl font-bold text-green-600">{stats.open}</div>
          <div className="text-sm text-green-600">Open</div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-6 border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
          <div className="text-sm text-yellow-600">In Progress</div>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-6 border border-red-200">
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          <div className="text-sm text-red-600">Overdue</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-6 border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{slaStats.total_assigned}</div>
          <div className="text-sm text-blue-600">Assigned</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200">
          <div className="text-2xl font-bold text-green-600">{slaStats.sla_met}</div>
          <div className="text-sm text-green-600">SLA Met</div>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-6 border border-red-200">
          <div className="text-2xl font-bold text-red-600">{slaStats.sla_breached}</div>
          <div className="text-sm text-red-600">SLA Breached</div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-6 border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600">{slaStats.compliance_rate}%</div>
          <div className="text-sm text-yellow-600">Compliance Rate</div>
        </div>
        <div className="bg-orange-50 rounded-lg shadow p-6 border border-orange-200">
          <span className="text-sm text-gray-600">PKR {slaStats.total_penalties}</span>
          <div className="text-sm text-orange-600">Total Penalties</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🔍 Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Area</label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Areas</option>
                {AREAS.map((area, index) => (
                  <option key={index} value={area}>{area}</option>
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
                <option value="all">All Districts</option>
                <option value="mardan">Mardan</option>
                <option value="peshawar">Peshawar</option>
                <option value="islamabad">Islamabad</option>
                <option value="rawalpindi">Rawalpindi</option>
                <option value="nowshera">Nowshera</option>
                <option value="charsadda">Charsadda</option>
                <option value="swabi">Swabi</option>
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
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SLA Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Remaining</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredComplaints.map((complaint) => (
                <tr key={complaint.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-xs font-medium text-blue-600">
                            {complaint.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{complaint.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">ID: {complaint.customerId || 'N/A'}</div>
                          <div className="text-xs text-gray-600 flex items-center">
                            <span className="mr-2">📞</span>
                            <span>{complaint.whatsapp_number || 'No phone'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{complaint.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{complaint.description?.substring(0, 50)}...</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {complaint.address || 'No address'}
                    </div>
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
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSLAStatusColor(complaint.sla_status, complaint.assigned_at, complaint.sla_deadline)}`}>
                      {getSLAStatusText(complaint.sla_status, complaint.assigned_at, complaint.sla_deadline)}
                    </span>
                    {complaint.penalty_applied && (
                      <div className="text-xs text-red-600 mt-1">
                        Penalty: PKR {complaint.penalty_amount || 500}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {complaint.assigned_at && complaint.sla_deadline ? (
                      <div>
                        <div className={`text-sm font-medium ${
                          calculateTimeRemaining(complaint.sla_deadline) > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatTimeRemaining(calculateTimeRemaining(complaint.sla_deadline))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Not Assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(complaint.created_at).toLocaleDateString()}
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
        </div>
        
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
      </div>
    </div>

    {/* No complaints message */}
    {filteredComplaints.length === 0 && (
      <div className="text-center py-8">
        <div className="text-gray-500">No complaints found matching the selected filters.</div>
      </div>
    )}
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
          {/* Left Column - Complaint Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Complaint ID</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {selectedComplaint?.id}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time Created</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {new Date(selectedComplaint?.createdAt || selectedComplaint?.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
              <span className={`inline-flex px-3 py-2 text-sm font-semibold rounded-full ${getStatusColor(selectedComplaint?.status)}`}>
                {selectedComplaint?.status?.replace('_', ' ').toUpperCase() || 'OPEN'}
              </span>
            </div>

            {/* Assignment Section */}
            {!selectedComplaint?.assignedTo ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Staff Member</label>
                <select
                  onChange={(e) => assignComplaint(selectedComplaint.id, parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue=""
                  disabled={techniciansLoading}
                >
                  <option value="" disabled>
                    {techniciansLoading ? 'Loading technicians...' : 'Select technician'}
                  </option>
                  {technicians.map(technician => (
                    <option key={technician.id} value={technician.id}>
                      {technician.username} - {technician.role}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

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
  </>
  );
};

export default ComplaintsDashboard;
