const { Complaint, User, Area, Customer } = require('../models');
const { Op } = require('sequelize');

class AreaAssignmentService {
  constructor() {
    this.staffWorkload = new Map();
    this.areaCache = new Map();
  }

  async assignComplaintToNearestTechnician(complaintId) {
    try {
      const complaint = await Complaint.findByPk(complaintId, {
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['area_id']
          }
        ]
      });

      if (!complaint) {
        return {
          success: false,
          message: 'Complaint not found',
          requiresManualAssignment: true
        };
      }

      if (complaint.assignedTo) {
        return {
          success: false,
          message: 'Complaint is already assigned',
          requiresManualAssignment: false
        };
      }

      // Get complaint location information
      const complaintLocation = await this.getComplaintLocation(complaint);
      
      // Find nearest area with available technicians
      const nearestArea = await this.findNearestAreaWithTechnicians(complaintLocation);
      
      if (!nearestArea) {
        return {
          success: false,
          message: 'No technicians available in any nearby area',
          requiresManualAssignment: true
        };
      }

      // Get available technicians in the nearest area
      const availableTechnicians = await this.getAvailableTechnicians(nearestArea.id, complaint.company_id);
      
      if (availableTechnicians.length === 0) {
        return {
          success: false,
          message: `No available technicians in ${nearestArea.name}`,
          requiresManualAssignment: true,
          suggestedArea: nearestArea
        };
      }

      // Select the best technician based on workload and availability
      const selectedTechnician = this.selectBestTechnician(availableTechnicians, complaint);
      
      // Perform the assignment
      await this.performAssignment(complaint.id, selectedTechnician.id, nearestArea.id);
      this.updateWorkloadCache(selectedTechnician.id, 'increment');

