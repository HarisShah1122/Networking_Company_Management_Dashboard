import { toast } from 'react-toastify';
import apiClient from './api/apiClient';

const assignmentService = {
  assignComplaint: async (complaintId) => {
    try {
      const response = await apiClient.post(`/assignment/complaints/${complaintId}/assign`);
      
      if (response.data.success) {
        toast.success('Complaint assigned successfully');
        return response.data.data;
      } else {
        toast.error(response.data.message || 'Failed to assign complaint');
        throw new Error(response.data.message);
      }
    } catch (error) {
      toast.error('Failed to assign complaint');
      throw error;
    }
  },

  autoAssignMultiple: async (complaintIds) => {
    try {
      const response = await apiClient.post('/assignment/complaints/auto-assign', { complaintIds });

      if (response.data.success) {
        const { successful, failed, total } = response.data.data;
        toast.success(`Processed ${total} complaints: ${successful} assigned, ${failed} failed`);
        return response.data.data;
      } else {
        toast.error(response.data.message || 'Failed to auto-assign complaints');
        throw new Error(response.data.message);
      }
    } catch (error) {
      toast.error('Failed to auto-assign complaints');
      throw error;
    }
  },

  manualAssignment: async (complaintId, staffId, officeId, reason) => {
    try {
      const response = await apiClient.post(`/assignment/complaints/${complaintId}/manual-assign`, { staffId, officeId, reason });

      if (response.data.success) {
        toast.success('Complaint assigned manually');
        return response.data.data;
      } else {
        toast.error(response.data.message || 'Failed to assign complaint manually');
        throw new Error(response.data.message);
      }
    } catch (error) {
      toast.error('Failed to assign complaint manually');
      throw error;
    }
  },

  reassignComplaint: async (complaintId, newStaffId, newOfficeId, reason) => {
    try {
      const response = await apiClient.put(`/assignment/complaints/${complaintId}/reassign`, { newStaffId, newOfficeId, reason });

      if (response.data.success) {
        toast.success('Complaint reassigned successfully');
        return response.data.data;
      } else {
        toast.error(response.data.message || 'Failed to reassign complaint');
        throw new Error(response.data.message);
      }
    } catch (error) {
      toast.error('Failed to reassign complaint');
      throw error;
    }
  },

  getAssignmentStats: async () => {
    try {
      const response = await apiClient.get('/assignment/stats');

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      throw error;
    }
  },

  getAvailableStaff: async (officeId) => {
    try {
      const response = await apiClient.get(`/assignment/staff/available?officeId=${officeId}`);

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      throw error;
    }
  },

  getMardanOffices: async () => {
    try {
      const response = await apiClient.get('/assignment/mardan/offices');

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      throw error;
    }
  },

  getStaffWorkload: async (staffId) => {
    try {
      const response = await apiClient.get(`/assignment/staff/${staffId}/workload`);

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      throw error;
    }
  }
};

export default assignmentService;
