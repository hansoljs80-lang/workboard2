
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Task, Staff, TaskStatus } from '../types';
import { Play, AlignLeft, CheckSquare, Check } from 'lucide-react';
import TaskCardPreview from './TaskCardPreview';
import TaskPostponeControl from './TaskPostponeControl';
import AvatarStack from './common/AvatarStack';
import { useTaskCardLogic } from '../hooks/useTaskCardLogic';

interface TaskCardProps {
  task: Task;
  staff: Staff[];
  onDelete: (taskId: string) => void;
  onMove: (taskId: string, currentStatus: TaskStatus, direction: 'next' | 'prev') => void;
  onDirectComplete?: (task: Task) => void;
  onDoubleClick?: (task: Task) => void;
  onRefresh?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  staff, 
  onDelete, 
  onMove, 
  onDirectComplete, 
  onDoubleClick, 
  onRefresh 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use separated logic hook
  const {
    colorStyle,
    isDone,
    isInProgress,
    displayIds,
    indicatorClass,
    indicatorLabel,
    recurrenceBadge,
    progress
  } = useTaskCardLogic(task);

  // -- Event Handlers --

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (cardRef.current) {
      setRect(cardRef.current.getBoundingClientRect());
    }
    setShowPreview(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setShowPreview(false);
    }, 150);
  }, []);

  const handleClick = useCallback(() => {
    if (cardRef.current) {
      setRect(cardRef.current.getBoundingClientRect());
    }
    setShowPreview(prev => !prev);
  }, []);

  const handleMovePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMove(task.id, task.status, 'prev');
  };

  const handleMoveNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMove(task.id, task.status, 'next');
  };

  const handleDirectCompleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDirectComplete) onDirectComplete(task);
  };

  return (
    <>
      <div 
        ref={cardRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onDoubleClick={() => onDoubleClick?.(task)}
        className={`
          relative w-full z-0 flex flex-col
          rounded-lg border shadow-sm transition-all duration-200
          hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer
          ${isDone 
            ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800' 
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-100'} 
        `}
      >
        {/* Color Indicator Strip */}
        <div 
          className={`w-1.5 h-full absolute left-0 top-0 rounded-l-lg ${indicatorClass}`} 
          title={indicatorLabel}
        ></div>

        {/* Content Row */}
        <div className={`flex items-center justify-between p-2 h-[56px] gap-2 pl-3 rounded-lg`}>
          
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Title */}
            <h4 className={`
              text-sm font-bold truncate leading-tight flex-1 flex items-center
              ${isDone ? 'text-slate-400' : 'text-slate-800 dark:text-slate-100'}
            `}>
              {isInProgress && <span className="mr-1 inline-block animate-pulse">🔥</span>}
              
              {recurrenceBadge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded mr-1.5 font-bold shrink-0 ${recurrenceBadge.className} ${isDone ? 'opacity-75 grayscale-[0.3]' : ''}`}>
                  {recurrenceBadge.label}
                </span>
              )}
              
              <span className={`truncate ${isDone ? 'line-through decoration-slate-400' : ''}`}>
                {task.title}
              </span>
            </h4>
            
            {/* Icons: Checklist or Description */}
            {progress ? (
              <div className={`
                 flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0
                 ${progress.percentage === 100 
                    ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
                    : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600'}
              `}>
                <CheckSquare size={10} />
                <span>{progress.checked}/{progress.total}</span>
              </div>
            ) : task.description ? (
              <AlignLeft size={14} className="text-slate-400 shrink-0 opacity-70" />
            ) : null}
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Postpone Control */}
            <TaskPostponeControl 
              task={task} 
              onRefresh={onRefresh} 
              disabled={isDone} 
            />

            {/* Staff Avatars */}
            <AvatarStack 
              ids={displayIds} 
              staff={staff} 
              max={3} 
              size="md" 
              isDone={isDone} 
            />

            {/* Move Arrows & Direct Complete */}
            <div className="flex items-center gap-1.5 ml-1">
              
              {/* Back Arrow (Only for In Progress or Done) */}
              {task.status !== TaskStatus.TODO && (
                <button 
                  onClick={handleMovePrev}
                  className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center transition-colors shadow-sm"
                  title="이전 단계로"
                >
                  <Play size={8} className="fill-current rotate-180 mr-0.5" />
                </button>
              )}

              {/* Direct Complete Button (Only for TODO) */}
              {task.status === TaskStatus.TODO && onDirectComplete && (
                <button 
                   onClick={handleDirectCompleteClick}
                   className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800 flex items-center justify-center shadow-md transition-all active:scale-95 border border-green-200 dark:border-green-800"
                   title="즉시 완료 처리"
                >
                   <Check size={12} strokeWidth={3} />
                </button>
              )}

              {/* Next Arrow (Todo -> In Progress, In Progress -> Done) */}
              {task.status !== TaskStatus.DONE && (
                <button 
                  onClick={handleMoveNext}
                  className={`w-7 h-7 rounded-full ${indicatorClass} hover:brightness-90 text-white flex items-center justify-center shadow-md transition-all active:scale-95 active:shadow-sm`}
                  title={task.status === TaskStatus.TODO ? "진행 중으로 이동" : "완료 처리"}
                >
                  <Play size={10} className="fill-current ml-0.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Detail Window */}
      <TaskCardPreview 
        task={task}
        staff={staff}
        rect={rect}
        isVisible={showPreview}
        colorStyle={colorStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDelete={onDelete}
        onRefresh={onRefresh}
      />
    </>
  );
};

export default React.memo(TaskCard);
