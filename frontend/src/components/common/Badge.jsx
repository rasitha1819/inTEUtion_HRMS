import React from 'react';
import { getStatusBadgeClass, getRoleBadgeClass } from '../../utils/helpers';

export const StatusBadge = ({ status }) => {
  const badgeClass = getStatusBadgeClass(status);
  const formatted = status ? status.replace('_', ' ') : 'N/A';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${badgeClass}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current mr-1.5"></span>
      {formatted}
    </span>
  );
};

export const RoleBadge = ({ role }) => {
  const badgeClass = getRoleBadgeClass(role);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wider border ${badgeClass}`}>
      {role || 'EMPLOYEE'}
    </span>
  );
};
