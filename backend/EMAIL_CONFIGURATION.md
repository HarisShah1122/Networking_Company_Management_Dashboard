# Email Notification Configuration Guide

This guide will help you configure email notifications for the PACE Telecom Management System.

## Prerequisites

1. **Gmail Account** (Recommended) or any SMTP email service
2. **App Password** for Gmail (if using 2-factor authentication)
3. **Environment variables** configured

## Step 1: Gmail Configuration (Recommended)

### Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Go to "App passwords" section
4. Generate a new app password for "PACE Telecom"

### Alternative: Use App Password without 2FA
1. Go to Google Account settings
2. Security → Less secure app access
3. Enable "Allow less secure apps" (Not recommended for production)

## Step 2: Environment Configuration

Add the following to your `.env` file:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=PACE Telecom <noreply@pacetelecom.com>
FRONTEND_URL=http://localhost:3000
```

### For Other Email Providers

#### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

#### Yahoo Mail
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-password
```

#### Custom SMTP
```env
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-username
EMAIL_PASS=your-password
```

## Step 3: Test Email Configuration

### Using API Endpoint
```bash
POST http://localhost:5000/api/notifications/test
Content-Type: application/json
Authorization: Bearer <your-jwt-token>

{
  "testEmail": "your-test-email@example.com"
}
```

### Using Test Script
```bash
cd backend
node -e "
const emailService = require('./src/services/email.service');
emailService.sendGenericNotification(
  'your-test-email@example.com',
  'Test Email',
  'This is a test email from PACE Telecom system.'
).then(result => console.log(result));
"
```

## Step 4: Available Email Notifications

The system supports the following email notifications:

### 1. Complaint Assignment
- **Trigger**: When a complaint is assigned to a technician
- **Recipient**: Assigned technician
- **Content**: Complaint details, assignment info, action required

### 2. Complaint Status Update
- **Trigger**: When complaint status changes
- **Recipient**: Customer
- **Content**: Status change details, next steps

### 3. Payment Confirmation
- **Trigger**: When payment is confirmed/approved
- **Recipient**: Customer
- **Content**: Payment details, receipt information

### 4. Customer Welcome
- **Trigger**: When new customer is created
- **Recipient**: New customer
- **Content**: Welcome message, account details

### 5. SLA Breach Warning
- **Trigger**: When SLA deadline is approaching or breached
- **Recipient**: Assigned technician
- **Content**: Urgent action required, time remaining

### 6. Generic Notification
- **Trigger**: Manual trigger via API
- **Recipient**: Any specified email
- **Content**: Custom message with optional action button

## Step 5: Email Templates

All email templates are automatically styled and include:
- Professional PACE Telecom branding
- Responsive design
- Action buttons where applicable
- Automatic signature and disclaimer

## Step 6: Troubleshooting

### Common Issues

#### 1. "Email service not configured"
- **Cause**: Missing EMAIL_USER or EMAIL_PASS
- **Solution**: Add email credentials to .env file

#### 2. "Email server connection failed"
- **Cause**: Incorrect SMTP settings or authentication
- **Solution**: Verify email provider settings and credentials

#### 3. "Gmail authentication failed"
- **Cause**: Using regular password instead of app password
- **Solution**: Generate and use app password

#### 4. Emails going to spam
- **Cause**: Missing SPF/DKIM records or suspicious content
- **Solution**: Configure domain authentication, use reputable email service

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

Check console logs for detailed email sending information.

## Step 7: Production Considerations

### Security
- Use environment variables for credentials
- Enable TLS/SSL for email connections
- Regularly rotate email passwords

### Deliverability
- Set up SPF, DKIM, and DMARC records
- Use dedicated IP for high volume
- Monitor bounce rates and spam complaints

### Monitoring
- Track email delivery success rates
- Monitor failed email attempts
- Set up alerts for email service issues

## Step 8: Customization

### Modify Email Templates
Edit the email templates in `backend/src/services/email.service.js`:
- Update company branding
- Add custom fields
- Modify styling

### Add New Notification Types
1. Create new method in `email.service.js`
2. Add corresponding controller method
3. Add route in `notification.routes.js`

## Support

For issues with email configuration:
1. Check console logs for error details
2. Verify SMTP settings with email provider
3. Test with a simple email client first
4. Ensure firewall allows SMTP connections

## Example Configuration

```env
# Working Gmail Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=pace.telecom@gmail.com
EMAIL_PASS=abcd-efgh-ijkl-mnop
EMAIL_FROM=PACE Telecom <noreply@pacetelecom.com>
FRONTEND_URL=https://your-domain.com
```

This configuration will enable all email notifications for your PACE Telecom Management System.
