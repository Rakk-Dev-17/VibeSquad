import React from 'react';

function CircularChart({ percentage, size = 120, strokeWidth = 10, label, sublabel, isCritical }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;
  const strokeColor = isCritical ? 'text-rose-500' : 'text-purple-400';

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-800/80"
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${strokeColor} transition-all duration-1000 ease-out`}
            fill="transparent"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`${size > 140 ? 'text-4xl' : 'text-xl'} font-black text-slate-100 tracking-tight`}>
            {percentage}%
          </span>
          {sublabel && (
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {sublabel}
            </span>
          )}
        </div>
      </div>
      {label && (
        <span className="mt-3 text-xs font-semibold text-slate-200 text-center max-w-[140px] truncate" title={label}>
          {label}
        </span>
      )}
    </div>
  );
}

export default function VisualAnalytics({ results, selectedSection, currentUser }) {
  if (!results || Object.keys(results).length === 0) {
    return (
      <div className="glass-card p-12 text-center border border-purple-500/20 max-w-2xl mx-auto my-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-100">No Analytics Available Yet</h3>
        <p className="text-slate-400 text-sm mt-2">
          Calculate your attendance in the Dashboard first to populate your charts.
        </p>
      </div>
    );
  }

  const subjects = Object.keys(results);
  let totalAttended = 0;
  let totalConducted = 0;
  let totalRemaining = 0;
  let criticalCount = 0;
  let safeCount = 0;

  subjects.forEach((s) => {
    const stat = results[s];
    totalAttended += Number(stat.attended) || 0;
    totalConducted += Number(stat.conducted) || 0;
    totalRemaining += Number(stat.remaining) || 0;
    if (stat.isImpossible || stat.currentPercent < 75) {
      criticalCount += 1;
    } else {
      safeCount += 1;
    }
  });

  const aggregatePercent = totalConducted > 0 
    ? ((totalAttended / totalConducted) * 100).toFixed(1) 
    : 0;

  const isLowOverall = aggregatePercent < 75;

  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
      {/* Overview Banner Card */}
      <div className="glass-card p-8 border border-purple-500/30 bg-gradient-to-r from-purple-900/20 via-indigo-900/10 to-transparent">
        <div className="flex flex-col md:flex-row items-center justify-around gap-8">
          <CircularChart
            percentage={aggregatePercent}
            size={180}
            strokeWidth={16}
            sublabel="Overall"
            isCritical={isLowOverall}
          />
          <div className="space-y-4 text-center md:text-left">
            <div>
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">
                Semester Matrix standing
              </span>
              <h2 className="text-3xl font-extrabold text-slate-100 mt-1">
                {currentUser} <span className="text-slate-400 font-normal">({selectedSection})</span>
              </h2>
            </div>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <span className="px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
                Attended: <strong className="text-slate-100">{totalAttended}</strong>
              </span>
              <span className="px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
                Conducted: <strong className="text-slate-100">{totalConducted}</strong>
              </span>
              <span className="px-3.5 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300">
                Classes Left: <strong>{totalRemaining}</strong>
              </span>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center min-w-[100px]">
              <span className="text-2xl font-black text-emerald-400">{safeCount}</span>
              <p className="text-[10px] uppercase font-bold text-emerald-300/80 mt-1">Safe</p>
            </div>
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center min-w-[100px]">
              <span className="text-2xl font-black text-rose-400">{criticalCount}</span>
              <p className="text-[10px] uppercase font-bold text-rose-300/80 mt-1">Danger</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Separate Donut Charts for Every Subject */}
      <div>
        <h3 className="text-xl font-bold text-slate-100 tracking-tight mb-4">
          Subject-by-Subject Visual Breakdown
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {subjects.map((sub) => {
            const stat = results[sub];
            const isCritical = stat.isImpossible || stat.currentPercent < 75;
            return (
              <div 
                key={sub} 
                className={`glass-card p-6 border ${isCritical ? 'border-rose-500/30 bg-rose-950/10' : 'border-white/10'} flex flex-col items-center justify-between text-center hover:scale-[1.02] transition-transform`}
              >
                <span className="text-xs font-bold text-slate-300 h-9 line-clamp-2 mb-4" title={sub}>
                  {sub}
                </span>

                <CircularChart
                  percentage={parseFloat(stat.currentPercent)}
                  size={120}
                  strokeWidth={10}
                  isCritical={isCritical}
                />

                <div className="mt-4 pt-3 border-t border-white/5 w-full flex justify-between text-[11px] text-slate-400">
                  <span>{stat.attended}/{stat.conducted} periods</span>
                  <span className={isCritical ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {stat.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}