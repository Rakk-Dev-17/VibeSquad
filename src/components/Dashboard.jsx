import React, { useState, useEffect } from 'react';
import SubjectCard from './SubjectCard';
import SemesterDatePicker from './SemesterDatePicker';
import Sidebar from './Sidebar';
import VisualAnalytics from './VisualAnalytics';
import FloatingAIChat from './FloatingAIChat';
import timetablesData from '../data/timetables.json';
import { 
  calculateRemainingClasses, 
  calculateAttendanceStats, 
  calculateSingleDayClasses,
  parseDateString
} from '../utils/attendanceMath';

export default function Dashboard() {
  const [inputRollNo, setInputRollNo] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | 'analytics'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState('2026-09-17');
  const [toDate, setToDate] = useState(timetablesData.semester.endDate);
  const [subjectInputs, setSubjectInputs] = useState({});
  const [results, setResults] = useState(null);
  const [saveNotification, setSaveNotification] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('active_attendance_roll');
    if (savedUser) {
      loadUserData(savedUser);
    }
  }, []);

  const getDayName = (dateStr) => {
    if (!dateStr) return '';
    const d = parseDateString(dateStr);
    return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()];
  };

  const getSubjectsForSection = (sectionId) => {
    const section = timetablesData.sections.find(sec => sec.sectionId === sectionId);
    if (!section || !section.schedule) return [];
    const subjects = new Set();
    Object.values(section.schedule).forEach(dayList => {
      if (Array.isArray(dayList)) {
        dayList.forEach(sub => subjects.add(sub));
      }
    });
    return Array.from(subjects);
  };

  const recomputeInitialInputs = (sectionId, dateStr, existingInputs = {}) => {
    const sectionData = timetablesData.sections.find(sec => sec.sectionId === sectionId);
    if (!sectionData) return {};
    const subjects = getSubjectsForSection(sectionId);
    const initialInputs = {};
    
    subjects.forEach(sub => {
      const singleDayPeriods = calculateSingleDayClasses(
        sub, 
        sectionData.schedule, 
        timetablesData.semester, 
        dateStr
      );
      initialInputs[sub] = { 
        attended: existingInputs[sub]?.attended ?? '', 
        conducted: singleDayPeriods 
      };
    });
    return initialInputs;
  };

  const loadUserData = (roll) => {
    setCurrentUser(roll);
    localStorage.setItem('active_attendance_roll', roll);

    const storedData = localStorage.getItem(`attendance_records_${roll}`);
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        if (parsed.selectedSection) {
          setSelectedSection(parsed.selectedSection);
          const computed = recomputeInitialInputs(
            parsed.selectedSection, 
            parsed.selectedDate || '2026-09-17', 
            parsed.subjectInputs || {}
          );
          setSubjectInputs(computed);
          setSelectedDate(parsed.selectedDate || '2026-09-17');
          setToDate(parsed.toDate || timetablesData.semester.endDate);
          setResults(parsed.results || null);
        }
      } catch (e) {
        console.error("Could not parse saved student records", e);
      }
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const cleanRoll = inputRollNo.trim().toUpperCase();
    if (!cleanRoll) return;
    loadUserData(cleanRoll);
  };

  const handleLogout = () => {
    localStorage.removeItem('active_attendance_roll');
    setCurrentUser(null);
    setInputRollNo('');
    setSelectedSection('');
    setSubjectInputs({});
    setResults(null);
    setSaveNotification('');
  };

  const handleSectionChange = (e) => {
    const sectionId = e.target.value;
    setSelectedSection(sectionId);
    setResults(null);
    setSubjectInputs(recomputeInitialInputs(sectionId, selectedDate));
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    setResults(null);
    if (selectedSection) {
      setSubjectInputs(recomputeInitialInputs(selectedSection, newDate, subjectInputs));
    }
  };

  const handleToDateChange = (newTo) => {
    setToDate(newTo);
    setResults(null);
  };

  const handleInputChange = (subject, field, value) => {
    setSubjectInputs(prev => ({
      ...prev,
      [subject]: { 
        ...prev[subject], 
        [field]: value === '' ? '' : Math.max(0, parseInt(value, 10) || 0)
      }
    }));
  };

  const handleCalculateAndSave = () => {
    const sectionData = timetablesData.sections.find(sec => sec.sectionId === selectedSection);
    if (!sectionData || !currentUser) return;
    
    const stats = {};
    Object.keys(subjectInputs).forEach(subject => {
      const attendedVal = subjectInputs[subject].attended === '' ? 0 : Number(subjectInputs[subject].attended);
      const conductedVal = subjectInputs[subject].conducted === '' ? 0 : Number(subjectInputs[subject].conducted);
      
      const remaining = calculateRemainingClasses(
        subject, 
        sectionData.schedule, 
        timetablesData.semester, 
        toDate, 
        selectedDate
      );
      stats[subject] = calculateAttendanceStats(attendedVal, conductedVal, remaining);
    });

    setResults(stats);

    const payload = {
      rollNumber: currentUser,
      selectedSection,
      selectedDate,
      toDate,
      subjectInputs,
      results: stats,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(`attendance_records_${currentUser}`, JSON.stringify(payload));
    setSaveNotification(`Record synced & saved for ${currentUser}`);
    setTimeout(() => setSaveNotification(''), 4000);
  };

  const dayOfWeek = getDayName(selectedDate);
  const isWeekend = dayOfWeek === "Saturday" || dayOfWeek === "Sunday";

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#030014]">
        <div className="glass-card p-10 w-full max-w-md border border-purple-500/30 text-center animate-[fadeIn_0.5s_ease-out]">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2 uppercase tracking-wider">
            Student Portal
          </h1>
          <p className="text-slate-400 text-sm mb-8">Enter your Roll Number to initialize your predictive attendance dashboard.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-left">
              <label className="block text-indigo-300 text-xs uppercase tracking-widest font-bold mb-2">
                Roll Number
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 713324001 or RA241..."
                value={inputRollNo}
                onChange={(e) => setInputRollNo(e.target.value)}
                className="w-full glass-input p-4 rounded-xl text-center text-lg font-bold tracking-wider uppercase text-slate-100 placeholder-slate-600"
              />
            </div>
            <button
              type="submit"
              className="w-full relative group overflow-hidden bg-white/[0.08] hover:bg-white/[0.14] active:scale-95 border border-white/20 hover:border-purple-400/50 backdrop-blur-2xl p-4 rounded-xl font-bold transition-all shadow-[0_8px_32px_rgba(99,102,241,0.25)] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] uppercase tracking-widest cursor-pointer text-slate-100"
            >
              <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-indigo-200 to-pink-200">
                Access Dashboard
              </span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#030014] text-slate-200">
      <Sidebar
        currentUser={currentUser}
        selectedSection={selectedSection}
        results={results}
        activeView={activeView}
        setActiveView={setActiveView}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <main className="flex-1 p-6 lg:p-10 overflow-y-auto max-w-7xl">
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 uppercase tracking-tight">
              {activeView === 'analytics' ? 'Visual Analytics Engine' : 'Attendance Intelligence'}
            </h1>
            <p className="text-xs text-purple-300/60 font-semibold tracking-widest uppercase mt-1">
              Semester Window: Aug 29, 2026 — Nov 29, 2026
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {saveNotification && (
              <span className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-[fadeIn_0.3s_ease-out]">
                ✓ {saveNotification}
              </span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs font-bold text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-3.5 py-2 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>

        {activeView === 'analytics' ? (
          <VisualAnalytics 
            results={results} 
            selectedSection={selectedSection} 
            currentUser={currentUser} 
          />
        ) : (
          <>
            <div className="glass-card p-6 lg:p-8 mb-10 border border-purple-500/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                  <label className="block text-indigo-300 text-xs uppercase tracking-widest font-bold mb-2">
                    Class Section
                  </label>
                  <select 
                    value={selectedSection}
                    onChange={handleSectionChange}
                    className="w-full glass-input p-3.5 rounded-xl text-sm appearance-none cursor-pointer"
                  >
                    <option value="" disabled className="bg-slate-900">Select section...</option>
                    {timetablesData.sections.map(sec => (
                      <option key={sec.sectionId} value={sec.sectionId} className="bg-slate-900">
                        {sec.sectionId}
                      </option>
                    ))}
                  </select>
                </div>

                <SemesterDatePicker
                  label="Selected Date"
                  selectedDate={selectedDate}
                  onDateChange={handleDateChange}
                  minDateStr={timetablesData.semester.startDate}
                  maxDateStr={timetablesData.semester.endDate}
                />

                <SemesterDatePicker
                  label="To Date (Planning Target)"
                  selectedDate={toDate}
                  onDateChange={handleToDateChange}
                  minDateStr={selectedDate}
                  maxDateStr={timetablesData.semester.endDate}
                />
              </div>

              {selectedDate && (
                <div className="mb-6 px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 flex justify-between items-center">
                  <span>Selected Planning Day: <strong>{selectedDate}</strong> ({dayOfWeek})</span>
                  {isWeekend && <span className="text-rose-400 font-bold uppercase">Weekend: Strictly 0 Periods</span>}
                </div>
              )}

              {selectedSection && Object.keys(subjectInputs).length > 0 && (
                <div className="animate-[fadeIn_0.4s_ease-out]">
                  <h3 className="text-slate-200 font-semibold mb-6 border-b border-white/10 pb-3">
                    Attendance Parameters for {selectedDate} ({dayOfWeek})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {Object.keys(subjectInputs).map(subject => (
                      <div key={subject} className="bg-white/[0.03] p-5 rounded-xl border border-white/5 shadow-inner">
                        <p className="text-sm font-bold text-indigo-300 mb-4 truncate" title={subject}>
                          {subject}
                        </p>
                        <div className="flex space-x-4">
                          <div className="w-1/2">
                            <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 pl-1">
                              Attended
                            </label>
                            <input 
                              type="number" 
                              placeholder="0"
                              value={subjectInputs[subject].attended}
                              onChange={(e) => handleInputChange(subject, 'attended', e.target.value)}
                              className="w-full glass-input p-3 rounded-lg text-center font-bold text-slate-200"
                            />
                          </div>
                          <div className="w-1/2">
                            <label className="block text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1 pl-1">
                              Conducted on this Day
                            </label>
                            <input 
                              type="number" 
                              value={subjectInputs[subject].conducted}
                              onChange={(e) => handleInputChange(subject, 'conducted', e.target.value)}
                              className="w-full glass-input p-3 rounded-lg text-center font-bold text-indigo-200 border-indigo-500/30 bg-indigo-500/5"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Glass Edition Action Button */}
                  <button 
                    type="button"
                    onClick={handleCalculateAndSave} 
                    className="w-full relative group overflow-hidden bg-white/[0.06] hover:bg-white/[0.12] active:scale-[0.99] border border-white/20 hover:border-purple-400/50 backdrop-blur-2xl px-8 py-4 rounded-2xl font-black transition-all duration-300 shadow-[0_8px_32px_rgba(99,102,241,0.25)] hover:shadow-[0_0_35px_rgba(168,85,247,0.45)] text-lg uppercase tracking-widest cursor-pointer text-slate-100"
                  >
                    <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-purple-200 to-pink-300">
                      Calculate & Save Record
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/15 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>
                </div>
              )}
            </div>

            {results && (
              <div className="w-full animate-[fadeIn_0.5s_ease-out]">
                <h2 className="text-2xl font-bold text-slate-100 tracking-tight mb-6">
                  Subject Projection Cards
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.keys(results).map(subject => (
                    <SubjectCard key={subject} subject={subject} stats={results[subject]} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <FloatingAIChat 
          currentUser={currentUser} 
          selectedSection={selectedSection} 
          results={results} 
        />
      </main>
    </div>
  );
}