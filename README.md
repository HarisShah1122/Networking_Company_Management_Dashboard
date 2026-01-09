# Networking Company Management Dashboard

A comprehensive management system for networking companies to handle customers, connections, recharges, stock, accounts, and staff management.

## Technology Stack

### Backend
- **Node.js** + **Express.js** - RESTful API server
- **MySQL** - Database with relational schema
- **JWT** (jsonwebtoken) - Authentication
- **bcrypt** - Password hashing
- **express-validator** - Input validation

### Frontend
- **React.js** - UI framework
- **React Router** - Routing
- **Zustand** - State management
- **Axios** - API calls
- **React Hook Form** - Form handling
- **Recharts** - Dashboard charts
- **Tailwind CSS** - Styling

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/          # Database & environment config
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── models/          # Data models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── server.js        # Express app entry
│   ├── database/
│   │   └── schema.sql       # MySQL schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── stores/          # Zustand stores
│   │   ├── hooks/           # Custom hooks
│   │   ├── utils/           # Utilities
│   │   └── App.js           # Main app
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- MySQL (v8+)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your MySQL credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=networking_dashboard
```

5. Create database and run schema:
```bash
mysql -u root -p < database/schema.sql
```

6. Start the server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

Frontend will run on `http://localhost:3000`

## Default Login

- **Email:** ceo@company.com
- **Username:** admin
- **Password:** admin123 (change after first login)

## Features

### Role-Based Access Control
- **CEO**: Full access to all modules
- **Manager**: Access to operations (customers, connections, recharges, stock, accounts)
- **Staff**: Limited access to assigned tasks

### Modules
- **Dashboard**: Overview with statistics and charts
- **Customers**: Customer management (CRUD)
- **Connections**: Connection tracking and status management
- **Recharges**: Payment tracking and due date management
- **Stock**: Inventory management
- **Accounts**: Income/expense tracking and P&L reports
- **Staff**: User management (CEO only)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (CEO only)
- `GET /api/auth/me` - Get current user

### Customers
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Connections
- `GET /api/connections` - List all connections
- `POST /api/connections` - Create connection
- `PUT /api/connections/:id` - Update connection
- `GET /api/connections/:id` - Get connection details

### Recharges
- `GET /api/recharges` - List all recharges
- `POST /api/recharges` - Create recharge
- `PUT /api/recharges/:id` - Update recharge status
- `GET /api/recharges/due` - Get due payments

### Stock
- `GET /api/stock` - List all stock items
- `POST /api/stock` - Add stock item
- `PUT /api/stock/:id` - Update stock item
- `DELETE /api/stock/:id` - Delete stock item

### Transactions
- `GET /api/transactions` - List all transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/summary` - Get P&L summary

### Users
- `GET /api/users` - List all users (CEO only)
- `POST /api/users` - Create user (CEO only)
- `PUT /api/users/:id` - Update user (CEO only)

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- SQL injection prevention
- Role-based access control
- CORS configuration
- Rate limiting

## License

ISC

