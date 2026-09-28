import React from 'react';

export default function SubjectCard({ subject, stats }) {
  let statusColor = 'text-purple-300 border-purple-500/30 bg-purple-500/10';
  let progressGradient = 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.4)]';

  if (stats.isImpossible) {
    statusColor = 'text-rose-400 border-rose-500/50 bg-rose-500/20 animate-pulse';
    progressGradient = 'bg-gradient-to-r from-rose-700 to-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.6)]';
  } else if (stats.currentPercent < 75) {
    statusColor = 'text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-500/10';
    progressGradient = 'bg-gradient-to-r from-fuchsia-600 to-pink-500 shadow-[0_0_15px_rgba(217,70,239,0.4)]';
  }

  return (
    <div className={`glass-card hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group ${stats.isImpossible ? 'border-rose-500/40 bg-rose-950/10' : 'border-white/10'}`}>
      
      {/* Subject Header with Specific Warning Tag */}
      <div className="p-5 pb-3 flex justify-between items-start border-b border-white/5">
        <div className="pr-2">
          <h3 className="text-base font-bold text-slate-100 leading-snug line-clamp-2" title={subject}>
            {subject}
          </h3>
          {/* Individual Subject Warning Badge */}
          <div className="mt-1.5">
            {stats.isImpossible ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                ⚠️ Detention Unavoidable
              </span>
            ) : stats.currentPercent < 75 ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ⚠️ Low Attendance Alert
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ✓ Safe Standing
              </span>
            )}
          </div>
        </div>

        <span className={`text-xs font-bold px-3 py-1 rounded-full border backdrop-blur-md shrink-0 ${statusColor}`}>
          {stats.currentPercent}%
        </span>
      </div>

      {/* Numerical Stats */}
      <div className="p-5 pb-2 grid grid-cols-3 gap-2 text-center">
        <div className="flex flex-col bg-white/[0.03] p-2 rounded-lg border border-white/5">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Attended</span>
          <span className="text-lg font-bold text-slate-200">{stats.attended}</span>
        </div>
        <div className="flex flex-col bg-white/[0.03] p-2 rounded-lg border border-white/5">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Conducted</span>
          <span className="text-lg font-bold text-slate-200">{stats.conducted}</span>
        </div>
        <div className="flex flex-col bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
          <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mb-1">Left</span>
          <span className="text-lg font-bold text-indigo-200">{stats.remaining}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-5 py-4">
        <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden border border-white/5">
          <div 
            className={`h-full ${progressGradient} transition-all duration-1000 ease-out`} 
            style={{ width: `${Math.min(stats.currentPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Action / Recovery Strategy */}
      <div className="mt-auto p-5 pt-3 bg-white/[0.02] border-t border-white/5 space-y-2.5">
        {stats.isImpossible ? (
          <div className="text-rose-300 text-xs bg-rose-950/40 p-3 rounded-lg border border-rose-500/30">
            <strong className="block text-rose-400 font-bold uppercase text-[10px] mb-0.5">Critical Notice</strong>
            Even attending all {stats.remaining} remaining periods cannot hit 75%.
          </div>
        ) : (
          <>
            {stats.currentPercent < 75 ? (
              <div className="flex justify-between items-center text-xs bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                <span className="text-rose-300 font-semibold">Deficit to 75%:</span>
                <span className="font-extrabold text-rose-200 bg-rose-500/30 px-2 py-0.5 rounded">
                  Must attend next {stats.requiredFor75}
                </span>
              </div>
            ) : (
              <div className="flex justify-between items-center text-xs bg-purple-500/10 p-2.5 rounded-lg border border-purple-500/20">
                <span className="text-purple-300 font-semibold">Safe Bunks Left:</span>
                <span className="font-extrabold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                  {stats.safeBunks} periods
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-[11px] pt-1">
              <span className="text-indigo-300/70">90% Target:</span>
              <span className="font-bold text-indigo-300">
                {stats.requiredFor90 > stats.remaining ? 'Impossible' : `Attend ${stats.requiredFor90}`}
              </span>
            </div>
          </>
        )}
      </div>

    </div>
  );
}