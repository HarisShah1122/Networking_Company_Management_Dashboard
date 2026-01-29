const models = require('../models');
const { Complaint, sequelize } = models;
const { randomUUID } = require('crypto');

class ExternalComplaintService {
  constructor() {
    this.externalSources = ['facebook', 'twitter', 'email', 'phone', 'website', 'walk_in'];
  }

  // Create external complaint
  async createExternalComplaint(complaintData) {
    try {
      const complaintId = randomUUID();
      const now = new Date();

      const complaint = await Complaint.create({
        id: complaintId,
        title: complaintData.title,
        description: complaintData.description,
        name: complaintData.name,
        address: complaintData.address,
        whatsapp_number: complaintData.whatsapp_number,
        status: complaintData.status || 'open',
        priority: complaintData.priority || 'medium',
        external_source: complaintData.external_source,
        external_id: complaintData.external_id,
        source_type: 'external',
        created_at: now,
        updated_at: now,
        company_id: complaintData.company_id || null
      });

      return complaint.toJSON();
    } catch (error) {
      console.error('Error creating external complaint:', error);
      throw error;
    }
  }

  // Fetch complaints from external sources
  async fetchExternalComplaints() {
    const externalComplaints = [];

    try {
      // Fetch from Facebook API (mock implementation)
      const facebookComplaints = await this.fetchFacebookComplaints();
      externalComplaints.push(...facebookComplaints);

      // Fetch from Twitter API (mock implementation)
      const twitterComplaints = await this.fetchTwitterComplaints();
      externalComplaints.push(...twitterComplaints);

      // Fetch from Email (mock implementation)
      const emailComplaints = await this.fetchEmailComplaints();
      externalComplaints.push(...emailComplaints);

      // Fetch from Phone Call Records (mock implementation)
      const phoneComplaints = await this.fetchPhoneComplaints();
      externalComplaints.push(...phoneComplaints);

      return externalComplaints;
    } catch (error) {
      console.error('Error fetching external complaints:', error);
      return [];
    }
  }

  // Mock Facebook API integration
  async fetchFacebookComplaints() {
    // In real implementation, use Facebook Graph API
    return [
      {
        external_id: 'FB_' + Date.now(),
        external_source: 'facebook',
        title: 'Internet Not Working - Facebook Complaint',
        description: 'Customer reported via Facebook page that internet is down',
        name: 'Facebook User',
        address: 'Main Bazaar, Mardan',
        whatsapp_number: '+923456789012',
        priority: 'high',
        status: 'open'
      }
    ];
  }

  // Mock Twitter API integration
  async fetchTwitterComplaints() {
    // In real implementation, use Twitter API
    return [
      {
        external_id: 'TW_' + Date.now(),
        external_source: 'twitter',
        title: 'Slow Internet - Twitter Complaint',
        description: 'Customer tweeted about slow internet speed',
        name: 'Twitter User',
        address: 'University Road, Peshawar',
        whatsapp_number: '+923123456789',
        priority: 'medium',
        status: 'open'
      }
    ];
  }

  // Mock Email integration
  async fetchEmailComplaints() {
    // In real implementation, connect to email server (Gmail API, etc.)
    return [
      {
        external_id: 'EMAIL_' + Date.now(),
        external_source: 'email',
        title: 'Connection Issue - Email Complaint',
        description: 'Customer emailed about frequent disconnections',
        name: 'Email Customer',
        address: 'Blue Area, Islamabad',
        whatsapp_number: '+923456789012',
        priority: 'medium',
        status: 'open'
      }
    ];
  }

  // Mock Phone Call integration
  async fetchPhoneComplaints() {
    // In real implementation, connect to phone system/CRM
    return [
      {
        external_id: 'PHONE_' + Date.now(),
        external_source: 'phone',
        title: 'No Internet - Phone Call',
        description: 'Customer called about complete internet outage',
        name: 'Phone Customer',
        address: 'Saddar, Rawalpindi',
        whatsapp_number: '+923234567890',
        priority: 'urgent',
        status: 'open'
      }
    ];
  }

  // Get all complaints (internal + external)
  async getAllComplaints(companyId = null) {
    try {
      let whereClause = {};
      if (companyId) {
        whereClause.company_id = companyId;
      }

      const complaints = await Complaint.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']]
      });

