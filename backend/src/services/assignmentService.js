const { MARDAN_OFFICE_LOCATIONS, MARDAN_DISTRICT_MAPPING, ASSIGNMENT_PRIORITY, WORKLOAD_LIMITS, DISTANCE_MATRIX } = require('../config/geographicConfig');
const { Complaint, User } = require('../models');

class AssignmentService {
  constructor() {
    this.staffWorkload = new Map();
  }

  async assignComplaint(complaint) {
    try {
      const location = this.extractLocation(complaint);
      const office = this.findNearestOffice(location);
      
      if (!office) {
        return { 
          success: false, 
          message: 'No office found for this location in Mardan district',
          requiresManualAssignment: true 
        };
      }

      const availableStaff = await this.getAvailableStaff(office.id);
      
      if (availableStaff.length === 0) {
        return { 
          success: false, 
          message: 'No available staff in the Mardan region',
          requiresManualAssignment: true,
          officeId: office.id
        };
      }

      const selectedStaff = this.selectBestStaff(availableStaff, complaint);
      await this.performAssignment(complaint.id, selectedStaff.id, office.id);
      this.updateWorkloadCache(selectedStaff.id, 'increment');

      return {
        success: true,
        assignedTo: selectedStaff,
        officeId: office.id,
        assignmentMethod: 'automated',
        estimatedResponseTime: this.calculateResponseTime(complaint.priority, office)
      };

    } catch (error) {
      console.error('Error in automated assignment:', error);
      return {
        success: false,
        message: 'Assignment failed due to system error',
        requiresManualAssignment: true,
        error: error.message
      };
    }
  }

  extractLocation(complaint) {
    const address = complaint.address || '';
    const customerName = complaint.name || '';
    const lowerAddress = address.toLowerCase();
    
    for (const [district, officeId] of Object.entries(MARDAN_DISTRICT_MAPPING)) {
      if (lowerAddress.includes(district)) {
        return {
          district: district,
          officeId: officeId,
          fullAddress: address,
          confidence: 'high'
        };
      }
    }
    
    const cityMatch = address.match(/([a-zA-Z\s]+),?\s*(?:Pakistan|PK)?$/i);
    if (cityMatch) {
      const city = cityMatch[1].trim().toLowerCase();
      return {
        district: city,
        officeId: MARDAN_DISTRICT_MAPPING[city] || null,
        fullAddress: address,
        confidence: 'medium'
      };
    }
    
    return {
      district: null,
      officeId: null,
      fullAddress: address,
      confidence: 'low'
    };
  }

  findNearestOffice(location) {
    if (location.officeId) {
      return MARDAN_OFFICE_LOCATIONS.find(office => office.id === location.officeId);
    }
    
    for (const office of MARDAN_OFFICE_LOCATIONS) {
      for (const serviceArea of office.serviceAreas) {
        if (location.fullAddress.toLowerCase().includes(serviceArea.toLowerCase())) {
          return office;
        }
      }
    }
    
    return DISTANCE_MATRIX.findNearestOffice(location);
  }

  async getAvailableStaff(officeId) {
    try {
      const staffMembers = await User.findAll({
        where: {
          role: 'Staff',
          status: 'active'
        },
        attributes: ['id', 'username', 'email', 'phone', 'role', 'status']
      });

      const availableStaff = [];
      
      for (const staff of staffMembers) {
        const workload = await this.getStaffWorkload(staff.id);
        
        if (workload.activeComplaints < WORKLOAD_LIMITS.MAX_ACTIVE_COMPLAINTS) {
          availableStaff.push({
            ...staff.toJSON(),
            workload: workload,
            availabilityScore: this.calculateAvailabilityScore(workload)
          });
        }
      }
      
      return availableStaff.sort((a, b) => b.availabilityScore - a.availabilityScore);
      
    } catch (error) {
      console.error('Error getting available staff:', error);
      return [];
    }
  }

