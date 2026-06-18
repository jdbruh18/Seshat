import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  Clock, 
  Award, 
  Lightbulb, 
  User, 
  LogOut, 
  Users, 
  Settings, 
  GraduationCap,
  PlusSquare,
  Sparkles
} from 'lucide-react';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Define links based on roles
  const studentLinks = [
    { to: '/student-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/subjects', label: 'Syllabus & Topics', icon: BookOpen },
    { to: '/study-tracker', label: 'Study Logger', icon: Clock },
    { to: '/quizzes', label: 'Quizzes', icon: Award },
    { to: '/recommendations', label: 'AI Advisor', icon: Lightbulb },
    { to: '/star-chart', label: 'Cosmic Rhythm', icon: Sparkles },
    { to: '/profile', label: 'My Profile', icon: User },
  ];

  const teacherLinks = [
    { to: '/teacher-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/subjects', label: 'Course Builder', icon: PlusSquare },
    { to: '/quizzes', label: 'Quiz Manager', icon: Award },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  const adminLinks = [
    { to: '/admin-dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Manage Users', icon: Users },
    { to: '/subjects', label: 'Subjects', icon: BookOpen },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  const getLinks = () => {
    switch (user.role) {
      case 'student': return studentLinks;
      case 'teacher': return teacherLinks;
      case 'admin': return adminLinks;
      default: return [];
    }
  };

  const links = getLinks();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-800 bg-slate-950/70 p-5 backdrop-blur-xl flex flex-col justify-between">
      <div>
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-2 py-4 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/20">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Seshat</h1>
            <span className="text-[10px] uppercase tracking-widest text-sky-400 font-bold">{user.role} Portal</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-gradient-to-r from-sky-500/10 to-indigo-500/5 text-sky-400 border-l-2 border-sky-500 pl-[14px]' 
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}
                `}
              >
                <Icon className="h-5 w-5" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User block & Logout */}
      <div className="border-t border-slate-900 pt-4">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sky-400 border border-slate-700">
            {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="truncate">
            <h4 className="text-xs font-semibold text-slate-200 truncate">{user.full_name}</h4>
            <span className="text-[10px] text-slate-500 truncate block">{user.email}</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/5 hover:text-rose-300 transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
