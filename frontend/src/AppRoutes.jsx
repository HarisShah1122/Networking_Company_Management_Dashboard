import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import ProtectedRoute from './components/routing/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import CustomersPage from './pages/customers/CustomersPage';
import CustomerDetailPage from './pages/customers/CustomerDetailPage';
import ConnectionsPage from './pages/connections/ConnectionsPage';
import RechargesPage from './pages/recharges/RechargesPage';
import StockPage from './pages/stock/StockPage';
import AccountsPage from './pages/accounts/AccountsPage';
import StaffPage from './pages/staff/StaffPage';
import AllUsersPage from './pages/admin/AllUsersPage';
import ComplaintsPage from './pages/complaints/ComplaintsPage';
import ComplaintsDashboardEnhanced from './pages/complaints/ComplaintsDashboardEnhanced';
import AreasPage from './pages/areas/AreasPage';
import PaymentsPage from './pages/payments/PaymentsPage';
import MainLayout from './components/layout/MainLayout';

const AppRoutes = () => {
  const { isAuthenticated, isInitializing } = useAuthStore();

  if (isInitializing) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/dashboard" replace />} />
        
        {/* Fallback for any unmatched routes */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />

        {/* Protected */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/connections" element={<ConnectionsPage />} />
          {/* <Route path="/recharges" element={<RechargesPage />} /> REMOVED - MOVED TO PAYMENTS */}
          <Route path="/payments" element={<PaymentsPage />} />
          {/* <Route path="/stock" element={<StockPage />} /> TEMPORARILY HIDDEN */}
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/complaints" element={<ComplaintsPage />} />
          <Route path="/complaints-dashboard" element={<ComplaintsDashboardEnhanced />} />
          <Route path="/areas" element={<AreasPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
