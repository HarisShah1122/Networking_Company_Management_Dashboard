# Setup Instructions

## Prerequisites

- Node.js (v16 or higher)
- MySQL (v8 or higher)
- npm or yarn

## Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your MySQL credentials:
```
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=networking_dashboard
DB_PORT=3306
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:3000
```

5. Create database and tables:
```bash
mysql -u root -p < database/schema.sql
```

6. Create default CEO user:
```bash
node database/seed.js
```

7. Start the backend server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

## Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (optional, defaults to localhost:5000):
```bash
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
```

4. Start the frontend:
```bash
npm start
```

Frontend will run on `http://localhost:3000`

## Default Login

- **Email:** ceo@company.com
- **Username:** admin
- **Password:** admin123

⚠️ **Change the password after first login!**

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/          # Database & environment config
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── models/          # Data models
│   │   ├── routes/          # API routes
│   │   └── server.js        # Express app entry
│   ├── database/
│   │   ├── schema.sql       # MySQL schema
│   │   └── seed.js          # Seed script for default user
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── stores/          # Zustand stores
│   │   ├── utils/           # Utilities
│   │   └── App.js           # Main app
│   └── package.json
└── README.md
```

## Features

- ✅ JWT Authentication
- ✅ Role-based Access Control (CEO, Manager, Staff)
- ✅ Customer Management
- ✅ Connection Tracking
- ✅ Recharge Management
- ✅ Stock/Inventory Management
- ✅ Accounts (Income/Expense Tracking)
- ✅ Staff Management (CEO only)
- ✅ Dashboard with Statistics
- ✅ Activity Logging

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- SQL injection prevention (parameterized queries)
- Input validation
- CORS configuration
- Rate limiting

