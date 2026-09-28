import React, { useState } from 'react';

const FLOORS = ["Ground Floor", "1st Floor", "2nd Floor", "3rd Floor"];

export default function FloorGrid({ roomsList }) {
  const [selectedFloor, setSelectedFloor] = useState("All");

  const filteredRooms = selectedFloor === "All" 
    ? roomsList 
    : roomsList.filter(r => r.floor === selectedFloor);

  return (
    <div className="space-y-6">
      {/* Floor Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-white/10 pb-3">
        {["All", ...FLOORS].map(fl => (
          <button
            key={fl}
            onClick={() => setSelectedFloor(fl)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedFloor === fl
                ? 'bg-purple-600/30 border border-purple-400/50 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                : 'bg-white/[0.03] border border-white/5 text-slate-400 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            {fl}
          </button>
        ))}
      </div>

      {/* Room Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRooms.map(room => (
          <div
            key={room.roomId}
            className={`glass-card p-5 border transition-all duration-300 ${
              room.isFree
                ? 'border-emerald-500/30 hover:border-emerald-400/60 bg-emerald-950/5'
                : 'border-rose-500/30 hover:border-rose-400/50 bg-rose-950/5 opacity-80'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  {room.floor}
                </span>
                <h4 className="text-lg font-black text-slate-100">{room.name}</h4>
              </div>
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                  room.isFree
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}
              >
                {room.isFree ? "● FREE NOW" : "✕ OCCUPIED"}
              </span>
            </div>

            {/* Room Features */}
            <div className="flex flex-wrap gap-1.5 mb-4 text-[10px]">
              <span className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/10 text-slate-300">
                👥 {room.capacity} Seats
              </span>
              {room.isAC && (
                <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300">
                  ❄️ AC
                </span>
              )}
              {room.hasProjector && (
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                  📽️ Projector
                </span>
              )}
            </div>

            {/* Occupancy Detail */}
            <div className="pt-3 border-t border-white/5 flex justify-between items-center text-xs">
              {room.isFree ? (
                <span className="text-emerald-300 font-semibold flex items-center gap-1">
                  ✓ Safe for next {room.freeForPeriods} period(s)
                </span>
              ) : (
                <div className="text-rose-300/80 truncate">
                  <span className="font-semibold">{room.occupiedBy}</span>
                  <span className="text-[10px] text-slate-400 block truncate">{room.currentSubject}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}