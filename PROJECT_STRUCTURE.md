# Backend Project Structure

This document outlines the complete structure of the Networking Company Management Dashboard backend.

## Directory Structure

```
backend/
├── config/                          # Configuration files
│   └── config.json                  # Sequelize configuration
├── migrations/                      # Database migrations
│   └── 20260113074036-initial-all-tables.js
├── models/                         # Sequelize model definitions (legacy)
│   └── index.js
├── seeders/                        # Database seeders
│   ├── 20260113-default-admin-user.js
│   ├── seed-all-data.js            # Main seeder for all Pakistani data
│   └── seed-areas.js               # Area seeder
├── src/                            # Main source code
│   ├── config/                     # Configuration modules
│   │   ├── database.js            # Database connection setup
│   │   └── env.js                 # Environment variables
│   ├── controllers/               # Request handlers (MVC Controllers)
│   │   ├── area.controller.js
│   │   ├── authController.js
│   │   ├── complaintController.js
│   │   ├── connectionController.js
│   │   ├── customerController.js
│   │   ├── packageRenewalController.js
│   │   ├── paymentController.js
│   │   ├── rechargeController.js
│   │   ├── stockController.js
│   │   ├── transactionController.js
│   │   └── userController.js
│   ├── helpers/                   # Helper utilities
│   │   ├── constants.js           # Application constants
│   │   ├── controllerHelper.js    # Shared controller utilities
│   │   ├── customerHelper.js      # Customer-specific helpers
│   │   ├── dbErrorHandler.js      # Database error handling
│   │   ├── queryBuilder.js        # Dynamic query building
│   │   ├── responses.js           # Standardized API responses
│   │   └── validators/            # Input validation rules
│   │       ├── auth.validator.js
│   │       ├── complaint.validator.js
│   │       ├── connection.validator.js
│   │       ├── customer.validator.js
│   │       ├── index.js
│   │       ├── recharge.validator.js
│   │       ├── stock.validator.js
│   │       ├── transaction.validator.js
│   │       └── user.validator.js
│   ├── middleware/                # Express middleware
│   │   ├── auth.middleware.js     # JWT authentication
│   │   ├── error.middleware.js    # Error handling
│   │   ├── rateLimit.middleware.js # Rate limiting
│   │   ├── role.middleware.js     # Role-based access control
│   │   └── validation.middleware.js # Request validation
│   ├── models/                    # Sequelize models
│   │   ├── ActivityLog.js         # User activity logging
│   │   ├── Area.js                # Geographic areas
│   │   ├── Complaint.js           # Customer complaints
│   │   ├── Connection.js          # Customer connections
│   │   ├── Customer.js            # Customer data model
│   │   ├── index.js               # Model associations
│   │   ├── PackageRenewal.js      # Package renewals
│   │   ├── Payment.js             # Payment records
│   │   ├── Recharge.js            # Recharge transactions
│   │   ├── Stock.js               # Inventory management
│   │   ├── Transaction.js         # Financial transactions
│   │   └── User.js                # User accounts
│   ├── routes/                    # API route definitions
│   │   ├── area.routes.js
│   │   ├── auth.routes.js
│   │   ├── complaint.routes.js
│   │   ├── connection.routes.js
│   │   ├── customer.routes.js
│   │   ├── packageRenewal.routes.js
│   │   ├── payment.routes.js
│   │   ├── recharge.routes.js
│   │   ├── stock.routes.js
│   │   ├── transaction.routes.js
│   │   └── user.routes.js
│   ├── services/                  # Business logic layer
│   │   ├── activityLog.service.js
│   │   ├── area.service.js
│   │   ├── auth.service.js
│   │   ├── complaint.service.js
│   │   ├── connection.service.js
│   │   ├── customer.service.js
│   │   ├── recharge.service.js
│   │   ├── stock.service.js
│   │   ├── transaction.service.js
│   │   └── user.service.js
│   └── server.js                  # Express app entry point
├── example.env                     # Environment variables template
├── package.json                    # Node.js dependencies
└── PROJECT_STRUCTURE.md           # This file
```

## Architecture Pattern

The backend follows a **layered architecture** pattern:

### 1. **Routes Layer** (`src/routes/`)
- Defines API endpoints
- Maps HTTP methods to controller functions
- Applies middleware (auth, validation, rate limiting)

### 2. **Controllers Layer** (`src/controllers/`)
- Handles HTTP requests and responses
- Validates input using validators
- Calls service layer for business logic
- Returns standardized responses

### 3. **Services Layer** (`src/services/`)
- Contains business logic
- Interacts with database models
- Handles complex operations and transactions
- Reusable across controllers

### 4. **Models Layer** (`src/models/`)
- Sequelize ORM model definitions
- Database schema representation
- Model associations and relationships
- Data validation at model level

### 5. **Middleware Layer** (`src/middleware/`)
- Authentication (JWT)
- Authorization (Role-based)
- Error handling
- Request validation
- Rate limiting

## Key Technologies

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Sequelize** - ORM for MySQL
- **MySQL** - Database
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **express-validator** - Input validation

## Data Models

### Core Entities
1. **User** - Staff accounts (CEO, Manager, Staff roles)
2. **Customer** - Customer information
3. **Area** - Geographic locations (Katlang, Mardan, etc.)
4. **Connection** - Customer internet connections
5. **Recharge** - Payment recharges
6. **Stock** - Inventory items
7. **Transaction** - Income/Expense records
8. **Complaint** - Customer complaints
9. **ActivityLog** - User activity tracking

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (CEO only)
- `GET /api/auth/me` - Get current user

### Customers
- `GET /api/customers` - List customers (with pagination, search, filters)
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer

### Connections
- `GET /api/connections` - List connections
- `POST /api/connections` - Create connection
- `PUT /api/connections/:id` - Update connection

### Recharges
- `GET /api/recharges` - List recharges
- `POST /api/recharges` - Create recharge
- `PUT /api/recharges/:id` - Update recharge

### Stock
- `GET /api/stock` - List stock items
- `POST /api/stock` - Create stock item
- `PUT /api/stock/:id` - Update stock item

### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction

### Users/Staff
- `GET /api/users` - List users (CEO only)
- `POST /api/users` - Create user (CEO only)
- `PUT /api/users/:id` - Update user (CEO only)

### Complaints
- `GET /api/complaints` - List complaints
- `POST /api/complaints` - Create complaint
- `PUT /api/complaints/:id` - Update complaint

### Areas
- `GET /api/areas` - List areas
- `POST /api/areas` - Create area
- `PUT /api/areas/:id` - Update area

## Environment Variables

Required environment variables (defined in `.env`):
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)
- `DB_HOST` - Database host
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `DB_PORT` - Database port (default: 3306)
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRES_IN` - Token expiration (default: 24h)
- `CORS_ORIGIN` - Frontend origin URL

## Database Seeding

Seeders are located in `seeders/` directory:
- `seed-all-data.js` - Seeds all tables with Pakistani test data
- Includes 12 records for each main entity (Customers, Connections, Recharges, etc.)
- Areas include Katlang and Mardan with area codes

Run seeders:
```bash
node seeders/seed-all-data.js
```

## Development Workflow

1. **Setup**: Install dependencies, configure `.env`, create database
2. **Migrations**: Run database migrations to create tables
3. **Seeding**: Seed database with test data
4. **Development**: Start server with `npm run dev`
5. **Testing**: API endpoints available at `http://localhost:5000/api`

