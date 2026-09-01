import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  PlusCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Filter, 
  User, 
  Calendar,
  AlertCircle,
  FileText
} from 'lucide-react';
import { leaveApi } from '../../api/leaves';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/Badge';
import { formatDate } from '../../utils/helpers';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ApplyLeaveModal from './ApplyLeaveModal';
import LeaveApprovalModal from './LeaveApprovalModal';

const LeaveManagement = () => {
  const { user, isHRorAdmin } = useAuth();

  const [balances, setBalances] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('my-requests'); // 'my-requests', 'pending', 'all'
  const [loading, setLoading] = useState(true);

  // Modals
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRequestForReview, setSelectedRequestForReview] = useState(null);

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      const [balRes, myReqRes] = await Promise.all([
        leaveApi.getMyBalances(),
        leaveApi.getMyRequests(),
      ]);
      setBalances(balRes || []);
      setMyRequests(myReqRes.results || myReqRes);

      if (isHRorAdmin) {
        const [pendingRes, allRes] = await Promise.all([
          leaveApi.getPendingRequests(),
          leaveApi.getAllRequests(),
        ]);
        setPendingRequests(pendingRes.results || pendingRes);
        setAllRequests(allRes.results || allRes);
      }
    } catch (err) {
      console.error('Error loading leave data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveData();
  }, [isHRorAdmin]);

  const handleOpenReview = (req) => {
    setSelectedRequestForReview(req);
    setReviewModalOpen(true);
  };

  const handleCancelRequest = async (id) => {
    if (window.confirm('Are you sure you want to cancel this leave application?')) {
      try {
        await leaveApi.cancelLeave(id);
        fetchLeaveData();
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to cancel leave request.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <CalendarDays className="h-6 w-6 text-indigo-400" />
            Leave Management & Entitlements
          </h1>
          <p className="text-xs text-slate-400">
            Submit leave requests, track remaining allowances, and manage team approvals.
          </p>
        </div>

        <button
          onClick={() => setApplyModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-all"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Leave Balances Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {balances.length > 0 ? (
          balances.map((b) => {
            const percentUsed = Math.min(100, Math.round((b.used_days / Math.max(1, b.total_days)) * 100));

            return (
              <div
                key={b.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl transition-all hover:border-slate-700"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {b.leave_type_display}
                    </span>
                    <h3 className="mt-1 text-2xl font-extrabold text-white">
                      {b.remaining_days}{' '}
                      <span className="text-xs font-normal text-slate-400">/ {b.total_days} Days</span>
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {b.used_days} Used
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${percentUsed}%` }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                    />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
                    <span>Available: {b.remaining_days}d</span>
                    <span>{percentUsed}% Used</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-center text-xs text-slate-400">
            No personal leave balances registered for current year.
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 space-x-4">
        <button
          onClick={() => setActiveTab('my-requests')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'my-requests'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>My Applications ({myRequests.length})</span>
        </button>

        {isHRorAdmin && (
          <>
            <button
              onClick={() => setActiveTab('pending')}
              className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'pending'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Pending Reviews</span>
              {pendingRequests.length > 0 && (
                <span className="rounded-full bg-amber-500/20 text-amber-300 px-2 py-0.2 text-[10px] border border-amber-500/30">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Company Leave Logs ({allRequests.length})</span>
            </button>
          </>
        )}
      </div>

      {/* Requests Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
        {loading ? (
          <LoadingSpinner size="md" message="Loading leave applications..." />
        ) : (
          (() => {
            const list =
              activeTab === 'my-requests'
                ? myRequests
                : activeTab === 'pending'
                ? pendingRequests
                : allRequests;

            if (list.length === 0) {
              return (
                <div className="p-12 text-center">
                  <CalendarDays className="mx-auto h-12 w-12 text-slate-600 mb-3" />
                  <p className="text-sm font-semibold text-slate-300">No applications in this view</p>
                  <p className="text-xs text-slate-500 mt-1">Submit a new leave request whenever needed.</p>
                </div>
              );
            }

            return (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">Employee</th>
                      <th className="py-3.5 px-4">Leave Type</th>
                      <th className="py-3.5 px-4">Start Date</th>
                      <th className="py-3.5 px-4">End Date</th>
                      <th className="py-3.5 px-4">Duration</th>
                      <th className="py-3.5 px-4">Reason</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {list.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-4 font-semibold text-white">
                          <p>{req.employee_name}</p>
                          <span className="text-[10px] font-mono text-slate-400">{req.employee_code}</span>
                        </td>
                        <td className="py-4 px-4 font-medium text-slate-200">
                          {req.leave_type_display}
                        </td>
                        <td className="py-4 px-4 font-mono text-slate-300">
                          {formatDate(req.start_date)}
                        </td>
                        <td className="py-4 px-4 font-mono text-slate-300">
                          {formatDate(req.end_date)}
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-indigo-300">
                          {req.total_days} Day(s)
                        </td>
                        <td className="py-4 px-4 text-slate-400 max-w-xs truncate">
                          {req.reason}
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="py-4 px-4 text-right">
                          {isHRorAdmin && req.status === 'PENDING' ? (
                            <button
                              onClick={() => handleOpenReview(req)}
                              className="rounded-lg bg-indigo-600/20 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-colors"
                            >
                              Review
                            </button>
                          ) : req.status === 'PENDING' && activeTab === 'my-requests' ? (
                            <button
                              onClick={() => handleCancelRequest(req.id)}
                              className="rounded-lg bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-colors"
                            >
                              Cancel
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500">
                              {req.reviewed_by_name ? `By ${req.reviewed_by_name}` : '-'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()
        )}
      </div>

      {/* Apply Leave Modal */}
      <ApplyLeaveModal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        balances={balances}
        onSuccess={fetchLeaveData}
      />

      {/* Review Modal */}
      <LeaveApprovalModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        leaveRequest={selectedRequestForReview}
        onSuccess={fetchLeaveData}
      />
    </div>
  );
};

export default LeaveManagement;
