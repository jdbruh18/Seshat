import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile';

import { Subjects } from './pages/Subjects';
import { StudyTracker } from './pages/StudyTracker';
import { Quizzes } from './pages/Quizzes';
import { Recommendations } from './pages/Recommendations';
import { StudentDashboard } from './pages/StudentDashboard';
import { StarChart } from './pages/StarChart';

import { TeacherDashboard } from './pages/TeacherDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminUsers } from './pages/AdminUsers';

// Layout wrapper for authenticated pages (contains Sidebar and main content area)
const DashboardLayout = () => {
  const { user } = useAuth();
  if (!user) return <Outlet />;

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />
      <main className="flex-1 pl-64 min-h-screen bg-slate-950 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

// Auto-redirection helper for base url depending on user login state/role
const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-sky-400">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-sky-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'student') return <Navigate to="/student-dashboard" replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher-dashboard" replace />;
  if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Authenticated Dashboard Pages */}
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<RootRedirect />} />

            {/* Shared Route */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />

            <Route path="/subjects" element={
              <ProtectedRoute>
                <Subjects />
              </ProtectedRoute>
            } />

            {/* Student Specific Routes */}
            <Route path="/student-dashboard" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/study-tracker" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudyTracker />
              </ProtectedRoute>
            } />
            <Route path="/recommendations" element={
              <ProtectedRoute allowedRoles={['student']}>
                <Recommendations />
              </ProtectedRoute>
            } />
            <Route path="/star-chart" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StarChart />
              </ProtectedRoute>
            } />

            {/* Teacher Specific Routes */}
            <Route path="/teacher-dashboard" element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherDashboard />
              </ProtectedRoute>
            } />

            {/* Admin Specific Routes */}
            <Route path="/admin-dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsers />
              </ProtectedRoute>
            } />

            {/* Shared Quizzes (Student plays, Teacher manages) */}
            <Route path="/quizzes" element={
              <ProtectedRoute allowedRoles={['student', 'teacher']}>
                <Quizzes />
              </ProtectedRoute>
            } />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
