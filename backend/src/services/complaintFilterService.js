const branchService = require('./branchService');

class ComplaintFilterService {
  async filterComplaints(complaints, filters) {
    if (!Array.isArray(complaints)) {
      return [];
    }

    let filteredComplaints = [...complaints];

    // Filter by branch
    if (filters.branch && filters.branch !== 'all') {
      filteredComplaints = await this.filterByBranch(filteredComplaints, filters.branch);
    }

    // Filter by district
    if (filters.district && filters.district !== 'all') {
      filteredComplaints = this.filterByDistrict(filteredComplaints, filters.district);
    }

    // Filter by source
    if (filters.source && filters.source !== 'all') {
      filteredComplaints = this.filterBySource(filteredComplaints, filters.source);
    }

    // Filter by status
    if (filters.status && filters.status !== 'all') {
      filteredComplaints = this.filterByStatus(filteredComplaints, filters.status);
    }

    // Filter by priority
    if (filters.priority && filters.priority !== 'all') {
      filteredComplaints = this.filterByPriority(filteredComplaints, filters.priority);
    }

    // Filter by date range
    if (filters.startDate || filters.endDate) {
      filteredComplaints = this.filterByDateRange(filteredComplaints, filters.startDate, filters.endDate);
    }

    return filteredComplaints;
  }

  async filterByBranch(complaints, branchId) {
    try {
      const branch = await branchService.getBranchById(branchId);
      
      return complaints.filter(complaint => {
        // Check if complaint branch matches
        if (complaint.branch === branchId) {
          return true;
        }

        // Check if complaint area is in branch areas
        if (branch.areas && branch.areas.length > 0 && complaint.area) {
          return branch.areas.includes(complaint.area);
        }

        // Check if complaint district matches branch district
        if (branch.district !== 'all' && complaint.district === branch.district) {
          return true;
        }

        return false;
      });
    } catch (error) {
      console.error('Error filtering by branch:', error);
      return complaints;
    }
  }

  filterByDistrict(complaints, district) {
    return complaints.filter(complaint => 
      complaint.district === district
    );
  }

  filterBySource(complaints, source) {
    return complaints.filter(complaint => 
      complaint.source === source
    );
  }

  filterByStatus(complaints, status) {
    return complaints.filter(complaint => 
      complaint.status === status
    );
  }

  filterByPriority(complaints, priority) {
    return complaints.filter(complaint => 
      complaint.priority === priority
    );
  }

  filterByDateRange(complaints, startDate, endDate) {
    return complaints.filter(complaint => {
      const complaintDate = new Date(complaint.createdAt || complaint.created_at);
      
      if (startDate && complaintDate < new Date(startDate)) {
        return false;
      }
      
      if (endDate && complaintDate > new Date(endDate)) {
        return false;
      }
      
      return true;
    });
  }

  paginateResults(complaints, page = 1, pageSize = 10) {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    const paginatedComplaints = complaints.slice(startIndex, endIndex);
    
    return {
      data: paginatedComplaints,
      pagination: {
        currentPage: page,
        pageSize: pageSize,
        totalCount: complaints.length,
        totalPages: Math.ceil(complaints.length / pageSize),
        hasNextPage: endIndex < complaints.length,
        hasPreviousPage: page > 1
      }
    };
  }

  sortComplaints(complaints, sortBy = 'createdAt', sortOrder = 'desc') {
    return [...complaints].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle date fields
      if (sortBy === 'createdAt' || sortBy === 'created_at' || sortBy === 'resolvedAt') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      }

      // Handle priority sorting
      if (sortBy === 'priority') {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        aValue = priorityOrder[aValue] || 0;
        bValue = priorityOrder[bValue] || 0;
      }

      // Handle status sorting
      if (sortBy === 'status') {
        const statusOrder = { open: 4, in_progress: 3, on_hold: 2, closed: 1 };
        aValue = statusOrder[aValue] || 0;
        bValue = statusOrder[bValue] || 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }
}

module.exports = new ComplaintFilterService();
