import React, { useState, useEffect } from 'react';
import { Menu, LogOut, CheckCircle2, Clock, Play, Square, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatTime } from '../../utils/helpers';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout, todayAttendance, punchCheckIn, punchCheckOut } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [punching, setPunching] = useState(false);
  const [punchError, setPunchError] = useState('');

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckIn = async () => {
    try {
      setPunching(true);
      setPunchError('');
      await punchCheckIn('Quick Check-in from Topbar');
    } catch (err) {
      setPunchError(err.response?.data?.detail || 'Failed to check in.');
    } finally {
      setPunching(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setPunching(true);
      setPunchError('');
      await punchCheckOut('Quick Check-out from Topbar');
    } catch (err) {
      setPunchError(err.response?.data?.detail || 'Failed to check out.');
    } finally {
      setPunching(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-4 backdrop-blur-xl lg:px-8">
      {/* Left section: Hamburger toggle & Live Clock */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
          <Clock className="h-3.5 w-3.5 text-indigo-400" />
          <span>{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          <span className="text-slate-600">|</span>
          <span>{currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Right section: Quick punch button, User Info & Logout */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Quick Check-in / Out Widget */}
        <div className="flex items-center">
          {!todayAttendance.checkedIn ? (
            <button
              onClick={handleCheckIn}
              disabled={punching}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all duration-150 disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>{punching ? 'PUNCHING...' : 'CHECK IN'}</span>
            </button>
          ) : !todayAttendance.checkedOut ? (
            <button
              onClick={handleCheckOut}
              disabled={punching}
              className="flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-all duration-150 disabled:opacity-50"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              <span>{punching ? 'PUNCHING...' : 'CHECK OUT'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 rounded-lg bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-400 border border-indigo-500/30">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>COMPLETED TODAY</span>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-slate-800" />

        {/* User profile dropdown info */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right">
            <p className="text-xs font-semibold text-slate-200">{user?.full_name || user?.username}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{user?.role}</p>
          </div>

          <button
            onClick={logout}
            title="Sign Out"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
