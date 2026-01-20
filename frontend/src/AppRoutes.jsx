import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import ComplaintsPage from './pages/complaints/ComplaintsPage';
import AreasPage from './pages/areas/AreasPage';
import PaymentsPage from './pages/payments/PaymentsPage';
import MainLayout from './components/layout/MainLayout';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
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
        <Route
          path="/complaints"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ComplaintsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/areas"
          element={
            <ProtectedRoute allowedRoles={['CEO', 'Manager']}>
              <MainLayout>
                <AreasPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <MainLayout>
                <PaymentsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
