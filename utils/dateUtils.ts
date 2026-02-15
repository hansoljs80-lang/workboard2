
export const getWeekRange = (date: Date) => {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay()); // Start on Sunday
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // End on Saturday
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

export const getYearRange = (date: Date) => {
  const start = new Date(date.getFullYear(), 0, 1); // Jan 1st
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(date.getFullYear(), 11, 31); // Dec 31st
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

export const getCalendarGridDays = (currentDate: Date, viewMode: 'week' | 'month') => {
  const days: Date[] = [];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  if (viewMode === 'month') {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Start from the first Sunday before the month starts
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(1 - startDate.getDay());

    // End at the last Saturday after the month ends
    const endDate = new Date(lastDayOfMonth);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    let d = new Date(startDate);
    while (d <= endDate) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
  } else {
    // Week View
    const { start } = getWeekRange(currentDate);
    
    for (let i = 0; i < 7; i++) {
      let next = new Date(start);
      next.setDate(start.getDate() + i);
      days.push(next);
    }
  }
  return days;
};

export const isSameDay = (d1: Date, d2: Date) => {
  return d1.getDate() === d2.getDate() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getFullYear() === d2.getFullYear();
};

export const isSameMonth = (d1: Date, d2: Date) => {
  return d1.getMonth() === d2.getMonth() && 
         d1.getFullYear() === d2.getFullYear();
};

export const formatDateRange = (currentDate: Date, viewMode: 'day' | 'week' | 'month' | 'year') => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short' };
  
  if (viewMode === 'day') {
    return currentDate.toLocaleDateString('ko-KR', options);
  } else if (viewMode === 'week') {
    const { start, end } = getWeekRange(currentDate);
    return `${start.getMonth() + 1}.${start.getDate()} ~ ${end.getMonth() + 1}.${end.getDate()} (주간)`;
  } else if (viewMode === 'year') {
    return `${currentDate.getFullYear()}년 전체`;
  } else {
    return currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
  }
};

/**
 * Generates a consistent string key (YYYY-MM-DD) for a date.
 * Used for Map/Set lookups to optimize performance.
 */
export const getDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
