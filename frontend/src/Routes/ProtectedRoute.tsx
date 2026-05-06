import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import type { UserRole } from '../types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const { showNotification } = useNotification();

  useEffect(() => {
    const handleAuthError = () => {
      showNotification('Your session has expired. Please log in again.', 'error');
      logout();
    };

    window.addEventListener('auth:error', handleAuthError);
    return () => window.removeEventListener('auth:error', handleAuthError);
  }, [logout, showNotification]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white/50 backdrop-blur-sm">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500/20 border-t-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const dashboardMap: Record<UserRole, string> = {
      super_admin: '/super-admin/dashboard',
      school_admin: '/admin/dashboard',
      teacher: '/teacher/dashboard',
      student: '/student/dashboard',
      parent: '/parent/dashboard',
      accountant: '/accountant/dashboard'
    };
    
    return <Navigate to={dashboardMap[user.role] || '/login'} replace />;
  }

  if (user.role !== 'super_admin' && user.subscriptionStatus) {
    const blockedStatuses = ['suspended', 'expired'];
    if (blockedStatuses.includes(user.subscriptionStatus)) {
      return <Navigate to={`/subscription-${user.subscriptionStatus}`} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
