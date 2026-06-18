import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Lightbulb, AlertCircle, RefreshCw, BookOpen, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Recommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/recommendations');
      setRecommendations(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load personalized recommendations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const getRecommendationCategory = (text) => {
    const textLower = text.toLowerCase();
    if (textLower.includes('quiz') || textLower.includes('score') || textLower.includes('revis')) {
      return {
        label: 'Revision Suggestion',
        icon: RefreshCw,
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        route: '/quizzes',
        routeLabel: 'Go to Quizzes'
      };
    }
    if (textLower.includes('inactivity') || textLower.includes('consecutive') || textLower.includes('haven\'t logged')) {
      return {
        label: 'Activity Alert',
        icon: AlertTriangle,
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        route: '/study-tracker',
        routeLabel: 'Log Study Session'
      };
    }
    return {
      label: 'Syllabus Focus',
      icon: BookOpen,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      route: '/subjects',
      routeLabel: 'View Syllabus'
    };
  };

  if (loading && recommendations.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-sky-400">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in space-y-8 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">AI Study Assistant</h1>
          <p className="text-slate-400 mt-1">Rule-based academic recommendations to optimize your study habits</p>
        </div>
        <button 
          onClick={fetchRecommendations}
          className="p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-all"
          title="Refresh Recommendations"
        >
          <RefreshCw className="h-5 w-5 text-sky-400" />
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {recommendations.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center shadow-xl">
          <Lightbulb className="h-12 w-12 text-sky-400 mx-auto mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-300">All Caught Up!</h3>
          <p className="text-slate-500 text-sm mt-1">
            Excellent! You have active study logs and high quiz scores. Keep up the consistent learning!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommendations.map((rec) => {
            const cat = getRecommendationCategory(rec.recommendation_text);
            const Icon = cat.icon;

            return (
              <div 
                key={rec.recommendation_id} 
                className="glass-panel rounded-3xl p-6 shadow-md border border-slate-800/80 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Category Header */}
                  <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${cat.color}`}>
                      <Icon className="h-4 w-4" />
                      {cat.label}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      {new Date(rec.generated_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                    </span>
                  </div>

                  {/* Recommendation Text */}
                  <p className="text-sm text-slate-300 font-medium leading-relaxed">
                    {rec.recommendation_text}
                  </p>
                </div>

                {/* Call to Action Button */}
                <div className="mt-6 pt-4 border-t border-slate-850 flex justify-end">
                  <Link 
                    to={cat.route} 
                    className="flex items-center gap-1 text-xs font-bold text-sky-400 hover:text-sky-300 transition-all hover:underline"
                  >
                    {cat.routeLabel}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default Recommendations;
