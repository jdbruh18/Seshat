import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-sky-400">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-sky-500"></div>
          <span className="text-sm font-semibold tracking-wider">Verifying Session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login but save the current location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If authenticated but role not allowed, redirect to correct default dashboard
    if (user.role === 'student') return <Navigate to="/student-dashboard" replace />;
    if (user.role === 'teacher') return <Navigate to="/teacher-dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};
