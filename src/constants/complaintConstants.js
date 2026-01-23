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
