import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Award, Plus, ChevronRight, X, AlertCircle, CheckCircle, 
  HelpCircle, History, Play, Trash2, Calendar, FileText, Check, AlertTriangle 
} from 'lucide-react';

export const Quizzes = () => {
  const { user } = useAuth();
  const isStaff = user?.role === 'teacher' || user?.role === 'admin';

  const [quizzes, setQuizzes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [stats, setStats] = useState({ quiz_average: 0, total_attempts: 0, attempts_history: [] });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Active Quiz Playing State
  const [activeQuiz, setActiveQuiz] = useState(null); // quiz object or null
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // {question_id: 'A'}
  const [quizResult, setQuizResult] = useState(null); // attempt result payload or null
  const [isPlaying, setIsPlaying] = useState(false);

  // Modals / Form States
  const [activeModal, setActiveModal] = useState(null); // 'quiz' | 'question' | 'review' | null
  const [modalTargetId, setModalTargetId] = useState(null); // quiz_id
  const [reviewPayload, setReviewPayload] = useState(null); // review attempt details
  
  const [quizForm, setQuizForm] = useState({ subject_id: '', title: '', difficulty: 'Medium' });
  const [questionForm, setQuestionForm] = useState({
    question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A'
  });
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [quizRes, subRes] = await Promise.all([
        axios.get('/api/quizzes'),
        axios.get('/api/subjects')
      ]);
      setQuizzes(quizRes.data);
      setSubjects(subRes.data);

      if (!isStaff) {
        const [attRes, statsRes] = await Promise.all([
          axios.get('/api/quizzes/attempts'),
          axios.get('/api/quizzes/attempts/stats')
        ]);
        setAttempts(attRes.data);
        setStats(statsRes.data);
      }
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch quizzes. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Play Quiz Handlers
  const startQuiz = async (quizId) => {
    try {
      setError('');
      const response = await axios.get(`/api/quizzes/${quizId}`);
      setActiveQuiz(response.data);
      setCurrentQuestionIdx(0);
      setSelectedAnswers({});
      setQuizResult(null);
      setIsPlaying(true);
    } catch (err) {
      setError('Failed to start quiz. Check connections.');
    }
  };

  const handleOptionSelect = (questionId, option) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const nextQuestion = () => {
    if (currentQuestionIdx < activeQuiz.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(prev => prev - 1);
    }
  };

  const submitQuiz = async () => {
    setFormLoading(true);
    try {
      const response = await axios.post(`/api/quizzes/${activeQuiz.quiz_id}/attempt`, {
        answers: selectedAnswers
      });
      setQuizResult(response.data);
      setIsPlaying(false);
      fetchData(); // refresh list & scores
    } catch (err) {
      setError('Failed to submit quiz. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  // Create Quiz / Question Handlers (Staff Only)
  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    if (!quizForm.subject_id || !quizForm.title.trim()) return;
    setFormLoading(true);
    try {
      await axios.post('/api/quizzes', {
        subject_id: parseInt(quizForm.subject_id),
        title: quizForm.title,
        difficulty: quizForm.difficulty
      });
      setQuizForm({ subject_id: '', title: '', difficulty: 'Medium' });
      setActiveModal(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create quiz.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    const { question_text, option_a, option_b, option_c, option_d, correct_answer } = questionForm;
    if (!question_text.trim() || !option_a.trim() || !option_b.trim() || !option_c.trim() || !option_d.trim()) return;
    setFormLoading(true);
    try {
      await axios.post(`/api/quizzes/${modalTargetId}/questions`, questionForm);
      setQuestionForm({
        question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A'
      });
      setActiveModal(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add question.');
    } finally {
      setFormLoading(false);
    }
  };

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'Easy': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Hard': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  // Standard Quiz Playing Screen
  if (isPlaying && activeQuiz) {
    const question = activeQuiz.questions[currentQuestionIdx];
    const totalQuestions = activeQuiz.questions.length;
    const progressPct = ((currentQuestionIdx + 1) / totalQuestions) * 100;
    const currentAnswer = selectedAnswers[question.question_id] || '';

    return (
      <div className="p-8 max-w-3xl mx-auto animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
          <div>
            <span className="text-xs uppercase tracking-widest text-sky-400 font-bold">{activeQuiz.difficulty} Difficulty</span>
            <h2 className="text-xl font-bold text-white mt-0.5">{activeQuiz.title}</h2>
          </div>
          <button 
            onClick={() => {
              if (window.confirm("Exit quiz? Your progress will be lost.")) {
                setIsPlaying(false);
                setActiveQuiz(null);
              }
            }} 
            className="p-2 text-slate-500 hover:text-slate-300 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Question {currentQuestionIdx + 1} of {totalQuestions}</span>
            <span>{Math.round(progressPct)}% Complete</span>
          </div>
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 transition-all duration-300" style={{ width: `${progressPct}%` }}></div>
          </div>
        </div>

        {/* Question Panel */}
        <div className="glass-panel rounded-3xl p-8 shadow-xl space-y-6">
          <div className="flex items-start gap-4">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold border border-sky-500/20">
              Q{currentQuestionIdx + 1}
            </div>
            <h3 className="text-lg font-bold text-white mt-1 leading-snug">{question.question_text}</h3>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {[
              { key: 'A', text: question.option_a },
              { key: 'B', text: question.option_b },
              { key: 'C', text: question.option_c },
              { key: 'D', text: question.option_d }
            ].map((opt) => {
              const isSelected = currentAnswer === opt.key;
              return (
                <div
                  key={opt.key}
                  onClick={() => handleOptionSelect(question.question_id, opt.key)}
                  className={`
                    p-5 rounded-2xl cursor-pointer border text-left transition-all duration-200 select-none
                    ${isSelected 
                      ? 'bg-gradient-to-r from-sky-500/15 to-indigo-500/5 border-sky-500 shadow-md shadow-sky-500/10' 
                      : 'bg-slate-900/40 border-slate-800 hover:bg-slate-900 hover:border-slate-700'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold border
                      ${isSelected ? 'bg-sky-500 border-sky-500 text-white' : 'border-slate-700 text-slate-500'}
                    `}>
                      {opt.key}
                    </div>
                    <span className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>{opt.text}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center gap-4">
          <button
            onClick={prevQuestion}
            disabled={currentQuestionIdx === 0}
            className="px-6 py-3 rounded-xl border border-slate-800 text-slate-300 font-semibold hover:bg-slate-900 disabled:opacity-30 disabled:hover:bg-transparent transition-all text-sm"
          >
            Previous
          </button>

          {currentQuestionIdx === totalQuestions - 1 ? (
            <button
              onClick={submitQuiz}
              disabled={formLoading}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 font-semibold text-white shadow-lg transition-all text-sm disabled:opacity-50"
            >
              {formLoading ? 'Submitting...' : 'Submit Quiz'}
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className="px-8 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-semibold hover:border-slate-700 hover:bg-slate-850 transition-all text-sm"
            >
              Next
            </button>
          )}
        </div>
      </div>
    );
  }

  // Quiz Attempt Summary Screen
  if (quizResult) {
    const passed = quizResult.score >= 50.0;
    return (
      <div className="p-8 max-w-2xl mx-auto animate-fade-in space-y-6 text-center">
        <div className="glass-panel rounded-3xl p-8 shadow-xl space-y-6">
          <div className="flex justify-center">
            <div className={`h-20 w-20 rounded-full flex items-center justify-center shadow-lg border ${
              passed ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              <Award className="h-10 w-10" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-white">Quiz Attempt Completed</h2>
            <p className="text-slate-400 text-sm mt-1">process scheduling basics evaluation results</p>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-900">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Score</span>
              <span className={`text-3xl font-black ${passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                {quizResult.score}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Correct</span>
              <span className="text-3xl font-black text-slate-300">
                {quizResult.correct_count} / {quizResult.total_questions}
              </span>
            </div>
          </div>

          {/* Quick Review details */}
          <div className="text-left space-y-4 max-h-60 overflow-y-auto pr-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Question Breakdown</h4>
            {quizResult.review.map((rev, idx) => (
              <div key={idx} className="p-3 bg-slate-900/30 border border-slate-900 rounded-xl flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-300 font-semibold">{rev.question_text}</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Your answer: <span className={rev.is_correct ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{rev.selected_option || 'None'}</span> 
                    {!rev.is_correct && ` (Correct: ${rev.correct_option})`}
                  </p>
                </div>
                {rev.is_correct ? (
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <X className="h-4.5 w-4.5 text-rose-400 shrink-0 mt-0.5" />
                )}
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={() => setQuizResult(null)}
              className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-semibold hover:bg-slate-850 hover:border-slate-700 transition-all text-sm w-full"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in space-y-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Practice Quizzes</h1>
          <p className="text-slate-400 mt-1">
            {isStaff ? 'Create multiple choice quizzes and questions' : 'Attempt subject-wise quizzes and track performance metrics'}
          </p>
        </div>

        {isStaff && (
          <button
            onClick={() => setActiveModal('quiz')}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Quiz
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Student Metrics */}
      {!isStaff && attempts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel rounded-3xl p-6 shadow-md flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Average score</span>
              <h3 className="text-2xl font-extrabold text-white mt-0.5">{stats.quiz_average}%</h3>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6 shadow-md flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <History className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Total Attempts</span>
              <h3 className="text-2xl font-extrabold text-white mt-0.5">{stats.total_attempts} attempts</h3>
            </div>
          </div>
        </div>
      )}

      {/* Main Quizzes List */}
      <div className="glass-panel rounded-3xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-6">Available Quizzes</h3>
        
        {quizzes.length === 0 ? (
          <p className="text-slate-500 text-sm py-4 text-center italic">No quizzes created yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quizzes.map((quiz) => (
              <div 
                key={quiz.quiz_id} 
                className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/80 hover:border-slate-800 hover:bg-slate-900/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {quiz.subject_name}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getDifficultyColor(quiz.difficulty)}`}>
                      {quiz.difficulty}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white">{quiz.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{quiz.total_questions} Questions total</p>
                </div>

                <div className="mt-6 border-t border-slate-850 pt-4 flex items-center justify-between gap-4">
                  {/* Student Scores */}
                  {!isStaff && (
                    <div className="text-xs">
                      {quiz.attempted ? (
                        <span className="text-emerald-400 font-semibold">Best Score: {quiz.best_score}%</span>
                      ) : (
                        <span className="text-slate-500 italic">Not attempted</span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {isStaff ? (
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={() => {
                          setModalTargetId(quiz.quiz_id);
                          setActiveModal('question');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500 hover:text-white transition-all text-xs font-semibold"
                      >
                        Add Question
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startQuiz(quiz.quiz_id)}
                      disabled={quiz.total_questions === 0}
                      className="flex items-center gap-1 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-xs font-bold text-white shadow-md transition-all ml-auto disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Play className="h-3 w-3 fill-white" />
                      Take Quiz
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student History logs list */}
      {!isStaff && attempts.length > 0 && (
        <div className="glass-panel rounded-3xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <History className="h-5 w-5 text-sky-400" />
            Quiz Performance History
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-850 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 pl-2">Date</th>
                  <th className="pb-3">Subject</th>
                  <th className="pb-3">Quiz Title</th>
                  <th className="pb-3 pr-2 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-900/60">
                {attempts.map((att) => {
                  const passed = att.score >= 50.0;
                  return (
                    <tr key={att.attempt_id} className="hover:bg-slate-900/20 transition-all">
                      <td className="py-4 pl-2 text-slate-400">
                        {new Date(att.attempt_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                      </td>
                      <td className="py-4 font-semibold text-slate-300">{att.subject_name}</td>
                      <td className="py-4 text-slate-200">{att.quiz_title}</td>
                      <td className={`py-4 pr-2 text-right font-bold ${passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {att.score}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Quiz Modal */}
      {activeModal === 'quiz' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Create New Practice Quiz</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleQuizSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Subject</label>
                <select
                  required
                  value={quizForm.subject_id}
                  onChange={e => setQuizForm(prev => ({ ...prev, subject_id: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="">Select Subject</option>
                  {subjects.map(sub => (
                    <option key={sub.subject_id} value={sub.subject_id}>{sub.subject_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Quiz Title</label>
                <input
                  type="text"
                  required
                  value={quizForm.title}
                  onChange={e => setQuizForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-sky-500"
                  placeholder="e.g. Memory Management MCQ"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Difficulty</label>
                <select
                  value={quizForm.difficulty}
                  onChange={e => setQuizForm(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-sm font-semibold text-white transition-all disabled:opacity-50"
              >
                {formLoading ? 'Creating...' : 'Create Quiz'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {activeModal === 'question' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Add Question to Quiz</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleQuestionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Question Text</label>
                <textarea
                  required
                  value={questionForm.question_text}
                  onChange={e => setQuestionForm(prev => ({ ...prev, question_text: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-sky-500 h-20 resize-none"
                  placeholder="Type multiple choice question here..."
                />
              </div>

              {/* Options A & B */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Option A</label>
                  <input
                    type="text"
                    required
                    value={questionForm.option_a}
                    onChange={e => setQuestionForm(prev => ({ ...prev, option_a: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-sky-500"
                    placeholder="Option A text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Option B</label>
                  <input
                    type="text"
                    required
                    value={questionForm.option_b}
                    onChange={e => setQuestionForm(prev => ({ ...prev, option_b: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-sky-500"
                    placeholder="Option B text"
                  />
                </div>
              </div>

              {/* Options C & D */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Option C</label>
                  <input
                    type="text"
                    required
                    value={questionForm.option_c}
                    onChange={e => setQuestionForm(prev => ({ ...prev, option_c: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-sky-500"
                    placeholder="Option C text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Option D</label>
                  <input
                    type="text"
                    required
                    value={questionForm.option_d}
                    onChange={e => setQuestionForm(prev => ({ ...prev, option_d: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-sky-500"
                    placeholder="Option D text"
                  />
                </div>
              </div>

              {/* Correct Answer */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Correct Option</label>
                <select
                  value={questionForm.correct_answer}
                  onChange={e => setQuestionForm(prev => ({ ...prev, correct_answer: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-sm font-semibold text-white transition-all disabled:opacity-50"
              >
                {formLoading ? 'Adding...' : 'Add Question'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
