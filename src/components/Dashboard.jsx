import React, { useState, useEffect, useMemo } from 'react';
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

// Exact 8-Hour Timetable Schedule Timings
const PERIOD_SLOTS = [
  { id: 1, label: "1st Hour", time: "9:00 AM - 9:50 AM", endTime: "9:50 AM" },
  { id: 2, label: "2nd Hour", time: "9:50 AM - 10:40 AM", endTime: "10:40 AM" },
  { id: 3, label: "3rd Hour", time: "10:50 AM - 11:40 AM", endTime: "11:40 AM" },
  { id: 4, label: "4th Hour", time: "11:40 AM - 12:30 PM", endTime: "12:30 PM" },
  { id: 5, label: "5th Hour", time: "1:20 PM - 2:10 PM", endTime: "2:10 PM" },
  { id: 6, label: "6th Hour", time: "2:10 PM - 3:00 PM", endTime: "3:00 PM" },
  { id: 7, label: "7th Hour", time: "3:10 PM - 4:00 PM", endTime: "4:00 PM" },
  { id: 8, label: "8th Hour", time: "4:00 PM - 4:50 PM", endTime: "4:50 PM" }
];

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// Permanent Classrooms mapped across Floors 1 to 6
const PERMANENT_ROOMS = [
  // Floor 1
  { 
    roomId: "IST 102", 
    roomNumber: "102",
    floorNum: 1, 
    floorLabel: "Floor 1", 
    assignedSection: "I-Biotech & BME",
    schedule: {
      Monday: ["C-520", "YOGA", "YOGA", "F-710", "E", "E", "A", "B"],
      Tuesday: ["C-520", "CDC-710", "CDC-710", "F-710", "FREE", "B", "A", "D"],
      Wednesday: ["Workshop", "Workshop", "Workshop", "FREE", "D", "B", "E", "D"],
      Thursday: ["A-710", "Che Lab", "Che Lab", "C-510", "FREE", "B", "Japanese", "FREE"],
      Friday: ["A", "F", "CDC", "FREE", "Japanese", "FREE", "PPS Lab", "PPS Lab"]
    }
  },
  { 
    roomId: "IST 108", 
    roomNumber: "108",
    floorNum: 1, 
    floorLabel: "Floor 1", 
    assignedSection: "SEEE Embedded & DSP Lab",
    schedule: {
      Monday: ["FREE", "FREE", "MPMC LAB", "MPMC LAB", "FREE", "FREE", "FREE", "FREE"],
      Tuesday: ["BIO DSP LAB", "BIO DSP LAB", "FREE", "FREE", "FREE", "FREE", "FREE", "FREE"],
      Wednesday: ["FREE", "LAB-108", "FREE", "FREE", "FREE", "FREE", "PCB-108", "PCB-108"],
      Thursday: ["FREE", "FREE", "I-108", "LAB-108", "FREE", "FREE", "FREE", "FREE"],
      Friday: ["I-108", "FREE", "FREE", "FREE", "FREE", "FREE", "LAB-108", "LAB-108"]
    }
  },

  // Floor 2
  { 
    roomId: "IST 211", 
    roomNumber: "211",
    floorNum: 2, 
    floorLabel: "Floor 2", 
    assignedSection: "III-BME",
    schedule: {
      Monday: ["G-625", "FREE", "MPMC LAB-107", "MPMC LAB-107", "E", "B", "F", "H"],
      Tuesday: ["BIO DSP LAB-108", "BIO DSP LAB-108", "G-625", "FREE", "C", "D", "A", "B"],
      Wednesday: ["FREE", "FREE", "FREE", "FREE", "C", "A", "F", "D"],
      Thursday: ["FREE", "FREE", "I-108", "FREE", "A", "C", "E", "B"],
      Friday: ["I-108", "FREE", "FREE", "FREE", "F", "A", "D", "E"]
    }
  },
  { 
    roomId: "IST 225", 
    roomNumber: "225",
    floorNum: 2, 
    floorLabel: "Floor 2", 
    assignedSection: "IV-ECE-A",
    schedule: {
      Monday: ["C", "D", "A", "D", "FREE", "FREE", "FREE", "FREE"],
      Tuesday: ["C", "FREE", "B", "F", "FREE", "FREE", "FREE", "FREE"],
      Wednesday: ["B", "LAB-108", "E", "F", "FREE", "FREE", "FREE", "FREE"],
      Thursday: ["F", "A", "E", "B", "FREE", "FREE", "FREE", "FREE"],
      Friday: ["C", "A", "D", "E", "FREE", "FREE", "FREE", "FREE"]
    }
  },
  { 
    roomId: "IST 227", 
    roomNumber: "227",
    floorNum: 2, 
    floorLabel: "Floor 2", 
    assignedSection: "IV-ECE-B",
    schedule: {
      Monday: ["C", "A", "E", "F", "FREE", "FREE", "FREE", "FREE"],
      Tuesday: ["C", "E", "B", "B", "FREE", "FREE", "FREE", "FREE"],
      Wednesday: ["C", "D", "F", "A", "FREE", "FREE", "FREE", "FREE"],
      Thursday: ["D", "B", "A", "LAB-108", "FREE", "FREE", "FREE", "FREE"],
      Friday: ["E", "D", "F", "FREE", "FREE", "FREE", "FREE", "FREE"]
    }
  },

  // Floor 3
  { 
    roomId: "IST 309", 
    roomNumber: "309",
    floorNum: 3, 
    floorLabel: "Floor 3", 
    assignedSection: "Digital IC & Simulation Lab",
    schedule: {
      Monday: ["FREE", "LAB-309", "FREE", "FREE", "FREE", "FREE", "LAB-309", "LAB-309"],
      Tuesday: ["FREE", "LAB-309", "FREE", "FREE", "FREE", "FREE", "FREE", "FREE"],
      Wednesday: ["FREE", "FREE", "FREE", "FREE", "FREE", "FREE", "FREE", "FREE"],
      Thursday: ["FREE", "FREE", "FREE", "FREE", "FREE", "LAB-309", "LAB-309", "FREE"],
      Friday: ["FREE", "FREE", "FREE", "FREE", "FREE", "FREE", "FREE", "FREE"]
    }
  },

  // Floor 4
  { 
    roomId: "IST 411", 
    roomNumber: "411",
    floorNum: 4, 
    floorLabel: "Floor 4", 
    assignedSection: "II-ECE-DS-B",
    schedule: {
      Monday: ["FREE", "LAB-309", "D", "B", "FREE", "C", "I", "A"],
      Tuesday: ["FREE", "LAB-309", "C", "D", "FREE", "E", "FREE", "FREE"],
      Wednesday: ["G-401", "FREE", "FREE", "I", "FREE", "E", "A", "D"],
      Thursday: ["G-401", "H-TB-106", "A", "C", "FREE", "FREE", "B", "E"],
      Friday: ["H-TB-106", "FREE", "F", "A", "FREE", "FREE", "B", "C"]
    }
  },
  { 
    roomId: "IST 416", 
    roomNumber: "416",
    floorNum: 4, 
    floorLabel: "Floor 4", 
    assignedSection: "II-ECE-DS-A",
    schedule: {
      Monday: ["E", "A", "FREE", "I", "FREE", "G-602", "LAB-309", "LAB-309"],
      Tuesday: ["C", "A", "E", "D", "FREE", "G-602", "H-TB-106", "FREE"],
      Wednesday: ["A", "B", "C", "D", "FREE", "H-TB-106", "FREE", "FREE"],
      Thursday: ["B", "C", "A", "F", "FREE", "LAB-309", "LAB-309", "FREE"],
      Friday: ["D", "B", "E", "C", "FREE", "FREE", "FREE", "FREE"]
    }
  },

  // Floor 5
  { 
    roomId: "IST 502", 
    roomNumber: "502",
    floorNum: 5, 
    floorLabel: "Floor 5", 
    assignedSection: "I-ECE-DS",
    schedule: {
      Monday: ["F-710", "FREE", "PCB-617", "PCB-617", "E", "E", "B", "A"],
      Tuesday: ["Che Lab", "Che Lab", "NSS-201", "NSS-201", "C", "B", "A", "D"],
      Wednesday: ["CDC-510", "CDC-510", "A-710", "FREE", "PPS Lab", "B", "E", "D"],
      Thursday: ["F-710", "A-510", "D-710", "FREE", "German", "FREE", "C", "B"],
      Friday: ["FREE", "German", "FREE", "PPS Lab", "Workshop", "Workshop", "FREE", "FREE"]
    }
  },
  { 
    roomId: "IST 518", 
    roomNumber: "518",
    floorNum: 5, 
    floorLabel: "Floor 5", 
    assignedSection: "III-ECE-A / III-ECE-B",
    schedule: {
      Monday: ["E", "B", "B", "A", "E", "B", "A", "D"],
      Tuesday: ["H", "D", "B", "B-Proj", "F", "B", "D", "C"],
      Wednesday: ["C", "A", "D", "F", "B-Proj", "B", "A", "H"],
      Thursday: ["A", "E", "C", "F", "A", "C", "E", "F"],
      Friday: ["D", "A", "E", "C", "C", "A", "E", "D"]
    }
  },
  { 
    roomId: "IST 519", 
    roomNumber: "519",
    floorNum: 5, 
    floorLabel: "Floor 5", 
    assignedSection: "III-ECE-DS",
    schedule: {
      Monday: ["E", "B", "C", "A", "FREE", "LAB-108", "LAB-108", "G-625"],
      Tuesday: ["C", "B", "D", "F", "FREE", "FREE", "FREE", "FREE"],
      Wednesday: ["H", "B", "A", "C", "FREE", "FREE", "FREE", "FREE"],
      Thursday: ["A", "D", "E", "F", "FREE", "FREE", "FREE", "FREE"],
      Friday: ["D", "A", "E", "B-Proj", "FREE", "G-625", "LAB-108", "LAB-108"]
    }
  },

  // Floor 6
  { 
    roomId: "IST 602", 
    roomNumber: "602",
    floorNum: 6, 
    floorLabel: "Floor 6", 
    assignedSection: "II-BME & I-ECE-A/B",
    schedule: {
      Monday: ["E", "C", "B", "A", "FREE", "Che Lab", "F-710", "CDC-710"],
      Tuesday: ["C", "E", "A", "D", "FREE", "Workshop", "Workshop", "FREE"],
      Wednesday: ["B", "D", "D", "FREE", "PPS Lab", "PPS Lab", "PCB-108", "PCB-108"],
      Thursday: ["A", "E", "German", "A", "CDC-510", "CDC-510", "NSS-201", "NSS-201"],
      Friday: ["F", "A", "C", "B", "F", "German", "FREE", "G-602"]
    }
  }
];

