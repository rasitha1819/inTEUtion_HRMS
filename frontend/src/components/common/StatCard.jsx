import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'indigo' }) => {
  const colorMap = {
    indigo: 'bg-indigo-50/80 dark:bg-gradient-to-br dark:from-indigo-500/20 dark:to-indigo-500/5 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20',
    emerald: 'bg-emerald-50/80 dark:bg-gradient-to-br dark:from-emerald-500/20 dark:to-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20',
    amber: 'bg-amber-50/80 dark:bg-gradient-to-br dark:from-amber-500/20 dark:to-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20',
    rose: 'bg-rose-50/80 dark:bg-gradient-to-br dark:from-rose-500/20 dark:to-rose-500/5 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20',
    sky: 'bg-sky-50/80 dark:bg-gradient-to-br dark:from-sky-500/20 dark:to-sky-500/5 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-500/20',
    purple: 'bg-purple-50/80 dark:bg-gradient-to-br dark:from-purple-500/20 dark:to-purple-500/5 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-500/20',
  };

  const activeColor = colorMap[color] || colorMap.indigo;

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] shadow-sm hover:shadow-md dark:shadow-none dark:hover:shadow-glow ${activeColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</h3>
          {subtitle && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="rounded-xl bg-white/90 dark:bg-slate-900/60 p-3.5 border border-slate-200/80 dark:border-white/5 shadow-sm dark:shadow-inner">
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
