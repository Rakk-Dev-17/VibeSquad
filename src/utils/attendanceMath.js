const normalizeDate = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const parseDateString = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const formatDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Calculates exact periods conducted on ONE SPECIFIC DAY.
 * Returns 0 on Saturdays, Sundays, and Holidays.
 */
export const calculateSingleDayClasses = (subject, schedule, semesterData, singleDateStr) => {
  if (!singleDateStr) return 0;
  
  const targetDate = normalizeDate(singleDateStr);
  const semesterStart = normalizeDate(semesterData.startDate);
  const semesterEnd = normalizeDate(semesterData.endDate);

  // If outside semester boundaries, strictly 0
  if (targetDate < semesterStart || targetDate > semesterEnd) return 0;

  const dayIndex = targetDate.getDay();
  // Strictly 0 on Sunday (0) and Saturday (6)
  if (dayIndex === 0 || dayIndex === 6) return 0;

  const holidays = (semesterData.holidays || []).map(h => normalizeDate(h).getTime());
  if (holidays.includes(targetDate.getTime())) return 0;

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = daysOfWeek[dayIndex];
  const dayClasses = schedule[dayName] || [];

  // Exact period count for this subject on that specific weekday
  return dayClasses.filter(s => s === subject).length;
};

/**
 * Calculates remaining classes between singleDate (exclusive) and toDate (inclusive).
 * Strictly ignores weekends (Saturday & Sunday) and holidays.
 */
export const calculateRemainingClasses = (subject, schedule, semesterData, toDateStr, singleDateStr) => {
  const semesterEnd = normalizeDate(semesterData.endDate);
  const startPoint = singleDateStr ? normalizeDate(singleDateStr) : normalizeDate(new Date());
  const finalDate = toDateStr ? normalizeDate(toDateStr) : semesterEnd;
  const cappedDate = finalDate > semesterEnd ? semesterEnd : finalDate;

  let curr = new Date(startPoint);
  curr.setDate(curr.getDate() + 1); // Start counting from the following day

  if (curr > cappedDate) return 0;

  let count = 0;
  const holidays = (semesterData.holidays || []).map(h => normalizeDate(h).getTime());
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  while (curr <= cappedDate) {
    const dayIndex = curr.getDay();
    const dayName = daysOfWeek[dayIndex];
    const timestamp = curr.getTime();

    if (dayIndex !== 0 && dayIndex !== 6 && !holidays.includes(timestamp)) {
      const todaysClasses = schedule[dayName] || [];
      count += todaysClasses.filter(s => s === subject).length;
    }
    curr.setDate(curr.getDate() + 1);
  }

  return count;
};

export const calculateAttendanceStats = (attended, conducted, remaining) => {
  const currentPercentage = conducted === 0 ? 0 : (attended / conducted) * 100;
  const totalProjectedClasses = conducted + remaining;

  const target75 = Math.ceil(0.75 * totalProjectedClasses);
  const requiredFor75 = Math.max(0, target75 - attended);

  const target90 = Math.ceil(0.90 * totalProjectedClasses);
  const requiredFor90 = Math.max(0, target90 - attended);

  const maxPossibleAttendance = attended + remaining;
  const isImpossible = totalProjectedClasses > 0 && maxPossibleAttendance < target75;

  const maxSafeBunks = Math.max(0, remaining - requiredFor75);

  let status = 'Safe';
  if (isImpossible) status = 'Irreversible Detention';
  else if (currentPercentage < 75) status = 'Detention Zone';
  else if (currentPercentage >= 75 && currentPercentage < 80) status = 'Warning';
  else if (currentPercentage >= 90) status = 'Excellent';

  return {
    currentPercent: currentPercentage.toFixed(1),
    attended,
    conducted,
    remaining,
    totalProjectedClasses,
    requiredFor75,
    requiredFor90,
    safeBunks: isImpossible ? 0 : (currentPercentage >= 75 ? maxSafeBunks : 0),
    status,
    isImpossible
  };
};