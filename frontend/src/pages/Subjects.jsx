import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, Plus, Trash2, ChevronDown, ChevronRight, CheckSquare, Square, 
  Clock, BarChart3, AlertCircle, X, Check, Save 
} from 'lucide-react';

export const Subjects = () => {
  const { user } = useAuth();
  const isStaff = user?.role === 'teacher' || user?.role === 'admin';

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Accordion open states
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [expandedUnits, setExpandedUnits] = useState({});

  // Modals / Form States
  const [activeModal, setActiveModal] = useState(null); // 'subject' | 'unit' | 'topic' | null
  const [modalTargetId, setModalTargetId] = useState(null); // subject_id or unit_id depending on context
  const [subjectForm, setSubjectForm] = useState({ subject_name: '', description: '' });
  const [unitForm, setUnitForm] = useState({ unit_name: '' });
  const [topicForm, setTopicForm] = useState({ 
    topic_name: '', description: '', estimated_hours: '1.0', difficulty_level: 'Medium' 
  });
  const [formLoading, setFormLoading] = useState(false);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/subjects');
      setSubjects(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch subjects. Please refresh page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const toggleSubject = (subId) => {
    setExpandedSubjects(prev => ({ ...prev, [subId]: !prev[subId] }));
  };

  const toggleUnit = (unitId) => {
    setExpandedUnits(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  // Student progress marking handler
  const handleProgressToggle = async (topicId, currentStatus) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      // Optimistic UI update
      setSubjects(prevSubjects => {
        return prevSubjects.map(sub => ({
          ...sub,
          units: sub.units.map(unit => ({
            ...unit,
            topics: unit.topics.map(topic => {
              if (topic.topic_id === topicId) {
                return { ...topic, status: nextStatus };
              }
              return topic;
            })
          }))
        }));
      });

      await axios.post(`/api/subjects/topics/${topicId}/progress`, { status: nextStatus });
    } catch (err) {
      console.error(err);
      // Revert UI on error
      fetchSubjects();
    }
  };

  // Create/Delete Handlers (Staff Only)
  const handleSubjectSubmit = async (e) => {
    e.preventDefault();
    if (!subjectForm.subject_name.trim()) return;
    setFormLoading(true);
    try {
      await axios.post('/api/subjects', subjectForm);
      setSubjectForm({ subject_name: '', description: '' });
      setActiveModal(null);
      fetchSubjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create subject.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUnitSubmit = async (e) => {
    e.preventDefault();
    if (!unitForm.unit_name.trim()) return;
    setFormLoading(true);
    try {
      await axios.post(`/api/subjects/${modalTargetId}/units`, unitForm);
      setUnitForm({ unit_name: '' });
      setActiveModal(null);
      fetchSubjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create unit.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleTopicSubmit = async (e) => {
    e.preventDefault();
    if (!topicForm.topic_name.trim()) return;
    setFormLoading(true);
    try {
      await axios.post(`/api/subjects/units/${modalTargetId}/topics`, topicForm);
      setTopicForm({ topic_name: '', description: '', estimated_hours: '1.0', difficulty_level: 'Medium' });
      setActiveModal(null);
      fetchSubjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create topic.');
    } finally {
      setFormLoading(false);
    }
  };

  const deleteSubject = async (subId) => {
    if (!window.confirm('Delete subject and all nested units and topics? This action is irreversible.')) return;
    try {
      await axios.delete(`/api/subjects/${subId}`);
      fetchSubjects();
    } catch (err) {
      setError('Failed to delete subject.');
    }
  };

  const deleteUnit = async (unitId) => {
    if (!window.confirm('Delete this unit and all its topics?')) return;
    try {
      await axios.delete(`/api/subjects/units/${unitId}`);
      fetchSubjects();
    } catch (err) {
      setError('Failed to delete unit.');
    }
  };

  const deleteTopic = async (topicId) => {
    if (!window.confirm('Delete this topic?')) return;
    try {
      await axios.delete(`/api/subjects/topics/${topicId}`);
      fetchSubjects();
    } catch (err) {
      setError('Failed to delete topic.');
    }
  };

  const getDifficultyBadge = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Medium': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Hard': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-400';
    }
  };

  if (loading && subjects.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-sky-400">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in relative min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Syllabus Curriculum</h1>
          <p className="text-slate-400 mt-1">
            {isStaff ? 'Design, structure and manage syllabus course details' : 'Explore subject syllabus and check off completed topics'}
          </p>
        </div>

        {isStaff && (
          <button
            onClick={() => setActiveModal('subject')}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/10 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Add Subject
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-rose-400 hover:text-rose-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {subjects.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center shadow-xl">
          <BookOpen className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-300">No Subjects Yet</h3>
          <p className="text-slate-500 text-sm mt-1">
            {isStaff ? 'Click the button above to create the first syllabus subject.' : 'Subjects will appear here once created by your teacher.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {subjects.map((sub) => {
            const isSubExpanded = !!expandedSubjects[sub.subject_id];
            
            // Calculate progress stats
            let totalTopics = 0;
            let completedTopics = 0;
            sub.units.forEach(u => {
              u.topics.forEach(t => {
                totalTopics++;
                if (t.status === 'completed') completedTopics++;
              });
            });
            const pct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

            return (
              <div key={sub.subject_id} className="glass-panel rounded-3xl overflow-hidden shadow-lg border border-slate-800/80">
                {/* Subject Accordion Header */}
                <div 
                  onClick={() => toggleSubject(sub.subject_id)}
                  className="p-6 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-900/30 transition-all select-none"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 text-sky-400">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-100">{sub.subject_name}</h2>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{sub.description || 'No description'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6" onClick={e => e.stopPropagation()}>
                    {/* Progress indicator */}
                    {!isStaff && totalTopics > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700/50">
                          <div className="bg-gradient-to-r from-sky-400 to-indigo-500 h-full transition-all duration-300" style={{ width: `${pct}%` }}></div>
                        </div>
                        <span className="text-xs font-semibold text-slate-400">{pct}%</span>
                      </div>
                    )}

                    {isStaff && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setModalTargetId(sub.subject_id);
                            setActiveModal('unit');
                          }}
                          className="p-2 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-lg transition-all"
                          title="Add Unit"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteSubject(sub.subject_id)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all"
                          title="Delete Subject"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    <div className="text-slate-400" onClick={() => toggleSubject(sub.subject_id)}>
                      {isSubExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </div>
                  </div>
                </div>

                {/* Subject Nested Units (Accordion body) */}
                {isSubExpanded && (
                  <div className="border-t border-slate-800/60 bg-slate-900/10 p-6 space-y-4">
                    {sub.units.length === 0 ? (
                      <p className="text-slate-500 text-sm italic py-2">No units defined under this subject.</p>
                    ) : (
                      sub.units.map((unit) => {
                        const isUnitExpanded = !!expandedUnits[unit.unit_id];
                        return (
                          <div key={unit.unit_id} className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-950/20">
                            {/* Unit Header */}
                            <div 
                              onClick={() => toggleUnit(unit.unit_id)}
                              className="px-5 py-4 flex items-center justify-between bg-slate-900/10 hover:bg-slate-900/20 cursor-pointer select-none"
                            >
                              <span className="text-sm font-bold text-slate-200">{unit.unit_name}</span>
                              
                              <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                                {isStaff && (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => {
                                        setModalTargetId(unit.unit_id);
                                        setActiveModal('topic');
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-md transition-all"
                                      title="Add Topic"
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => deleteUnit(unit.unit_id)}
                                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-all"
                                      title="Delete Unit"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )}
                                <div className="text-slate-500" onClick={() => toggleUnit(unit.unit_id)}>
                                  {isUnitExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </div>
                              </div>
                            </div>

                            {/* Unit Nested Topics */}
                            {isUnitExpanded && (
                              <div className="border-t border-slate-800/60 p-4 space-y-3 bg-slate-950/45">
                                {unit.topics.length === 0 ? (
                                  <p className="text-slate-500 text-xs italic">No topics defined under this unit.</p>
                                ) : (
                                  unit.topics.map((topic) => (
                                    <div 
                                      key={topic.topic_id} 
                                      className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-900/30 border border-slate-800/40 hover:border-slate-800 transition-all"
                                    >
                                      <div className="flex items-start gap-3">
                                        {/* Status Checkbox for Students */}
                                        {!isStaff && (
                                          <button
                                            onClick={() => handleProgressToggle(topic.topic_id, topic.status)}
                                            className="mt-1 text-slate-400 hover:text-sky-400 transition-all focus:outline-none"
                                          >
                                            {topic.status === 'completed' ? (
                                              <CheckSquare className="h-5 w-5 text-sky-400 fill-sky-500/10" />
                                            ) : (
                                              <Square className="h-5 w-5 text-slate-600" />
                                            )}
                                          </button>
                                        )}

                                        <div>
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className={`text-sm font-semibold text-slate-200 ${topic.status === 'completed' && !isStaff ? 'line-through text-slate-500' : ''}`}>
                                              {topic.topic_name}
                                            </h4>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${getDifficultyBadge(topic.difficulty_level)}`}>
                                              {topic.difficulty_level}
                                            </span>
                                          </div>
                                          <p className="text-xs text-slate-400 mt-1">{topic.description || 'No description.'}</p>
                                          
                                          <div className="flex items-center gap-3 mt-2 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                                            <span className="flex items-center gap-1">
                                              <Clock className="h-3.5 w-3.5" />
                                              {topic.estimated_hours} Hours
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {isStaff && (
                                        <button
                                          onClick={() => deleteTopic(topic.topic_id)}
                                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-md transition-all self-center"
                                          title="Delete Topic"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Subject Modal */}
      {activeModal === 'subject' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Create New Subject</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubjectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Subject Name</label>
                <input
                  type="text"
                  required
                  value={subjectForm.subject_name}
                  onChange={e => setSubjectForm(prev => ({ ...prev, subject_name: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-sky-500"
                  placeholder="e.g. Artificial Intelligence"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={subjectForm.description}
                  onChange={e => setSubjectForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-sky-500 h-24 resize-none"
                  placeholder="Brief summary of the subject contents..."
                />
              </div>
              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-sm font-semibold text-white transition-all disabled:opacity-50"
              >
                {formLoading ? 'Creating...' : 'Create Subject'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Unit Modal */}
      {activeModal === 'unit' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Create New Unit</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUnitSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Unit Title</label>
                <input
                  type="text"
                  required
                  value={unitForm.unit_name}
                  onChange={e => setUnitForm({ unit_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-sky-500"
                  placeholder="e.g. Unit 1: Foundations of Machine Learning"
                />
              </div>
              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-sm font-semibold text-white transition-all disabled:opacity-50"
              >
                {formLoading ? 'Creating...' : 'Create Unit'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Topic Modal */}
      {activeModal === 'topic' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Create New Topic</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleTopicSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Topic Name</label>
                <input
                  type="text"
                  required
                  value={topicForm.topic_name}
                  onChange={e => setTopicForm(prev => ({ ...prev, topic_name: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-sky-500"
                  placeholder="e.g. Support Vector Machines"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={topicForm.description}
                  onChange={e => setTopicForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-sky-500 h-20 resize-none"
                  placeholder="Short description of this topic..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Estimated Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={topicForm.estimated_hours}
                    onChange={e => setTopicForm(prev => ({ ...prev, estimated_hours: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Difficulty</label>
                  <select
                    value={topicForm.difficulty_level}
                    onChange={e => setTopicForm(prev => ({ ...prev, difficulty_level: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-sm font-semibold text-white transition-all disabled:opacity-50"
              >
                {formLoading ? 'Creating...' : 'Create Topic'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
