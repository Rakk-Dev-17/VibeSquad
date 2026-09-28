import React from 'react';

export default function Sidebar({ 
  currentUser, 
  selectedSection, 
  results, 
  activeView, 
  setActiveView, 
  onLogout,
  isCollapsed,
  setIsCollapsed
}) {
  let overallPercentage = 0;
  if (results && Object.keys(results).length > 0) {
    let totalAttended = 0;
    let totalConducted = 0;
    Object.values(results).forEach((r) => {
      totalAttended += Number(r.attended) || 0;
      totalConducted += Number(r.conducted) || 0;
    });
    if (totalConducted > 0) {
      overallPercentage = ((totalAttended / totalConducted) * 100).toFixed(1);
    }
  }

  const isLow = overallPercentage < 75 && overallPercentage > 0;

  return (
    <aside 
      className={`relative bg-slate-950/80 backdrop-blur-2xl border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out z-30 ${
        isCollapsed ? 'lg:w-20 p-4' : 'lg:w-72 p-6'
      }`}
    >
      {/* Toggle Button on Border */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden lg:flex absolute -right-3.5 top-8 w-7 h-7 rounded-full bg-slate-900 border border-purple-500/40 text-purple-300 items-center justify-center hover:bg-purple-600 hover:text-white transition-all shadow-[0_0_12px_rgba(168,85,247,0.4)] z-50 cursor-pointer"
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <svg 
          className={`w-3.5 h-3.5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div>
        {/* Branding Header */}
        <div className={`flex items-center mb-8 ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)] shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden transition-opacity duration-200">
              <h2 className="text-base font-black tracking-wider text-slate-100 uppercase">VibeCraft</h2>
              <p className="text-[10px] text-purple-400 uppercase tracking-widest font-semibold">Attendance AI</p>
            </div>
          )}
        </div>

        {/* Student Profile Snapshot */}
        {!isCollapsed ? (
          <div className="glass-card p-4 mb-6 border border-white/5 bg-white/[0.02] animate-[fadeIn_0.2s_ease-out]">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Student Record</p>
            <p className="text-sm font-bold text-slate-200 tracking-wide truncate">{currentUser}</p>
            <div className="mt-2 flex items-center space-x-2">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 truncate">
                {selectedSection || "Section Unassigned"}
              </span>
            </div>
          </div>
        ) : (
          <div className="mb-6 flex justify-center" title={`${currentUser} (${selectedSection || 'No Section'})`}>
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-indigo-300">
              {currentUser ? currentUser.slice(-2) : "??"}
            </div>
          </div>
        )}

        {/* Standing Metric Card */}
        {!isCollapsed ? (
          <div className="glass-card p-4 mb-6 border border-purple-500/20 bg-gradient-to-b from-purple-500/10 to-transparent">
            <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block mb-1">
              Current Standing
            </span>
            <div className="flex items-baseline space-x-2">
              <span className={`text-3xl font-black ${isLow ? 'text-rose-400' : 'text-emerald-400'}`}>
                {overallPercentage}%
              </span>
              <span className="text-xs text-slate-400 font-medium">aggregate</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 mt-3 overflow-hidden border border-white/5">
              <div 
                className={`h-full ${isLow ? 'bg-rose-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'} transition-all duration-700`}
                style={{ width: `${Math.min(overallPercentage, 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <div 
            className="mb-6 flex flex-col items-center justify-center p-2 rounded-xl bg-purple-500/10 border border-purple-500/20"
            title={`Standing: ${overallPercentage}%`}
          >
            <span className={`text-xs font-black ${isLow ? 'text-rose-400' : 'text-emerald-400'}`}>
              {overallPercentage}%
            </span>
          </div>
        )}

        {/* Navigation Elements */}
        <nav className="space-y-2">
          <button
            type="button"
            onClick={() => setActiveView('dashboard')}
            title="Dashboard"
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'space-x-3 px-4'} py-3 rounded-xl text-sm font-semibold transition-all ${
              activeView === 'dashboard'
                ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-white border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <svg className="w-5 h-5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            {!isCollapsed && <span>Dashboard</span>}
          </button>

          <button
            type="button"
            onClick={() => setActiveView('analytics')}
            title="Visual Analytics"
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'space-x-3 px-4'} py-3 rounded-xl text-sm font-semibold transition-all ${
              activeView === 'analytics'
                ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-white border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <svg className="w-5 h-5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            {!isCollapsed && <span>Visual Analytics</span>}
          </button>
        </nav>
      </div>

      {/* Logout Action */}
      <div className="pt-6 border-t border-white/5">
        <button
          type="button"
          onClick={onLogout}
          title="Logout / Switch User"
          className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'justify-center space-x-2 p-3'} text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-all`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}