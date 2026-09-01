/**
 * Helper utility functions for HRMS
 */

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

export const formatTime = (timeStr) => {
  if (!timeStr) return '-';
  try {
    // Check if format is "HH:MM:SS"
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 becomes 12
      return `${hours}:${minutes} ${ampm}`;
    }
    return timeStr;
  } catch {
    return timeStr;
  }
};

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
};

export const getStatusBadgeClass = (status) => {
  switch (status?.toUpperCase()) {
    case 'PRESENT':
    case 'APPROVED':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'LATE':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    case 'HALF_DAY':
      return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    case 'ABSENT':
    case 'REJECTED':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    case 'ON_LEAVE':
      return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    case 'PENDING':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
    case 'CANCELLED':
      return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  }
};

export const getRoleBadgeClass = (role) => {
  switch (role?.toUpperCase()) {
    case 'ADMIN':
      return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    case 'HR':
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    case 'EMPLOYEE':
      return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    default:
      return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
  }
};
