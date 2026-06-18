import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Sparkles, 
  Moon, 
  Sun, 
  Activity, 
  Compass, 
  BookOpen,
  Info,
  Clock,
  Compass as BearIcon, // We'll map to compass or custom icons
  HelpCircle,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export const StarChart = () => {
  const [rhythmData, setRhythmData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedConstellation, setSelectedConstellation] = useState(null);

  useEffect(() => {
    const fetchCosmicRhythm = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/cosmic/rhythm');
        setRhythmData(response.data);
        if (response.data.constellations && response.data.constellations.length > 0) {
          setSelectedConstellation(response.data.constellations[0]);
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to load cosmic study stats.');
      } finally {
        setLoading(false);
      }
    };

    fetchCosmicRhythm();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
          <p className="text-slate-400 text-sm animate-pulse">Consulting the academic skies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl bg-rose-500/10 border border-rose-500/20 p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-rose-400 mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Celestial System Error</h3>
        <p className="text-slate-400 text-sm mb-4">{error}</p>
      </div>
    );
  }

  // Get Chronotype icon and style
  const getChronotypeStyles = (key) => {
    switch (key) {
      case 'morning_lark':
        return {
          icon: Sun,
          color: 'text-amber-400',
          bg: 'bg-amber-400/10 border-amber-400/20',
          glow: 'shadow-amber-400/10'
        };
      case 'golden_bear':
        return {
          icon: BearIcon,
          color: 'text-yellow-500',
          bg: 'bg-yellow-500/10 border-yellow-500/20',
          glow: 'shadow-yellow-500/10'
        };
      case 'night_owl':
        return {
          icon: Moon,
          color: 'text-indigo-400',
          bg: 'bg-indigo-400/10 border-indigo-400/20',
          glow: 'shadow-indigo-400/10'
        };
      case 'midnight_nebula':
        return {
          icon: Sparkles,
          color: 'text-purple-400',
          bg: 'bg-purple-400/10 border-purple-400/20',
          glow: 'shadow-purple-400/10'
        };
      default:
        return {
          icon: HelpCircle,
          color: 'text-slate-400',
          bg: 'bg-slate-400/10 border-slate-400/20',
          glow: 'shadow-slate-400/10'
        };
    }
  };

  const cStyle = getChronotypeStyles(rhythmData.chronotype_key);
  const ChronoIcon = cStyle.icon;

  // Background stars for the SVG Constellation night sky
  const bgStars = [
    { x: 12, y: 15, r: 0.5, op: 0.3 },
    { x: 85, y: 25, r: 0.7, op: 0.6 },
    { x: 45, y: 12, r: 0.4, op: 0.4 },
    { x: 92, y: 68, r: 0.6, op: 0.5 },
    { x: 18, y: 72, r: 0.5, op: 0.3 },
    { x: 28, y: 88, r: 0.8, op: 0.7 },
    { x: 74, y: 84, r: 0.4, op: 0.3 },
    { x: 62, y: 16, r: 0.6, op: 0.5 },
    { x: 95, y: 10, r: 0.5, op: 0.4 },
    { x: 5, y: 45, r: 0.7, op: 0.6 },
  ];

  return (
    <div className="space-y-8 animate-fade-in p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-sky-400 animate-pulse" />
            Cosmic Rhythm & Star Map
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Grounding academic progress in chronobiology and astronomical constellation tracking.
          </p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Circadian Rhythms & Insights (5 columns) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Chronotype Profile Card */}
          <div className={`glass-panel p-6 rounded-3xl border shadow-xl ${cStyle.bg} flex items-start gap-5`}>
            <div className={`p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md ${cStyle.color}`}>
              <ChronoIcon className="h-8 w-8" />
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-slate-400">Circadian Archetype</span>
              <h2 className="text-2xl font-bold text-white mt-1">{rhythmData.chronotype}</h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{rhythmData.chronotype_description}</p>
            </div>
          </div>

          {/* Hourly Study Distribution Bar Chart */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-850 shadow-xl space-y-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-sky-400" />
              <h3 className="text-lg font-bold text-white">Daily Cognitive Rhythms</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              This chart logs your study sessions and quiz attempts over the 24-hour cycle. The gold bar indicates your peak learning hour block.
            </p>
            
            {/* Custom SVG Bar Chart */}
            <div className="flex items-end justify-between h-44 gap-1.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-900">
              {rhythmData.hourly_distribution.map((count, hr) => {
                const maxCount = Math.max(...rhythmData.hourly_distribution, 1);
                const heightPercent = (count / maxCount) * 100;
                const isPeak = count === Math.max(...rhythmData.hourly_distribution) && count > 0;
                
                return (
                  <div key={hr} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 bg-slate-950 border border-slate-800 text-[10px] text-slate-200 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                      {count} activity log{count !== 1 ? 's' : ''} at {hr}:00
                    </div>
                    {/* Bar */}
                    <div 
                      style={{ height: `${heightPercent || 6}%` }} // Minimal height for visibility
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        isPeak 
                          ? 'bg-gradient-to-t from-amber-500 to-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]' 
                          : count > 0 
                            ? 'bg-gradient-to-t from-sky-500 to-indigo-600' 
                            : 'bg-slate-900/30'
                      }`}
                    ></div>
                    {/* Hourly Labels */}
                    <span className="text-[9px] text-slate-500 mt-2 font-mono">
                      {hr % 6 === 0 ? `${hr}h` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scientific Cognitive Insight Card */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-850 shadow-xl bg-slate-950/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 bg-sky-500/5 rounded-full blur-2xl"></div>
            <div className="flex items-center gap-3 mb-4">
              <Activity className="h-5 w-5 text-sky-400" />
              <h3 className="text-lg font-bold text-white">Weekly Focus Insight</h3>
            </div>
            <div className="text-slate-300 text-sm leading-relaxed bg-slate-900/40 p-4 rounded-2xl border border-slate-850 border-dashed"
                 dangerouslySetInnerHTML={{ __html: rhythmData.scientific_insight.replace(/\*\*(.*?)\*\*/g, '<strong class="text-sky-400">$1</strong>') }}>
            </div>
          </div>
        </div>

        {/* Right Side: Astronomical Star Map (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Tab selectors for Constellations / Subjects */}
          <div className="flex flex-wrap gap-2 bg-slate-950/40 p-2 rounded-2xl border border-slate-900">
            {rhythmData.constellations.map((c) => (
              <button
                key={c.subject_id}
                onClick={() => setSelectedConstellation(c)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 ${
                  selectedConstellation?.subject_id === c.subject_id
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/10'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                {c.subject_name}
              </button>
            ))}
          </div>

          {/* Constellation Viewer Board */}
          {selectedConstellation && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-850 shadow-2xl flex flex-col gap-6">
              
              {/* Constellation Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-sky-400">Constellation Target</span>
                  <h3 className="text-xl font-bold text-white mt-1">{selectedConstellation.constellation_name}</h3>
                </div>
                {selectedConstellation.is_completed ? (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-bold animate-pulse">
                    <Sparkles className="h-3.5 w-3.5" />
                    Constellation Restored
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-850 text-xs text-slate-400 font-medium">
                    <Clock className="h-3.5 w-3.5" />
                    Aligning Stars...
                  </div>
                )}
              </div>

              {/* Star Map Viewport */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-900 shadow-inner">
                {selectedConstellation.stars.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80">
                    <p className="text-slate-500 text-sm">Add topics to this subject to generate stars.</p>
                  </div>
                ) : (
                  <svg 
                    viewBox="0 0 100 100" 
                    className="w-full h-full select-none"
                  >
                    <defs>
                      <linearGradient id="sky-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#020617" />
                        <stop offset="60%" stopColor="#0b0f19" />
                        <stop offset="100%" stopColor="#1e1b4b" />
                      </linearGradient>
                    </defs>

                    {/* Sky Background */}
                    <rect width="100" height="100" fill="url(#sky-gradient)" />

                    {/* Twinkling background stars */}
                    {bgStars.map((s, idx) => (
                      <circle 
                        key={`bg-${idx}`}
                        cx={s.x}
                        cy={s.y}
                        r={s.r}
                        fill="#fff"
                        opacity={s.op}
                        className="animate-pulse"
                      />
                    ))}

                    {/* Constellation Connection Lines */}
                    {selectedConstellation.connections.map(([a, b], idx) => {
                      const starA = selectedConstellation.stars[a];
                      const starB = selectedConstellation.stars[b];
                      if (!starA || !starB) return null;
                      const isLit = starA.is_completed && starB.is_completed;
                      
                      return (
                        <line 
                          key={`line-${idx}`}
                          x1={starA.x}
                          y1={starA.y}
                          x2={starB.x}
                          y2={starB.y}
                          stroke={isLit ? '#f59e0b' : 'rgba(255, 255, 255, 0.08)'}
                          strokeWidth={isLit ? '1.2' : '0.5'}
                          className={isLit ? 'animate-pulse' : ''}
                        />
                      );
                    })}

                    {/* Constellation Stars (Nodes) */}
                    {selectedConstellation.stars.map((star, idx) => (
                      <g key={`star-${idx}`} className="cursor-pointer group">
                        {/* Ping outer halo for completed stars */}
                        {star.is_completed && (
                          <circle 
                            cx={star.x}
                            cy={star.y}
                            r="2.5"
                            fill="#f59e0b"
                            className="animate-ping opacity-25"
                          />
                        )}
                        {/* Star Circle */}
                        <circle 
                          cx={star.x}
                          cy={star.y}
                          r={star.is_completed ? '1.5' : '1.0'}
                          fill={star.is_completed ? '#f59e0b' : '#334155'}
                          stroke={star.is_completed ? '#ffffff' : '#0f172a'}
                          strokeWidth="0.3"
                        />
                        {/* Topic Label */}
                        <text
                          x={star.x}
                          y={star.y - 3.5}
                          textAnchor="middle"
                          fontSize="2.0"
                          fill={star.is_completed ? '#f8fafc' : '#64748b'}
                          className="opacity-60 group-hover:opacity-100 font-medium transition-all select-none"
                        >
                          {star.star_name}
                        </text>
                      </g>
                    ))}
                  </svg>
                )}
              </div>

              {/* Constellation Facts & Details Card */}
              <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl flex gap-4">
                <Info className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Stellar History & Facts</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{selectedConstellation.facts}</p>
                </div>
              </div>

              {/* Stars Completion Progression Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl text-center">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Shining Stars</span>
                  <div className="text-2xl font-black text-white mt-1">
                    {selectedConstellation.stars.filter(s => s.is_completed).length} / {selectedConstellation.stars.length}
                  </div>
                </div>
                <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl text-center">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-semibold">Syllabus Completion</span>
                  <div className="text-2xl font-black text-white mt-1">
                    {selectedConstellation.stars.length > 0 
                      ? `${Math.round((selectedConstellation.stars.filter(s => s.is_completed).length / selectedConstellation.stars.length) * 100)}%` 
                      : '0%'}
                  </div>
                </div>
              </div>

            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};
