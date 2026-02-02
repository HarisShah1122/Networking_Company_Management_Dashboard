import { useEffect, useState } from 'react';
import { complaintService } from '../../services/complaintService';
import Loader from '../../components/common/Loader';

const AllComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const response = await complaintService.getAll();
      const complaintsData = (response.data || []).map(complaint => ({
        id: complaint.id,
        title: complaint.title || 'No Title',
        name: complaint.name || 'Unknown Customer',
        address: complaint.address || 'No Address Provided',
        status: complaint.status || 'open',
        priority: complaint.priority || 'medium',
        whatsapp: complaint.whatsapp_number || 'N/A',
        createdAt: complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : 'Unknown Date',
        description: complaint.description || 'No description available',
        customerId: complaint.customerId || 'N/A',
        connectionId: complaint.connectionId || 'N/A'
      }));
      setComplaints(complaintsData);
    } catch (error) {
      console.error('Error loading complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'text-red-600 bg-red-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'on_hold': return 'text-yellow-600 bg-yellow-100';
      case 'closed': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedComplaint(null);
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">📋 All Complaints</h1>
          <div className="text-sm text-gray-600">
            Total: {complaints.length} complaints
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {complaints.map((complaint) => (
                <tr key={complaint.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {complaint.id.substring(0, 8)}...
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{complaint.name}</div>
                      <div className="text-sm text-gray-500">{complaint.createdAt}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{complaint.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {complaint.description?.substring(0, 80)}...
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      📍 {complaint.address?.length > 30 ? complaint.address.substring(0, 30) + '...' : complaint.address}
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
                    <div className="text-sm text-gray-900">
                      💬 {complaint.whatsapp || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {complaint.createdAt}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleViewDetails(complaint)}
                      className="text-indigo-600 hover:text-indigo-900 mr-2"
                    >
                      View
                    </button>
                    <button className="text-green-600 hover:text-green-900">Assign</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {complaints.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500">No complaints found.</div>
            </div>
          )}
        </div>
      </div>

      {/* Complaint Details Modal */}
      {showDetailsModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">📋 Complaint Details</h2>
                <button
                  onClick={handleCloseDetails}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Name:</span>
                      <p className="text-sm text-gray-900">{selectedComplaint.name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">WhatsApp:</span>
                      <p className="text-sm text-gray-900">💬 {selectedComplaint.whatsapp}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Address:</span>
                      <p className="text-sm text-gray-900">📍 {selectedComplaint.address}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Customer ID:</span>
                      <p className="text-sm text-gray-900">{selectedComplaint.customerId}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Connection ID:</span>
                      <p className="text-sm text-gray-900">{selectedComplaint.connectionId}</p>
                    </div>
                  </div>
                </div>

                {/* Complaint Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Complaint Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Complaint ID:</span>
                      <p className="text-sm text-gray-900">{selectedComplaint.id}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Title:</span>
                      <p className="text-sm text-gray-900">{selectedComplaint.title}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Priority:</span>
                      <div className="mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedComplaint.priority)}`}>
                          {selectedComplaint.priority}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Status:</span>
                      <div className="mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedComplaint.status)}`}>
                          {selectedComplaint.status}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Created Date:</span>
                      <p className="text-sm text-gray-900">{selectedComplaint.createdAt}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900">Description</h3>
                <div className="bg-gray-50 rounded-lg p-4 mt-2">
                  <p className="text-sm text-gray-900">{selectedComplaint.description}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={handleCloseDetails}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Assign to Staff
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllComplaintsPage;
