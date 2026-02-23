
import React, { useMemo } from 'react';
import { Task, Staff } from '../types';
import CalendarTaskItem from './CalendarTaskItem';
import { getCalendarGridDays, isSameDay, isSameMonth, getDateKey } from '../utils/dateUtils';

interface CalendarViewProps {
  viewMode: 'week' | 'month';
  currentDate: Date;
  tasks: Task[];
  staff?: Staff[];
  onTaskDoubleClick: (task: Task) => void;
  onDateClick: (date: Date) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  viewMode, 
  currentDate, 
  tasks,
  staff, 
  onTaskDoubleClick,
  onDateClick
}) => {
  // Memoize grid calculation to avoid re-running on every staff/task change if date hasn't changed
  const days = useMemo(() => {
    return getCalendarGridDays(currentDate, viewMode);
  }, [currentDate, viewMode]);
  
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  // OPTIMIZATION: Group tasks by date once using a Map.
  // This changes the complexity from O(Days * Tasks) to O(Tasks + Days)
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach(task => {
      const dateKey = getDateKey(new Date(task.createdAt));
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(task);
    });
    return map;
  }, [tasks]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header (Days of week) */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
        {weekDays.map((day, i) => (
          <div key={day} className={`py-2 text-center text-xs font-bold ${i === 0 ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className={`flex-1 grid grid-cols-7 ${viewMode === 'month' ? 'grid-rows-5 md:grid-rows-6' : 'grid-rows-1'} overflow-y-auto`}>
        {days.map((date, idx) => {
          const dateKey = getDateKey(date);
          const dateTasks = tasksByDate.get(dateKey) || [];
          
          const isDimmed = viewMode === 'month' && !isSameMonth(date, currentDate);
          const dayIsToday = isSameDay(date, new Date());
          
          return (
            <div 
              key={date.toISOString()} 
              onClick={() => onDateClick(date)}
              className={`
                border-r border-b border-slate-100 dark:border-slate-800 p-1 flex flex-col transition-colors
                ${isDimmed ? 'bg-slate-50/50 dark:bg-black/40 text-slate-400' : 'bg-white dark:bg-slate-900'}
                ${viewMode === 'week' ? 'min-h-[200px]' : 'min-h-[80px]'}
                hover:bg-blue-50/30 dark:hover:bg-blue-900/10 cursor-pointer
              `}
            >
              <div className="flex justify-center md:justify-start mb-1">
                <span className={`
                  w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold
                  ${dayIsToday 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : date.getDay() === 0 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}
                `}>
                  {date.getDate()}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar px-0.5">
                {dateTasks.map(task => (
                  <CalendarTaskItem 
                    key={task.id} 
                    task={task} 
                    staff={staff}
                    onDoubleClick={onTaskDoubleClick} 
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
