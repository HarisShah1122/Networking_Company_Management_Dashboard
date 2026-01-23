# Frontend Project Structure

This document outlines the complete structure of the Networking Company Management Dashboard frontend.

## Directory Structure

```
frontend/
├── public/                          # Static assets
│   └── index.html                  # HTML template
├── src/                            # Main source code
│   ├── components/                 # Reusable React components
│   │   ├── common/                 # Shared/common components
│   │   │   ├── ConfirmModal.jsx   # Delete confirmation modal
│   │   │   ├── CustomTabs.jsx     # Tab component
│   │   │   ├── Loader.jsx         # Loading spinner
│   │   │   ├── Modal.jsx          # Generic modal component
│   │   │   └── TablePagination.jsx # Pagination component
│   │   ├── layout/                 # Layout components
│   │   │   ├── Header.jsx         # App header/navbar
│   │   │   ├── MainLayout.jsx     # Main layout wrapper
│   │   │   └── Sidebar.jsx        # Side navigation
│   │   └── routing/                # Routing components
│   │       └── ProtectedRoute.jsx # Route protection wrapper
│   ├── config/                     # Configuration files
│   │   └── queryClient.js         # React Query client setup
│   ├── contexts/                   # React contexts
│   │   └── LayoutContext.jsx      # Layout state management
│   ├── hooks/                      # Custom React hooks
│   │   ├── queries/                # React Query hooks
│   │   │   └── useStockQueries.js
│   │   ├── useCrudOperations.js   # CRUD operations hook
│   │   ├── useCustomers.js        # Customer-specific hooks
│   │   ├── useDataFetch.js        # Data fetching hook
│   │   ├── useDataLoader.js       # Data loading hook
│   │   ├── useDebounce.js         # Debounce hook
│   │   ├── useFormSubmission.js   # Form submission hook
│   │   ├── useModal.js            # Modal state hook
│   │   ├── usePagination.js       # Pagination hook
│   │   └── useSearchFilter.js     # Search/filter hook
│   ├── pages/                      # Page components (routes)
│   │   ├── accounts/               # Accounts/Transactions pages
│   │   │   └── AccountsPage.jsx
│   │   ├── areas/                  # Areas management pages
│   │   │   └── AreasPage.jsx
│   │   ├── auth/                   # Authentication pages
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── complaints/             # Complaints management
│   │   │   └── ComplaintsPage.jsx
│   │   ├── connections/            # Connections management
│   │   │   └── ConnectionsPage.jsx
│   │   ├── customers/              # Customer management
│   │   │   ├── CustomerDetailPage.jsx
│   │   │   └── CustomersPage.jsx
│   │   ├── dashboard/              # Dashboard page
│   │   │   └── DashboardPage.jsx
│   │   ├── recharges/              # Recharges management
│   │   │   └── RechargesPage.jsx
│   │   ├── staff/                  # Staff management
│   │   │   └── StaffPage.jsx
│   │   └── stock/                  # Stock/Inventory management
│   │       └── StockPage.jsx
│   ├── services/                   # API service layer
│   │   ├── api/                    # API client configuration
│   │   │   └── apiClient.js       # Axios instance setup
│   │   ├── areaService.js
│   │   ├── authService.js
│   │   ├── complaintService.js
│   │   ├── connectionService.js
│   │   ├── customerService.js
│   │   ├── rechargeService.js
│   │   ├── stockService.js
│   │   ├── transactionService.js
│   │   └── userService.js
│   ├── stores/                     # State management (Zustand)
│   │   └── authStore.js           # Authentication state
│   ├── utils/                      # Utility functions
│   │   ├── apiResponseHelper.js   # API response handling
│   │   ├── dataHelpers.js         # Data manipulation utilities
│   │   ├── pagination.utils.js    # Pagination helpers
│   │   ├── permission.utils.js    # Permission checking
│   │   └── storage.utils.js       # LocalStorage utilities
│   ├── App.js                      # Main App component
│   ├── AppRoutes.jsx               # Route definitions
│   ├── index.js                    # Entry point
│   └── index.css                   # Global styles
├── package.json                    # Dependencies
├── postcss.config.js               # PostCSS configuration
├── tailwind.config.js              # Tailwind CSS configuration
└── PROJECT_STRUCTURE.md           # This file
```

## Architecture Pattern

The frontend follows a **component-based architecture** with clear separation of concerns:

### 1. **Pages Layer** (`src/pages/`)
- Top-level route components
- Page-specific logic and state
- Composes components and hooks
- Handles user interactions

### 2. **Components Layer** (`src/components/`)
- Reusable UI components
- Layout components (Header, Sidebar, MainLayout)
- Common components (Modal, Loader, TablePagination)
- Presentational and container components

