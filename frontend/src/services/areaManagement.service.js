const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const areaManagementService = {
  // Get all areas with their assigned managers
  getAreasWithManagers: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/area-management/areas-with-managers`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error getting areas with managers:', error);
      throw error;
    }
  },

  // Get area manager by area ID
  getAreaManager: async (areaId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/area-management/area-manager/${areaId}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error getting area manager:', error);
      throw error;
    }
  },

  // Get technicians in an area with their workload
  getAreaTechnicians: async (areaId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/area-management/area-technicians/${areaId}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error getting area technicians:', error);
      throw error;
    }
  },

  // Assign manager to area
  assignManagerToArea: async (areaId, managerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/area-management/assign-manager`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ areaId, managerId })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error assigning manager to area:', error);
      throw error;
    }
  },

  // Auto-assign technician to complaint
  autoAssignTechnician: async (areaId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/area-management/auto-assign-technician/${areaId}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error auto-assigning technician:', error);
      throw error;
    }
  },

  // Reassign complaint (Manager override)
  reassignComplaint: async (complaintId, newTechnicianId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/area-management/reassign-complaint`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ complaintId, newTechnicianId })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error reassigning complaint:', error);
      throw error;
    }
  },

  // Get technician workload
  getTechnicianWorkload: async (technicianId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/area-management/technician-workload/${technicianId}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data || { activeComplaints: 0 };
    } catch (error) {
      console.error('Error getting technician workload:', error);
      throw error;
    }
  }
};

export default areaManagementService;
