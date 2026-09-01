import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Play, 
  Square, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Timer, 
  Filter, 
  User, 
  FileText,
  Search,
  Building2
} from 'lucide-react';
import { attendanceApi } from '../../api/attendance';
import { departmentApi } from '../../api/departments';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/Badge';
import { formatDate, formatTime } from '../../utils/helpers';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AttendanceTracking = () => {
  const { user, isHRorAdmin, todayAttendance, punchCheckIn, punchCheckOut, fetchTodayStatus } = useAuth();
  
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const [punchNotes, setPunchNotes] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Filters
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDept, setFilterDept] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterDate) params.date = filterDate;
      if (filterStatus) params.status = filterStatus;
      if (filterDept) params.department_id = filterDept;

      const data = await attendanceApi.getAttendanceLogs(params);
      setLogs(data.results || data);

      const sumData = await attendanceApi.getAttendanceSummary();
      setSummary(sumData);
    } catch (err) {
      console.error('Error fetching attendance logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInit = async () => {
      if (isHRorAdmin) {
        try {
          const deptRes = await departmentApi.getDepartments();
          setDepartments(deptRes.results || deptRes);
        } catch (err) {
          console.error(err);
        }
      }
      await fetchLogs();
    };
    loadInit();
  }, [filterDate, filterStatus, filterDept]);

  const handlePunchIn = async () => {
    try {
      setPunchLoading(true);
      setActionError('');
      setActionSuccess('');
      await punchCheckIn(punchNotes);
      setActionSuccess('Successfully checked in!');
      setPunchNotes('');
      await fetchLogs();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to check in.');
    } finally {
      setPunchLoading(false);
    }
  };

  const handlePunchOut = async () => {
    try {
      setPunchLoading(true);
      setActionError('');
      setActionSuccess('');
      await punchCheckOut(punchNotes);
      setActionSuccess('Successfully checked out. Hours recorded.');
      setPunchNotes('');
      await fetchLogs();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to check out.');
    } finally {
      setPunchLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Clock className="h-6 w-6 text-indigo-400" />
            Attendance Tracking
          </h1>
          <p className="text-xs text-slate-400">
            {isHRorAdmin ? 'Live company punch logs, punctuality metrics, and history.' : 'Record your daily punch in/out and view your monthly attendance summary.'}
          </p>
        </div>
      </div>

      {/* Interactive Punch In/Out Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Timer className="h-5 w-5 text-indigo-400" />
                Daily Timecard & Punch Station
              </h2>
              <p className="text-xs text-slate-400">Standard office start is 09:15 AM (late arrival threshold)</p>
            </div>
            <span className="text-xs font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-indigo-300">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="text-xs font-medium text-slate-400">Current Status:</span>
                <StatusBadge status={todayAttendance.attendance?.status || (todayAttendance.checkedIn ? 'PRESENT' : 'ABSENT')} />
              </div>
              <p className="text-sm font-semibold text-white">
                Check In:{' '}
                <span className="font-mono text-indigo-400">
                  {todayAttendance.attendance?.check_in_time ? formatTime(todayAttendance.attendance.check_in_time) : '--:-- --'}
                </span>
                <span className="mx-2 text-slate-600">|</span>
                Check Out:{' '}
                <span className="font-mono text-indigo-400">
                  {todayAttendance.attendance?.check_out_time ? formatTime(todayAttendance.attendance.check_out_time) : '--:-- --'}
                </span>
              </p>
              {todayAttendance.attendance?.working_hours > 0 && (
                <p className="text-xs font-medium text-emerald-400">
                  Hours Recorded Today: {todayAttendance.attendance.working_hours} hrs
                </p>
              )}
            </div>

            <div className="flex flex-col w-full sm:w-auto items-stretch sm:items-end gap-3">
              <input
                type="text"
                placeholder="Punch note (optional)..."
                value={punchNotes}
                onChange={(e) => setPunchNotes(e.target.value)}
                className="rounded-xl border border-slate-800 bg-slate-950 py-1.5 px-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />

              <div className="flex items-center gap-3">
                {!todayAttendance.checkedIn ? (
                  <button
                    onClick={handlePunchIn}
                    disabled={punchLoading}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition-all disabled:opacity-50"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    <span>{punchLoading ? 'Recording...' : 'Punch In'}</span>
                  </button>
                ) : !todayAttendance.checkedOut ? (
                  <button
                    onClick={handlePunchOut}
                    disabled={punchLoading}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-500/25 hover:bg-rose-400 transition-all disabled:opacity-50"
                  >
                    <Square className="h-4 w-4 fill-current" />
                    <span>{punchLoading ? 'Recording...' : 'Punch Out'}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Day Completed</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {actionError && (
            <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
              {actionError}
            </div>
          )}
          {actionSuccess && (
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
              {actionSuccess}
            </div>
          )}
        </div>

        {/* Quick Month Metrics Widget */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl flex flex-col justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Monthly Summary Stats</h3>
          <div className="grid grid-cols-2 gap-3 my-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] text-slate-400">Present</span>
              <p className="text-xl font-bold text-white mt-1">{summary?.present_days || 0} Days</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] text-slate-400">Late Days</span>
              <p className="text-xl font-bold text-amber-400 mt-1">{summary?.late_days || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] text-slate-400">Total Hours</span>
              <p className="text-xl font-bold text-indigo-400 mt-1">{summary?.total_hours || 0}h</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] text-slate-400">Avg Daily</span>
              <p className="text-xl font-bold text-emerald-400 mt-1">{summary?.average_hours || 0}h</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 text-center">Auto-calculated from official punches</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          {/* Specific Date Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950 py-1.5 px-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950 py-1.5 px-3 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late Arrival</option>
            <option value="HALF_DAY">Half Day</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="ABSENT">Absent</option>
          </select>

          {/* Department Filter (for HR/Admin) */}
          {isHRorAdmin && (
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950 py-1.5 px-3 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          )}

          {(filterDate || filterStatus || filterDept) && (
            <button
              onClick={() => { setFilterDate(''); setFilterStatus(''); setFilterDept(''); }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
        {loading ? (
          <LoadingSpinner size="md" message="Loading attendance logs..." />
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="mx-auto h-12 w-12 text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-300">No attendance records found</p>
            <p className="text-xs text-slate-500 mt-1">Check back later or adjust your date filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Check In</th>
                  <th className="py-3.5 px-4">Check Out</th>
                  <th className="py-3.5 px-4">Hours</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 font-mono font-medium text-slate-200">
                      {formatDate(log.date)}
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-semibold text-white">{log.employee_name}</p>
                        <p className="text-[11px] font-mono text-indigo-400">{log.employee_code}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-300">
                      {log.department_name || '-'}
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-200">
                      {log.check_in_time ? formatTime(log.check_in_time) : '-'}
                      {log.late_minutes > 0 && (
                        <span className="ml-1.5 text-[10px] text-amber-400">
                          (+{log.late_minutes}m)
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-200">
                      {log.check_out_time ? formatTime(log.check_out_time) : '-'}
                    </td>
                    <td className="py-4 px-4 font-mono font-semibold text-indigo-300">
                      {log.working_hours > 0 ? `${log.working_hours}h` : '-'}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="py-4 px-4 text-slate-400 max-w-xs truncate">
                      {log.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceTracking;
