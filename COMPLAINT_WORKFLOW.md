# Complaint Management Workflow

## Overview
This document describes the comprehensive complaint management workflow that automatically routes customer complaints to the appropriate area manager and assigns them to available technicians within the same area.

## Workflow Process

### 1. Customer Submits Complaint
- Customer submits a complaint through any channel (web form, phone, etc.)
- Complaint is created with area information
- System automatically detects the selected area

### 2. Automatic Routing
- **Area Manager Detection**: System identifies the manager assigned to the complaint's area
- **Technician Assignment**: System automatically assigns the complaint to the available technician with the lowest workload in that area
- **Assignment Logic**:
  - Filter technicians by selected area
  - Sort by least number of active complaints
  - Assign to first available technician
  - If no technicians available → notify manager for manual assignment

### 3. Real-time Notifications
- **Area Manager**: Receives immediate notification about new complaint in their area
- **Assigned Technician**: Gets real-time notification with complaint details
- **Notification Channels**:
  - In-app notifications
  - Email notifications
  - WhatsApp notifications (if configured)

### 4. Manager Override Functionality
- **Reassignment**: Managers can reassign complaints to different technicians in the same area
- **Available Technicians**: System shows all technicians in the area with current workload
- **Audit Trail**: All reassignments are tracked with timestamps

### 5. Status Tracking & SLA Monitoring
- **Live Updates**: Real-time status updates as technicians work on complaints
- **SLA Tracking**: Automatic monitoring of Service Level Agreement compliance
- **Penalty System**: Automatic penalty calculation for SLA breaches

## Key Features

### Automatic Technician Assignment
```javascript
// Assignment algorithm
1. Get all active technicians in the complaint's area
2. Calculate current workload for each technician
3. Sort by workload (ascending)
4. Assign to technician with lowest workload
```

### Manager Override
- Managers can only reassign within their authorized area
- System validates manager permissions before allowing reassignment
- All reassignments trigger notifications to affected parties

### Real-time Notifications
- WebSocket-based real-time updates
- Browser push notifications for immediate alerts
- Email notifications for detailed information
- WhatsApp notifications for mobile users

### SLA Management
- Automatic SLA deadline calculation based on priority
- Real-time countdown timers
- Compliance tracking and reporting
- Automatic penalty calculation for breaches

## API Endpoints

### Complaint Management
- `POST /api/complaints` - Create new complaint (triggers automatic routing)
- `GET /api/complaints` - List all complaints
- `GET /api/complaints/:id` - Get complaint details
- `PUT /api/complaints/:id` - Update complaint

### Routing & Assignment
- `POST /api/complaints/:id/route` - Manual trigger for routing
- `POST /api/complaints/:id/reassign` - Manager override reassignment
- `GET /api/complaints/available-technicians?areaId=:id` - Get available technicians

### Statistics & Monitoring
- `GET /api/complaints/stats` - Get complaint statistics
- `GET /api/complaints/sla-stats` - Get SLA performance metrics

## Frontend Components

### Enhanced Complaint Dashboard
- Real-time complaint list with status updates
- SLA performance metrics
- Manager override functionality
- Live countdown timers for SLA deadlines

### Notification System
- Real-time notification dropdown
- Browser push notifications
- Email and WhatsApp integration
- Notification history and management

### Assignment Interface
- Technician workload display
- Area-based filtering
- One-click assignment
- Bulk assignment capabilities

## Database Schema

### Areas Table
```sql
- id (UUID, Primary Key)
- name (String)
- description (Text)
- company_id (UUID, Foreign Key)
- manager_id (UUID, Foreign Key to Users)
```

### Complaints Table
```sql
- id (UUID, Primary Key)
- customer_id (UUID, Foreign Key)
- title (String)
- description (Text)
- status (Enum: open, in_progress, on_hold, closed)
- priority (Enum: low, medium, high, urgent)
- assigned_to (UUID, Foreign Key to Users)
- area (String)
- assigned_at (DateTime)
- sla_deadline (DateTime)
- sla_status (Enum: pending, met, breached, pending_penalty)
- penalty_applied (Boolean)
- penalty_amount (Decimal)
```

## Configuration

### Environment Variables
```bash
# Notification Settings
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# Email Settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# WebSocket Settings
REACT_APP_WS_URL=http://localhost:5000
```

## Testing the Workflow

### 1. Create Test Complaint
```bash
curl -X POST http://localhost:3000/api/complaints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Test Complaint",
    "description": "This is a test complaint",
    "area": "Katlang",
    "priority": "medium",
    "name": "Test Customer",
    "whatsapp_number": "+1234567890"
  }'
```

### 2. Verify Automatic Assignment
- Check that complaint is assigned to a technician in the correct area
- Verify notifications are sent to manager and technician
- Confirm SLA deadline is set

### 3. Test Manager Override
```bash
curl -X POST http://localhost:3000/api/complaints/:id/reassign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -d '{
    "technicianId": "new_technician_uuid"
  }'
```

### 4. Monitor Real-time Updates
- Open dashboard in multiple browser windows
- Create new complaint and observe real-time updates
- Test notification delivery across different channels

## Performance Considerations

### Database Optimization
- Indexed queries for area-based filtering
- Optimized technician workload calculations
- Efficient notification queue management

### Caching Strategy
- Technician workload cache (5-minute TTL)
- Area manager mapping cache
- Notification delivery status tracking

### Scalability
- Horizontal scaling support for WebSocket connections
- Queue-based notification processing
- Database connection pooling for high load

## Security Considerations

### Authorization
- Role-based access control for manager functions
- Area-based assignment restrictions
- API endpoint protection with JWT tokens

### Data Validation
- Input sanitization for complaint data
- Technician availability validation
- Area assignment verification

## Monitoring & Logging

### Application Monitoring
- Complaint routing success/failure rates
- Notification delivery metrics
- SLA compliance tracking
- System performance indicators

### Audit Logging
- All complaint assignments and reassignments
- Manager override actions
- Notification delivery attempts
- SLA breach events

## Troubleshooting

### Common Issues
1. **Complaints not auto-assigning**
   - Check if area has active technicians
   - Verify area manager is assigned
   - Check technician availability status

2. **Notifications not delivering**
   - Verify email/WhatsApp configuration
   - Check WebSocket connection status
   - Review notification queue

3. **SLA calculations incorrect**
   - Verify priority-based deadline settings
   - Check timezone configurations
   - Review assignment timestamps

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=complaint-routing:* npm start
```

This comprehensive complaint management workflow ensures efficient handling of customer complaints with automatic routing, real-time notifications, and proper SLA management while providing managers with the flexibility to override assignments when needed.
