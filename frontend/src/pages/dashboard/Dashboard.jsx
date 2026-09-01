import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  Clock, 
  Calendar, 
  AlertCircle, 
  TrendingUp, 
  Building2, 
  ArrowRight,
  Play,
  Square,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../api/dashboard';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { RoleBadge } from '../../components/common/Badge';
import { formatTime } from '../../utils/helpers';

const Dashboard = () => {
  const { user, isHRorAdmin, todayAttendance, punchCheckIn, punchCheckOut } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const [punchMsg, setPunchMsg] = useState('');

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await dashboardApi.getMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handlePunchIn = async () => {
    try {
      setPunchLoading(true);
      setPunchMsg('');
      await punchCheckIn('Checked in from Dashboard');
      setPunchMsg('Check-in recorded successfully!');
      fetchMetrics();
    } catch (err) {
      setPunchMsg(err.response?.data?.detail || 'Failed to check in.');
    } finally {
      setPunchLoading(false);
    }
  };

  const handlePunchOut = async () => {
    try {
      setPunchLoading(true);
      setPunchMsg('');
      await punchCheckOut('Checked out from Dashboard');
      setPunchMsg('Check-out recorded successfully!');
      fetchMetrics();
    } catch (err) {
      setPunchMsg(err.response?.data?.detail || 'Failed to check out.');
    } finally {
      setPunchLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading analytics dashboard..." />;
  }

  const summary = metrics?.summary || {};
  const trends = metrics?.attendance_trends || [];
  const depts = metrics?.department_distribution || [];
  const userStats = metrics?.user_stats;

  // Maximum value for SVG chart scaling
  const maxTrendVal = Math.max(...trends.map(t => (t.present + t.late) || 1), 10);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-200 dark:border-indigo-500/20 bg-gradient-to-r from-indigo-50/90 via-purple-50/60 to-white dark:from-indigo-900/40 dark:via-purple-900/20 dark:to-slate-900/40 p-6 sm:p-8 backdrop-blur-xl shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Dashboard Overview</span>
              <RoleBadge role={user?.role} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Good day, {user?.first_name || user?.username}!
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {isHRorAdmin 
                ? `System-wide overview: ${summary.active_employees || 0} active employees, today's attendance rate is ${summary.attendance_rate || 0}%.`
                : `Here is your attendance and leave tracker for today.`
              }
            </p>
          </div>

          {/* Quick Check-in Banner Action */}
          <div className="flex items-center gap-3">
            {!todayAttendance.checkedIn ? (
              <button
                onClick={handlePunchIn}
                disabled={punchLoading}
                className="flex items-center gap-2 rounded-2xl bg-emerald-600 dark:bg-emerald-500 px-5 py-3 text-sm font-bold text-white dark:text-slate-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-500 transition-all transform hover:scale-105 disabled:opacity-50"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>{punchLoading ? 'Recording...' : 'Punch In Now'}</span>
              </button>
            ) : !todayAttendance.checkedOut ? (
              <button
                onClick={handlePunchOut}
                disabled={punchLoading}
                className="flex items-center gap-2 rounded-2xl bg-rose-600 dark:bg-rose-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/25 hover:bg-rose-500 transition-all transform hover:scale-105 disabled:opacity-50"
              >
                <Square className="h-4 w-4 fill-current" />
                <span>{punchLoading ? 'Recording...' : 'Punch Out Now'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-2xl bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 px-5 py-3 text-sm font-semibold text-indigo-700 dark:text-indigo-300 shadow-sm">
                <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Checked Out ({formatTime(todayAttendance.attendance?.check_out_time)})</span>
              </div>
            )}
          </div>
        </div>
        {punchMsg && (
          <p className="mt-3 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/60 inline-block px-3 py-1 rounded-lg border border-indigo-200 dark:border-indigo-500/20">
            {punchMsg}
          </p>
        )}
      </div>

      {/* Primary Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isHRorAdmin ? (
          <>
            <StatCard
              title="Total Workforce"
              value={summary.total_employees || 0}
              subtitle={`${summary.active_employees || 0} Active staff members`}
              icon={Users}
              color="indigo"
            />
            <StatCard
              title="Checked In Today"
              value={summary.checked_in_total || 0}
              subtitle={`${summary.today_present || 0} On Time | ${summary.today_late || 0} Late`}
              icon={UserCheck}
              color="emerald"
            />
            <StatCard
              title="Absent / On Leave"
              value={(summary.today_absent || 0) + (summary.today_on_leave || 0)}
              subtitle={`${summary.today_on_leave || 0} approved leaves`}
              icon={AlertCircle}
              color="rose"
            />
            <StatCard
              title="Pending Leaves"
              value={summary.pending_leaves_count || 0}
              subtitle="Awaiting HR approval"
              icon={Calendar}
              color="amber"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Today's Status"
              value={todayAttendance.checkedIn ? (todayAttendance.checkedOut ? 'Completed' : 'Checked In') : 'Not Checked In'}
              subtitle={todayAttendance.attendance?.check_in_time ? `In: ${formatTime(todayAttendance.attendance.check_in_time)}` : 'Punch in to start'}
              icon={Clock}
              color={todayAttendance.checkedIn ? 'emerald' : 'amber'}
            />
            <StatCard
              title="Month Present"
              value={`${userStats?.month_present_days || 0} Days`}
              subtitle={`${userStats?.month_late_days || 0} Late arrivals`}
              icon={UserCheck}
              color="indigo"
            />
            <StatCard
              title="Available Leaves"
              value={`${userStats?.remaining_leave_days || 0} Days`}
              subtitle="Current calendar year"
              icon={CalendarDays}
              color="sky"
            />
            <StatCard
              title="My Pending Requests"
              value={userStats?.pending_my_leaves || 0}
              subtitle="Under management review"
              icon={Calendar}
              color="purple"
            />
          </>
        )}
      </div>

      {/* Middle Section: Attendance Trend & Department / Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Attendance Trends Chart Card */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 backdrop-blur-xl shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                7-Day Attendance Activity
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Daily present vs late attendance logs</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500"></span> Present
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span> Late
              </span>
            </div>
          </div>

          {/* SVG Bar Chart Visualization */}
          <div className="mt-6 flex h-60 items-end justify-between gap-3 pt-6 px-2">
            {trends.map((t, idx) => {
              const presentHeight = (t.present / maxTrendVal) * 160;
              const lateHeight = (t.late / maxTrendVal) * 160;

              return (
                <div key={idx} className="flex flex-1 flex-col items-center gap-2 group">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -translate-y-12 bg-slate-900 dark:bg-slate-950 text-slate-100 text-[10px] px-2 py-1 rounded shadow-lg border border-slate-700 dark:border-slate-800 whitespace-nowrap z-20 pointer-events-none">
                    {t.date}: {t.present} Present, {t.late} Late
                  </div>

                  {/* Stacked bar */}
                  <div className="w-full max-w-[36px] flex flex-col items-center justify-end rounded-t-lg overflow-hidden bg-slate-100 dark:bg-slate-800/40 h-44">
                    {t.late > 0 && (
                      <div
                        style={{ height: `${Math.max(6, lateHeight)}px` }}
                        className="w-full bg-gradient-to-t from-amber-600 to-amber-400 transition-all duration-500"
                        title={`${t.late} Late`}
                      />
                    )}
                    {t.present > 0 && (
                      <div
                        style={{ height: `${Math.max(8, presentHeight)}px` }}
                        className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all duration-500"
                        title={`${t.present} Present`}
                      />
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{t.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Departments Breakdown or Quick Actions */}
        <div className="space-y-6">
          {/* Department Breakdown Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 backdrop-blur-xl shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Departments
              </h3>
              {isHRorAdmin && (
                <Link to="/departments" className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-semibold flex items-center gap-1">
                  View All <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>

            <div className="mt-4 space-y-3">
              {depts.slice(0, 4).map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/60">
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">{d.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{d.code}</p>
                  </div>
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20">
                    {d.total_members} Staff
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Nav Links */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 backdrop-blur-xl shadow-sm">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Quick Navigation</h4>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/attendance"
                className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/40 transition-colors shadow-xs"
              >
                <Clock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Attendance Log</span>
              </Link>
              <Link
                to="/leaves"
                className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/40 transition-colors shadow-xs"
              >
                <CalendarDays className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Leave Portal</span>
              </Link>
              {isHRorAdmin && (
                <>
                  <Link
                    to="/employees"
                    className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/40 transition-colors shadow-xs"
                  >
                    <Users className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Directory</span>
                  </Link>
                  <Link
                    to="/departments"
                    className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/40 transition-colors shadow-xs"
                  >
                    <Building2 className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Depts</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
