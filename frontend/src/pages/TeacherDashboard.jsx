import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Users, BookOpen, Award, AlertCircle, RefreshCw, 
  ChevronRight, BookOpenText, Target, ShieldAlert, BarChart2 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const TeacherDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({
    total_students: 0,
    subject_performance: [],
    weak_topics: [],
    grades_breakdown: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTeacherStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/analytics/teacher');
      setData(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load teacher analytics dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherStats();
  }, []);

  if (loading && data.subject_performance.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-sky-400">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-sky-500"></div>
      </div>
    );
  }

  // Calculate some aggregate values
  const totalSubjects = data.subject_performance.length;
  const overallQuizAvg = data.subject_performance.length > 0
    ? Math.round(data.subject_performance.reduce((sum, s) => sum + s.class_quiz_average, 0) / totalSubjects)
    : 0;
  
  const overallCompletionAvg = data.subject_performance.length > 0
    ? Math.round(data.subject_performance.reduce((sum, s) => sum + s.average_completion, 0) / totalSubjects)
    : 0;

  // Find max grade count for breakdown chart scaling
  const maxGradeCount = data.grades_breakdown.length > 0
    ? Math.max(...data.grades_breakdown.map(g => g.count), 1)
    : 1;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome, {user?.full_name}!
          </h1>
          <p className="text-slate-400 mt-1">Here is your student performance overview and syllabus completion analytics</p>
        </div>
        
        <button 
          onClick={fetchTeacherStats}
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
        {/* Card 1: Total Students */}
        <div className="glass-panel rounded-3xl p-6 shadow-md border border-slate-800/80 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Total Enrolled</span>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{data.total_students} Students</h3>
          </div>
        </div>

        {/* Card 2: Total Subjects */}
        <div className="glass-panel rounded-3xl p-6 shadow-md border border-slate-800/80 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Active Courses</span>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{totalSubjects} Subjects</h3>
          </div>
        </div>

        {/* Card 3: Class Quiz Average */}
        <div className="glass-panel rounded-3xl p-6 shadow-md border border-slate-800/80 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Class Quiz Avg</span>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{overallQuizAvg}%</h3>
          </div>
        </div>

        {/* Card 4: Avg Syllabus Completion */}
        <div className="glass-panel rounded-3xl p-6 shadow-md border border-slate-800/80 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Class Completion</span>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{overallCompletionAvg}%</h3>
          </div>
        </div>
      </div>

      {/* Main Grid: Subject Details on Left, Grade Distribution & Weak Topics on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Columns (Subject Performance Table) */}
        <div className="lg:col-span-3 space-y-8">
          <div className="glass-panel rounded-3xl p-6 shadow-lg border border-slate-800/80">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpenText className="h-5 w-5 text-sky-400" />
                Subject Performance Analytics
              </h3>
              <Link to="/subjects" className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-0.5">
                Manage Courses
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {data.subject_performance.length === 0 ? (
              <p className="text-slate-500 text-sm italic py-8 text-center">No subjects created yet. Use Course Builder to get started.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <th className="pb-3 pr-4">Subject</th>
                      <th className="pb-3 px-4">Completion %</th>
                      <th className="pb-3 px-4 text-center">Quizzes</th>
                      <th className="pb-3 pl-4 text-right">Quiz Avg</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60">
                    {data.subject_performance.map((sub) => (
                      <tr key={sub.subject_id} className="group hover:bg-slate-900/25 transition-all">
                        <td className="py-4 pr-4">
                          <span className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors block">
                            {sub.subject_name}
                          </span>
                        </td>
                        <td className="py-4 px-4 min-w-[150px]">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-300 font-bold w-9">{sub.average_completion}%</span>
                            <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                              <div 
                                className="h-full bg-gradient-to-r from-sky-500 to-indigo-500" 
                                style={{ width: `${sub.average_completion}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center text-xs font-semibold text-slate-400">
                          {sub.total_quizzes}
                        </td>
                        <td className="py-4 pl-4 text-right">
                          <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${
                            sub.class_quiz_average >= 75 
                              ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' 
                              : sub.class_quiz_average >= 55 
                              ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' 
                              : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                          }`}>
                            {sub.class_quiz_average}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Columns (Grades Breakdown & Weak Topics) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Predicted Grades Breakdown Chart */}
          <div className="glass-panel rounded-3xl p-6 shadow-lg border border-slate-800/80">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-sky-400" />
              ML Exam Predictions Grade Pool
            </h3>
            
            {data.grades_breakdown.length === 0 ? (
              <p className="text-slate-500 text-xs italic py-4 text-center">No student projections generated yet.</p>
            ) : (
              <div className="space-y-4">
                {data.grades_breakdown.map((g) => {
                  const pct = (g.count / maxGradeCount) * 100;
                  // Color codes for grades
                  const colorMap = {
                    'A': 'from-emerald-500 to-teal-600',
                    'B': 'from-sky-500 to-indigo-600',
                    'C': 'from-indigo-500 to-purple-600',
                    'D': 'from-amber-500 to-orange-600',
                    'F': 'from-rose-500 to-pink-600'
                  };
                  const textColors = {
                    'A': 'text-emerald-400',
                    'B': 'text-sky-400',
                    'C': 'text-indigo-400',
                    'D': 'text-amber-400',
                    'F': 'text-rose-400'
                  };
                  const bgColors = {
                    'A': 'bg-emerald-500/10 border-emerald-500/20',
                    'B': 'bg-sky-500/10 border-sky-500/20',
                    'C': 'bg-indigo-500/10 border-indigo-500/20',
                    'D': 'bg-amber-500/10 border-amber-500/20',
                    'F': 'bg-rose-500/10 border-rose-500/20'
                  };

                  return (
                    <div key={g.grade} className="flex items-center gap-4">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm border ${bgColors[g.grade] || 'text-slate-300'}`}>
                        {g.grade}
                      </span>
                      <div className="flex-1 h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-850/60 relative">
                        <div 
                          className={`h-full bg-gradient-to-r ${colorMap[g.grade] || 'from-sky-500 to-indigo-500'} transition-all duration-500`}
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-slate-400 w-10 text-right">
                        {g.count} student{g.count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Weak Areas of Focus (Topics) */}
          <div className="glass-panel rounded-3xl p-6 shadow-lg border border-slate-800/80">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-400 animate-pulse" />
              Top Weak Areas (&lt;50% completion)
            </h3>
            <p className="text-xs text-slate-500 mb-4">Focus classroom reviews on these topics to improve syllabus coverage</p>
            
            {data.weak_topics.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-emerald-400 text-xs font-semibold">Perfect Coverage!</p>
                <p className="text-slate-500 text-[10px] mt-0.5">All topics are above 50% class completion.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.weak_topics.map((t) => (
                  <div key={t.topic_id} className="p-3 bg-slate-900/35 border border-slate-900 rounded-xl space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs font-bold text-slate-200 line-clamp-1">{t.topic_name}</span>
                      <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 shrink-0">
                        {t.completed_percentage}% Done
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-none truncate">
                      {t.subject_name} &bull; {t.unit_name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
