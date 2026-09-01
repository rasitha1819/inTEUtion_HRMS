import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 'md', message = 'Loading data...' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <Loader2 className={`${sizeClasses[size] || sizeClasses.md} animate-spin text-indigo-500`} />
      {message && <p className="text-sm font-medium text-slate-400">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
