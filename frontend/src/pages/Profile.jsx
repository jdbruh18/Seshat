import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, School, BookOpen, Layers, Briefcase, Lock, Save, AlertCircle, CheckCircle } from 'lucide-react';

export const Profile = () => {
  const { user, updateProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    password: '',
    institution: user?.student_details?.institution || '',
    course: user?.student_details?.course || '',
    semester: user?.student_details?.semester || '1',
    department: user?.teacher_details?.department || '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.full_name.trim()) {
      setError('Full Name is required.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        full_name: formData.full_name,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      if (user.role === 'student') {
        payload.institution = formData.institution;
        payload.course = formData.course;
        payload.semester = parseInt(formData.semester);
      } else if (user.role === 'teacher') {
        payload.department = formData.department;
      }

      await updateProfile(payload);
      setSuccess('Profile updated successfully.');
      setFormData((prev) => ({ ...prev, password: '' })); // clear password field
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Profile update failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">My Profile</h1>
        <p className="text-slate-400 mt-1">Manage your account information and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: Avatar Card */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col items-center text-center shadow-xl">
          <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-3xl text-white shadow-lg border border-slate-700/50 mb-4">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <h2 className="text-xl font-bold text-white">{user?.full_name}</h2>
          <p className="text-xs text-sky-400 uppercase tracking-widest font-bold mt-1">{user?.role}</p>
          
          <div className="w-full border-t border-slate-800/80 my-5 pt-4 text-left space-y-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">Email</span>
              <span className="text-sm text-slate-300 font-medium">{user?.email}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">Member Since</span>
              <span className="text-sm text-slate-300 font-medium">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Settings Form */}
        <div className="md:col-span-2">
          <div className="glass-panel rounded-3xl p-8 shadow-xl">
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

            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800/80 pb-3">Personal Details</h3>
              
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
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-sky-500 transition-all"
                  />
                </div>
              </div>

              {/* Student fields */}
              {user?.role === 'student' && (
                <div className="space-y-6">
                  {/* Institution */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Institution / College
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
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-sky-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Course & Semester Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Course
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
                          className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-sky-500 transition-all"
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
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-sky-500 transition-all appearance-none"
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

              {/* Teacher fields */}
              {user?.role === 'teacher' && (
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
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-sky-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800/80 pb-3 pt-4">Change Password</h3>
              
              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  New Password (leave blank to keep current)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
                    placeholder="Enter new password"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/10 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
