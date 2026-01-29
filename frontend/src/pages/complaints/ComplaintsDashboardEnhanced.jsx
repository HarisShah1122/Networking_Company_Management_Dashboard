import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { complaintService } from '../../services/complaintService';

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

  // Mock staff members
  const staffMembers = [
    { id: 1, name: 'Ahmed Khan', role: 'Technician', fines: 0 },
    { id: 2, name: 'Sara Ali', role: 'Support Staff', fines: 0 },
    { id: 3, name: 'Muhammad Raza', role: 'Technician', fines: 0 },
    { id: 4, name: 'Fatima Sheikh', role: 'Support Staff', fines: 0 },
    { id: 5, name: 'Bilal Ahmed', role: 'Technician', fines: 0 }
  ];

  // Mock complaints data
  const mockComplaints = [
    {
      id: 'COMP-001',
      description: 'Internet connection is very slow in the morning hours',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: 'pending',
      assignedTo: null,
      assignedAt: null,
      fine: 0
    },
    {
      id: 'COMP-002',
      description: 'WiFi router not working after power outage',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      status: 'in_progress',
      assignedTo: 1,
      assignedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      fine: 0
    },
    {
      id: 'COMP-003',
      description: 'Frequent disconnections during video calls',
      createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000), // 26 hours ago
      status: 'overdue',
      assignedTo: 2,
      assignedAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
      fine: 500
    },
    {
      id: 'COMP-004',
      description: 'No internet connection in bedroom area',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      status: 'resolved',
      assignedTo: 3,
      assignedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      resolvedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      fine: 0
    },
    {
      id: 'COMP-005',
      description: 'High ping issues while gaming',
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      status: 'pending',
      assignedTo: null,
      assignedAt: null,
      fine: 0
    }
  ];

  // Load complaints
  const loadComplaints = useCallback(async () => {
    try {
      setLoading(true);
      
      // Use mock data for now
      const allComplaints = mockComplaints;
      
      setComplaints(allComplaints);
      setFilteredComplaints(allComplaints);
      calculateStats(allComplaints);
    } catch (error) {
      console.error('Error loading complaints:', error);
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

  // Assign complaint to staff member
  const assignComplaint = useCallback((complaintId, staffId) => {
    const staffMember = staffMembers.find(s => s.id === staffId);
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
    calculateStats(updatedComplaints);
    
    toast.success(`Complaint assigned to ${staffMember.name}`, { autoClose: 3000 });
  }, [complaints, staffMembers, calculateStats]);

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
          const staffMember = staffMembers.find(s => s.id === complaint.assignedTo);
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
  }, [complaints, calculateTimeRemaining, staffMembers, calculateStats]);

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
  }, [loadComplaints]);

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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complaint ID</th>
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
                  const assignedStaff = staffMembers.find(s => s.id === complaint.assignedTo);
                  
                  return (
                    <tr key={complaint.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {complaint.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {complaint.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(complaint.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(complaint.status)}`}>
                          {complaint.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assignedStaff ? `${assignedStaff.name} (${assignedStaff.role})` : 'Unassigned'}
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
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View Details
                        </button>
                        {complaint.status === 'pending' && (
                          <select
                            onChange={(e) => assignComplaint(complaint.id, parseInt(e.target.value))}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                            defaultValue=""
                          >
                            <option value="" disabled>Assign</option>
                            {staffMembers.map(staff => (
                              <option key={staff.id} value={staff.id}>
                                {staff.name}
                              </option>
                            ))}
                          </select>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Complaint ID</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedComplaint.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time Created</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {new Date(selectedComplaint.createdAt).toLocaleString()}
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
                        {staffMembers.find(s => s.id === selectedComplaint.assignedTo)?.name || 'Unknown Staff'}
                      </p>
                    ) : (
                      <select
                        onChange={(e) => assignComplaint(selectedComplaint.id, parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        defaultValue=""
                      >
                        <option value="" disabled>Select staff member</option>
                        {staffMembers.map(staff => (
                          <option key={staff.id} value={staff.id}>
                            {staff.name} - {staff.role}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Timer Section */}
                {selectedComplaint.assignedAt && selectedComplaint.status !== 'resolved' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time Remaining</label>
                    <div className="space-y-2">
                      <div className={`text-lg font-bold ${getTimerColor(calculateTimeRemaining(selectedComplaint.assignedAt))}`}>
                        {formatTimeRemaining(calculateTimeRemaining(selectedComplaint.assignedAt))}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className={`h-4 rounded-full transition-all duration-1000 ${
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
      </div>
    </div>
    </>
  );
};

export default ComplaintsDashboardEnhanced;
