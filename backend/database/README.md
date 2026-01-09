# Database Setup

## Initial Setup

1. Create MySQL database:
```bash
mysql -u root -p < schema.sql
```

2. Create default CEO user:
```bash
cd backend
node database/seed.js
```

## Default Login Credentials

- **Email:** ceo@company.com
- **Username:** admin
- **Password:** admin123

⚠️ **Important:** Change the default password after first login!

## Database Schema

The schema includes the following tables:
- `users` - User accounts and authentication
- `customers` - Customer information
- `connections` - Network connections
- `recharges` - Payment records
- `stock_items` - Inventory management
- `transactions` - Financial transactions
- `activity_logs` - System activity tracking

