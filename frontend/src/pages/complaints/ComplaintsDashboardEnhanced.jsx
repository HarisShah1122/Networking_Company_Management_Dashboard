import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { complaintService } from '../../services/complaintService';
import assignmentService from '../../services/assignmentService';
import { STAFF_MEMBERS } from '../../constants/complaintConstants';

// Your areas with PACE TELECOM prefix
const PACE_OFFICES = [
  { id: 'katlang', name: 'PACE TELECOM Katlang', area: 'Katlang' },
  { id: 'katti_garhi', name: 'PACE TELECOM Katti Garhi', area: 'Katti Garhi' },
  { id: 'jamal_garhi', name: 'PACE TELECOM Jamal Garhi', area: 'Jamal Garhi' },
  { id: 'ghondo', name: 'PACE TELECOM Ghondo', area: 'Ghondo' },
  { id: 'babozo', name: 'PACE TELECOM Babozo', area: 'Babozo' },
  { id: 'shadand', name: 'PACE TELECOM Shadand', area: 'Shadand' }
];

const ComplaintsDashboardEnhanced = () => {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    overdue: 0
  });
  const [availableStaff, setAvailableStaff] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedComplaintForAssignment, setSelectedComplaintForAssignment] = useState(null);

  // Real areas data
  const areas = [
    "PACE TELECOM Katlang",
    "PACE TELECOM Katti Garhi", 
    "PACE TELECOM Jamal Garhi",
    "PACE TELECOM Ghondo",
    "PACE TELECOM Babozo",
    "PACE TELECOM Shadand"
  ];

  // Load staff members from database
  const loadStaff = useCallback(async () => {
    try {
      const response = await fetch('/api/users/staff-list', {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const staffData = data.data || data;
        setStaffMembers(staffData);
        console.log('Loaded staff members:', staffData);
      } else {
        console.error('Staff fetch failed:', response.status);
        setStaffMembers([]);
      }
    } catch (error) {
      console.error('Error loading staff:', error);
      // Fallback to empty array
      setStaffMembers([]);
    }
  }, []);

  // Load complaints
  const loadComplaints = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch real complaints from database
      const response = await complaintService.getAll();
      let complaintsData = [];
      
      // Handle different response formats
      if (response?.data?.complaints) {
        complaintsData = response.data.complaints;
      } else if (response?.complaints) {
        complaintsData = response.complaints;
      } else if (Array.isArray(response)) {
        complaintsData = response;
      } else if (Array.isArray(response?.data)) {
        complaintsData = response.data;
      }
      
      console.log('Loaded complaints:', complaintsData);
      
      setComplaints(complaintsData);
      setFilteredComplaints(complaintsData);
      calculateStats(complaintsData);
    } catch (error) {
      toast.error('Failed to load complaints', { autoClose: 3000 });
      setComplaints([]);
      setFilteredComplaints([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate statistics
  const calculateStats = useCallback((complaintsList) => {
    const newStats = {
      total: complaintsList.length,
      pending: complaintsList.filter(c => c.status === 'pending').length,
      inProgress: complaintsList.filter(c => c.status === 'in_progress').length,
      resolved: complaintsList.filter(c => c.status === 'resolved').length,
      overdue: complaintsList.filter(c => c.status === 'overdue').length
    };
    setStats(newStats);
  }, []);

  // Calculate time remaining for assigned complaints
  const calculateTimeRemaining = useCallback((assignedAt) => {
    if (!assignedAt) return null;
    
    const now = currentTime;
    const assigned = new Date(assignedAt);
    const timeDiff = now - assigned;
    const timeLimit = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const remaining = timeLimit - timeDiff;
    
    if (remaining <= 0) return { expired: true, hours: 0, minutes: 0, seconds: 0 };
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    return { expired: false, hours, minutes, seconds };
  }, [currentTime]);

  // Format time remaining
  const formatTimeRemaining = useCallback((timeRemaining) => {
    if (!timeRemaining) return 'Not assigned';
    if (timeRemaining.expired) return 'Overdue';
    
    return `${timeRemaining.hours}h ${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
  }, []);

  const assignComplaint = useCallback(async (complaintId, staffId, officeId) => {
    try {
      setAssignmentLoading(true);
      
      // Validate inputs
      if (!complaintId || !staffId) {
        toast.error('Missing required information for assignment');
        return;
      }

      console.log('Assigning complaint:', { complaintId, staffId, officeId });
      
      const assignmentResult = await assignmentService.manualAssignment(
        complaintId, 
        staffId, 
        officeId || null,
        'Manual assignment from dashboard'
      );

      console.log('Assignment result:', assignmentResult);

      // Update local state
      const updatedComplaints = complaints.map(complaint => {
        if (complaint.id === complaintId) {
          return {
            ...complaint,
            assignedTo: staffId,
            assignedAt: new Date().toISOString(),
            status: 'in_progress',
            officeId: officeId || null,
            fine: 0
          };
        }
        return complaint;
      });

      setComplaints(updatedComplaints);
      setFilteredComplaints(updatedComplaints);
      calculateStats(updatedComplaints);
      
      const staffName = staffMembers.find(s => s.id === staffId)?.name || staffMembers.find(s => s.id === staffId)?.username;
      toast.success(`Complaint assigned to ${staffName}`);
      
    } catch (error) {
      console.error('Assignment failed:', error);
      toast.error(error.message || 'Failed to assign complaint');
    } finally {
      setAssignmentLoading(false);
    }
  }, [complaints, STAFF_MEMBERS, calculateStats]);

  const autoAssignComplaint = useCallback(async (complaintId) => {
    try {
      setAssignmentLoading(true);
      
      const assignmentResult = await assignmentService.assignComplaint(complaintId);

      if (assignmentResult.success) {
        const updatedComplaints = complaints.map(complaint => {
          if (complaint.id === complaintId) {
            return {
              ...complaint,
              assignedTo: assignmentResult.assignedTo.id,
              assignedAt: new Date().toISOString(),
              status: 'in_progress',
              officeId: assignmentResult.officeId,
              assignmentMethod: 'automated'
            };
          }
          return complaint;
        });

        setComplaints(updatedComplaints);
        setFilteredComplaints(updatedComplaints);
        calculateStats(updatedComplaints);
      }
      
    } catch (error) {
      // Handle auto assignment error
    } finally {
      setAssignmentLoading(false);
    }
  }, [complaints, calculateStats]);

  const openAssignmentModal = useCallback((complaint) => {
    setSelectedComplaintForAssignment(complaint);
    setShowAssignmentModal(true);
  }, []);

  // Update complaint status
  const updateComplaintStatus = useCallback((complaintId, newStatus) => {
    const updatedComplaints = complaints.map(complaint => {
      if (complaint.id === complaintId) {
        const updatedComplaint = {
          ...complaint,
          status: newStatus
        };
        
        if (newStatus === 'resolved') {
          updatedComplaint.resolvedAt = new Date().toISOString();
        }
        
        return updatedComplaint;
      }
      return complaint;
    });

    setComplaints(updatedComplaints);
    setFilteredComplaints(updatedComplaints);
    calculateStats(updatedComplaints);
    
    toast.success(`Complaint status updated to ${newStatus.replace('_', ' ')}`, { autoClose: 3000 });
  }, [complaints, calculateStats]);

  // Check for overdue complaints and apply fines
  const checkOverdueComplaints = useCallback(() => {
    const updatedComplaints = complaints.map(complaint => {
      if (complaint.assignedTo && complaint.status === 'in_progress') {
        const timeRemaining = calculateTimeRemaining(complaint.assignedAt);
        
        if (timeRemaining && timeRemaining.expired && complaint.fine === 0) {
          const staffMember = STAFF_MEMBERS.find(s => s.id === complaint.assignedTo);
          toast.error(`⚠️ Fine applied: ${staffMember.name} - RS500 for overdue complaint ${complaint.id}`, { autoClose: 5000 });
          
          return {
            ...complaint,
            status: 'overdue',
            fine: 500
          };
        }
      }
      return complaint;
    });

    const hasChanges = updatedComplaints.some((complaint, index) => 
      complaint.status !== complaints[index].status || complaint.fine !== complaints[index].fine
    );

    if (hasChanges) {
      setComplaints(updatedComplaints);
      setFilteredComplaints(updatedComplaints);
      calculateStats(updatedComplaints);
    }
  }, [complaints, calculateTimeRemaining, STAFF_MEMBERS, calculateStats]);

  // View complaint details
  const viewComplaint = useCallback((complaint) => {
    setSelectedComplaint(complaint);
    setShowModal(true);
  }, []);

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500 text-white',
      in_progress: 'bg-blue-500 text-white',
      resolved: 'bg-green-500 text-white',
      overdue: 'bg-red-500 text-white'
    };
    return colors[status] || 'bg-gray-500 text-white';
  };

  // Get timer color based on time remaining
  const getTimerColor = (timeRemaining) => {
    if (!timeRemaining || timeRemaining.expired) return 'text-red-600';
    if (timeRemaining.hours < 2) return 'text-orange-600';
    if (timeRemaining.hours < 6) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check for overdue complaints every minute
  useEffect(() => {
    const timer = setInterval(() => {
      checkOverdueComplaints();
    }, 60000); // Check every minute

    return () => clearInterval(timer);
  }, [checkOverdueComplaints]);

  // Load complaints on mount
  useEffect(() => {
    loadComplaints();
    loadStaff();
  }, [loadComplaints, loadStaff]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
      <div className="min-h-screen bg-gray-50 py-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 shadow-sm"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🎯 Complaints Management</h1>
          <p className="text-gray-600 mt-2">Track and manage customer complaints with real-time monitoring</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Complaints</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-6 border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-yellow-600">Pending</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-6 border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-sm text-blue-600">In Progress</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <div className="text-sm text-green-600">Resolved</div>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-6 border border-red-200">
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-sm text-red-600">Overdue</div>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">📋 Active Complaints</h2>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Remaining</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredComplaints.map((complaint) => {
                  const timeRemaining = calculateTimeRemaining(complaint.assignedAt);
                  const assignedStaff = STAFF_MEMBERS.find(s => s.id === complaint.assignedTo);
                  
                  return (
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
                              <div className="text-xs text-gray-500">ID: {complaint.customerId || complaint.id?.substring(0, 8)}</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 flex items-center">
                            <span className="mr-2">📱</span>
                            <span>{complaint.whatsapp_number || 'No phone'}</span>
                          </div>
                          <div className="text-xs text-gray-600 flex items-center">
                            <span className="mr-2">📍</span>
                            <span>{complaint.address || 'No address'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {complaint.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {complaint.createdAt ? 
                          (isNaN(new Date(complaint.createdAt).getTime()) ? 
                            'Invalid Date' : 
                            new Date(complaint.createdAt).toLocaleString()
                          ) : 
                          'Not available'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(complaint.status)}`}>
                          {complaint.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assignedStaff ? `${assignedStaff.name || assignedStaff.username} (${assignedStaff.role})` : 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className={`font-medium ${getTimerColor(timeRemaining)}`}>
                          {formatTimeRemaining(timeRemaining)}
                        </div>
                        {complaint.fine > 0 && (
                          <div className="text-red-600 font-semibold">Fine: RS{complaint.fine}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => viewComplaint(complaint)}
                          className="text-blue-600 hover:text-blue-900 mr-2"
                        >
                          View Details
                        </button>
                        {complaint.status === 'pending' && (
                          <>
                            <button
                              onClick={() => autoAssignComplaint(complaint.id)}
                              disabled={assignmentLoading}
                              className="text-green-600 hover:text-green-900 mr-2 text-sm bg-green-50 px-2 py-1 rounded"
                            >
                              {assignmentLoading ? 'Assigning...' : 'Auto Assign'}
                            </button>
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  assignComplaint(complaint.id, e.target.value);
                                  e.target.value = ''; // Reset after selection
                                }
                              }}
                              className="text-xs border border-gray-300 rounded px-2 py-1 mr-2"
                              defaultValue=""
                            >
                              <option value="">Quick Assign</option>
                              {staffMembers.slice(0, 5).map(staff => (
                                <option key={staff.id} value={staff.id}>
                                  {staff.name || staff.username}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => openAssignmentModal(complaint)}
                              className="text-purple-600 hover:text-purple-900 text-sm bg-purple-50 px-2 py-1 rounded"
                            >
                              Manual Assign
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Complaint Details Modal */}
        {showModal && selectedComplaint && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-lg bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Complaint Details</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Customer Information Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                    <span className="mr-2">👤</span>
                    Customer Information
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-blue-600">
                          {selectedComplaint.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{selectedComplaint.name || 'Unknown Customer'}</p>
                        <p className="text-xs text-gray-500">ID: {selectedComplaint.customerId || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center text-sm">
                        <span className="mr-2 text-gray-500">📱</span>
                        <span className="text-gray-900">{selectedComplaint.whatsapp_number || 'No phone number'}</span>
                      </div>
                      
                      <div className="flex items-start text-sm">
                        <span className="mr-2 text-gray-500 mt-0.5">📍</span>
                        <span className="text-gray-900">{selectedComplaint.address || 'No address provided'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Complaint ID</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded font-mono">{selectedComplaint.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time Created</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {selectedComplaint.createdAt ? 
                        (isNaN(new Date(selectedComplaint.createdAt).getTime()) ? 
                          'Invalid Date' : 
                          new Date(selectedComplaint.createdAt).toLocaleString()
                        ) : 
                        'Not available'
                      }
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedComplaint.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                    <span className={`inline-flex px-3 py-2 text-sm font-semibold rounded-full ${getStatusColor(selectedComplaint.status)}`}>
                      {selectedComplaint.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Staff Member</label>
                    {selectedComplaint.assignedTo ? (
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {staffMembers.find(s => s.id === selectedComplaint.assignedTo)?.name || staffMembers.find(s => s.id === selectedComplaint.assignedTo)?.username || 'Unknown Staff'}
                      </p>
                    ) : (
                      <select
                        onChange={(e) => assignComplaint(selectedComplaint.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        defaultValue=""
                      >
                        <option value="" disabled>Select staff member</option>
                        {staffMembers.map(staff => (
                          <option key={staff.id} value={staff.id}>
                            {staff.name || staff.username} - {staff.role}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Timer Section */}
                {selectedComplaint.assignedAt && selectedComplaint.status !== 'resolved' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ⏰ Time Remaining (24-hour SLA)
                    </label>
                    <div className="space-y-3">
                      <div className={`text-2xl font-bold ${getTimerColor(calculateTimeRemaining(selectedComplaint.assignedAt))}`}>
                        {formatTimeRemaining(calculateTimeRemaining(selectedComplaint.assignedAt))}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-6 relative">
                        <div 
                          className={`h-6 rounded-full transition-all duration-1000 ${
                            calculateTimeRemaining(selectedComplaint.assignedAt)?.expired 
                              ? 'bg-red-500' 
                              : calculateTimeRemaining(selectedComplaint.assignedAt)?.hours < 2 
                                ? 'bg-orange-500' 
                                : calculateTimeRemaining(selectedComplaint.assignedAt)?.hours < 6 
                                  ? 'bg-yellow-500' 
                                  : 'bg-green-500'
                          }`}
                          style={{
                            width: calculateTimeRemaining(selectedComplaint.assignedAt)?.expired 
                              ? '100%' 
                              : `${((24 * 60 * 60 * 1000 - (currentTime - new Date(selectedComplaint.assignedAt))) / (24 * 60 * 60 * 1000)) * 100}%`
                          }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                          {calculateTimeRemaining(selectedComplaint.assignedAt)?.expired 
                            ? 'OVERDUE' 
                            : `${Math.round(((24 * 60 * 60 * 1000 - (currentTime - new Date(selectedComplaint.assignedAt))) / (24 * 60 * 60 * 1000)) * 100)}% Complete`
                          }
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">
                        Assigned: {new Date(selectedComplaint.assignedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Fine Section */}
                {selectedComplaint.fine > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="text-red-800 font-semibold">⚠️ Fine Applied</h4>
                    <p className="text-red-700">Fine amount: RS{selectedComplaint.fine}</p>
                    <p className="text-red-600 text-sm">Complaint was not resolved within 24 hours</p>
                  </div>
                )}

                {/* Status Update Actions */}
                <div className="flex space-x-3">
                  {selectedComplaint.status === 'pending' && (
                    <button
                      onClick={() => updateComplaintStatus(selectedComplaint.id, 'in_progress')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Mark In Progress
                    </button>
                  )}
                  {selectedComplaint.status === 'in_progress' && (
                    <button
                      onClick={() => updateComplaintStatus(selectedComplaint.id, 'resolved')}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assignment Modal */}
        {showAssignmentModal && selectedComplaintForAssignment && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-lg bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Assign Complaint - {selectedComplaintForAssignment.id}</h3>
                <button
                  onClick={() => setShowAssignmentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Complaint Details</h4>
                  <p className="text-sm text-gray-600">{selectedComplaintForAssignment.description}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Location:</strong> {selectedComplaintForAssignment.address}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Customer:</strong> {selectedComplaintForAssignment.customerId}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Office</label>
                  <select
                    id="officeSelect"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={async (e) => {
                      const officeId = e.target.value;
                      if (officeId) {
                        try {
                          const staff = await assignmentService.getAvailableStaff(officeId);
                          setAvailableStaff(staff);
                        } catch (error) {
                          console.error('Error loading staff:', error);
                          // Fallback to mock staff if API fails
                          const mockStaff = staffMembers.map(staff => ({
                            ...staff,
                            workload: { activeComplaints: Math.floor(Math.random() * 5), capacity: 10 },
                            availabilityScore: Math.floor(Math.random() * 100)
                          }));
                          setAvailableStaff(mockStaff);
                        }
                      } else {
                        setAvailableStaff([]);
                      }
                    }}
                  >
                    <option value="">Select an office</option>
                    <option value="mardan_main">PACE TELECOM Mardan Main</option>
                    <option value="takht_bhai">PACE TELECOM Takht Bhai</option>
                    <option value="katlang">PACE TELECOM Katlang</option>
                  </select>
                </div>

                {availableStaff.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Available Staff</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {availableStaff.map(staff => (
                        <div key={staff.id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                          <div className="flex-1">
                            <p className="font-medium">{staff.name || staff.username}</p>
                            <p className="text-sm text-gray-600">
                              Role: {staff.role}
                              {staff.workload && ` - Workload: ${staff.workload.activeComplaints}/${staff.workload.capacity}`}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              const officeId = document.getElementById('officeSelect').value;
                              if (!officeId) {
                                toast.error('Please select an office first');
                                return;
                              }
                              assignComplaint(selectedComplaintForAssignment.id, staff.id, officeId);
                              setShowAssignmentModal(false);
                            }}
                            disabled={assignmentLoading}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {assignmentLoading ? 'Assigning...' : 'Assign'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Phone-based Assignment */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assign by Phone Number</label>
                  <div className="flex space-x-2">
                    <input
                      type="tel"
                      id="phoneInput"
                      placeholder="Enter phone number (e.g., 03001234567)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => {
                        const phoneNumber = document.getElementById('phoneInput').value.trim();
                        if (phoneNumber) {
                          const staff = STAFF_MEMBERS.find(s => s.phone === phoneNumber);
                          if (staff) {
                            assignComplaint(selectedComplaintForAssignment.id, staff.id, document.getElementById('officeSelect').value);
                            setShowAssignmentModal(false);
                            toast.success(`Task assigned to ${staff.name} via phone ${phoneNumber}`);
                          } else {
                            toast.error('No staff member found with this phone number');
                          }
                        } else {
                          toast.error('Please enter a phone number');
                        }
                      }}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Assign by Phone
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Quick assign by entering staff phone number
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowAssignmentModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default ComplaintsDashboardEnhanced;
