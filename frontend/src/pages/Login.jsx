import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      const loggedUser = await login(email, password);
      // Redirect based on role unless a custom redirect path was specified
      if (redirectPath && redirectPath !== '/login' && redirectPath !== '/register') {
        navigate(redirectPath, { replace: true });
      } else {
        if (loggedUser.role === 'student') navigate('/student-dashboard');
        else if (loggedUser.role === 'teacher') navigate('/teacher-dashboard');
        else if (loggedUser.role === 'admin') navigate('/admin-dashboard');
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        'Login failed. Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 overflow-hidden">
      {/* Decorative Glow Elements */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>

      <div className="relative w-full max-w-md space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-xl shadow-sky-500/10 mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Welcome Back</h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to access your self-learning assistant
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-3xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  placeholder="name@institution.edu"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/10 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-sky-400 hover:text-sky-300 hover:underline transition-all">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};
