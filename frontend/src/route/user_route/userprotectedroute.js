import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';

export default function UserProtectedRoute({ children }) {
  const { user, loading } = useAuthContext();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (!user || user.role !== 'user') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children || <Outlet />;
}