      return complaints.map(complaint => {
        const data = complaint.toJSON();
        
        // Add source information
        if (data.external_source) {
          data.source = 'external';
          data.sourceLabel = this.getSourceLabel(data.external_source);
        } else {
          data.source = 'internal';
          data.sourceLabel = 'Internal App';
        }

        // Extract area and district from address
        data.area = this.extractAreaFromAddress(data.address);
        data.district = this.extractDistrictFromAddress(data.address);

        return data;
      });
    } catch (error) {
      console.error('Error fetching all complaints:', error);
      throw error;
    }
  }

  // Get complaints by branch/district
  async getComplaintsByBranch(branchId, companyId = null) {
    try {
      const branchConfig = this.getBranchConfig(branchId);
      if (!branchConfig) {
        throw new Error('Invalid branch ID');
      }

      let whereClause = {
        district: branchConfig.district
      };

      if (companyId) {
        whereClause.company_id = companyId;
      }

      const complaints = await Complaint.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']]
      });

      // Filter by area if branch has specific areas
      let filteredComplaints = complaints.map(c => c.toJSON());
      if (branchConfig.areas && branchConfig.areas.length > 0) {
        filteredComplaints = filteredComplaints.filter(complaint => {
          const area = this.extractAreaFromAddress(complaint.address);
          return branchConfig.areas.includes(area);
        });
      }

      return filteredComplaints.map(complaint => ({
        ...complaint,
        source: complaint.external_source ? 'external' : 'internal',
        sourceLabel: complaint.external_source ? this.getSourceLabel(complaint.external_source) : 'Internal App',
        area: this.extractAreaFromAddress(complaint.address),
        district: this.extractDistrictFromAddress(complaint.address)
      }));
    } catch (error) {
      console.error('Error fetching complaints by branch:', error);
      throw error;
    }
  }

  // Get branch configuration
  getBranchConfig(branchId) {
    const branches = {
      'mardan': {
        id: 'mardan',
        name: 'Mardan Branch',
        district: 'Mardan',
        areas: ['Main Market', 'City Center', 'University Road', 'Kotla Mohsin Khan']
      },
      'katlang': {
        id: 'katlang',
        name: 'Katlang Branch',
        district: 'Mardan',
        areas: ['Katlang Bazaar', 'Shahbaz Garhi', 'Takht Bhai']
      },
      'peshawar': {
        id: 'peshawar',
        name: 'Peshawar Branch',
        district: 'Peshawar',
        areas: ['University Town', 'Hayatabad', 'Cantt', 'Karkhano Market']
      },
      'islamabad': {
        id: 'islamabad',
        name: 'Islamabad Branch',
        district: 'Islamabad',
        areas: ['Blue Area', 'F-10 Markaz', 'G-11 Markaz', 'I-8 Markaz']
      },
      'rawalpindi': {
        id: 'rawalpindi',
        name: 'Rawalpindi Branch',
        district: 'Rawalpindi',
        areas: ['Saddar', 'Raja Bazaar', 'Commercial Market', 'Lalkurti']
      }
    };

    return branches[branchId] || null;
  }

  // Extract area from address
  extractAreaFromAddress(address) {
    if (!address) return 'Unknown';
    
    const areas = [
      'Main Market', 'City Center', 'University Road', 'Kotla Mohsin Khan',
      'Katlang Bazaar', 'Shahbaz Garhi', 'Takht Bhai',
      'University Town', 'Hayatabad', 'Cantt', 'Karkhano Market',
      'Blue Area', 'F-10 Markaz', 'G-11 Markaz', 'I-8 Markaz',
      'Saddar', 'Raja Bazaar', 'Commercial Market', 'Lalkurti'
    ];
    
    const lowerAddress = address.toLowerCase();
    for (const area of areas) {
      if (lowerAddress.includes(area.toLowerCase())) {
        return area;
      }
    }
    
    return 'Other Area';
  }

  // Extract district from address
  extractDistrictFromAddress(address) {
    if (!address) return 'Unknown';
    
    const districtMap = {
      'mardan': 'Mardan',
      'peshawar': 'Peshawar',
      'islamabad': 'Islamabad',
      'rawalpindi': 'Rawalpindi',
      'nowshera': 'Nowshera',
      'charsadda': 'Charsadda',
      'swabi': 'Swabi'
    };
    
    const lowerAddress = address.toLowerCase();
    for (const [key, value] of Object.entries(districtMap)) {
      if (lowerAddress.includes(key)) {
        return value;
      }
    }
    
    return 'Other District';
  }

  // Get source label
  getSourceLabel(externalSource) {
    const sourceLabels = {
      'facebook': 'Facebook',
      'twitter': 'Twitter',
      'email': 'Email',
      'phone': 'Phone Call',
      'website': 'Website',
      'walk_in': 'Walk In'
    };

    return sourceLabels[externalSource] || 'External';
  }

  // Sync external complaints to database
  async syncExternalComplaints() {
    try {
      const externalComplaints = await this.fetchExternalComplaints();
      
      for (const complaintData of externalComplaints) {
        // Check if complaint already exists
        const existingComplaint = await Complaint.findOne({
          where: {
            external_id: complaintData.external_id,
            external_source: complaintData.external_source
          }
        });

        if (!existingComplaint) {
          // Create new complaint
          await this.createExternalComplaint(complaintData);
        }
      }

      return {
        synced: externalComplaints.length,
        message: 'External complaints synced successfully'
      };
    } catch (error) {
      console.error('Error syncing external complaints:', error);
      throw error;
    }
  }
}

module.exports = new ExternalComplaintService();
