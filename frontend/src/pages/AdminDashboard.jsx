import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Users, BookOpen, Award, Clock, RefreshCw, 
  Activity, ArrowRight, ShieldCheck, Database, LayoutGrid 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({
    total_users: 0,
    total_subjects: 0,
    total_study_sessions: 0,
    role_breakdown: [],
    total_study_hours: 0,
    total_quiz_attempts: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/analytics/admin');
      setData(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load administrator overview stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  if (loading && data.role_breakdown.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-sky-400">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-sky-500"></div>
      </div>
    );
  }

  // Find max role count for scaling chart bars
  const maxRoleCount = data.role_breakdown.length > 0
    ? Math.max(...data.role_breakdown.map(r => r.count), 1)
    : 1;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-slate-400 mt-1">Platform management overview, usage metrics, and account controls</p>
        </div>
        
        <button 
          onClick={fetchAdminStats}
          className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-sky-400 rounded-xl transition-all self-start md:self-auto"
          title="Reload Dashboard"
        >
          <RefreshCw className="h-4.5 w-4.5" />
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Platform Users */}
        <div className="glass-panel rounded-3xl p-6 shadow-md border border-slate-800/80 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Platform Users</span>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{data.total_users} Users</h3>
          </div>
        </div>

        {/* Card 2: Total Study Hours */}
        <div className="glass-panel rounded-3xl p-6 shadow-md border border-slate-800/80 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Logged Hours</span>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{data.total_study_hours} hrs</h3>
          </div>
        </div>

        {/* Card 3: Quiz Attempts */}
        <div className="glass-panel rounded-3xl p-6 shadow-md border border-slate-800/80 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Quiz Submissions</span>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{data.total_quiz_attempts} Attempts</h3>
          </div>
        </div>

        {/* Card 4: Total Subjects */}
        <div className="glass-panel rounded-3xl p-6 shadow-md border border-slate-800/80 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Subjects Registered</span>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{data.total_subjects} Subjects</h3>
          </div>
        </div>
      </div>

      {/* Main Grid: User breakdown on Left, Management options on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Columns (User Breakdown by Role) */}
        <div className="lg:col-span-3 space-y-8">
          <div className="glass-panel rounded-3xl p-6 shadow-lg border border-slate-800/80">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Database className="h-5 w-5 text-sky-400" />
              Database Account Distributions
            </h3>

            <div className="space-y-6">
              {data.role_breakdown.map((item) => {
                const pct = (item.count / maxRoleCount) * 100;
                let colorClass = 'from-sky-500 to-indigo-600';
                if (item.role === 'Teachers') colorClass = 'from-purple-500 to-pink-600';
                if (item.role === 'Administrators') colorClass = 'from-amber-500 to-orange-600';

                return (
                  <div key={item.role} className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-200">{item.role}</span>
                      <span className="text-slate-400 font-bold">{item.count} Registered</span>
                    </div>
                    <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                      <div 
                        className={`h-full bg-gradient-to-r ${colorClass} transition-all duration-550`} 
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Columns (Admin Controls Quick Cards) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: User management shortcut */}
          <div className="glass-panel rounded-3xl p-6 shadow-lg border border-slate-800/80 bg-gradient-to-tr from-slate-900/60 via-slate-900/30 to-sky-950/10 flex flex-col justify-between h-48">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-sky-400" />
                User Account Directory
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Review all registered student, teacher, and administrator accounts. Delete inactive or invalid profiles.
              </p>
            </div>
            
            <Link 
              to="/admin/users" 
              className="flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 transition-all hover:underline"
            >
              Access User Directory
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Card 2: Syllabus management shortcut */}
          <div className="glass-panel rounded-3xl p-6 shadow-lg border border-slate-800/80 bg-gradient-to-tr from-slate-900/60 via-slate-900/30 to-indigo-950/10 flex flex-col justify-between h-48">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-400" />
                Curriculum Registry
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                View subjects, units, and topics in the system registry. Set up standard MCA curricula.
              </p>
            </div>
            
            <Link 
              to="/subjects" 
              className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-all hover:underline"
            >
              Review Subjects List
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
