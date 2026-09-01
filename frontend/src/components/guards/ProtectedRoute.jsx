import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <LoadingSpinner size="lg" message="Authenticating session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role authorization if restricted
  if (allowedRoles.length > 0) {
    const userRole = user?.role;
    const isSuper = user?.is_superuser;
    if (!isSuper && !allowedRoles.includes(userRole)) {
      // Redirect to dashboard if user has no permission for this specific route
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
};
