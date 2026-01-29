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
  'Main Market', 'City Center', 'University Road', 'Kotla Mohsin Khan',
  'Katlang Bazaar', 'Shahbaz Garhi', 'Takht Bhai',
  'University Town', 'Hayatabad', 'Cantt', 'Karkhano Market',
  'Blue Area', 'F-10 Markaz', 'G-11 Markaz', 'I-8 Markaz',
  'Saddar', 'Raja Bazaar', 'Commercial Market', 'Lalkurti'
];

export const STAFF_MEMBERS = [
  { id: 1, name: 'Ahmed Khan', role: 'Technician' },
  { id: 2, name: 'Sara Ali', role: 'Support Staff' },
  { id: 3, name: 'Muhammad Raza', role: 'Technician' },
  { id: 4, name: 'Fatima Sheikh', role: 'Support Staff' },
  { id: 5, name: 'Bilal Ahmed', role: 'Technician' }
];

export const BRANCHES = [
  { id: 'all', name: 'All Branches', district: 'all', areas: [] },
  { id: 'mardan', name: 'Mardan Branch', district: 'Mardan', areas: ['Main Market', 'City Center', 'University Road', 'Kotla Mohsin Khan'] },
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
