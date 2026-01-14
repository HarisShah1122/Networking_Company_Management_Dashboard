import { Navigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import Loader from '../common/Loader';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, isInitializing } = useAuthStore();

  // Show loading while checking authentication
  if (isInitializing) {
    return <Loader />;
  }

  // Only redirect if auth check is complete and user is not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;

