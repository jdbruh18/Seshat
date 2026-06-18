import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, Calendar, BookOpen, MessageSquare, Plus, AlertCircle, CheckCircle, TrendingUp, History } from 'lucide-react';

export const StudyTracker = () => {
  const [subjects, setSubjects] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    daily_hours: 0,
    weekly_hours: 0,
    monthly_hours: 0,
    weekly_trend: [],
    subject_breakdown: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    subject_id: '',
    topic_id: '',
    duration_minutes: '',
    notes: '',
    study_date: new Date().toISOString().split('T')[0]
  });

  const [submitLoading, setSubmitLoading] = useState(false);

  // Fetch subjects, logs, and stats
  const fetchData = async () => {
    try {
      setLoading(true);
      const [subsRes, logsRes, statsRes] = await Promise.all([
        axios.get('/api/subjects'),
        axios.get('/api/study/logs'),
        axios.get('/api/study/stats')
      ]);
      setSubjects(subsRes.data);
      setLogs(logsRes.data);
      setStats(statsRes.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load study tracker data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Reset topic if subject changes
      if (name === 'subject_id') {
        updated.topic_id = '';
      }
      return updated;
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { subject_id, topic_id, duration_minutes, notes, study_date } = formData;
    if (!subject_id || !topic_id || !duration_minutes) {
      setError('Subject, Topic, and Duration are required fields.');
      return;
    }

    const duration = parseInt(duration_minutes);
    if (isNaN(duration) || duration <= 0) {
      setError('Duration must be a positive number of minutes.');
      return;
    }

    setSubmitLoading(true);
    try {
      await axios.post('/api/study/log', {
        subject_id: parseInt(subject_id),
        topic_id: parseInt(topic_id),
        duration_minutes: duration,
        notes: notes,
        study_date: study_date
      });

      setSuccess('Study session logged successfully!');
      setFormData({
        subject_id: '',
        topic_id: '',
        duration_minutes: '',
        notes: '',
        study_date: new Date().toISOString().split('T')[0]
      });
      // Refresh statistics and logs list
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to log study session.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Find topics for selected subject
  const selectedSubject = subjects.find(sub => sub.subject_id === parseInt(formData.subject_id));
  const availableTopics = [];
  if (selectedSubject) {
    selectedSubject.units.forEach(unit => {
      unit.topics.forEach(topic => {
        availableTopics.push(topic);
      });
    });
  }

  // Calculate highest hours in trend for scaling the custom chart
  const maxTrendHours = stats.weekly_trend.length > 0 
    ? Math.max(...stats.weekly_trend.map(t => t.hours), 1) 
    : 1;

  if (loading && logs.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-sky-400">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Study Session Logger</h1>
        <p className="text-slate-400 mt-1">Log your subject study times and analyze weekly performance rates</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rounded-3xl p-6 shadow-md flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Today's Study</span>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{stats.daily_hours} hrs</h3>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6 shadow-md flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Weekly Study</span>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{stats.weekly_hours} hrs</h3>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6 shadow-md flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Monthly Study</span>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{stats.monthly_hours} hrs</h3>
          </div>
        </div>
      </div>

      {/* Main Grid: Form on Left, Chart on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Logging Form */}
        <div className="lg:col-span-2">
          <div className="glass-panel rounded-3xl p-6 shadow-lg h-full">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Plus className="h-5 w-5 text-sky-400" />
              Log New Session
            </h3>

            {error && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs text-rose-400">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs text-emerald-400">
                <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Subject Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Subject</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <select
                    name="subject_id"
                    required
                    value={formData.subject_id}
                    onChange={handleInputChange}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-sky-500 appearance-none"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(sub => (
                      <option key={sub.subject_id} value={sub.subject_id}>
                        {sub.subject_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Topic Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Topic</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <select
                    name="topic_id"
                    required
                    disabled={!formData.subject_id}
                    value={formData.topic_id}
                    onChange={handleInputChange}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-sky-500 appearance-none disabled:opacity-50"
                  >
                    <option value="">Select Topic</option>
                    {availableTopics.map(topic => (
                      <option key={topic.topic_id} value={topic.topic_id}>
                        {topic.topic_name} ({topic.difficulty_level})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Duration & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Duration (mins)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                      <Clock className="h-4 w-4" />
                    </span>
                    <input
                      type="number"
                      name="duration_minutes"
                      required
                      min="1"
                      value={formData.duration_minutes}
                      onChange={handleInputChange}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-sky-500"
                      placeholder="60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Date</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                      <Calendar className="h-4 w-4" />
                    </span>
                    <input
                      type="date"
                      name="study_date"
                      required
                      value={formData.study_date}
                      onChange={handleInputChange}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Session Notes</label>
                <div className="relative">
                  <span className="absolute top-3 left-4 text-slate-500">
                    <MessageSquare className="h-4 w-4" />
                  </span>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-sky-500 h-20 resize-none"
                    placeholder="Summarize what you learned..."
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-sm font-semibold text-white transition-all disabled:opacity-50"
              >
                {submitLoading ? 'Logging...' : 'Log Session'}
              </button>
            </form>
          </div>
        </div>

        {/* Weekly Trend Chart */}
        <div className="lg:col-span-3">
          <div className="glass-panel rounded-3xl p-6 shadow-lg flex flex-col justify-between h-full">
            <div>
              <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-sky-400" />
                Weekly Study Hours Trend
              </h3>
              <p className="text-slate-500 text-xs mb-6">Visual logs record over the last 7 active days</p>
            </div>

            {/* Custom Interactive HTML Bar Chart */}
            <div className="flex h-56 items-end justify-between px-4 pb-2 border-b border-slate-850">
              {stats.weekly_trend.map((t, idx) => {
                // Calculate height percentage relative to max hours recorded in the 7 days
                const pct = (t.hours / maxTrendHours) * 100;
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 group relative">
                    {/* Tooltip on Hover */}
                    <span className="absolute -top-10 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 bg-slate-900 border border-slate-800 text-[10px] text-sky-400 font-bold px-2 py-1 rounded-md transition-all shadow-lg pointer-events-none">
                      {t.hours} hrs
                    </span>
                    
                    {/* Bar */}
                    <div 
                      className="w-8 rounded-t-lg bg-gradient-to-t from-sky-600/30 to-sky-400 group-hover:from-sky-500 group-hover:to-indigo-500 transition-all duration-500 shadow-md group-hover:shadow-sky-500/20"
                      style={{ height: `${Math.max(pct, 5)}%` }}
                    ></div>
                    
                    {/* Label */}
                    <span className="text-[10px] text-slate-500 font-semibold mt-3 group-hover:text-slate-300">
                      {t.label}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>Oldest (7 days ago)</span>
              <span>Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* History logs */}
      <div className="glass-panel rounded-3xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <History className="h-5 w-5 text-sky-400" />
          Study Log History
        </h3>

        {logs.length === 0 ? (
          <p className="text-slate-500 text-sm italic py-4 text-center">No study sessions logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-850 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 pl-2">Date</th>
                  <th className="pb-3">Subject</th>
                  <th className="pb-3">Topic</th>
                  <th className="pb-3">Duration</th>
                  <th className="pb-3 pr-2">Session Notes</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-900/60">
                {logs.map((log) => (
                  <tr key={log.log_id} className="hover:bg-slate-900/20 transition-all">
                    <td className="py-4 pl-2 font-medium text-slate-300">
                      {new Date(log.study_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                    </td>
                    <td className="py-4 text-slate-200 font-medium">{log.subject_name}</td>
                    <td className="py-4">
                      <span className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-xs text-slate-400">
                        {log.topic_name}
                      </span>
                    </td>
                    <td className="py-4 text-sky-400 font-bold">{log.duration_minutes} mins</td>
                    <td className="py-4 pr-2 text-xs text-slate-400 max-w-xs truncate" title={log.notes}>
                      {log.notes || <span className="text-slate-600 italic">No notes</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
