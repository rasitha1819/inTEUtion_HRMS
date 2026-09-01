import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import { leaveApi } from '../../api/leaves';

const ApplyLeaveModal = ({ isOpen, onClose, balances = [], onSuccess }) => {
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentBalance = balances.find((b) => b.leave_type === leaveType);

  // Calculate requested duration
  let requestedDays = 0;
  if (startDate && endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (e >= s) {
      requestedDays = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (new Date(startDate) > new Date(endDate)) {
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
        end_date: endDate,
        reason,
      });
      onSuccess();
      onClose();
      // Reset form
      setReason('');
      setStartDate('');
      setEndDate('');
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
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-400 mb-1">Leave Category *</label>
          <select
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none"
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-400 mb-1">Start Date *</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-400 mb-1">End Date *</label>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none"
            />
          </div>
        </div>

        {requestedDays > 0 && (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 p-3 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
            Total Duration Requested: <span className="font-bold text-slate-900 dark:text-white">{requestedDays} day(s)</span>
          </div>
        )}

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