  async getStaffWorkload(staffId) {
    try {
      if (this.staffWorkload.has(staffId)) {
        const cached = this.staffWorkload.get(staffId);
        if (Date.now() - cached.timestamp < 300000) {
          return cached.data;
        }
      }

      const activeComplaints = await Complaint.count({
        where: {
          assignedTo: staffId,
          status: ['pending', 'in_progress']
        }
      });

      const todayComplaints = await Complaint.count({
        where: {
          assignedTo: staffId,
          createdAt: {
            [require('sequelize').Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      });

      const workload = {
        activeComplaints,
        todayComplaints,
        capacity: WORKLOAD_LIMITS.MAX_ACTIVE_COMPLAINTS,
        utilizationRate: activeComplaints / WORKLOAD_LIMITS.MAX_ACTIVE_COMPLAINTS
      };

      this.staffWorkload.set(staffId, {
        data: workload,
        timestamp: Date.now()
      });

      return workload;
      
    } catch (error) {
      console.error('Error getting staff workload:', error);
      return {
        activeComplaints: 0,
        todayComplaints: 0,
        capacity: WORKLOAD_LIMITS.MAX_ACTIVE_COMPLAINTS,
        utilizationRate: 0
      };
    }
  }

  calculateAvailabilityScore(workload) {
    const { activeComplaints, todayComplaints, capacity } = workload;
    
    let score = 100;
    
    score -= (activeComplaints / capacity) * 50;
    score -= (todayComplaints / WORKLOAD_LIMITS.MAX_DAILY_COMPLAINTS) * 30;
    
    if (activeComplaints === 0) score += 20;
    if (todayComplaints < 5) score += 10;
    
    return Math.max(0, Math.min(100, score));
  }

  selectBestStaff(availableStaff, complaint) {
    if (availableStaff.length === 1) {
      return availableStaff[0];
    }

    const sortedStaff = availableStaff.sort((a, b) => {
      if (a.availabilityScore !== b.availabilityScore) {
        return b.availabilityScore - a.availabilityScore;
      }
      if (a.workload.todayComplaints !== b.workload.todayComplaints) {
        return a.workload.todayComplaints - b.workload.todayComplaints;
      }
      return a.workload.activeComplaints - b.workload.activeComplaints;
    });

    return sortedStaff[0];
  }

  async performAssignment(complaintId, staffId, officeId) {
    try {
      await Complaint.update(
        {
          assignedTo: staffId,
          assignedAt: new Date(),
          officeId: officeId,
          status: 'in_progress',
          assignmentMethod: 'automated'
        },
        {
          where: { id: complaintId }
        }
      );
    } catch (error) {
      console.error('Error performing assignment:', error);
      throw error;
    }
  }

  calculateResponseTime(priority, office) {
    const priorityConfig = ASSIGNMENT_PRIORITY[priority.toUpperCase()] || ASSIGNMENT_PRIORITY.MEDIUM;
    
    return {
      maxResponseTime: priorityConfig.maxResponseTime,
      estimatedArrival: priorityConfig.maxResponseTime * 0.7,
      officeLocation: office.name,
      serviceArea: office.serviceAreas.join(', ')
    };
  }

  updateWorkloadCache(staffId, operation) {
    if (this.staffWorkload.has(staffId)) {
      const cached = this.staffWorkload.get(staffId);
      if (operation === 'increment') {
        cached.data.activeComplaints++;
        cached.data.todayComplaints++;
        cached.data.utilizationRate = cached.data.activeComplaints / cached.data.capacity;
      } else if (operation === 'decrement') {
        cached.data.activeComplaints = Math.max(0, cached.data.activeComplaints - 1);
        cached.data.utilizationRate = cached.data.activeComplaints / cached.data.capacity;
      }
    }
  }

  async getAssignmentStats() {
    try {
      const totalComplaints = await Complaint.count();
      const assignedComplaints = await Complaint.count({
        where: {
          assignedTo: { [require('sequelize').Op.ne]: null }
        }
      });
      
      const automatedAssignments = await Complaint.count({
        where: {
          assignmentMethod: 'automated'
        }
      });

      return {
        totalComplaints,
        assignedComplaints,
        automatedAssignments,
        assignmentRate: totalComplaints > 0 ? (assignedComplaints / totalComplaints) * 100 : 0,
        automationRate: assignedComplaints > 0 ? (automatedAssignments / assignedComplaints) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting assignment stats:', error);
      return null;
    }
  }

  async getMardanDistrictStats() {
    try {
      const mardanComplaints = await Complaint.count({
        where: {
          address: {
            [require('sequelize').Op.or]: [
              { [require('sequelize').Op.like]: '%Mardan%' },
              { [require('sequelize').Op.like]: '%Takht Bhai%' },
              { [require('sequelize').Op.like]: '%Katlang%' },
              { [require('sequelize').Op.like]: '%Rustam%' }
            ]
          }
        }
      });

      const officeStats = {};
      for (const office of MARDAN_OFFICE_LOCATIONS) {
        const officeComplaints = await Complaint.count({
          where: {
            officeId: office.id
          }
        });
        
        officeStats[office.id] = {
          name: office.name,
          totalComplaints: officeComplaints,
          capacity: office.capacity,
          utilizationRate: (officeComplaints / office.capacity) * 100
        };
      }

      return {
        totalMardanComplaints: mardanComplaints,
        officeStats
      };
    } catch (error) {
      console.error('Error getting Mardan district stats:', error);
      return null;
    }
  }
}

module.exports = new AssignmentService();
