
import React from 'react';
import { CalendarDays } from 'lucide-react';
import { Task } from '../types';
import { updateTask } from '../services/api';

interface TaskPostponeControlProps {
  task: Task;
  onRefresh?: () => void;
  disabled?: boolean;
}

const TaskPostponeControl: React.FC<TaskPostponeControlProps> = ({ task, onRefresh, disabled }) => {
  
  // 이미 발급된 업무이므로, '매일' 반복이라도 개별 날짜 변경은 가능하게 허용 (유연성)
  // 단, 완료된 업무는 변경 불가
  
  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDateVal = e.target.value;
    if (!newDateVal) return;
    
    e.target.value = '';

    setTimeout(async () => {
        if (window.confirm('이 업무의 날짜를 변경하시겠습니까?')) {
            try {
                const [yearStr, monthStr, dayStr] = newDateVal.split('-');
                const year = parseInt(yearStr, 10);
                const month = parseInt(monthStr, 10) - 1; 
                const day = parseInt(dayStr, 10);
    
                const targetDate = new Date(year, month, day);
                targetDate.setHours(9, 0, 0, 0); 
                
                const isoDate = targetDate.toISOString();
    
                // DB 업데이트 (단순 날짜 변경)
                await updateTask(task.id, { createdAt: isoDate });
    
                if (onRefresh) {
                    await onRefresh();
                }
            } catch (error) {
                console.error("Failed to postpone task", error);
                alert("날짜 변경 중 오류가 발생했습니다.");
            }
        }
    }, 10);
  };

  if (disabled) {
    return (
      <div 
        className="w-7 h-7 flex items-center justify-center text-slate-300 dark:text-slate-600 cursor-not-allowed"
        onClick={(e) => e.stopPropagation()}
      >
        <CalendarDays size={16} />
      </div>
    );
  }

  return (
    <label 
      className="relative w-7 h-7 flex items-center justify-center group cursor-pointer"
      onClick={(e) => e.stopPropagation()} 
    >
      <div className="absolute inset-0 flex items-center justify-center p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 group-hover:text-blue-500 transition-colors pointer-events-none">
        <CalendarDays size={16} />
      </div>
      <input 
        type="date" 
        onChange={handleDateChange}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        title="날짜 변경 (이동)"
      />
    </label>
  );
};

export default React.memo(TaskPostponeControl);
