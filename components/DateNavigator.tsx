
import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatDateRange } from '../utils/dateUtils';

interface DateNavigatorProps {
  currentDate: Date;
  viewMode: 'day' | 'week' | 'month';
  onNavigate: (direction: 'prev' | 'next') => void;
  onDateSelect?: (date: Date) => void;
}

const DateNavigator: React.FC<DateNavigatorProps> = ({ currentDate, viewMode, onNavigate, onDateSelect }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value && onDateSelect) {
      // "YYYY-MM-DD" 문자열을 로컬 시간 기준으로 파싱하여 타임존 문제 방지
      const [year, month, day] = e.target.value.split('-').map(Number);
      // JS Date의 월은 0부터 시작하므로 month - 1
      onDateSelect(new Date(year, month - 1, day));
    }
  };

  // input value를 위한 YYYY-MM-DD 문자열 생성 (로컬 시간 기준)
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;

  const handleCalendarClick = () => {
    // 데스크탑 브라우저에서 버튼 클릭 시 달력 팝업을 강제로 띄우기 위한 API
    try {
      if (inputRef.current && typeof inputRef.current.showPicker === 'function') {
        inputRef.current.showPicker();
      }
    } catch (e) {
      // showPicker가 지원되지 않는 구형 브라우저에서는 opacity 0 input이 fallback으로 동작함
      console.log('showPicker not supported', e);
    }
  };

  return (
    <div className="flex items-center gap-1 md:gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm select-none transition-colors">
      
      {/* 이전 버튼 */}
      <button 
        onClick={() => onNavigate('prev')} 
        className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-all active:scale-95"
        title="이전"
      >
        <ChevronLeft size={20} />
      </button>
      
      {/* 날짜 텍스트 */}
      <span className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap min-w-[100px] text-center px-2">
        {formatDateRange(currentDate, viewMode)}
      </span>

      {/* 달력 버튼 (독립형) */}
      {onDateSelect && (
        <div className="relative group">
          <button 
            type="button"
            onClick={handleCalendarClick}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all active:scale-95 shadow-sm"
            title="달력 열기"
          >
            <Calendar size={18} />
          </button>
          {/* 
            Invisible Input Overlay
            모바일에서는 이 input을 직접 터치하게 되고, 
            데스크탑에서는 버튼 클릭 -> showPicker()로 동작하거나 input 클릭으로 동작
          */}
          <input 
            ref={inputRef}
            type="date" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            value={dateString}
            onChange={handleDateChange}
            onClick={(e) => {
               // 이벤트 전파 방지 (필요 시)
               // e.stopPropagation();
            }}
          />
        </div>
      )}

      {/* 다음 버튼 */}
      <button 
        onClick={() => onNavigate('next')} 
        className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-all active:scale-95"
        title="다음"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default DateNavigator;
