import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'indigo' }) => {
  const colorMap = {
    indigo: 'from-indigo-500/20 to-indigo-500/5 text-indigo-400 border-indigo-500/20',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20',
    rose: 'from-rose-500/20 to-rose-500/5 text-rose-400 border-rose-500/20',
    sky: 'from-sky-500/20 to-sky-500/5 text-sky-400 border-sky-500/20',
    purple: 'from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/20',
  };

  const activeColor = colorMap[color] || colorMap.indigo;

  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-glow ${activeColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-white tracking-tight">{value}</h3>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="rounded-xl bg-slate-900/60 p-3.5 border border-white/5 shadow-inner">
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center text-xs font-medium text-emerald-400">
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
