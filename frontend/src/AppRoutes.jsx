import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
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
import MainLayout from './components/layout/MainLayout';

const AppRoutes = () => {
  const { checkAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Navigate to="/dashboard" replace />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <MainLayout>
                <CustomersPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/customers/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <CustomerDetailPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/connections"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ConnectionsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/recharges"
          element={
            <ProtectedRoute>
              <MainLayout>
                <RechargesPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/stock"
          element={
            <ProtectedRoute>
              <MainLayout>
                <StockPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/accounts"
          element={
            <ProtectedRoute>
              <MainLayout>
                <AccountsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={['CEO']}>
              <MainLayout>
                <StaffPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;

