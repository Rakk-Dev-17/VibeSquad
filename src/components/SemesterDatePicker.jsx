import React, { useState, useRef, useEffect } from 'react';
import { parseDateString, formatDateString } from '../utils/attendanceMath';

export default function SemesterDatePicker({ label, selectedDate, onDateChange, minDateStr, maxDateStr }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  const minDate = parseDateString(minDateStr);
  const maxDate = parseDateString(maxDateStr);
  const current = selectedDate ? parseDateString(selectedDate) : minDate;

  const [viewYear, setViewYear] = useState(current.getFullYear());
  const [viewMonth, setViewMonth] = useState(current.getMonth()); // 0-indexed

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday

  const daysArray = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(new Date(viewYear, viewMonth, d));
  }

  const handleSelectDay = (dayObj) => {
    if (!dayObj) return;
    const dayIndex = dayObj.getDay();
    // Exclude weekends: Saturday (6) and Sunday (0)
    if (dayIndex === 0 || dayIndex === 6) return;
    if (dayObj < minDate || dayObj > maxDate) return;

    onDateChange(formatDateString(dayObj));
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 7 && viewYear === 2026) return; // August 2026 limit
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 10 && viewYear === 2026) return; // November 2026 limit
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-indigo-300 text-xs uppercase tracking-widest font-bold mb-2">
        {label}
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full glass-input p-3.5 rounded-xl text-left flex justify-between items-center text-slate-100 font-medium"
      >
        <span>{selectedDate || "Select Date"}</span>
        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 p-4 w-72 bg-slate-900/95 backdrop-blur-2xl border border-purple-500/30 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
          {/* Header Month/Year navigation */}
          <div className="flex justify-between items-center mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={viewMonth <= 7 && viewYear === 2026}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-300 disabled:opacity-20"
            >
              ◀
            </button>
            <span className="text-sm font-bold text-slate-200">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              disabled={viewMonth >= 10 && viewYear === 2026}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-300 disabled:opacity-20"
            >
              ▶
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase mb-2">
            <span className="text-slate-600">Su</span>
            <span className="text-indigo-300">Mo</span>
            <span className="text-indigo-300">Tu</span>
            <span className="text-indigo-300">We</span>
            <span className="text-indigo-300">Th</span>
            <span className="text-indigo-300">Fr</span>
            <span className="text-slate-600">Sa</span>
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {daysArray.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="p-2" />;
              }
              const dayOfWeek = day.getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const isOutOfRange = day < minDate || day > maxDate;
              const isSelected = selectedDate === formatDateString(day);

              const isDisabled = isWeekend || isOutOfRange;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDay(day)}
                  className={`p-2 rounded-lg transition-colors font-medium ${
                    isSelected
                      ? 'bg-purple-600 text-white font-bold shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                      : isDisabled
                      ? 'text-slate-600 opacity-40 cursor-not-allowed bg-white/[0.01]'
                      : 'text-slate-200 hover:bg-purple-500/20 hover:text-purple-300'
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-500 text-center mt-3 border-t border-white/5 pt-2">
            Sat/Sun & out-of-semester dates disabled
          </p>
        </div>
      )}
    </div>
  );
}