import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Mail, Lock, User, School, BookOpen, Layers, Briefcase, AlertCircle, CheckCircle } from 'lucide-react';

export const Register = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'student',
    institution: '',
    course: '',
    semester: '1',
    department: '',
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const { full_name, email, password, role, institution, course, semester, department } = formData;

    // Local Validation
    if (!full_name.trim() || !email.trim() || !password) {
      setError('Please fill in all basic fields.');
      setLoading(false);
      return;
    }

    if (role === 'student') {
      if (!institution.trim() || !course.trim()) {
        setError('Students must enter institution and course details.');
        setLoading(false);
        return;
      }
    } else if (role === 'teacher') {
      if (!department.trim()) {
        setError('Teachers must enter their department.');
        setLoading(false);
        return;
      }
    }

    try {
      // Build register payload
      const payload = {
        full_name,
        email,
        password,
        role,
      };

      if (role === 'student') {
        payload.institution = institution;
        payload.course = course;
        payload.semester = parseInt(semester);
      } else if (role === 'teacher') {
        payload.department = department;
      }

      await register(payload);
      setSuccess('Account registered successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        'Registration failed. Please review the inputs and try again.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>

      <div className="relative w-full max-w-lg space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-xl shadow-sky-500/10 mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Create Account</h2>
          <p className="mt-2 text-sm text-slate-400">
            Join the StudyAI academic assistant program
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-panel rounded-3xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-400">
              <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Roles Tab Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Registering As
              </label>
              <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
                {['student', 'teacher', 'admin'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, role }))}
                    className={`py-2 text-xs font-semibold rounded-lg capitalize transition-all duration-200 ${
                      formData.role === role
                        ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                  <User className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

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
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  placeholder="john@institution.edu"
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
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  placeholder="Min 6 chars, letters & numbers"
                />
              </div>
            </div>

            {/* Role Specific Fields */}
            {formData.role === 'student' && (
              <div className="space-y-4 pt-2 border-t border-slate-900">
                {/* Institution */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Institution / University
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                      <School className="h-5 w-5" />
                    </span>
                    <input
                      type="text"
                      name="institution"
                      required
                      value={formData.institution}
                      onChange={handleInputChange}
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                      placeholder="University of Science"
                    />
                  </div>
                </div>

                {/* Course & Semester Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Course / Degree
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                        <BookOpen className="h-5 w-5" />
                      </span>
                      <input
                        type="text"
                        name="course"
                        required
                        value={formData.course}
                        onChange={handleInputChange}
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                        placeholder="MCA AI & ML"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Semester
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                        <Layers className="h-5 w-5" />
                      </span>
                      <select
                        name="semester"
                        value={formData.semester}
                        onChange={handleInputChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all appearance-none"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                          <option key={sem} value={sem}>
                            Semester {sem}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {formData.role === 'teacher' && (
              <div className="space-y-4 pt-2 border-t border-slate-900">
                {/* Department */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Department
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                      <Briefcase className="h-5 w-5" />
                    </span>
                    <input
                      type="text"
                      name="department"
                      required
                      value={formData.department}
                      onChange={handleInputChange}
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                      placeholder="Computer Science & Engineering"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex justify-center rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/10 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <span>Register Account</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-sky-400 hover:text-sky-300 hover:underline transition-all">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
