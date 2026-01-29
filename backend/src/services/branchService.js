const { Branch } = require('../models');

class BranchService {
  async getAllBranches() {
    try {
      const branches = await Branch.findAll({
        attributes: ['id', 'name', 'district', 'areas'],
        order: [['name', 'ASC']]
      });

      // Transform to expected format
      return [
        {
          id: 'all',
          name: 'All Branches',
          district: 'all',
          areas: []
        },
        ...branches.map(branch => ({
          id: branch.id,
          name: branch.name,
          district: branch.district,
          areas: branch.areas || []
        }))
      ];
    } catch (error) {
      // Fallback to mock data if database is not ready
      return this.getMockBranches();
    }
  }

  async getBranchById(branchId) {
    try {
      if (branchId === 'all') {
        return { id: 'all', name: 'All Branches', district: 'all', areas: [] };
      }

      const branch = await Branch.findByPk(branchId);
      if (!branch) {
        throw new Error('Branch not found');
      }

      return {
        id: branch.id,
        name: branch.name,
        district: branch.district,
        areas: branch.areas || []
      };
    } catch (error) {
      // Fallback to mock data
      const mockBranches = this.getMockBranches();
      const branch = mockBranches.find(b => b.id === branchId);
      if (!branch) {
        throw new Error('Branch not found');
      }
      return branch;
    }
  }

  getMockBranches() {
    return [
      {
        id: 'all',
        name: 'All Branches',
        district: 'all',
        areas: []
      },
      {
        id: 'mardan',
        name: 'Mardan Branch',
        district: 'Mardan',
        areas: ['Main Market', 'City Center', 'University Road', 'Kotla Mohsin Khan']
      },
      {
        id: 'katlang',
        name: 'Katlang Branch',
        district: 'Mardan',
        areas: ['Katlang Bazaar', 'Shahbaz Garhi', 'Takht Bhai']
      },
      {
        id: 'peshawar',
        name: 'Peshawar Branch',
        district: 'Peshawar',
        areas: ['University Town', 'Hayatabad', 'Cantt', 'Karkhano Market']
      },
      {
        id: 'islamabad',
        name: 'Islamabad Branch',
        district: 'Islamabad',
        areas: ['Blue Area', 'F-10 Markaz', 'G-11 Markaz', 'I-8 Markaz']
      },
      {
        id: 'rawalpindi',
        name: 'Rawalpindi Branch',
        district: 'Rawalpindi',
        areas: ['Saddar', 'Raja Bazaar', 'Commercial Market', 'Lalkurti']
      }
    ];
  }
}

module.exports = new BranchService();
