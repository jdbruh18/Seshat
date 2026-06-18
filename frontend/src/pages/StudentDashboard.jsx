import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Clock, BookOpen, Award, GraduationCap, RefreshCw, 
  Lightbulb, ChevronRight, AlertCircle, ArrowUpRight, ShieldCheck 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentDashboard = () => {
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState({
    total_study_hours: 0,
    completion_percentage: 0,
    quiz_average: 0,
    learning_speed: 0,
    streak: 0,
    active_days: 0,
    strong_subjects: [],
    weak_subjects: []
  });

  const [prediction, setPrediction] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [subjectsProgress, setSubjectsProgress] = useState([]);
  const [studyStats, setStudyStats] = useState({ weekly_trend: [] });

  const [loading, setLoading] = useState(true);
  const [predLoading, setPredLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const [analyticsRes, recsRes, progRes, studyRes] = await Promise.all([
        axios.get('/api/analytics/dashboard'),
        axios.get('/api/recommendations'),
        axios.get('/api/analytics/progress'),
        axios.get('/api/study/stats')
      ]);

      setDashboardData(analyticsRes.data);
      setRecommendations(recsRes.data);
      setSubjectsProgress(progRes.data.subjects_progress);
      setStudyStats(studyRes.data);
      
      // Load saved prediction if exists
      const predRes = await axios.get('/api/predictions/predict');
      setPrediction(predRes.data);
      
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const handleRecalculatePrediction = async () => {
    try {
      setPredLoading(true);
      const response = await axios.get('/api/predictions/predict');
      setPrediction(response.data);
      
      // Also refresh dashboard stats to reflect classifications
      const analyticsRes = await axios.get('/api/analytics/dashboard');
      setDashboardData(analyticsRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to calculate exam prediction.');
    } finally {
      setPredLoading(false);
    }
  };

  // Find max weekly hours for trend chart scaling
  const maxWeeklyHours = studyStats.weekly_trend.length > 0 
    ? Math.max(...studyStats.weekly_trend.map(t => t.hours), 1) 
    : 1;

  if (loading && !prediction) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-sky-400">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Hi, {user?.full_name}!
          </h1>
          <p className="text-slate-400 mt-1">Here is your academic learning and ML prediction overview today</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="glass-panel px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-bold text-sky-400 uppercase tracking-widest">
            🔥 {dashboardData.streak} Day Study Streak
          </div>
          <button 
            onClick={fetchDashboardStats}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-sky-400 rounded-xl transition-all"
            title="Reload Dashboard"
          >
            <RefreshCw className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Study Hours */}
        <div className="glass-panel rounded-3xl p-6 shadow-md border border-slate-800/80 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Total Hours</span>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{dashboardData.total_study_hours} hrs</h3>
          </div>
        </div>

        {/* Card 2: Completion */}
        <div className="glass-panel rounded-3xl p-6 shadow-md border border-slate-800/80 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Syllabus Done</span>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{dashboardData.completion_percentage}%</h3>
          </div>
        </div>

        {/* Card 3: Quiz Average */}
        <div className="glass-panel rounded-3xl p-6 shadow-md border border-slate-800/80 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Quiz Average</span>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{dashboardData.quiz_average}%</h3>
          </div>
        </div>

        {/* Card 4: ML Prediction */}
        <div className="glass-panel rounded-3xl p-6 shadow-md border border-slate-800/80 flex items-center justify-between gap-4 bg-gradient-to-tr from-slate-900/60 via-slate-900/30 to-indigo-950/15">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Predicted Score</span>
              <h3 className="text-2xl font-extrabold text-white mt-0.5">
                {prediction ? `${prediction.predicted_score}%` : 'N/A'}
              </h3>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="text-lg font-black bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-xl shadow-inner leading-none" title="Predicted Grade">
              {prediction ? prediction.predicted_grade : '-'}
            </span>
            <button 
              onClick={handleRecalculatePrediction} 
              disabled={predLoading}
              className="text-[10px] text-sky-400 hover:text-sky-300 font-bold uppercase tracking-wider focus:outline-none flex items-center gap-1 disabled:opacity-40"
            >
              <RefreshCw className={`h-3 w-3 ${predLoading ? 'animate-spin' : ''}`} />
              Sync
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Syllabus & Trend on Left, Recommendations on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Columns (Syllabus & Trends) */}
        <div className="lg:col-span-3 space-y-8">
          {/* Syllabus Progress */}
          <div className="glass-panel rounded-3xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-sky-400" />
                Syllabus Progress Breakdown
              </h3>
              <Link to="/subjects" className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-0.5">
                Full Curriculum
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {subjectsProgress.length === 0 ? (
              <p className="text-slate-500 text-xs italic py-4 text-center">No syllabus subjects loaded.</p>
            ) : (
              <div className="space-y-4">
                {subjectsProgress.slice(0, 3).map((sub) => (
                  <div key={sub.subject_id} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-200">{sub.subject_name}</span>
                      <span className="text-slate-400">{sub.completion_percentage}% done</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                      <div 
                        className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 transition-all duration-500" 
                        style={{ width: `${sub.completion_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Custom Weekly Hour trend */}
          <div className="glass-panel rounded-3xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5 text-sky-400" />
              Weekly Study Trend
            </h3>
            
            {studyStats.weekly_trend.length === 0 ? (
              <p className="text-slate-500 text-xs italic py-4 text-center">No study hours logged this week.</p>
            ) : (
              <div className="flex h-44 items-end justify-between px-4 pb-2 border-b border-slate-850/80">
                {studyStats.weekly_trend.map((t, idx) => {
                  const pct = (t.hours / maxWeeklyHours) * 100;
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 group relative">
                      <span className="absolute -top-8 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 bg-slate-900 border border-slate-800 text-[10px] text-sky-400 font-bold px-2 py-0.5 rounded transition-all shadow pointer-events-none">
                        {t.hours}h
                      </span>
                      <div 
                        className="w-7 rounded-t-md bg-gradient-to-t from-sky-600/30 to-sky-400 group-hover:from-sky-500 group-hover:to-indigo-500 transition-all duration-300"
                        style={{ height: `${Math.max(pct, 5)}%` }}
                      ></div>
                      <span className="text-[9px] text-slate-500 mt-2 font-semibold">{t.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Columns (Recommendations & Strong/Weak Classification) */}
        <div className="lg:col-span-2 space-y-8">
          {/* AI Recommendations */}
          <div className="glass-panel rounded-3xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-sky-400 animate-pulse" />
                AI Study Advisor
              </h3>
              <Link to="/recommendations" className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-0.5">
                All Recommendations
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recommendations.length === 0 ? (
              <div className="text-center py-6">
                <ShieldCheck className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
                <p className="text-slate-400 text-xs font-semibold">Everything looks optimal!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.slice(0, 2).map((rec) => (
                  <div key={rec.recommendation_id} className="p-4 bg-slate-900/35 border border-slate-900 rounded-2xl flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-300 font-medium leading-relaxed">
                      {rec.recommendation_text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Strong / Weak Subjects */}
          <div className="glass-panel rounded-3xl p-6 shadow-lg space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-sky-400" />
              Learning Strengths & Weaknesses
            </h3>

            <div className="space-y-4">
              {/* Strong Subjects */}
              <div>
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Strong Subjects</h4>
                {dashboardData.strong_subjects.length === 0 ? (
                  <p className="text-slate-600 text-xs italic">No strong subjects classified yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {dashboardData.strong_subjects.map((sub) => (
                      <span key={sub.subject_id} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-xl text-xs font-bold">
                        {sub.subject_name} ({sub.completion_percentage}%)
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Weak Subjects */}
              <div>
                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-2">Areas for Focus</h4>
                {dashboardData.weak_subjects.length === 0 ? (
                  <p className="text-slate-600 text-xs italic">No weak subjects classified. Outstanding!</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {dashboardData.weak_subjects.map((sub) => (
                      <span key={sub.subject_id} className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-xl text-xs font-bold">
                        {sub.subject_name} ({sub.completion_percentage}%)
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default StudentDashboard;
