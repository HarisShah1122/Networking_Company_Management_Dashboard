export const COMPLAINT_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  ON_HOLD: 'on_hold',
  CLOSED: 'closed'
};

export const COMPLAINT_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

export const STATUS_LABELS = {
  [COMPLAINT_STATUS.OPEN]: 'Open',
  [COMPLAINT_STATUS.IN_PROGRESS]: 'In Progress',
  [COMPLAINT_STATUS.ON_HOLD]: 'On Hold',
  [COMPLAINT_STATUS.CLOSED]: 'Closed'
};

export const PRIORITY_LABELS = {
  [COMPLAINT_PRIORITY.LOW]: 'Low',
  [COMPLAINT_PRIORITY.MEDIUM]: 'Medium',
  [COMPLAINT_PRIORITY.HIGH]: 'High',
  [COMPLAINT_PRIORITY.URGENT]: 'Urgent'
};

export const DEFAULT_PAGE_SIZE = 10;
export const DEBOUNCE_DELAY = 500;
export const MIN_DESCRIPTION_LENGTH = 10;

export const DISTRICTS = [
  { id: 'all', name: 'All Districts' },
  { id: 'mardan', name: 'Mardan' },
  { id: 'peshawar', name: 'Peshawar' },
  { id: 'islamabad', name: 'Islamabad' },
  { id: 'rawalpindi', name: 'Rawalpindi' },
  { id: 'nowshera', name: 'Nowshera' },
  { id: 'charsadda', name: 'Charsadda' },
  { id: 'swabi', name: 'Swabi' }
];

export const AREAS = [
  "katlang",
  "katti garhi",
  "jamal garhi",
  "Ghondo",
  "Babozo",
  "Shadand",
  "katlang bazar"
];

export const STAFF_MEMBERS = [
  { id: 1, name: 'Ahmed Khan', role: 'Technician', phone: '03001234567' },
  { id: 2, name: 'Sara Ali', role: 'Support Staff', phone: '03011234568' },
  { id: 3, name: 'Muhammad Raza', role: 'Technician', phone: '03021234569' },
  { id: 4, name: 'Fatima Sheikh', role: 'Support Staff', phone: '03031234570' },
  { id: 5, name: 'Bilal Ahmed', role: 'Technician', phone: '03041234571' },
  // Your new staff members with phone numbers
  { id: 6, name: 'Mansoor Khan', role: 'Manager', area: 'Katti Garhi', phone: '03001234567' },
  { id: 7, name: 'Shawkat Ali', role: 'Technician', phone: '03011234568' },
  { id: 8, name: 'Muhammad Yaseen', role: 'Technician', phone: '03021234569' },
  { id: 9, name: 'Muhammad Adil', role: 'Technician', phone: '03031234570' },
  { id: 10, name: 'Jabran', role: 'Technician', phone: '03041234571' },
  { id: 11, name: 'Maaz', role: 'Technician', phone: '03051234572' },
  { id: 12, name: 'Ubaid', role: 'Technician', area: 'Babozo', phone: '03061234573' },
  { id: 13, name: 'Shakeel', role: 'Technician', area: 'Katlang', phone: '03071234574' },
  { id: 14, name: 'Alhaj', role: 'Technician', phone: '03081234575' },
  { id: 15, name: 'Ihraq', role: 'Technician', phone: '03091234576' },
  { id: 16, name: 'Ghafar Ali', role: 'Technician', area: 'Ghondo', phone: '03101234577' },
  { id: 17, name: 'Muhammad Awais', role: 'Technician', phone: '03111234578' },
  { id: 18, name: 'Tasleem Khan', role: 'Technician', phone: '03121234579' },
  { id: 19, name: 'Muhammad Ejaz', role: 'Manager', area: 'Jamal Garhi', phone: '03131234580' }
];

export const BRANCHES = [
  { id: 'all', name: 'All Branches', district: 'all', areas: [] },
  { id: 'mardan', name: 'Mardan Branch', district: 'Mardan', areas: ["Katlang", "Katti Garhi", "Jamal Garhi", "Ghondo", "Babozo", "Shadand", 'Main Market', 'City Center', 'University Road', 'Kotla Mohsin Khan'] },
  { id: 'katlang', name: 'Katlang Branch', district: 'Mardan', areas: ['Katlang Bazaar', 'Shahbaz Garhi', 'Takht Bhai'] },
  { id: 'peshawar', name: 'Peshawar Branch', district: 'Peshawar', areas: ['University Town', 'Hayatabad', 'Cantt', 'Karkhano Market'] },
  { id: 'islamabad', name: 'Islamabad Branch', district: 'Islamabad', areas: ['Blue Area', 'F-10 Markaz', 'G-11 Markaz', 'I-8 Markaz'] },
  { id: 'rawalpindi', name: 'Rawalpindi Branch', district: 'Rawalpindi', areas: ['Saddar', 'Raja Bazaar', 'Commercial Market', 'Lalkurti'] }
];

export const SOURCES = [
  { id: 'all', name: 'All Sources' },
  { id: 'internal', name: 'Internal (App)' },
  { id: 'external', name: 'WhatsApp' }
];

// Color utility functions
export const getStatusColor = (status) => {
  const statusColors = {
    [COMPLAINT_STATUS.OPEN]: 'bg-red-500 text-white',
    [COMPLAINT_STATUS.IN_PROGRESS]: 'bg-blue-500 text-white',
    [COMPLAINT_STATUS.ON_HOLD]: 'bg-yellow-500 text-white',
    [COMPLAINT_STATUS.CLOSED]: 'bg-green-500 text-white'
  };
  return statusColors[status] || 'bg-gray-500 text-white';
};

export const getPriorityColor = (priority) => {
  const priorityColors = {
    [COMPLAINT_PRIORITY.URGENT]: 'bg-red-500 text-white',
    [COMPLAINT_PRIORITY.HIGH]: 'bg-orange-500 text-white',
    [COMPLAINT_PRIORITY.MEDIUM]: 'bg-yellow-500 text-white',
    [COMPLAINT_PRIORITY.LOW]: 'bg-green-500 text-white'
  };
  return priorityColors[priority] || 'bg-gray-500 text-white';
};

export const getSourceColor = (source) => {
  const sourceColors = {
    'internal': 'bg-blue-500 text-white',
    'external': 'bg-purple-500 text-white'
  };
  return sourceColors[source] || 'bg-gray-500 text-white';
};
