import React from 'react';

export default function BuildingMap3D({ 
  rooms, 
  activeFloor, 
  setActiveFloor, 
  selectedRoom, 
  onSelectRoom 
}) {
  return (
    <div className="glass-card p-6 border border-purple-500/20 backdrop-blur-2xl relative overflow-hidden mb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            Interactive 3D Visual Map — Floor {activeFloor}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Isometric architectural layout. Click any room block to inspect countdown & invite squad.
          </p>
        </div>

        {/* Mini Floor Switcher */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
          {[1, 2, 3, 4, 5, 6].map(fl => (
            <button
              key={fl}
              type="button"
              onClick={() => setActiveFloor(fl)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFloor === fl
                  ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              F{fl}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Isometric View Container */}
      <div className="relative py-8 px-4 flex items-center justify-center min-h-[320px] bg-gradient-to-b from-[#0a0520]/80 to-[#02000c]/80 rounded-2xl border border-white/5 overflow-x-auto">
        <div 
          className="grid grid-cols-5 sm:grid-cols-6 gap-3 sm:gap-4 transition-transform duration-500 ease-out"
          style={{
            transform: 'perspective(900px) rotateX(25deg) rotateZ(-6deg)',
            transformStyle: 'preserve-3d'
          }}
        >
          {rooms.map(room => {
            const isSelected = selectedRoom?.roomId === room.roomId;
            return (
              <div
                key={room.roomId}
                onClick={() => onSelectRoom(room)}
                className={`relative p-3.5 rounded-xl cursor-pointer transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 flex flex-col justify-between items-center text-center select-none ${
                  isSelected
                    ? 'ring-2 ring-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.8)] scale-105'
                    : ''
                } ${
                  room.isFree
                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 shadow-[0_4px_20px_rgba(16,185,129,0.25)]'
                    : 'bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/40 shadow-[0_4px_15px_rgba(244,63,94,0.15)] opacity-85'
                }`}
                style={{
                  minWidth: '72px',
                  minHeight: '75px',
                  boxShadow: room.isFree 
                    ? '0 10px 0 rgba(5, 150, 105, 0.4), 0 15px 20px rgba(0,0,0,0.5)' 
                    : '0 10px 0 rgba(225, 29, 72, 0.3), 0 15px 20px rgba(0,0,0,0.5)'
                }}
              >
                {/* 3D Roof Cap indicator */}
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-mono font-bold text-slate-300">
                    {room.roomId}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${room.isFree ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                </div>

                <span className={`text-[9px] font-black uppercase tracking-wider px-1 py-0.5 rounded ${
                  room.isFree ? 'text-emerald-300' : 'text-rose-300'
                }`}>
                  {room.isFree ? 'FREE' : 'BUSY'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-4 px-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            Free Classroom
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
            Class Scheduled
          </span>
        </div>
        <span className="text-purple-300 font-mono">Tip: Select a room block to open Squad Share</span>
      </div>
    </div>
  );
}