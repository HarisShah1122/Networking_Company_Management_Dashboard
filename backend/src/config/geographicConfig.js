const MARDAN_OFFICE_LOCATIONS = [
  {
    id: 'mardan_main',
    name: 'Mardan Main Office',
    address: 'Mardan City, KPK, Pakistan',
    coordinates: { lat: 34.1984, lng: 72.0443 },
    serviceAreas: [
      'Mardan City',
      'Takht Bhai',
      'Katlang',
      'Rustam',
      'Sawaldher',
      'Toru',
      'Mangal',
      'Saro Dherai',
      'Gujar Garhi',
      'Pirsabaq',
      'Shahbaz Garhi',
      'Karo',
      'Nawab Kalley',
      'Sakhakot',
      'Dheri Zardad',
      'Khalo',
      'Mian Khan',
      'Jabba',
      'Bakhshali',
      'Hathian',
      'Seri Behlol',
      'Mamo Khel',
      'Kotki',
      'Zarobi',
      'Munda',
      'Shah Dherai',
      'Kashmir',
      'Sangao',
      'Mian Baba'
    ],
    capacity: 50,
    activeStaff: 0
  },
  {
    id: 'takht_bhai',
    name: 'Takht Bhai Sub Office',
    address: 'Takht Bhai, Mardan, KPK, Pakistan',
    coordinates: { lat: 34.3167, lng: 72.0500 },
    serviceAreas: [
      'Takht Bhai',
      'Seri Behlol',
      'Mamo Khel',
      'Kotki',
      'Zarobi',
      'Munda',
      'Shah Dherai',
      'Kashmir',
      'Sangao',
      'Mian Baba'
    ],
    capacity: 25,
    activeStaff: 0
  },
  {
    id: 'katlang',
    name: 'Katlang Sub Office',
    address: 'Katlang, Mardan, KPK, Pakistan',
    coordinates: { lat: 34.3833, lng: 71.9667 },
    serviceAreas: [
      'Katlang',
      'Rustam',
      'Sawaldher',
      'Toru',
      'Mangal',
      'Saro Dherai',
      'Gujar Garhi',
      'Pirsabaq'
    ],
    capacity: 20,
    activeStaff: 0
  }
];

const MARDAN_DISTRICT_MAPPING = {
  'mardan': 'mardan_main',
  'mardan city': 'mardan_main',
  'takht bhai': 'takht_bhai',
  'takhtbai': 'takht_bhai',
  'katlang': 'katlang',
  'rustam': 'katlang',
  'sawaldher': 'katlang',
  'toru': 'katlang',
  'mangal': 'katlang',
  'saro dherai': 'katlang',
  'gujar garhi': 'katlang',
  'pirsabaq': 'katlang',
  'shahbaz garhi': 'mardan_main',
  'karo': 'mardan_main',
  'nawab kalley': 'mardan_main',
  'sakhakot': 'mardan_main',
  'dheri zardad': 'mardan_main',
  'khalo': 'mardan_main',
  'mian khan': 'mardan_main',
  'jabba': 'mardan_main',
  'bakhshali': 'mardan_main',
  'hathian': 'mardan_main',
  'seri behlol': 'takht_bhai',
  'mamo khel': 'takht_bhai',
  'kotki': 'takht_bhai',
  'zarobi': 'takht_bhai',
  'mundah': 'takht_bhai',
  'shah dherai': 'takht_bhai',
  'kashmir': 'takht_bhai',
  'sangao': 'takht_bhai',
  'mian baba': 'takht_bhai'
};

const ASSIGNMENT_PRIORITY = {
  LOW: {
    maxResponseTime: 48,
    weight: 1
  },
  MEDIUM: {
    maxResponseTime: 24,
    weight: 2
  },
  HIGH: {
    maxResponseTime: 12,
    weight: 3
  },
  URGENT: {
    maxResponseTime: 4,
    weight: 4
  },
  CRITICAL: {
    maxResponseTime: 2,
    weight: 5
  }
};

const WORKLOAD_LIMITS = {
  MAX_ACTIVE_COMPLAINTS: 10,
  MAX_DAILY_COMPLAINTS: 25,
  PREFERRED_WORKLOAD: 6
};

const DISTANCE_MATRIX = {
  calculateDistance: (point1, point2) => {
    const R = 6371;
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },
  
  findNearestOffice: (location) => {
    let nearestOffice = null;
    let minDistance = Infinity;
    
    MARDAN_OFFICE_LOCATIONS.forEach(office => {
      const distance = DISTANCE_MATRIX.calculateDistance(
        location.coordinates || { lat: 34.1984, lng: 72.0443 },
        office.coordinates
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestOffice = office;
      }
    });
    
    return nearestOffice;
  }
};

module.exports = {
  MARDAN_OFFICE_LOCATIONS,
  MARDAN_DISTRICT_MAPPING,
  ASSIGNMENT_PRIORITY,
  WORKLOAD_LIMITS,
  DISTANCE_MATRIX
};
