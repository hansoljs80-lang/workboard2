
import React, { useMemo } from 'react';
import { Task, TaskStatus, Staff } from '../types';
import { Clock, CheckCircle2 } from 'lucide-react';
import AvatarStack from './common/AvatarStack';

interface CalendarTaskItemProps {
  task: Task;
  staff?: Staff[];
  onDoubleClick: (task: Task) => void;
}

const CalendarTaskItem: React.FC<CalendarTaskItemProps> = ({ task, staff = [], onDoubleClick }) => {
  const statusConfig = useMemo(() => {
    switch (task.status) {
      case TaskStatus.TODO:
        return {
          // Updated to Blue to match Kanban 'Todo' Column (was red previously)
          style: "bg-white dark:bg-slate-800 border-l-4 border-blue-500 text-slate-700 dark:text-slate-200",
          icon: <Clock size={10} className="text-blue-500" />
        };
      case TaskStatus.IN_PROGRESS:
        return {
          style: "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-l-4 border-amber-400 font-bold",
          icon: <span className="animate-pulse">🔥</span>
        };
      case TaskStatus.DONE:
        return {
          style: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-500 border-l-4 border-green-500/50 opacity-60 grayscale-[0.5] line-through decoration-green-500/50",
          icon: <CheckCircle2 size={10} />
        };
      default:
        return { style: "", icon: null };
    }
  }, [task.status]);

  // Determine who to show
  const isDone = task.status === TaskStatus.DONE;
  const targetIds = useMemo(() => {
    return isDone && task.completedBy && task.completedBy.length > 0 
      ? task.completedBy 
      : task.assigneeIds;
  }, [isDone, task.completedBy, task.assigneeIds]);

  return (
    <div 
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(task); }}
      className={`text-[10px] md:text-xs p-1.5 rounded-r shadow-sm mb-1 cursor-pointer hover:opacity-100 hover:scale-[1.02] transition-all flex items-center justify-between gap-1.5 ${statusConfig.style}`}
      title={`${task.title} (${task.status})`}
    >
      <div className="flex items-center gap-1.5 overflow-hidden">
         <span className="shrink-0 flex items-center justify-center w-3 h-3">{statusConfig.icon}</span>
         <span className="truncate font-medium">{task.title}</span>
      </div>
      
      {/* Staff Indicators */}
      {targetIds.length > 0 && (
         <div className="shrink-0">
           <AvatarStack ids={targetIds} staff={staff} max={3} size="xs" />
         </div>
      )}
    </div>
  );
};

export default React.memo(CalendarTaskItem);
