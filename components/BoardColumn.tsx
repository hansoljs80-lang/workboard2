
import React, { useMemo } from 'react';
import { Task, Staff, TaskStatus } from '../types';
import TaskCard from './TaskCard';

interface BoardColumnProps {
  title: string;
  icon: React.ReactNode;
  colorClass: string;
  borderColorClass: string;
  tasks: Task[];
  staff: Staff[];
  onDelete: (id: string) => void;
  onMove: (id: string, status: TaskStatus, dir: 'next' | 'prev') => void;
  onDirectComplete?: (task: Task) => void;
  headerAction?: React.ReactNode;
  onTaskDoubleClick?: (task: Task) => void;
  onRefresh?: () => void;
}

const BoardColumn: React.FC<BoardColumnProps> = ({ 
  title, 
  icon, 
  colorClass, 
  borderColorClass,
  tasks, 
  staff, 
  onDelete, 
  onMove, 
  onDirectComplete,
  headerAction, 
  onTaskDoubleClick,
  onRefresh
}) => {
  
  const EmptyState = () => {
    let message = "데이터 없음";
    let subMessage = "";
    
    if (title === "할 일") {
      message = "할 일이 없네요!";
      subMessage = "잠깐 쉴까요? 😴";
    } else if (title === "진행 중") {
      message = "진행 중인 업무가 없습니다.";
      subMessage = "시작해볼까요? 🔥";
    } else if (title === "완료") {
      message = "아직 완료된 게 없어요.";
      subMessage = "화이팅! 💪";
    }

    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 text-center pointer-events-none p-4 opacity-70">
        <div className="text-4xl mb-2 grayscale opacity-30">📦</div>
        <p className="font-medium text-sm">{message}</p>
        <p className="text-xs mt-1 opacity-75">{subMessage}</p>
      </div>
    );
  };

  // Memoize the task list rendering to ensure stability
  const taskList = useMemo(() => {
    return tasks.map(task => (
      <TaskCard 
        key={task.id} 
        task={task} 
        staff={staff} 
        onDelete={onDelete} 
        onMove={onMove} 
        onDirectComplete={onDirectComplete}
        onDoubleClick={onTaskDoubleClick}
        onRefresh={onRefresh}
      />
    ));
  }, [tasks, staff, onDelete, onMove, onDirectComplete, onTaskDoubleClick, onRefresh]);

  return (
    <div className={`
      flex-1 min-w-[300px] flex flex-col 
      bg-white dark:bg-slate-900 
      rounded-xl 
      border-t-4 ${borderColorClass} 
      border-x border-b border-slate-200 dark:border-slate-800
      shadow-lg shadow-slate-200/50 dark:shadow-none
      transition-all
      h-auto min-h-[200px] md:h-full
    `}>
      {/* 
         Mobile: h-auto to allow growing with content (page scroll). Reduced min-h to 200px.
         Desktop: h-full to fit container (internal scroll)
      */}

      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-lg sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorClass} bg-opacity-20 text-opacity-100`}>
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-none">{title}</h3>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {tasks.length}개의 카드
            </span>
          </div>
        </div>
        {headerAction}
      </div>
      
      {/* Task List Area */}
      {/* Mobile: Removed flex-1 to allow proper expansion, removed overflow. Desktop: flex-1 + overflow-y-auto */}
      <div className="p-3 relative bg-slate-50/50 dark:bg-black/20 md:overflow-y-auto md:flex-1 custom-scrollbar min-h-[150px]">
        {tasks.length > 0 ? (
          <div className="space-y-2 pb-2">
            {taskList}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
};

export default React.memo(BoardColumn);
