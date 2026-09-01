import React, { useState, useEffect } from 'react';
import { UserCircle, Mail, Phone, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth';
import { employeeApi } from '../../api/employees';
import { RoleBadge } from '../../components/common/Badge';
import { formatDate } from '../../utils/helpers';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await employeeApi.getMyProfile();
        setProfile(data);
      } catch {
        // Fallback to basic user data if no separate employee record
      }
    };
    fetchProfile();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setPwdMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setPwdLoading(true);
    try {
      await authApi.changePassword(oldPassword, newPassword);
      setPwdMsg({ type: 'success', text: 'Password changed successfully!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setPwdMsg({
        type: 'error',
        text: err.response?.data?.old_password?.[0] || err.response?.data?.detail || 'Failed to change password.'
      });
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <UserCircle className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          My Profile & Security
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          View your employment details and update your account credentials.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 backdrop-blur-xl shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-2xl font-bold text-white shadow-glow">
            {user?.first_name ? user.first_name[0] : (user?.email ? user.email[0].toUpperCase() : 'U')}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user?.full_name || user?.username}</h2>
              <RoleBadge role={user?.role} />
            </div>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
              {profile?.designation || 'Staff Member'} {profile?.department_name ? `• ${profile.department_name}` : ''}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
              Employee ID: {profile?.employee_id || 'N/A'}
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
            <span className="text-slate-500 dark:text-slate-400 block mb-1 font-medium">Work Email</span>
            <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              {user?.email}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
            <span className="text-slate-500 dark:text-slate-400 block mb-1 font-medium">Phone Number</span>
            <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              {profile?.phone || user?.phone_number || 'Not provided'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
            <span className="text-slate-500 dark:text-slate-400 block mb-1 font-medium">Date of Joining</span>
            <p className="font-semibold text-slate-900 dark:text-white">
              {formatDate(profile?.date_of_joining)}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
            <span className="text-slate-500 dark:text-slate-400 block mb-1 font-medium">Employment Type</span>
            <p className="font-semibold text-slate-900 dark:text-white">
              {profile?.employment_type ? profile.employment_type.replace('_', ' ') : 'Full Time'}
            </p>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 backdrop-blur-xl shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
          <Lock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          Update Password
        </h3>

        {pwdMsg.text && (
          <div
            className={`mb-4 flex items-center gap-2 rounded-xl p-3 text-xs border ${
              pwdMsg.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400'
            }`}
          >
            {pwdMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            <span>{pwdMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-400 mb-1">Current Password *</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-400 mb-1">New Password (min 6 chars) *</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-400 mb-1">Confirm New Password *</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={pwdLoading}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500 transition-all disabled:opacity-50"
          >
            {pwdLoading ? 'Updating Password...' : 'Save New Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
