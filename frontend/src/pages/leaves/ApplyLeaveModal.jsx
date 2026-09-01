import React, { useState } from 'react';
import { Calendar, ArrowRight, Clock, Sparkles } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { leaveApi } from '../../api/leaves';

const ApplyLeaveModal = ({ isOpen, onClose, balances = [], onSuccess }) => {
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [rangeMode, setRangeMode] = useState('range'); // 'single' | 'range'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentBalance = balances.find((b) => b.leave_type === leaveType);

  // Effective end date based on mode
  const effectiveEndDate = rangeMode === 'single' ? startDate : endDate;

  // Calculate requested duration
  let requestedDays = 0;
  if (startDate && effectiveEndDate) {
    const s = new Date(startDate);
    const e = new Date(effectiveEndDate);
    if (e >= s) {
      requestedDays = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
    }
  }

  const handleStartDateChange = (newStart) => {
    setStartDate(newStart);
    if (rangeMode === 'single') {
      setEndDate(newStart);
    } else if (!endDate || new Date(endDate) < new Date(newStart)) {
      setEndDate(newStart);
    }
  };

  const handleApplyPreset = (daysOffset, countDays) => {
    const start = new Date();
    start.setDate(start.getDate() + daysOffset);
    const end = new Date(start);
    end.setDate(start.getDate() + (countDays - 1));

    const sStr = start.toISOString().split('T')[0];
    const eStr = end.toISOString().split('T')[0];

    if (countDays === 1) {
      setRangeMode('single');
    } else {
      setRangeMode('range');
    }
    setStartDate(sStr);
    setEndDate(eStr);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const finalEndDate = rangeMode === 'single' ? startDate : endDate;

    if (!startDate || !finalEndDate) {
      setError('Please select a valid date range.');
      return;
    }

    if (new Date(startDate) > new Date(finalEndDate)) {
      setError('End date must be on or after start date.');
      return;
    }

    if (currentBalance && requestedDays > currentBalance.remaining_days) {
      setError(`Insufficient balance. You have ${currentBalance.remaining_days} days remaining for ${leaveType}.`);
      return;
    }

    setLoading(true);
    try {
      await leaveApi.applyLeave({
        leave_type: leaveType,
        start_date: startDate,
        end_date: finalEndDate,
        reason,
      });
      onSuccess();
      onClose();
      // Reset form
      setReason('');
      setStartDate('');
      setEndDate('');
      setRangeMode('range');
    } catch (err) {
      console.error(err);
      let errMsg = 'Failed to submit leave application.';
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errMsg = err.response.data.includes('<!DOCTYPE') || err.response.data.includes('<html')
            ? 'Server error occurred while submitting application.'
            : err.response.data;
        } else if (typeof err.response.data === 'object') {
          if (err.response.data.leave_type) {
            errMsg = Array.isArray(err.response.data.leave_type) ? err.response.data.leave_type.join(' ') : err.response.data.leave_type;
          } else if (err.response.data.detail) {
            errMsg = err.response.data.detail;
          } else if (err.response.data.non_field_errors) {
            errMsg = Array.isArray(err.response.data.non_field_errors) ? err.response.data.non_field_errors.join(' ') : err.response.data.non_field_errors;
          } else {
            errMsg = Object.entries(err.response.data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : (typeof v === 'object' ? JSON.stringify(v) : v)}`)
              .join(' | ');
          }
        }
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Apply for Leave" maxWidth="max-w-lg">
      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Leave Category */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-400 mb-1">Leave Category *</label>
          <select
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-3 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none shadow-xs"
          >
            <option value="CASUAL">Casual Leave</option>
            <option value="SICK">Sick Leave</option>
            <option value="EARNED">Earned Leave</option>
            <option value="MATERNITY">Maternity Leave</option>
            <option value="PATERNITY">Paternity Leave</option>
            <option value="WFH">Work From Home</option>
          </select>
          {currentBalance && (
            <p className="mt-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              {leaveType === 'WFH' ? 'Allowance: 3 days / month • ' : ''}Available Balance: {currentBalance.remaining_days} of {currentBalance.total_days} days remaining
            </p>
          )}
        </div>

        {/* Date Range Selector Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-400">
              Leave Duration / Date Range *
            </label>
            {/* Mode Switch Tabs */}
            <div className="flex rounded-lg bg-slate-100 dark:bg-slate-950 p-0.5 border border-slate-200 dark:border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setRangeMode('single');
                  if (startDate) setEndDate(startDate);
                }}
                className={`px-2.5 py-0.5 rounded-md font-medium transition-all ${
                  rangeMode === 'single'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Single Day
              </button>
              <button
                type="button"
                onClick={() => setRangeMode('range')}
                className={`px-2.5 py-0.5 rounded-md font-medium transition-all ${
                  rangeMode === 'range'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Date Range
              </button>
            </div>
          </div>

          {/* Unified Connected Date Range Container */}
          <div className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 p-3">
            {rangeMode === 'single' ? (
              <div className="relative">
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-2">
                {/* Start Date */}
                <div className="flex-1 w-full">
                  <span className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Start Date
                  </span>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Arrow Divider */}
                <div className="hidden sm:flex pt-4 text-slate-400">
                  <ArrowRight className="h-4 w-4" />
                </div>

                {/* End Date */}
                <div className="flex-1 w-full">
                  <span className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">
                    End Date
                  </span>
                  <input
                    type="date"
                    required
                    min={startDate}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Quick Preset Buttons */}
            <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-medium mr-1">Quick Select:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset(0, 1)}
                className="px-2 py-0.5 text-[11px] rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(1, 1)}
                className="px-2 py-0.5 text-[11px] rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(1, 3)}
                className="px-2 py-0.5 text-[11px] rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Next 3 Days
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(1, 5)}
                className="px-2 py-0.5 text-[11px] rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                5 Days
              </button>
            </div>
          </div>
        </div>

        {/* Calculated Total Duration Banner */}
        {requestedDays > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 p-3 border border-indigo-200 dark:border-indigo-500/20 text-xs">
            <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-medium">
              <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              Calculated Total Duration:
            </span>
            <span className="font-bold text-indigo-700 dark:text-indigo-300 text-sm">
              {requestedDays} Day{requestedDays > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Reason for Leave */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-400 mb-1">Reason for Leave *</label>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please describe reason for leave request..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none"
          />
        </div>

        {/* Modal Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 dark:border-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500 transition-all disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ApplyLeaveModal;
