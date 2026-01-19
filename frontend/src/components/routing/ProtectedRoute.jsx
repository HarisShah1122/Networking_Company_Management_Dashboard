import { Navigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import Loader from '../common/Loader';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, isInitializing } = useAuthStore();

  // Show loader while checking auth
  if (isInitializing) return <Loader />;

  // Redirect to login if not authenticated
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Redirect if role is not allowed
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
