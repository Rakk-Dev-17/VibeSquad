import rooms from '../data/roomsData.json';
import timetablesData from '../data/timetables.json';

export const PERIOD_SLOTS = [
  { id: 1, label: "Period 1", time: "09:00 - 09:50" },
  { id: 2, label: "Period 2", time: "09:50 - 10:40" },
  { id: 3, label: "Period 3", time: "10:55 - 11:45" },
  { id: 4, label: "Period 4", time: "11:45 - 12:35" },
  { id: 5, label: "Period 5", time: "01:30 - 02:20" },
  { id: 6, label: "Period 6", time: "02:20 - 03:10" },
  { id: 7, label: "Period 7", time: "03:15 - 04:05" }
];

export function getRoomStatusForSlot(dayName, periodIndex) {
  const dayNormalized = dayName.charAt(0).toUpperCase() + dayName.slice(1).toLowerCase();

  return rooms.map(room => {
    if (!room.sectionId) {
      return {
        ...room,
        isFree: true,
        currentSubject: null,
        occupiedBy: null,
        freeForPeriods: 7 - periodIndex
      };
    }

    const section = timetablesData.sections.find(s => s.sectionId === room.sectionId);
    if (!section || !section.schedule || !section.schedule[dayNormalized]) {
      return {
        ...room,
        isFree: true,
        currentSubject: null,
        occupiedBy: null,
        freeForPeriods: 7 - periodIndex
      };
    }

    const daySubjects = section.schedule[dayNormalized];
    const currentSub = daySubjects[periodIndex] || null;
    const isFree = !currentSub || currentSub.toUpperCase() === "FREE" || currentSub.toUpperCase() === "LIBRARY";

    let consecutiveFree = 0;
    if (isFree) {
      for (let i = periodIndex; i < daySubjects.length; i++) {
        const sub = daySubjects[i];
        if (!sub || sub.toUpperCase() === "FREE" || sub.toUpperCase() === "LIBRARY") {
          consecutiveFree++;
        } else {
          break;
        }
      }
    }

    return {
      ...room,
      isFree,
      currentSubject: currentSub,
      occupiedBy: isFree ? null : room.sectionId,
      freeForPeriods: consecutiveFree
    };
  });
}