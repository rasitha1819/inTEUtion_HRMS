import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('Password@123');
    setError('');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-200">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle theme"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/40 transition-all duration-200 shadow-sm"
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-90" />
          ) : (
            <Moon className="h-4 w-4 text-indigo-600 transition-transform duration-300 rotate-0 hover:-rotate-12" />
          )}
        </button>
      </div>

      {/* Dynamic Background Glow Elements */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-500/15 dark:bg-indigo-600/20 blur-[128px]" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-purple-500/15 dark:bg-purple-600/20 blur-[128px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-sky-500/10 blur-[140px]" />

      <div className="relative w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 shadow-glow mb-4">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Welcome to HRMS <span className="text-indigo-600 dark:text-indigo-400">PRO</span>
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Attendance Tracking & Enterprise Human Resources
          </p>
        </div>

        {/* Login Glass Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/80 p-6 sm:p-8 shadow-xl dark:shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 dark:bg-gradient-to-r dark:from-indigo-600 dark:to-indigo-500 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 hover:bg-indigo-500 dark:hover:from-indigo-500 dark:hover:to-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Preset Demo Logins */}
          <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6">
            <p className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">
              One-Click Demo Roles (Password: <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">Password@123</span>)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials('admin@hrms.com')}
                className="flex flex-col items-center justify-center rounded-xl border border-purple-200 dark:border-purple-500/20 bg-purple-50 dark:bg-purple-500/5 p-2 text-center hover:bg-purple-100 dark:hover:bg-purple-500/15 hover:border-purple-300 dark:hover:border-purple-500/40 transition-colors"
              >
                <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-400 mb-1" />
                <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">Admin</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400">Full Control</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('hr@hrms.com')}
                className="flex flex-col items-center justify-center rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/5 p-2 text-center hover:bg-blue-100 dark:hover:bg-blue-500/15 hover:border-blue-300 dark:hover:border-blue-500/40 transition-colors"
              >
                <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 mb-1" />
                <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">HR Manager</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400">Staff & Leaves</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('emp@hrms.com')}
                className="flex flex-col items-center justify-center rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 p-2 text-center hover:bg-emerald-100 dark:hover:bg-emerald-500/15 hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-colors"
              >
                <Mail className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mb-1" />
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Employee</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400">Punch & Leave</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