const AVAILABLE_FLOORS = [
  { label: "All", value: "All" },
  { label: "Floor 1", value: 1 },
  { label: "Floor 2", value: 2 },
  { label: "Floor 3", value: 3 },
  { label: "Floor 4", value: 4 },
  { label: "Floor 5", value: 5 },
  { label: "Floor 6", value: 6 }
];

export default function Dashboard() {
  const [inputRollNo, setInputRollNo] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  
  // Dashboard Tabs: 'rooms' | 'attendance' | 'analytics'
  const [activeTab, setActiveTab] = useState('rooms');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Attendance Persistence State
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState('2026-09-17');
  const [toDate, setToDate] = useState(timetablesData.semester.endDate);
  const [dailyLogs, setDailyLogs] = useState({});
  const [subjectInputs, setSubjectInputs] = useState({});
  const [results, setResults] = useState(null);
  const [saveNotification, setSaveNotification] = useState('');

  // Room Locator Filter State
  const [selectedFloor, setSelectedFloor] = useState("All");
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [selectedPeriodIdx, setSelectedPeriodIdx] = useState(0);
  const [roomOverrides, setRoomOverrides] = useState({});
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSearching, setAiSearching] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  // Phase 2: Live Room Countdown Timer State
  const [inspectedRoom, setInspectedRoom] = useState(null);
  const [modalSelectedDay, setModalSelectedDay] = useState("Monday");
  const [modalSelectedPeriodIdx, setModalSelectedPeriodIdx] = useState(0);
  const [liveSecondsLeft, setLiveSecondsLeft] = useState(2700);

  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

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

  const computeInputsForDate = (sectionId, dateStr, existingDailyLogs = {}) => {
    const sectionData = timetablesData.sections.find(sec => sec.sectionId === sectionId);
    if (!sectionData) return {};
    const subjects = getSubjectsForSection(sectionId);
    const dateLog = existingDailyLogs[dateStr] || {};
    const inputs = {};

    subjects.forEach(sub => {
      const scheduledConducted = calculateSingleDayClasses(
        sub,
        sectionData.schedule,
        timetablesData.semester,
        dateStr
      );
      inputs[sub] = {
        attended: dateLog[sub]?.attended !== undefined ? dateLog[sub].attended : '',
        conducted: dateLog[sub]?.conducted !== undefined ? dateLog[sub].conducted : scheduledConducted
      };
    });
    return inputs;
  };

  const computeCumulativeStats = (logs, sectionId, targetToDate, currentActiveDate) => {
    const sectionData = timetablesData.sections.find(sec => sec.sectionId === sectionId);
    if (!sectionData) return null;
    const subjects = getSubjectsForSection(sectionId);
    const stats = {};

    subjects.forEach(sub => {
      let totalAttended = 0;
      let totalConducted = 0;

      Object.values(logs).forEach(dayRecord => {
        if (dayRecord && dayRecord[sub]) {
          totalAttended += Number(dayRecord[sub].attended || 0);
          totalConducted += Number(dayRecord[sub].conducted || 0);
        }
      });

      const remaining = calculateRemainingClasses(
        sub,
        sectionData.schedule,
        timetablesData.semester,
        targetToDate,
        currentActiveDate
      );

      stats[sub] = calculateAttendanceStats(totalAttended, totalConducted, remaining);
    });

    return stats;
  };

  const loadUserData = (roll) => {
    setCurrentUser(roll);
    localStorage.setItem('active_attendance_roll', roll);

    const storedData = localStorage.getItem(`attendance_records_${roll}`);
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        const section = parsed.selectedSection || '';
        const savedDate = parsed.selectedDate || '2026-09-17';
        const savedToDate = parsed.toDate || timetablesData.semester.endDate;
        const loadedDailyLogs = parsed.dailyLogs || {};

        setSelectedSection(section);
        setSelectedDate(savedDate);
        setToDate(savedToDate);
        setDailyLogs(loadedDailyLogs);

        if (section) {
          const inputs = computeInputsForDate(section, savedDate, loadedDailyLogs);
          setSubjectInputs(inputs);
          setResults(parsed.results || computeCumulativeStats(loadedDailyLogs, section, savedToDate, savedDate));
        }
      } catch (e) {
        console.error("Could not parse saved records", e);
      }
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('active_attendance_roll');
    if (savedUser) {
      loadUserData(savedUser);
    }
    const savedRoomOverrides = localStorage.getItem('vibecraft_floor_overrides_v2');
    if (savedRoomOverrides) {
      try {
        setRoomOverrides(JSON.parse(savedRoomOverrides));
      } catch (e) {
        console.error("Could not parse room overrides", e);
      }
    }
  }, []);

  // Real-Time Countdown Ticker
  useEffect(() => {
    const currentEndTimeStr = PERIOD_SLOTS[selectedPeriodIdx]?.endTime || "2:10 PM";

    const updateCountdown = () => {
      const now = new Date();
      const [rawH, rawM] = currentEndTimeStr.replace(/[^0-9:]/g, '').split(':').map(Number);
      let adjustedH = rawH;
      if (currentEndTimeStr.toLowerCase().includes('pm') && adjustedH < 12) {
        adjustedH += 12;
      }

      const target = new Date();
      target.setHours(adjustedH, rawM || 0, 0, 0);

      let diff = Math.floor((target.getTime() - now.getTime()) / 1000);
      if (diff <= 0) {
        diff = ((50 * 60) - (Math.floor(now.getTime() / 1000) % (50 * 60)));
      }
      setLiveSecondsLeft(diff);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [selectedPeriodIdx]);

  const formattedCountdown = useMemo(() => {
    const h = Math.floor(liveSecondsLeft / 3600);
    const m = Math.floor((liveSecondsLeft % 3600) / 60);
    const s = liveSecondsLeft % 60;
    return `${String(h).padStart(2, '0')}h : ${String(m).padStart(2, '0')}m : ${String(s).padStart(2, '0')}s`;
  }, [liveSecondsLeft]);

  const handleLogin = (e) => {
    e.preventDefault();
    const clean = inputRollNo.trim().toUpperCase();
    if (!clean) return;
    loadUserData(clean);
  };

  const handleLogout = () => {
    localStorage.removeItem('active_attendance_roll');
    setCurrentUser(null);
    setInputRollNo('');
    setSelectedSection('');
    setDailyLogs({});
    setSubjectInputs({});
    setResults(null);
  };

  const handleSectionChange = (e) => {
    const sectionId = e.target.value;
    setSelectedSection(sectionId);
    setResults(null);
    setSubjectInputs(computeInputsForDate(sectionId, selectedDate, dailyLogs));
  };

  const handleDateChange = (newDate) => {
    if (!selectedSection) {
      setSelectedDate(newDate);
      return;
    }

    const updatedLogs = {
      ...dailyLogs,
      [selectedDate]: subjectInputs
    };

    setDailyLogs(updatedLogs);
    setSelectedDate(newDate);

    const nextInputs = computeInputsForDate(selectedSection, newDate, updatedLogs);
    setSubjectInputs(nextInputs);

    if (currentUser) {
      const updatedStats = computeCumulativeStats(updatedLogs, selectedSection, toDate, newDate);
      setResults(updatedStats);
      localStorage.setItem(`attendance_records_${currentUser}`, JSON.stringify({
        rollNumber: currentUser,
        selectedSection,
        selectedDate: newDate,
        toDate,
        dailyLogs: updatedLogs,
        results: updatedStats,
        updatedAt: new Date().toISOString()
      }));
    }
  };

  const handleToDateChange = (newTo) => {
    setToDate(newTo);
    if (selectedSection && currentUser) {
      const updatedLogs = { ...dailyLogs, [selectedDate]: subjectInputs };
      const updatedStats = computeCumulativeStats(updatedLogs, selectedSection, newTo, selectedDate);
      setResults(updatedStats);
    }
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
    if (!selectedSection || !currentUser) return;

    const updatedLogs = {
      ...dailyLogs,
      [selectedDate]: subjectInputs
    };
    setDailyLogs(updatedLogs);

    const stats = computeCumulativeStats(updatedLogs, selectedSection, toDate, selectedDate);
    setResults(stats);

    const payload = {
      rollNumber: currentUser,
      selectedSection,
      selectedDate,
      toDate,
      dailyLogs: updatedLogs,
      results: stats,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(`attendance_records_${currentUser}`, JSON.stringify(payload));
    setSaveNotification(`Saved attendance for ${selectedDate}`);
    setTimeout(() => setSaveNotification(''), 4000);
  };

  const toggleRoomStatus = (roomId, currentIsFree) => {
    const nextStatus = !currentIsFree;
    const updated = {
      ...roomOverrides,
      [roomId]: nextStatus
    };
    setRoomOverrides(updated);
    localStorage.setItem('vibecraft_floor_overrides_v2', JSON.stringify(updated));
    showToast(`${roomId} marked as ${nextStatus ? 'FREE' : 'OCCUPIED'}`);
  };

  const computedRooms = useMemo(() => {
    return PERMANENT_ROOMS.map(room => {
      const scheduleDay = room.schedule[selectedDay] || [];
      const scheduledClass = scheduleDay[selectedPeriodIdx];
      const isTimetableFree = !scheduledClass || scheduledClass.toUpperCase() === "FREE";

      const hasOverride = roomOverrides.hasOwnProperty(room.roomId);
      const isFree = hasOverride ? roomOverrides[room.roomId] : isTimetableFree;

      return {
        ...room,
        isFree,
        hasOverride,
        currentSubject: isFree ? null : scheduledClass,
        occupiedBy: isFree ? null : room.assignedSection
      };
    });
  }, [selectedDay, selectedPeriodIdx, roomOverrides]);

  const filteredRooms = useMemo(() => {
    if (selectedFloor === "All") return computedRooms;
    return computedRooms.filter(r => r.floorNum === Number(selectedFloor));
  }, [computedRooms, selectedFloor]);

  const freeCount = filteredRooms.filter(r => r.isFree).length;

  const inspectedSlotStatus = useMemo(() => {
    if (!inspectedRoom) return null;
    const scheduleDay = inspectedRoom.schedule[modalSelectedDay] || [];
    const scheduledClass = scheduleDay[modalSelectedPeriodIdx];
    const isFree = !scheduledClass || scheduledClass.toUpperCase() === "FREE";
    return {
      isFree,
      subject: scheduledClass || "Free Period",
      assignedSection: inspectedRoom.assignedSection
    };
  }, [inspectedRoom, modalSelectedDay, modalSelectedPeriodIdx]);

  // Phase 2: Call the Squad (Direct WhatsApp integration)
  const handleCallSquad = (room) => {
    const slot = PERIOD_SLOTS[modalSelectedPeriodIdx] || PERIOD_SLOTS[selectedPeriodIdx];
    const untilTime = slot?.endTime || "2:10 PM";
    const shareText = `📍 Heading to ${room.roomId}. It's free until ${untilTime}. Come fast!`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  };

  // AI Smart Room Finder with Universal Dual-Authentication
  const handleAISearch = async (queryText) => {
    const query = queryText || aiPrompt;
    if (!query.trim() || aiSearching) return;

    setAiSearching(true);
    setAiResponse('');

    try {
      const rawKey = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();
      if (!rawKey) {
        throw new Error("Missing VITE_GEMINI_API_KEY in environment or .env");
      }

      const isBearerToken = rawKey.startsWith("AQ.");

      // Formulate target endpoint and headers based on token type
      const url = isBearerToken
        ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent`
        : `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${rawKey}`;

      const headers = {
        'Content-Type': 'application/json'
      };

      if (isBearerToken) {
        headers['Authorization'] = `Bearer ${rawKey}`;
      } else {
        headers['x-goog-api-key'] = rawKey;
      }

      const systemPrompt = `
You are the Smart-Search Floor Manager AI for a 6-Floor campus building (Floors 1 to 6).
Current Day: ${selectedDay}, Slot: ${PERIOD_SLOTS[selectedPeriodIdx].label} (${PERIOD_SLOTS[selectedPeriodIdx].time})
LIVE DATA: ${JSON.stringify(computedRooms, null, 2)}

TASK:
1. Parse user query (floor, hour, duration).
2. Recommend strictly FREE rooms (isFree: true).
3. If floor is mentioned, prioritize that floor. Output structured bullet points.
`;

      const res = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `${systemPrompt}\n\nQuery: "${query}"` }
              ]
            }
          ]
        })
      });

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message || JSON.stringify(data.error));
      }

      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No free classrooms match that criteria.";
      setAiResponse(reply);
    } catch (err) {
      console.error(err);
      setAiResponse(`Search failed: ${err.message}`);
    } finally {
      setAiSearching(false);
    }
  };

  const dayOfWeek = getDayName(selectedDate);
  const isWeekend = dayOfWeek === "Saturday" || dayOfWeek === "Sunday";

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#030014]">
        <div className="glass-card p-10 w-full max-w-md border border-white/10 text-center animate-[fadeIn_0.5s_ease-out]">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/[0.05] border border-white/20 flex items-center justify-center shadow-[0_0_25px_rgba(255,255,255,0.1)]">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-slate-100 mb-2 uppercase tracking-wider">
            Student Portal
          </h1>
          <p className="text-slate-400 text-sm mb-8">Enter your Roll Number to initialize your predictive attendance & floor locator.</p>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="text-left">
              <label className="block text-slate-300 text-xs uppercase tracking-widest font-bold mb-2">
                Roll Number
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 713324001 or RA241..."
                value={inputRollNo}
                onChange={(e) => setInputRollNo(e.target.value)}
                className="w-full glass-input p-4 rounded-2xl text-center text-lg font-bold tracking-wider uppercase text-slate-100 placeholder-slate-600 border border-white/15 focus:border-white/40"
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-4 px-6 rounded-2xl bg-white/[0.05] hover:bg-white/[0.12] active:scale-95 border border-white/20 hover:border-white/40 backdrop-blur-2xl transition-all duration-300 text-slate-100 font-bold text-sm uppercase tracking-widest cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            >
              Access Portal
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
        activeView={activeTab}
        setActiveView={setActiveTab}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <main className="flex-1 p-6 lg:p-10 overflow-y-auto max-w-7xl">
        {/* Top Header */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 uppercase tracking-tight">
              {activeTab === 'rooms' && '3D Floor Map & Free Class Locator'}
              {activeTab === 'attendance' && 'Attendance Intelligence'}
              {activeTab === 'analytics' && 'Visual Analytics Engine'}
            </h1>
            <p className="text-xs text-slate-400 font-semibold tracking-widest uppercase mt-1">
              Phase 2: 3D Visual Map • Live Countdown Timers • Call the Squad
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {(saveNotification || toastMessage) && (
              <span className="px-3.5 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold backdrop-blur-xl animate-[fadeIn_0.3s_ease-out]">
                ✓ {saveNotification || toastMessage}
              </span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs font-bold text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-4 py-2 rounded-2xl backdrop-blur-xl transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Transparent Glassmorphism Navigation Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          {[
            { id: 'rooms', label: '3D Floor Map & Free Class', icon: '🏢' },
            { id: 'attendance', label: 'Mark Attendance', icon: '📝' },
            { id: 'analytics', label: 'Visual Analytics', icon: '📊' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold tracking-wider uppercase backdrop-blur-2xl transition-all duration-300 cursor-pointer flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'bg-white/[0.12] border border-white/40 text-white shadow-[0_0_20px_rgba(255,255,255,0.15),inset_0_1px_1px_rgba(255,255,255,0.25)]'
                  : 'bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: 3D MAP, LIVE COUNTDOWN & SQUAD SHARE */}
        {activeTab === 'rooms' && (
          <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
            {/* Global Day & Period Picker */}
            <div className="glass-card p-6 border border-white/10 backdrop-blur-2xl flex flex-wrap gap-6 items-center justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1.5">
                    Select Day
                  </label>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="glass-input px-4 py-2.5 rounded-2xl text-sm font-semibold cursor-pointer border border-white/15"
                  >
                    {WEEKDAYS.map(d => (
                      <option key={d} value={d} className="bg-slate-900">{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1.5">
                    Select Hour / Timing
                  </label>
                  <select
                    value={selectedPeriodIdx}
                    onChange={(e) => setSelectedPeriodIdx(Number(e.target.value))}
                    className="glass-input px-4 py-2.5 rounded-2xl text-sm font-semibold cursor-pointer border border-white/15"
                  >
                    {PERIOD_SLOTS.map((slot, i) => (
                      <option key={slot.id} value={i} className="bg-slate-900">
                        {slot.label} ({slot.time})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* LIVE ACTIVE PERIOD COUNTDOWN TICKER BADGE */}
              <div className="flex items-center gap-4">
                <div className="p-3 px-4 rounded-2xl bg-white/[0.04] border border-white/15 backdrop-blur-xl flex items-center space-x-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 block font-bold">
                      Current Slot Countdown:
                    </span>
                    <span className="text-sm font-black font-mono text-emerald-300">
                      {formattedCountdown}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    localStorage.removeItem('vibecraft_floor_overrides_v2');
                    setRoomOverrides({});
                    showToast('All room statuses reset to timetable baseline');
                  }}
                  className="text-[11px] text-slate-300 hover:text-white border border-white/15 hover:border-white/30 bg-white/[0.04] hover:bg-white/[0.09] px-3.5 py-2.5 rounded-2xl backdrop-blur-xl transition-all cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* AI Room Search Box */}
            <div className="glass-card p-6 border border-white/10 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
              <div className="flex items-center space-x-2.5 mb-3">
                <div className="w-7 h-7 rounded-xl bg-white/[0.06] border border-white/20 flex items-center justify-center text-white">
                  <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                    AI Smart Class Finder
                    <span className="text-[9px] bg-white/[0.08] text-slate-300 border border-white/15 px-2 py-0.5 rounded-full font-mono">NATURAL LANGUAGE</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Ask in plain language — AI evaluates all classrooms across Floors 1 to 6.</p>
                </div>
              </div>

              <div className="flex gap-2.5 mb-3.5">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
                  placeholder='e.g., "Find me a free room on Floor 4 or 5 for the 3rd hour"'
                  className="flex-1 glass-input px-4 py-3.5 rounded-2xl text-xs md:text-sm text-slate-100 placeholder-slate-500 border border-white/15 focus:border-white/35"
                />
                <button
                  type="button"
                  onClick={() => handleAISearch()}
                  disabled={aiSearching || !aiPrompt.trim()}
                  className="px-6 py-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-40 border border-white/20 hover:border-white/40 text-slate-100 font-bold text-xs backdrop-blur-xl transition-all cursor-pointer whitespace-nowrap shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
                >
                  {aiSearching ? 'Searching...' : 'Locate Room'}
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
                {[
                  "Is IST 602 free during 3rd hour?",
                  "Find an empty classroom on Floor 2 right now",
                  "Which room is free during 5th hour on Floor 5?"
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { setAiPrompt(preset); handleAISearch(preset); }}
                    className="px-3.5 py-1.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/25 text-slate-300 hover:text-white whitespace-nowrap backdrop-blur-xl transition-all cursor-pointer text-[11px]"
                  >
                    ⚡ {preset}
                  </button>
                ))}
              </div>

              {aiResponse && (
                <div className="mt-4 p-5 rounded-2xl bg-white/[0.03] border border-white/15 backdrop-blur-xl text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  <strong className="block text-slate-200 font-bold uppercase tracking-wider mb-2 text-[11px]">
                    ⚡ AI Recommendation:
                  </strong>
                  {aiResponse}
                </div>
              )}
            </div>

            {/* Floor Selection Buttons (Floors 1 to 6) */}
            <div>
              <label className="block text-[11px] uppercase tracking-widest font-extrabold text-slate-400 mb-3">
                Select Floor:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {AVAILABLE_FLOORS.map(fl => {
                  const isSelected = selectedFloor === fl.value;
                  const count = fl.value === "All"
                    ? computedRooms.filter(r => r.isFree).length
                    : computedRooms.filter(r => r.floorNum === fl.value && r.isFree).length;

                  return (
                    <button
                      key={fl.label}
                      type="button"
                      onClick={() => setSelectedFloor(fl.value)}
                      className={`p-4 rounded-2xl backdrop-blur-2xl transition-all duration-300 cursor-pointer flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-white/[0.12] border border-white/40 text-white shadow-[0_0_20px_rgba(255,255,255,0.12),inset_0_1px_1px_rgba(255,255,255,0.25)] scale-[1.02]'
                          : 'bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-white/25 text-slate-300'
                      }`}
                    >
                      <span className="text-sm font-black tracking-tight block">
                        {fl.label}
                      </span>
                      <span className={`text-[9px] font-bold mt-2 px-2 py-0.5 rounded-full border ${
                        count > 0 
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      }`}>
                        {count} Free
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FEATURE 1: 3D MAP MODEL (COLOR-CODED BY AVAILABILITY) */}
            <div className="glass-card p-6 border border-white/10 backdrop-blur-2xl relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-100 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    3D Architectural Building Model — {selectedFloor !== "All" ? `Floor ${selectedFloor}` : "All Floors"}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Isometric campus view. Click any room block to inspect countdown & Call the Squad.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                    Free Room
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-300">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
                    Occupied Room
                  </span>
                </div>
              </div>

              <div className="py-10 px-4 flex items-center justify-center bg-gradient-to-b from-[#0a061a]/90 to-[#02000c]/90 rounded-2xl border border-white/10 overflow-x-auto min-h-[220px]">
                <div 
                  className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 transition-transform duration-500 ease-out"
                  style={{
                    transform: 'perspective(900px) rotateX(24deg) rotateZ(-4deg)',
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {filteredRooms.map(room => (
                    <div
                      key={room.roomId}
                      onClick={() => {
                        setInspectedRoom(room);
                        setModalSelectedDay(selectedDay);
                        setModalSelectedPeriodIdx(selectedPeriodIdx);
                      }}
                      className={`relative p-3.5 rounded-2xl cursor-pointer transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 flex flex-col justify-between items-center text-center select-none ${
                        room.isFree
                          ? 'bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/50 shadow-[0_10px_0_rgba(5,150,105,0.4),0_12px_20px_rgba(0,0,0,0.5)]'
                          : 'bg-rose-500/15 hover:bg-rose-500/30 border border-rose-400/40 shadow-[0_10px_0_rgba(225,29,72,0.3),0_12px_20px_rgba(0,0,0,0.5)] opacity-85'
                      }`}
                      style={{ minWidth: '85px', minHeight: '85px' }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] font-mono font-black text-slate-200">
                          {room.roomNumber}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${room.isFree ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider ${
                        room.isFree ? 'text-emerald-300' : 'text-rose-300'
                      }`}>
                        {room.isFree ? 'FREE' : 'OCCUPIED'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Permanent Classrooms Floor-by-Floor Grid */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span>Classrooms on Floor {selectedFloor}</span>
                  <span className="text-xs font-mono text-slate-300 bg-white/[0.06] border border-white/15 px-2 py-0.5 rounded-full">
                    {filteredRooms.length} Rooms
                  </span>
                </h3>
                <span className="text-xs text-slate-400">
                  Tap "Call the Squad" or click card to inspect live countdown timer.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredRooms.map(room => (
                  <div
                    key={room.roomId}
                    className={`glass-card p-5 border transition-all duration-300 flex flex-col justify-between ${
                      room.isFree
                        ? 'border-emerald-500/30 hover:border-emerald-400/50 bg-emerald-950/10'
                        : 'border-rose-500/30 hover:border-rose-400/50 bg-rose-950/10'
                    }`}
                  >
                    <div 
                      onClick={() => {
                        setInspectedRoom(room);
                        setModalSelectedDay(selectedDay);
                        setModalSelectedPeriodIdx(selectedPeriodIdx);
                      }}
                      className="cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                            {room.floorLabel}
                          </span>
                          <h4 className="text-2xl font-black text-slate-100 tracking-tight font-mono">
                            {room.roomId}
                          </h4>
                        </div>
                        <span
                          className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${
                            room.isFree
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/35'
                          }`}
                        >
                          {room.isFree ? "FREE NOW" : "OCCUPIED"}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 mb-3 text-xs">
                        <span className="text-[10px] text-slate-400 block uppercase font-mono">Designated Class:</span>
                        <strong className="text-slate-200">{room.assignedSection}</strong>
                      </div>

                      {/* LIVE COUNTDOWN ON CARD */}
                      <div className="text-xs mb-3 space-y-1">
                        {room.isFree ? (
                          <div>
                            <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                              ✓ Available Right Now
                            </span>
                            <span className="text-[11px] font-mono text-slate-400 block mt-1">
                              ⏳ Time Left: <strong className="text-emerald-300 font-bold">{formattedCountdown}</strong>
                            </span>
                          </div>
                        ) : (
                          <div className="text-rose-300 truncate">
                            <span className="font-bold text-rose-200">Class: {room.currentSubject}</span>
                            <span className="text-[11px] text-slate-400 block truncate">In Session</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-white/10">
                      {/* CALL THE SQUAD BUTTON */}
                      <button
                        type="button"
                        onClick={() => handleCallSquad(room)}
                        className="w-full py-2.5 px-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-95 border border-emerald-500/35 hover:border-emerald-400/50 backdrop-blur-2xl transition-all duration-300 text-emerald-200 hover:text-white font-bold text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                      >
                        <svg className="w-3.5 h-3.5 fill-current text-emerald-400" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                        </svg>
                        <span>Call the Squad</span>
                      </button>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setInspectedRoom(room);
                            setModalSelectedDay(selectedDay);
                            setModalSelectedPeriodIdx(selectedPeriodIdx);
                          }}
                          className="flex-1 py-1.5 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider backdrop-blur-xl transition-all border border-white/10 hover:border-white/25 text-slate-300 hover:text-white cursor-pointer"
                        >
                          Inspect Room
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleRoomStatus(room.roomId, room.isFree)}
                          className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider backdrop-blur-xl transition-all border cursor-pointer ${
                            room.isFree
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/25'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/25'
                          }`}
                        >
                          {room.isFree ? "Mark Busy" : "Mark Free"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ATTENDANCE INTELLIGENCE */}
        {activeTab === 'attendance' && (
          <div className="animate-[fadeIn_0.3s_ease-out]">
            <div className="glass-card p-6 lg:p-8 mb-10 border border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                  <label className="block text-slate-300 text-xs uppercase tracking-widest font-bold mb-2">
                    Class Section
                  </label>
                  <select 
                    value={selectedSection}
                    onChange={handleSectionChange}
                    className="w-full glass-input p-3.5 rounded-2xl text-sm appearance-none cursor-pointer border border-white/15"
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
                  label="Marking Date (Changes are preserved)"
                  selectedDate={selectedDate}
                  onDateChange={handleDateChange}
                  minDateStr={timetablesData.semester.startDate}
                  maxDateStr={timetablesData.semester.endDate}
                />

                <SemesterDatePicker
                  label="Target Calculation Date"
                  selectedDate={toDate}
                  onDateChange={handleToDateChange}
                  minDateStr={selectedDate}
                  maxDateStr={timetablesData.semester.endDate}
                />
              </div>

              {selectedDate && (
                <div className="mb-6 px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-slate-300 flex justify-between items-center backdrop-blur-xl">
                  <span>Selected Day: <strong>{selectedDate}</strong> ({dayOfWeek}) — <em>Inputs auto-saved per day</em></span>
                  {isWeekend && <span className="text-rose-400 font-bold uppercase">Weekend: 0 Scheduled Periods</span>}
                </div>
              )}

              {selectedSection && Object.keys(subjectInputs).length > 0 && (
                <div>
                  <h3 className="text-slate-200 font-semibold mb-6 border-b border-white/10 pb-3">
                    Attendance Entries for {selectedDate} ({dayOfWeek})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {Object.keys(subjectInputs).map(subject => (
                      <div key={subject} className="bg-white/[0.03] p-5 rounded-2xl border border-white/10 shadow-inner">
                        <p className="text-sm font-bold text-slate-200 mb-4 truncate" title={subject}>
                          {subject}
                        </p>
                        <div className="flex space-x-4">
                          <div className="w-1/2">
                            <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 pl-1">
                              Attended Classes
                            </label>
                            <input 
                              type="number" 
                              placeholder="0"
                              value={subjectInputs[subject].attended}
                              onChange={(e) => handleInputChange(subject, 'attended', e.target.value)}
                              className="w-full glass-input p-3 rounded-xl text-center font-bold text-slate-200 border border-white/15"
                            />
                          </div>
                          <div className="w-1/2">
                            <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 pl-1">
                              Conducted on {selectedDate}
                            </label>
                            <input 
                              type="number" 
                              value={subjectInputs[subject].conducted}
                              onChange={(e) => handleInputChange(subject, 'conducted', e.target.value)}
                              className="w-full glass-input p-3 rounded-xl text-center font-bold text-slate-200 border border-white/15 bg-white/[0.02]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    type="button"
                    onClick={handleCalculateAndSave} 
                    className="w-full py-4 px-6 rounded-2xl bg-white/[0.05] hover:bg-white/[0.12] active:scale-95 border border-white/20 hover:border-white/40 backdrop-blur-2xl transition-all duration-300 text-slate-100 font-bold text-sm uppercase tracking-widest cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.15)]"
                  >
                    Save Day & Compute Projections
                  </button>
                </div>
              )}
            </div>

            {results && (
              <div className="w-full">
                <h2 className="text-2xl font-bold text-slate-100 tracking-tight mb-6">
                  Cumulative Subject Projection Cards
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.keys(results).map(subject => (
                    <SubjectCard key={subject} subject={subject} stats={results[subject]} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: VISUAL CHARTS & ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="animate-[fadeIn_0.3s_ease-out]">
            <VisualAnalytics 
              results={results} 
              selectedSection={selectedSection} 
              currentUser={currentUser} 
            />
          </div>
        )}

        {/* 5-DAY & 8-HOUR POP-UP INSPECTOR */}
        {inspectedRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
            <div className="glass-card max-w-2xl w-full p-6 sm:p-8 border border-white/20 relative shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-3xl">
              <button
                onClick={() => setInspectedRoom(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl font-mono border bg-white/[0.05] text-slate-100 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.08)]">
                  {inspectedRoom.roomNumber}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400">
                      {inspectedRoom.floorLabel}
                    </span>
                    <span className="text-[10px] bg-white/[0.06] text-slate-300 border border-white/10 px-2 py-0.5 rounded-full font-mono">
                      Venue: {inspectedRoom.roomId}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-100">
                    Classroom {inspectedRoom.roomId}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Designated Section: <strong className="text-slate-200">{inspectedRoom.assignedSection}</strong>
                  </p>
                </div>
              </div>

              {/* LIVE COUNTDOWN TIMER DISPLAY */}
              <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/15 mb-6 text-center backdrop-blur-2xl">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-2">
                  ⏳ Live Countdown Until Next Class Begins
                </span>
                <div className="flex items-center justify-center gap-2 text-3xl font-black font-mono text-white tracking-wider">
                  <span className="bg-black/60 px-3 py-1.5 rounded-xl border border-white/10 text-emerald-400">
                    {formattedCountdown}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Period concludes at <strong className="text-slate-200">{PERIOD_SLOTS[modalSelectedPeriodIdx]?.endTime || "2:10 PM"}</strong>.
                </p>
              </div>

              {/* Day Selector (5 Days) */}
              <div className="mb-5">
                <label className="block text-[11px] uppercase tracking-widest font-extrabold text-slate-400 mb-2">
                  1. Choose Day:
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {WEEKDAYS.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setModalSelectedDay(day)}
                      className={`py-2 px-1 rounded-2xl text-xs font-bold transition-all text-center cursor-pointer border backdrop-blur-xl ${
                        modalSelectedDay === day
                          ? 'bg-white/[0.15] text-white border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)]'
                          : 'bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 border-white/10'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* 8 Hour Timings Selector */}
              <div className="mb-6">
                <label className="block text-[11px] uppercase tracking-widest font-extrabold text-slate-400 mb-2">
                  2. Choose Hour Timing:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PERIOD_SLOTS.map((slot, idx) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setModalSelectedPeriodIdx(idx)}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer backdrop-blur-xl ${
                        modalSelectedPeriodIdx === idx
                          ? 'bg-white/[0.14] border-white/40 text-white shadow-[0_0_12px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)]'
                          : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 text-slate-300'
                      }`}
                    >
                      <span className="block text-[11px] font-bold text-slate-200">{slot.label}</span>
                      <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{slot.time}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Output */}
              {inspectedSlotStatus && (
                <div className={`p-5 rounded-2xl border mb-6 text-center backdrop-blur-2xl animate-[fadeIn_0.2s_ease-out] ${
                  inspectedSlotStatus.isFree
                    ? 'bg-emerald-950/20 border-emerald-500/35 text-emerald-200'
                    : 'bg-rose-950/20 border-rose-500/35 text-rose-200'
                }`}>
                  <span className="text-[10px] font-black uppercase tracking-widest block mb-1 text-slate-400">
                    Status on {modalSelectedDay} • {PERIOD_SLOTS[modalSelectedPeriodIdx].label} ({PERIOD_SLOTS[modalSelectedPeriodIdx].time})
                  </span>

                  <div className="text-2xl font-black uppercase tracking-wider mb-1 flex items-center justify-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${inspectedSlotStatus.isFree ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'}`} />
                    <span>{inspectedSlotStatus.isFree ? "CLASS IS FREE" : "CLASS IS OCCUPIED"}</span>
                  </div>

                  <p className="text-xs text-slate-300">
                    {inspectedSlotStatus.isFree 
                      ? "This classroom has no scheduled lecture during this period and is free for student study or project work."
                      : `Subject Scheduled: "${inspectedSlotStatus.subject}" conducted for section ${inspectedSlotStatus.assignedSection}.`}
                  </p>
                </div>
              )}

              {/* CALL THE SQUAD BUTTON */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleCallSquad(inspectedRoom)}
                  className="flex-1 py-3.5 px-4 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-95 border border-emerald-500/35 hover:border-emerald-400/50 text-emerald-200 hover:text-white font-bold text-xs uppercase tracking-wider backdrop-blur-2xl transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  <svg className="w-4 h-4 fill-current text-emerald-400" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                  <span>📍 Call the Squad</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInspectedRoom(null)}
                  className="py-3.5 px-6 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-bold text-xs uppercase tracking-wider border border-white/10 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating AI Strategist Chat */}
        <FloatingAIChat 
          currentUser={currentUser} 
          selectedSection={selectedSection} 
          results={results} 
        />
      </main>
    </div>
  );
}
