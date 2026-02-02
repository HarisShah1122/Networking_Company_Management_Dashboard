import { toast } from 'react-toastify';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const assignmentService = {
  assignComplaint: async (complaintId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assignment/complaints/${complaintId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Complaint assigned successfully');
        return data.data;
      } else {
        toast.error(data.message || 'Failed to assign complaint');
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error('Failed to assign complaint');
      throw error;
    }
  },

  autoAssignMultiple: async (complaintIds) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assignment/complaints/auto-assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ complaintIds })
      });

      const data = await response.json();

      if (data.success) {
        const { successful, failed, total } = data.data;
        toast.success(`Processed ${total} complaints: ${successful} assigned, ${failed} failed`);
        return data.data;
      } else {
        toast.error(data.message || 'Failed to auto-assign complaints');
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error('Failed to auto-assign complaints');
      throw error;
    }
  },

  manualAssignment: async (complaintId, staffId, officeId, reason) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assignment/complaints/${complaintId}/manual-assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ staffId, officeId, reason })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Complaint assigned manually');
        return data.data;
      } else {
        toast.error(data.message || 'Failed to assign complaint manually');
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error('Failed to assign complaint manually');
      throw error;
    }
  },

  reassignComplaint: async (complaintId, newStaffId, newOfficeId, reason) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assignment/complaints/${complaintId}/reassign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ newStaffId, newOfficeId, reason })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Complaint reassigned successfully');
        return data.data;
      } else {
        toast.error(data.message || 'Failed to reassign complaint');
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error('Failed to reassign complaint');
      throw error;
    }
  },

  getAssignmentStats: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/assignment/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      throw error;
    }
  },

  getAvailableStaff: async (officeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assignment/staff/available?officeId=${officeId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      throw error;
    }
  },

  getMardanOffices: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/assignment/mardan/offices`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      throw error;
    }
  },

  getStaffWorkload: async (staffId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assignment/staff/${staffId}/workload`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      throw error;
    }
  }
};

export default assignmentService;