      return {
        success: true,
        assignedTo: selectedTechnician,
        areaId: nearestArea.id,
        areaName: nearestArea.name,
        assignmentMethod: 'area_based',
        distance: nearestArea.distance || 0,
        estimatedResponseTime: this.calculateResponseTime(complaint.priority, nearestArea)
      };

    } catch (error) {
      return {
        success: false,
        message: 'Assignment failed due to system error',
        requiresManualAssignment: true,
        error: error.message
      };
    }
  }

  async getComplaintLocation(complaint) {
    let location = {
      latitude: complaint.latitude,
      longitude: complaint.longitude,
      area: complaint.area,
      district: complaint.district,
      city: complaint.city,
      address: complaint.address
    };

    // If complaint has customer with area_id, get area details
    if (complaint.customer && complaint.customer.area_id) {
      const customerArea = await this.getAreaById(complaint.customer.area_id);
      if (customerArea) {
        location.areaId = customerArea.id;
        location.areaName = customerArea.name;
      }
    }

    // Try to match area by name from complaint area field
    if (complaint.area && !location.areaId) {
      const matchedArea = await this.findAreaByName(complaint.area, complaint.company_id);
      if (matchedArea) {
        location.areaId = matchedArea.id;
        location.areaName = matchedArea.name;
      }
    }

    return location;
  }

  async findAreaByName(areaName, companyId) {
    if (!areaName) return null;

    const cacheKey = `${areaName.toLowerCase()}_${companyId}`;
    if (this.areaCache.has(cacheKey)) {
      return this.areaCache.get(cacheKey);
    }

    const area = await Area.findOne({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: areaName } },
          { name: { [Op.iLike]: `%${areaName}%` } },
          { code: { [Op.iLike]: areaName } }
        ],
        company_id: companyId
      }
    });

    if (area) {
      this.areaCache.set(cacheKey, area);
    }

    return area;
  }

  async getAreaById(areaId) {
    if (this.areaCache.has(areaId)) {
      return this.areaCache.get(areaId);
    }

    const area = await Area.findByPk(areaId);
    if (area) {
      this.areaCache.set(areaId, area);
    }

    return area;
  }

  async findNearestAreaWithTechnicians(complaintLocation) {
    try {
      // First, try exact area match
      if (complaintLocation.areaId) {
        const technicians = await this.getAvailableTechnicians(complaintLocation.areaId, complaintLocation.companyId);
        if (technicians.length > 0) {
          const area = await this.getAreaById(complaintLocation.areaId);
          return { ...area.toJSON(), distance: 0 };
        }
      }

      // If no exact match, find all areas with available technicians
      const areasWithTechnicians = await this.findAllAreasWithTechnicians(complaintLocation.companyId);
      
      if (areasWithTechnicians.length === 0) {
        return null;
      }

      // Calculate distances and sort by nearest
      const areasWithDistance = areasWithTechnicians.map(area => {
        const distance = this.calculateDistance(complaintLocation, area);
        return { ...area, distance };
      });

      // Sort by distance (closest first) and then by technician count
      areasWithDistance.sort((a, b) => {
        if (a.distance !== b.distance) {
          return a.distance - b.distance;
        }
        return b.availableTechnicians - a.availableTechnicians;
      });

      return areasWithDistance[0];

    } catch (error) {
      return null;
    }
  }

  async findAllAreasWithTechnicians(companyId) {
    const areas = await Area.findAll({
      where: { company_id: companyId },
      include: [
        {
          model: User,
          as: 'users',
          where: {
            role: 'Technician',
            status: 'active'
          },
          required: false,
          attributes: ['id']
        }
      ]
    });

    const areasWithAvailableTechs = [];
    
    for (const area of areas) {
      const availableTechnicians = await this.getAvailableTechnicians(area.id, companyId);
      if (availableTechnicians.length > 0) {
        areasWithAvailableTechs.push({
          ...area.toJSON(),
          availableTechnicians: availableTechnicians.length
        });
      }
    }

    return areasWithAvailableTechs;
  }

  async getAvailableTechnicians(areaId, companyId) {
    try {
      // Get all technicians in the area
      const technicians = await User.findAll({
        where: {
          role: 'Technician',
          status: 'active',
          companyId: companyId
        },
        attributes: ['id', 'username', 'email', 'phone', 'role', 'status']
      });

      const availableTechnicians = [];
      
      for (const technician of technicians) {
        const workload = await this.getTechnicianWorkload(technician.id);
        
        if (workload.activeComplaints < 10) { // Max 10 active complaints per technician
          availableTechnicians.push({
            ...technician.toJSON(),
            workload: workload,
            availabilityScore: this.calculateAvailabilityScore(workload)
          });
        }
      }
      
      return availableTechnicians.sort((a, b) => b.availabilityScore - a.availabilityScore);
      
    } catch (error) {
      return [];
    }
  }

  async getTechnicianWorkload(technicianId) {
    try {
      if (this.staffWorkload.has(technicianId)) {
        const cached = this.staffWorkload.get(technicianId);
        if (Date.now() - cached.timestamp < 300000) { // 5 minutes cache
          return cached.data;
        }
      }

      const activeComplaints = await Complaint.count({
        where: {
          assignedTo: technicianId,
          status: ['open', 'in_progress']
        }
      });

      const todayComplaints = await Complaint.count({
        where: {
          assignedTo: technicianId,
          createdAt: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      });

      const workload = {
        activeComplaints,
        todayComplaints,
        capacity: 10,
        utilizationRate: activeComplaints / 10
      };

      this.staffWorkload.set(technicianId, {
        data: workload,
        timestamp: Date.now()
      });

      return workload;
      
    } catch (error) {
      return {
        activeComplaints: 0,
        todayComplaints: 0,
        capacity: 10,
        utilizationRate: 0
      };
    }
  }

  calculateAvailabilityScore(workload) {
    const { activeComplaints, todayComplaints, capacity } = workload;
    
    let score = 100;
    
    // Reduce score based on active complaints
    score -= (activeComplaints / capacity) * 50;
    
    // Reduce score based on today's complaints
    score -= (todayComplaints / 15) * 30; // Max 15 complaints per day
    
    // Bonus for having no active complaints
    if (activeComplaints === 0) score += 20;
    
    // Bonus for low daily workload
    if (todayComplaints < 5) score += 10;
    
    return Math.max(0, Math.min(100, score));
  }

  selectBestTechnician(availableTechnicians, complaint) {
    if (availableTechnicians.length === 1) {
      return availableTechnicians[0];
    }

    // Sort by availability score first, then by workload
    const sortedTechnicians = availableTechnicians.sort((a, b) => {
      if (a.availabilityScore !== b.availabilityScore) {
        return b.availabilityScore - a.availabilityScore;
      }
      if (a.workload.activeComplaints !== b.workload.activeComplaints) {
        return a.workload.activeComplaints - b.workload.activeComplaints;
      }
      return a.workload.todayComplaints - b.workload.todayComplaints;
    });

    return sortedTechnicians[0];
  }

  calculateDistance(location1, location2) {
    // If coordinates are available, use Haversine formula
    if (location1.latitude && location1.longitude && 
        location2.latitude && location2.longitude) {
      return this.haversineDistance(
        parseFloat(location1.latitude),
        parseFloat(location1.longitude),
        parseFloat(location2.latitude),
        parseFloat(location2.longitude)
      );
    }

    // Fallback to text-based distance calculation
    if (location1.area && location2.name) {
      if (location1.area.toLowerCase() === location2.name.toLowerCase()) {
        return 0;
      }
      // Simple heuristic for same district/city
      if (location1.district && location2.name.toLowerCase().includes(location1.district.toLowerCase())) {
        return 5; // 5 km for same district
      }
      if (location1.city && location2.name.toLowerCase().includes(location1.city.toLowerCase())) {
        return 10; // 10 km for same city
      }
    }

    return 50; // Default distance for unknown locations
  }

  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  async performAssignment(complaintId, technicianId, areaId) {
    try {
      await Complaint.update(
        {
          assignedTo: technicianId,
          assignedAt: new Date(),
          status: 'in_progress',
          assignmentMethod: 'area_based'
        },
        {
          where: { id: complaintId }
        }
      );
    } catch (error) {
      throw error;
    }
  }

  calculateResponseTime(priority, area) {
    const priorityTimes = {
      'urgent': 30,    // 30 minutes
      'high': 60,      // 1 hour
      'medium': 180,   // 3 hours
      'low': 480       // 8 hours
    };

    const baseTime = priorityTimes[priority] || priorityTimes['medium'];
    const distanceFactor = Math.min(area.distance || 0, 20) * 3; // 3 minutes per km, max 20km

    return {
      maxResponseTime: baseTime + distanceFactor,
      estimatedArrival: Math.max(baseTime * 0.7, (baseTime + distanceFactor) * 0.7),
      areaName: area.name,
      distance: area.distance || 0
    };
  }

  updateWorkloadCache(technicianId, operation) {
    if (this.staffWorkload.has(technicianId)) {
      const cached = this.staffWorkload.get(technicianId);
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

  async getAreaAssignmentStats(companyId) {
    try {
      const areas = await Area.findAll({
        where: { company_id: companyId },
        include: [
          {
            model: User,
            as: 'users',
            where: { role: 'Technician', status: 'active' },
            required: false,
            attributes: ['id']
          }
        ]
      });

      const areaStats = await Promise.all(
        areas.map(async (area) => {
          const technicians = await this.getAvailableTechnicians(area.id, companyId);
          const assignedComplaints = await Complaint.count({
            where: {
              assignedTo: technicians.map(t => t.id),
              status: ['open', 'in_progress']
            }
          });

          return {
            areaId: area.id,
            areaName: area.name,
            totalTechnicians: area.users ? area.users.length : 0,
            availableTechnicians: technicians.length,
            activeComplaints: assignedComplaints,
            averageWorkload: technicians.length > 0 ? 
              assignedComplaints / technicians.length : 0
          };
        })
      );

      return {
        totalAreas: areas.length,
        areasWithTechnicians: areaStats.filter(a => a.totalTechnicians > 0).length,
        areaStats: areaStats.sort((a, b) => b.activeComplaints - a.activeComplaints)
      };
    } catch (error) {
      return null;
    }
  }

  clearCache() {
    this.staffWorkload.clear();
    this.areaCache.clear();
  }
}

module.exports = new AreaAssignmentService();
