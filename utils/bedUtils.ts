
import { BedData, BedStatus } from '../types';

/**
 * Calculates the status of a bed based on its last changed date and the configured interval.
 * Returns the status level (color), days since change, and a display label.
 */
export const calculateBedStatus = (bed: BedData, interval: number): BedStatus => {
  if (!bed.lastChanged) {
    return { status: 'danger', diffDays: -1, label: '기록 없음' };
  }

  const lastDate = new Date(bed.lastChanged);
  const today = new Date();
  
  // Reset time for accurate day calc (client-side only logic)
  lastDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  
  if (diffDays >= interval) {
    return { status: 'danger', diffDays, label: `${diffDays}일 전 교체` };
  }
  if (diffDays >= interval - 2) {
    return { status: 'warning', diffDays, label: `${diffDays}일 전 교체` };
  }
  
  return { 
    status: 'success', 
    diffDays, 
    label: diffDays === 0 ? '오늘 교체함' : `${diffDays}일 전 교체` 
  };
};

/**
 * Generates the default configuration for the Bed Manager.
 */
export const getDefaultBedConfig = () => ({
  count: 10,
  interval: 7, // 1 week
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
  // If today is the routine day (diff=0), we treat it as today (upcoming includes today)
  let daysUntil = (routineDay - currentDay + 7) % 7;
  
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysUntil);
  return nextDate;
};