### 3. **Services Layer** (`src/services/`)
- API communication layer
- Axios-based HTTP clients
- Encapsulates API endpoints
- Handles request/response transformations

### 4. **State Management** (`src/stores/`)
- Zustand stores for global state
- Authentication state
- User session management

### 5. **Hooks Layer** (`src/hooks/`)
- Custom React hooks
- Reusable logic extraction
- React Query hooks for data fetching
- Form handling, pagination, modals

### 6. **Utils Layer** (`src/utils/`)
- Pure utility functions
- Helper functions for common operations
- Data transformation utilities

## Key Technologies

- **React.js** - UI library
- **React Router** - Client-side routing
- **Zustand** - State management
- **React Query (TanStack Query)** - Data fetching and caching
- **React Hook Form** - Form management
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first CSS framework
- **Mantine** - UI component library
- **Recharts** - Chart library (for dashboard)
- **React Toastify** - Toast notifications

## Key Features

### Form Validation
- **Dirty form validation** - Shows errors on touched fields
- **Red border highlighting** - Invalid fields have red borders
- **Real-time validation** - Validation occurs on blur/submit
- Uses React Hook Form for validation

### Data Management
- **Pagination** - Client-side and server-side pagination support
- **Search & Filters** - Debounced search and filtering
- **CRUD Operations** - Create, Read, Update operations (Delete removed)
- **Real-time Updates** - React Query for cache invalidation

### User Experience
- **Loading States** - Loading spinners and skeletons
- **Error Handling** - User-friendly error messages
- **Toast Notifications** - Success/error feedback
- **Responsive Design** - Mobile-friendly layouts

### Security
- **Protected Routes** - Authentication required
- **Role-Based Access** - CEO, Manager, Staff permissions
- **JWT Authentication** - Token-based auth
- **Token Refresh** - Automatic token management

## Page Components

### Authentication Pages
- **LoginPage** - User login form
- **RegisterPage** - User registration (CEO only)

### Main Pages
- **DashboardPage** - Overview with statistics and charts
- **CustomersPage** - Customer list with search/filter
- **CustomerDetailPage** - Individual customer details
- **ConnectionsPage** - Connection management
- **RechargesPage** - Recharge/payment management
- **StockPage** - Inventory management
- **AccountsPage** - Income/expense transactions
- **StaffPage** - Staff/user management (CEO only)
- **ComplaintsPage** - Customer complaint management
- **AreasPage** - Geographic area management

## Routing Structure

Routes are defined in `AppRoutes.jsx`:
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Dashboard (protected)
- `/customers` - Customer list (protected)
- `/customers/:id` - Customer details (protected)
- `/connections` - Connections (protected)
- `/recharges` - Recharges (protected)
- `/stock` - Stock (protected)
- `/accounts` - Accounts (protected)
- `/staff` - Staff management (protected, CEO only)
- `/complaints` - Complaints (protected)
- `/areas` - Areas (protected)

## State Management

### Zustand Stores
- **authStore** - Authentication state
  - User information
  - Login/logout functions
  - Token management
  - Permission checks

### React Query Cache
- Automatic caching of API responses
- Background refetching
- Optimistic updates
- Cache invalidation on mutations

## Form Handling

All forms use **React Hook Form** with:
- **Dirty field tracking** - Only shows errors for touched fields
- **Validation rules** - Required fields, patterns, custom validators
- **Error display** - Red borders and error messages
- **Form reset** - Clears form on modal close

Example form field with validation:
```jsx
<input
  {...register('name', { required: 'Name is required' })}
  className={`mt-1 block w-full px-3 py-2 border rounded-md ${
    errors.name ? 'border-red-500' : 'border-gray-300'
  }`}
/>
{errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
```

## API Integration

Services use Axios for HTTP requests:
- Base URL configured in `apiClient.js`
- Automatic token injection
- Error handling and transformation
- Request/response interceptors

## Styling

- **Tailwind CSS** - Utility classes for styling
- **Mantine** - Component library for forms/date pickers
- **Custom CSS** - Global styles in `index.css`
- **Responsive** - Mobile-first approach

## Error Handling

- **ResizeObserver Error** - Suppressed in index.js (harmless browser warning)
- **API Errors** - Caught and displayed via toast notifications
- **Form Errors** - Displayed inline with red borders
- **Network Errors** - User-friendly error messages

## Development Workflow

1. **Setup**: Install dependencies with `npm install`
2. **Development**: Start dev server with `npm start`
3. **Build**: Create production build with `npm run build`
4. **Testing**: Run tests with `npm test`

Frontend runs on `http://localhost:3000` (default)

