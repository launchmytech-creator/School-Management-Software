import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/auth';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white/50 backdrop-blur-sm">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500/20 border-t-blue-500"></div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    // If already logged in, redirect to their role-based dashboard
    const dashboardMap: Record<UserRole, string> = {
      super_admin: '/super-admin/dashboard',
      school_admin: '/admin/dashboard',
      teacher: '/teacher/dashboard',
      student: '/student/dashboard',
      parent: '/parent/dashboard',
      accountant: '/accountant/dashboard'
    };
    
    return <Navigate to={dashboardMap[user.role] || '/admin/dashboard'} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
