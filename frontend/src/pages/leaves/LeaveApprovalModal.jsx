import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import { leaveApi } from '../../api/leaves';
import { formatDate } from '../../utils/helpers';

const LeaveApprovalModal = ({ isOpen, onClose, leaveRequest, onSuccess }) => {
  const [decision, setDecision] = useState('APPROVE'); // 'APPROVE' | 'REJECT'
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!leaveRequest) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (decision === 'APPROVE') {
        await leaveApi.approveLeave(leaveRequest.id, comments || 'Approved by HR/Management');
      } else {
        await leaveApi.rejectLeave(leaveRequest.id, comments || 'Rejected by HR/Management');
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to process leave request review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Review Leave Application" maxWidth="max-w-lg">
      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
          {error}
        </div>
      )}

      {/* Applicant details summary */}
      <div className="rounded-xl bg-slate-950/70 p-4 border border-slate-800 space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-white">{leaveRequest.employee_name} ({leaveRequest.employee_code})</span>
          <span className="text-xs text-indigo-400 font-medium">{leaveRequest.leave_type_display}</span>
        </div>
        <p className="text-xs text-slate-300">
          Duration: <span className="font-semibold text-white">{formatDate(leaveRequest.start_date)}</span> to{' '}
          <span className="font-semibold text-white">{formatDate(leaveRequest.end_date)}</span> ({leaveRequest.total_days} days)
        </p>
        <p className="text-xs text-slate-400 italic">
          Reason: "{leaveRequest.reason}"
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Decision selector */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Review Decision *</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDecision('APPROVE')}
              className={`rounded-xl p-3 border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                decision === 'APPROVE'
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-sm'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
              }`}
            >
              Approve Request
            </button>
            <button
              type="button"
              onClick={() => setDecision('REJECT')}
              className={`rounded-xl p-3 border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                decision === 'REJECT'
                  ? 'border-rose-500 bg-rose-500/20 text-rose-400 shadow-sm'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
              }`}
            >
              Reject Request
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
            Reviewer Remarks / Feedback
          </label>
          <textarea
            rows={2}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add comments or instructions for the applicant..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`rounded-xl px-5 py-2 text-xs font-semibold text-white shadow-lg transition-all disabled:opacity-50 ${
              decision === 'APPROVE'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
            }`}
          >
            {loading ? 'Submitting...' : decision === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default LeaveApprovalModal;
