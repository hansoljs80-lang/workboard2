
import { BedData, BedStatus } from '../types';

/**
 * Calculates the status of a bed based on countdown logic.
 * Returns the status level (color), remaining days, and a display label.
 */
export const calculateBedStatus = (bed: BedData, interval: number): BedStatus => {
  // 1. If never changed, treat as overdue (needs immediate action)
  if (!bed.lastChanged) {
    return { status: 'danger', diffDays: -1, label: '교체 기록 없음' };
  }

  const lastDate = new Date(bed.lastChanged);
  const today = new Date();
  
  // Reset time for accurate day calc (client-side only logic)
  lastDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  // Calculate days passed since last change
  const diffTime = today.getTime() - lastDate.getTime();
  const passedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
  
  // Calculate REMAINING days (Countdown)
  const remainingDays = interval - passedDays;
  
  // 2. Check for "Today" status (Priority)
  if (passedDays === 0) {
    return { status: 'today', diffDays: remainingDays, label: '오늘 교체함' };
  }

  // Determine Status based on Remaining Days
  if (remainingDays < 0) {
    // Overdue
    return { status: 'danger', diffDays: remainingDays, label: `${Math.abs(remainingDays)}일 초과됨` };
  }
  
  if (remainingDays === 0) {
    // Due Today
    return { status: 'warning', diffDays: 0, label: '오늘 교체 예정' };
  }

  if (remainingDays <= 2) {
    // Imminent (1-2 days left)
    return { status: 'warning', diffDays: remainingDays, label: `${remainingDays}일 남음` };
  }
  
  // Safe
  return { 
    status: 'success', 
    diffDays: remainingDays, 
    label: `${remainingDays}일 남음` 
  };
};

/**
 * Generates the default configuration for the Bed Manager.
 */
export const getDefaultBedConfig = () => ({
  count: 10,
  interval: 7, // 1 week default
  routineDay: 4, // Thursday
  cols: 5
});

/**
 * Initializes an array of BedData objects.
 */
export const initializeBeds = (count: number): BedData[] => {
  const newBeds: BedData[] = [];
  for (let i = 1; i <= count; i++) {
    newBeds.push({ id: i, name: `${i}번 베드`, lastChanged: null });
  }
  return newBeds;
};

/**
 * Calculates the next occurrence date of the specified routine day.
 * @param routineDay 0=Sun, 1=Mon, ..., 6=Sat
 */
export const getNextRoutineDate = (routineDay: number): Date => {
  const today = new Date();
  const currentDay = today.getDay();
  
  // Calculate difference (0-6)
  let daysUntil = (routineDay - currentDay + 7) % 7;
  
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysUntil);
  return nextDate;
};
