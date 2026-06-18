import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Trash2, Search, AlertCircle, RefreshCw, 
  ShieldCheck, ShieldAlert, UserCheck, AlertTriangle 
} from 'lucide-react';

export const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/auth/users');
      setUsers(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (targetId) => {
    try {
      setDeletingId(targetId);
      await axios.delete(`/api/auth/users/${targetId}`);
      // Remove from list
      setUsers(users.filter(u => u.user_id !== targetId));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeletingId(null);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'student':
        return (
          <span className="px-2.5 py-1 text-[10px] font-black tracking-wider uppercase bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-lg">
            Student
          </span>
        );
      case 'teacher':
        return (
          <span className="px-2.5 py-1 text-[10px] font-black tracking-wider uppercase bg-purple-500/10 border border-purple-500/25 text-purple-400 rounded-lg">
            Teacher
          </span>
        );
      case 'admin':
        return (
          <span className="px-2.5 py-1 text-[10px] font-black tracking-wider uppercase bg-amber-500/10 border border-amber-500/25 text-amber-400 rounded-lg">
            Admin
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-[10px] font-semibold bg-slate-800 text-slate-400 rounded-lg">
            {role}
          </span>
        );
    }
  };

  // Filter users based on search query and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in pb-16 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-sky-400" />
            Manage Platform Users
          </h1>
          <p className="text-slate-400 mt-1">Review accounts and delete profiles from the centralized registry</p>
        </div>
        
        <button 
          onClick={fetchUsers}
          className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-sky-400 rounded-xl transition-all self-start md:self-auto"
          title="Reload Directory"
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

      {/* Filters & Search Grid */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-3 h-5 w-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-900 border border-slate-850 focus:border-sky-500 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-all shadow-inner"
          />
        </div>

        {/* Role Select */}
        <div className="w-full sm:w-48 shrink-0">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-850 focus:border-sky-500 rounded-xl text-sm text-slate-300 focus:outline-none transition-all"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* Directory Table Card */}
      <div className="glass-panel rounded-3xl p-6 shadow-xl border border-slate-800/80 overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="py-12 flex justify-center text-sky-400">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-sky-500"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center">
            <UserCheck className="h-10 w-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm font-semibold">No matching accounts found</p>
            <p className="text-slate-600 text-xs mt-0.5">Adjust your filters or query term and try again.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="pb-3 pr-4">Full Name</th>
                  <th className="pb-3 px-4">Role</th>
                  <th className="pb-3 px-4">Affiliation / Description</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {filteredUsers.map((u) => {
                  const isSelf = currentUser?.user_id === u.user_id;

                  return (
                    <tr key={u.user_id} className="group hover:bg-slate-900/25 transition-all">
                      {/* Name & Email */}
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sky-400 border border-slate-750 shrink-0">
                            {u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <span className="text-sm font-bold text-white block">
                              {u.full_name} {isSelf && <span className="text-[10px] text-sky-400 ml-1 font-semibold italic">(You)</span>}
                            </span>
                            <span className="text-xs text-slate-500 font-medium block mt-0.5">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      
                      {/* Role Badge */}
                      <td className="py-4 px-4">
                        {getRoleBadge(u.role)}
                      </td>
                      
                      {/* Affiliation / Details */}
                      <td className="py-4 px-4 text-xs font-semibold text-slate-400">
                        {u.details}
                      </td>
                      
                      {/* Action Button */}
                      <td className="py-4 pl-4 text-right">
                        {isSelf ? (
                          <span className="text-xs text-slate-600 font-semibold italic mr-3">Owner Account</span>
                        ) : confirmDeleteId === u.user_id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Confirm?
                            </span>
                            <button
                              onClick={() => handleDeleteUser(u.user_id)}
                              disabled={deletingId === u.user_id}
                              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white rounded hover:bg-rose-500 transition-colors disabled:opacity-40"
                            >
                              {deletingId === u.user_id ? 'Deleting...' : 'Yes'}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 rounded hover:bg-slate-700 transition-colors"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(u.user_id)}
                            className="p-2 bg-slate-900 border border-slate-800/80 hover:border-rose-500/20 hover:text-rose-400 text-slate-400 rounded-xl transition-all shadow-inner"
                            title="Delete User Account"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
