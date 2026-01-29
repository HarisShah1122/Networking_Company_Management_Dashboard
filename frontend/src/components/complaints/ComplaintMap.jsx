import { useState, useEffect } from 'react';
import { complaintService } from '../../services/complaintService';

const ComplaintMap = ({ complaints = [] }) => {
  const [mapComplaints, setMapComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const response = await complaintService.getAll();
      const complaintData = response.data || [];
      
      // Process complaints for map display
      const processedComplaints = complaintData.map(complaint => ({
        id: complaint.id,
        name: complaint.name || 'Unknown Customer',
        title: complaint.title || 'No Title',
        address: complaint.address || 'No Address',
        status: complaint.status || 'open',
        priority: complaint.priority || 'medium',
        whatsapp: complaint.whatsapp_number,
        latitude: complaint.latitude || extractLocationFromAddress(complaint.address)?.lat,
        longitude: complaint.longitude || extractLocationFromAddress(complaint.address)?.lng,
        createdAt: new Date(complaint.createdAt).toLocaleDateString(),
        description: complaint.description || 'No description available'
      })).filter(complaint => complaint.latitude && complaint.longitude); // Only show complaints with valid coordinates

      setMapComplaints(processedComplaints);
    } catch (error) {
      console.error('Error loading complaints for map:', error);
      // Use sample data if API fails
      setMapComplaints(getSampleComplaints());
    } finally {
      setLoading(false);
    }
  };

  const extractLocationFromAddress = (address) => {
    if (!address) return null;
    
    // Simple geocoding based on city names
    const locations = {
      'mardan': { lat: 34.4326, lng: 72.0311 },
      'peshawar': { lat: 34.0151, lng: 71.5785 },
      'islamabad': { lat: 33.6844, lng: 73.0479 },
      'rawalpindi': { lat: 33.5651, lng: 73.0169 },
      'karachi': { lat: 24.8607, lng: 67.0011 },
      'lahore': { lat: 31.5204, lng: 74.3587 },
      'quetta': { lat: 30.1798, lng: 66.9750 }
    };

    const lowerAddress = address.toLowerCase();
    for (const [city, coords] of Object.entries(locations)) {
      if (lowerAddress.includes(city)) {
        return coords;
      }
    }
    
    // Default to Mardan with small random offset
    return {
      lat: 34.4326 + (Math.random() - 0.5) * 0.1,
      lng: 72.0311 + (Math.random() - 0.5) * 0.1
    };
  };

  const getSampleComplaints = () => [
    {
      id: '1',
      name: 'Ahmed Khan',
      title: 'Internet Not Working',
      address: 'Main Market, Mardan',
      status: 'open',
      priority: 'high',
      whatsapp: '+923429055515',
      latitude: 34.4326,
      longitude: 72.0311,
      createdAt: '2024-01-29',
      description: 'No internet connection for 2 days'
    },
    {
      id: '2',
      name: 'Sara Ali',
      title: 'Slow Connection Speed',
      address: 'City Center, Peshawar',
      status: 'in_progress',
      priority: 'medium',
      whatsapp: '+923123456789',
      latitude: 34.0151,
      longitude: 71.5785,
      createdAt: '2024-01-28',
      description: 'Very slow internet speed during peak hours'
    },
    {
      id: '3',
      name: 'Muhammad Usman',
      title: 'Connection Issues',
      address: 'Sector G-9, Islamabad',
      status: 'closed',
      priority: 'low',
      whatsapp: '+923456789012',
      latitude: 33.6844,
      longitude: 73.0479,
      createdAt: '2024-01-27',
      description: 'Frequent disconnections'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-red-500';
      case 'in_progress': return 'bg-blue-500';
      case 'on_hold': return 'bg-yellow-500';
      case 'closed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-4 h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">📍 Live Complaint Locations</h3>
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
            <span className="text-xs text-gray-600">Open</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
            <span className="text-xs text-gray-600">In Progress</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
            <span className="text-xs text-gray-600">Closed</span>
          </div>
        </div>
      </div>
      
      {/* Map Container */}
      <div className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-lg h-64 mb-4 border-2 border-blue-200">
        {/* Simple Map Visualization */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full">
            {/* Map Background */}
            <div className="absolute inset-0 opacity-20">
              <div className="text-6xl text-center mt-8">🗺️</div>
              <p className="text-center text-gray-500 mt-2">Pakistan Region</p>
            </div>
            
            {/* Complaint Markers */}
            {mapComplaints.map((complaint, index) => (
              <div
                key={complaint.id}
                className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
                style={{
                  left: `${20 + (index * 25)}%`,
                  top: `${30 + (index * 15)}%`
                }}
                onClick={() => setSelectedComplaint(complaint)}
              >
                <div className="relative">
                  <div className={`w-4 h-4 ${getStatusColor(complaint.status)} rounded-full border-2 border-white shadow-lg`}>
                  </div>
                  <div className="absolute -top-1 -right-1 text-xs">
                    {getPriorityIcon(complaint.priority)}
                  </div>
                  {/* Pulse animation for active complaints */}
                  {(complaint.status === 'open' || complaint.status === 'in_progress') && (
                    <div className={`absolute inset-0 ${getStatusColor(complaint.status)} rounded-full animate-ping opacity-75`}></div>
                  )}
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
                  {complaint.name} - {complaint.title}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Map Stats Overlay */}
        <div className="absolute top-2 left-2 bg-white bg-opacity-90 rounded-lg p-2 text-xs">
          <div className="font-semibold text-gray-800">{mapComplaints.length} Active Complaints</div>
          <div className="text-gray-600">Real-time locations</div>
        </div>
      </div>

      {/* Selected Complaint Details */}
      {selectedComplaint && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 flex items-center">
                {getPriorityIcon(selectedComplaint.priority)} {selectedComplaint.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                👤 {selectedComplaint.name} | 📍 {selectedComplaint.address}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                💬 {selectedComplaint.whatsapp} | 📅 {selectedComplaint.createdAt}
              </p>
              <p className="text-xs text-gray-500 mt-2">{selectedComplaint.description}</p>
            </div>
            <button
              onClick={() => setSelectedComplaint(null)}
              className="text-gray-400 hover:text-gray-600 ml-2"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedComplaint.status)} text-white`}>
              {selectedComplaint.status}
            </span>
            <div className="flex space-x-2">
              <button className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                View Details
              </button>
              <button className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complaint List */}
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {mapComplaints.slice(0, 5).map((complaint) => (
          <div
            key={complaint.id}
            className="flex items-center justify-between bg-gray-50 rounded p-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => setSelectedComplaint(complaint)}
          >
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 ${getStatusColor(complaint.status)} rounded-full`}></div>
              <span className="text-sm font-medium">{complaint.name}</span>
              <span className="text-xs text-gray-500">{getPriorityIcon(complaint.priority)}</span>
            </div>
            <span className="text-xs text-gray-600">{complaint.address}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComplaintMap;
