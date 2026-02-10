
import React from 'react';
import { Task, Staff, TaskStatus } from '../types';
import BoardColumn from './BoardColumn';
import { Clock, Check, Plus, ChevronsRight, Loader } from 'lucide-react';

interface KanbanViewProps {
  todoTasks: Task[];
  inProgressTasks: Task[]; 
  doneTasks: Task[];
  staff: Staff[];
  onDelete: (id: string) => void;
  onMove: (id: string, status: TaskStatus, dir: 'next' | 'prev') => void;
  onDirectComplete?: (task: Task) => void;
  onTaskDoubleClick: (task: Task) => void;
  onAddClick: () => void;
  onRefresh?: () => void;
}

const KanbanView: React.FC<KanbanViewProps> = ({
  todoTasks,
  inProgressTasks,
  doneTasks,
  staff,
  onDelete,
  onMove,
  onDirectComplete,
  onTaskDoubleClick,
  onAddClick,
  onRefresh
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-2 h-full overflow-x-auto pb-2 items-stretch">
      {/* Column: To Do */}
      <BoardColumn 
        title="할 일" 
        icon={<Clock size={20} />} 
        colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        borderColorClass="border-blue-500"
        tasks={todoTasks} 
        staff={staff} 
        onDelete={onDelete} 
        onMove={onMove}
        onDirectComplete={onDirectComplete}
        onTaskDoubleClick={onTaskDoubleClick}
        onRefresh={onRefresh}
        headerAction={
          <button 
            onClick={onAddClick}
            className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 active:scale-90"
            title="새 업무 추가"
          >
            <Plus size={18} />
          </button>
        }
      />

      {/* Arrow 1: To Do -> In Progress */}
      <div className="hidden md:flex items-center justify-center px-1">
        <ChevronsRight 
          size={36} 
          strokeWidth={3} 
          className="text-slate-400 dark:text-slate-600 drop-shadow-sm" 
        />
      </div>

      {/* Column: In Progress */}
      <BoardColumn 
        title="진행 중" 
        // Only spin if there are tasks in progress
        icon={<Loader size={20} className={inProgressTasks.length > 0 ? "animate-spin" : ""} />} 
        colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        borderColorClass="border-amber-500"
        tasks={inProgressTasks} 
        staff={staff} 
        onDelete={onDelete} 
        onMove={onMove}
        onDirectComplete={onDirectComplete}
        onTaskDoubleClick={onTaskDoubleClick}
        onRefresh={onRefresh} 
      />

      {/* Arrow 2: In Progress -> Done */}
      <div className="hidden md:flex items-center justify-center px-1">
        <ChevronsRight 
          size={36} 
          strokeWidth={3} 
          className="text-slate-400 dark:text-slate-600 drop-shadow-sm" 
        />
      </div>

      {/* Column: Done */}
      <BoardColumn 
        title="완료" 
        icon={<Check size={20} />} 
        colorClass="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
        borderColorClass="border-green-500"
        tasks={doneTasks} 
        staff={staff} 
        onDelete={onDelete} 
        onMove={onMove}
        onDirectComplete={onDirectComplete}
        onTaskDoubleClick={onTaskDoubleClick}
        onRefresh={onRefresh} 
      />
    </div>
  );
};

export default React.memo(KanbanView);
