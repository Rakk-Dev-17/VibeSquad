import React, { useState, useEffect } from 'react';

export default function RoomDetailModal({ 
  room, 
  currentSlot, 
  onClose, 
  onToggleStatus 
}) {
  if (!room) return null;

  // Calculate live countdown timer
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // Extract end time string for current slot (e.g., "11:45")
  const getEndTime = () => {
    if (!currentSlot?.time) return "2:30 PM";
    const parts = currentSlot.time.split('-');
    return parts[1]?.trim() || "2:30 PM";
  };

  const endTimeStr = getEndTime();

  useEffect(() => {
    const calculateSecondsRemaining = () => {
      const now = new Date();
      // Match currentSlot end time or provide a realistic dynamic countdown based on minutes
      const [endHours, endMinutes] = endTimeStr.includes(':') 
        ? endTimeStr.replace(/[^0-9:]/g, '').split(':').map(Number)
        : [14, 30];

      const target = new Date();
      // Adjust standard 12/24 hour format for campus time slots
      const adjustedHour = (endHours < 8 && endHours > 0) ? endHours + 12 : endHours;
      target.setHours(adjustedHour, endMinutes || 0, 0, 0);

      let diff = Math.floor((target.getTime() - now.getTime()) / 1000);

      // Fallback demo timer if period is past current local time
      if (diff <= 0) {
        diff = ((45 * 60) - (Math.floor(now.getTime() / 1000) % (45 * 60)));
      }

      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setTimeLeft({ hours: h, minutes: m, seconds: s });
    };

    calculateSecondsRemaining();
    const interval = setInterval(calculateSecondsRemaining, 1000);
    return () => clearInterval(interval);
  }, [endTimeStr]);

  // "Call the Squad" Feature
  const handleCallSquadWhatsApp = () => {
    const shareMessage = `📍 Heading to Room ${room.roomId}! It's free until ${endTimeStr}. Come fast!`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
      <div className="glass-card max-w-md w-full p-6 sm:p-8 border border-purple-500/40 relative shadow-[0_0_50px_rgba(168,85,247,0.3)]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Room Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl font-mono border ${
            room.isFree
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
          }`}>
            {room.roomId}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400">
                {room.floorLabel}
              </span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                room.isFree
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}>
                {room.isFree ? "Free Classroom" : "Occupied"}
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-100">Room {room.roomId}</h2>
          </div>
        </div>

        {/* LIVE COUNTDOWN TIMER */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 mb-6 text-center">
          <span className="text-[10px] uppercase font-bold tracking-widest text-purple-300 block mb-1">
            {room.isFree ? "⏳ Free Time Remaining Until Next Lecture" : "⏳ Time Remaining in Ongoing Class"}
          </span>
          <div className="flex items-center justify-center gap-2 text-2xl sm:text-3xl font-black font-mono text-white tracking-wider">
            <span className="bg-black/50 px-3 py-1.5 rounded-xl border border-white/10">
              {String(timeLeft.hours).padStart(2, '0')}h
            </span>
            <span className="text-purple-400 animate-pulse">:</span>
            <span className="bg-black/50 px-3 py-1.5 rounded-xl border border-white/10">
              {String(timeLeft.minutes).padStart(2, '0')}m
            </span>
            <span className="text-purple-400 animate-pulse">:</span>
            <span className="bg-black/50 px-3 py-1.5 rounded-xl border border-white/10 text-emerald-400">
              {String(timeLeft.seconds).padStart(2, '0')}s
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Scheduled period boundary concludes at <strong className="text-slate-200">{endTimeStr}</strong>.
          </p>
        </div>

        {/* Status context */}
        <div className="mb-6 p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-slate-300">
          {room.isFree ? (
            <span>✅ <strong>Clear for Study & Collab:</strong> No scheduled lectures or conflicting sections in this period.</span>
          ) : (
            <span>⚠️ <strong>Class in session:</strong> {room.occupiedBy ? `Allocated to ${room.occupiedBy}` : 'Academic lecture active'}.</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* CALL THE SQUAD BUTTON */}
          <button
            type="button"
            onClick={handleCallSquadWhatsApp}
            className="w-full relative group overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white p-3.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
            <span>Call the Squad (Share on WhatsApp)</span>
          </button>

          {/* Toggle status */}
          <button
            type="button"
            onClick={() => onToggleStatus(room.roomId, room.isFree)}
            className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              room.isFree
                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}
          >
            {room.isFree ? "Mark as Occupied" : "Mark as Free"}
          </button>
        </div>
      </div>
    </div>
  );
}