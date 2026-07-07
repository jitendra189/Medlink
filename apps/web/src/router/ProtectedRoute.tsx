import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { Role } from '@medlink/shared';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const redirects: Record<Role, string> = {
      [Role.PATIENT]: '/patient/dashboard',
      [Role.HOSPITAL]: '/hospital/dashboard',
      [Role.DONOR]: '/donor/dashboard',
      [Role.DRIVER]: '/driver/dashboard',
    };
    return <Navigate to={redirects[user.role]} replace />;
  }
  return <>{children}</>;
}
