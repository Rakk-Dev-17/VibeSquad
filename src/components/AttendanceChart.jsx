import React from 'react';

export default function AttendanceChart({ results }) {
  if (!results || Object.keys(results).length === 0) return null;

  const subjectKeys = Object.keys(results);
  let totalAttended = 0;
  let totalConducted = 0;
  let criticalCount = 0;
  let safeCount = 0;

  subjectKeys.forEach((sub) => {
    totalAttended += Number(results[sub].attended) || 0;
    totalConducted += Number(results[sub].conducted) || 0;
    if (results[sub].isImpossible || results[sub].currentPercent < 75) {
      criticalCount += 1;
    } else {
      safeCount += 1;
    }
  });

  const overallPercentage = totalConducted > 0 
    ? ((totalAttended / totalConducted) * 100).toFixed(1) 
    : 0;

  // SVG Donut calculation
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(overallPercentage, 100) / 100) * circumference;

  const isLow = overallPercentage < 75;
  const ringColor = isLow ? 'text-rose-500' : 'text-purple-400';

  return (
    <div className="glass-card p-6 mb-8 border border-purple-500/20 bg-gradient-to-br from-white/[0.04] to-transparent">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Left Side: Circular Pie/Donut Chart */}
        <div className="flex items-center space-x-6">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="currentColor"
                strokeWidth="14"
                className="text-slate-800/60"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="currentColor"
                strokeWidth="14"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={`${ringColor} transition-all duration-1000 ease-out`}
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-slate-100 tracking-tight">
                {overallPercentage}%
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Overall
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-100">Cumulative Semester Standing</h3>
            <p className="text-xs text-slate-400 mt-1">Aggregated across all registered course slots</p>
            <div className="mt-3 flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white/5 border border-white/10 text-slate-300">
                {totalAttended} / {totalConducted} Periods Attended
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Status Distribution Badges */}
        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-5 py-3 rounded-xl flex flex-col items-center">
            <span className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">Safe / Excellent</span>
            <span className="text-2xl font-extrabold text-emerald-400 mt-1">{safeCount}</span>
            <span className="text-[10px] text-emerald-300/70">Subjects ≥ 75%</span>
          </div>

          <div className="bg-rose-500/10 border border-rose-500/20 px-5 py-3 rounded-xl flex flex-col items-center">
            <span className="text-xs text-rose-300 font-semibold uppercase tracking-wider">Detention Risk</span>
            <span className="text-2xl font-extrabold text-rose-400 mt-1">{criticalCount}</span>
            <span className="text-[10px] text-rose-300/70">Subjects &lt; 75%</span>
          </div>
        </div>

      </div>
    </div>
  );
}