
import React from 'react';
import { Repeat, CalendarRange, Clock, CalendarDays } from 'lucide-react';
import { RecurrenceType } from '../../types';

interface ScheduleSelectorProps {
  recurrence: RecurrenceType;
  setRecurrence: (type: RecurrenceType) => void;
  customInterval: number;
  setCustomInterval: (val: number) => void;
  weekDay: number; // For backward compatibility (not used in new UI)
  setWeekDay: (val: number) => void; // For backward compatibility
  weekDays?: number[]; // New array prop
  setWeekDays?: (val: number[]) => void; // New setter
  monthDay: number;
  setMonthDay: (val: number) => void;
}

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

const ScheduleSelector: React.FC<ScheduleSelectorProps> = ({
  recurrence,
  setRecurrence,
  customInterval,
  setCustomInterval,
  weekDays = [],
  setWeekDays,
  monthDay,
  setMonthDay
}) => {
  
  // Helper to handle toggle of week days
  const toggleWeekDay = (idx: number) => {
    if (!setWeekDays) return;
    if (weekDays.includes(idx)) {
      setWeekDays(weekDays.filter(d => d !== idx));
    } else {
      setWeekDays([...weekDays, idx].sort());
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
        <Repeat size={16} className="text-blue-500" /> 반복 일정 설정
      </label>
      
      {/* 1. Main Type Tabs */}
      <div className="flex bg-white dark:bg-slate-700 p-1 rounded-lg border border-slate-200 dark:border-slate-600 mb-4">
        {[
           { id: 'none', label: '없음', icon: null },
           { id: 'daily', label: '매일', icon: <Clock size={14} /> },
           { id: 'weekly', label: '주간', icon: <CalendarRange size={14} /> },
           { id: 'monthly', label: '월간', icon: <CalendarDays size={14} /> },
           { id: 'custom_days', label: '간격', icon: <Repeat size={14} /> },
        ].map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => {
               setRecurrence(type.id as RecurrenceType);
               // Reset defaults when switching
               if (type.id === 'weekly' && customInterval < 1) setCustomInterval(1);
               if (type.id === 'monthly' && customInterval < 1) setCustomInterval(1);
            }}
            className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-md flex items-center justify-center gap-1.5 transition-all ${
              recurrence === type.id 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600'
            }`}
          >
            {type.icon}
            {type.label}
          </button>
        ))}
      </div>

      {/* 2. Detailed Configuration */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4 animate-fade-in">
         
         {recurrence === 'none' && (
           <p className="text-sm text-slate-500 text-center py-2">반복 없이 1회성 업무로 저장됩니다.</p>
         )}

         {recurrence === 'daily' && (
           <p className="text-sm text-slate-500 text-center py-2">매일 반복되는 업무입니다.</p>
         )}

         {recurrence === 'weekly' && (
           <div className="space-y-4">
             <div className="flex items-center gap-3">
               <span className="text-sm font-bold text-slate-600 dark:text-slate-300">반복 간격:</span>
               <div className="flex items-center gap-2">
                 <input
                    type="number" min="1" max="52"
                    value={customInterval}
                    onChange={(e) => setCustomInterval(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 p-2 text-center border border-slate-300 dark:border-slate-600 rounded-lg font-bold bg-white dark:bg-slate-800"
                 />
                 <span className="text-sm text-slate-600 dark:text-slate-400">주 마다</span>
               </div>
             </div>

             <div>
               <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block uppercase">요일 선택 (다중 선택 가능)</span>
               <div className="flex gap-1 justify-between">
                 {WEEK_DAYS.map((day, idx) => (
                   <button
                     key={day}
                     type="button"
                     onClick={() => toggleWeekDay(idx)}
                     className={`w-10 h-10 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${
                       weekDays.includes(idx) 
                         ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-200 dark:ring-blue-900' 
                         : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                     }`}
                   >
                     {day}
                   </button>
                 ))}
               </div>
               {weekDays.length === 0 && <p className="text-xs text-red-500 mt-1">* 요일을 최소 1개 선택해주세요.</p>}
             </div>
           </div>
         )}

         {recurrence === 'monthly' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
               <span className="text-sm font-bold text-slate-600 dark:text-slate-300">반복 간격:</span>
               <div className="flex items-center gap-2">
                 <input
                    type="number" min="1" max="12"
                    value={customInterval}
                    onChange={(e) => setCustomInterval(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 p-2 text-center border border-slate-300 dark:border-slate-600 rounded-lg font-bold bg-white dark:bg-slate-800"
                 />
                 <span className="text-sm text-slate-600 dark:text-slate-400">개월 마다</span>
               </div>
             </div>

              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block uppercase">날짜 선택</span>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setMonthDay(day)}
                      className={`h-8 rounded-md text-xs font-bold transition-all ${
                        monthDay === day 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
         )}

         {recurrence === 'custom_days' && (
           <div className="flex items-center justify-center gap-3 py-4">
              <span className="text-sm font-bold text-slate-600 dark:text-slate-400">매</span>
              <input
                type="number"
                min="1"
                max="365"
                value={customInterval}
                onChange={(e) => setCustomInterval(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 p-3 text-center bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-slate-100"
              />
              <span className="text-sm font-bold text-slate-600 dark:text-slate-400">일 마다 반복</span>
           </div>
         )}
      </div>
    </div>
  );
};

export default React.memo(ScheduleSelector);
