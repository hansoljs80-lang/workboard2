
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Task, Staff, TaskStatus } from '../types';
import { Trash, CheckCircle2, Clock, Square, CheckSquare, Loader2 } from 'lucide-react';
import { toggleChecklistItem } from '../utils/checklistUtils';
import { updateTask } from '../services/api';

interface TaskCardPreviewProps {
  task: Task;
  staff: Staff[];
  rect: DOMRect | null;
  isVisible: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onDelete: (id: string) => void;
  colorStyle: any;
  onRefresh?: () => void;
}

const TaskCardPreview: React.FC<TaskCardPreviewProps> = ({
  task,
  staff,
  rect,
  isVisible,
  onMouseEnter,
  onMouseLeave,
  onDelete,
  colorStyle,
  onRefresh
}) => {
  const [localDesc, setLocalDesc] = useState(task.description);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setLocalDesc(task.description);
  }, [task.description]);

  const handleToggleCheck = async (idx: number) => {
    if (updating) return;

    const newDesc = toggleChecklistItem(localDesc, idx);
    setLocalDesc(newDesc);
    setUpdating(true);

    try {
      await updateTask(task.id, { description: newDesc });
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
      setLocalDesc(task.description); 
    } finally {
      setUpdating(false);
    }
  };

  const renderDescription = () => {
    if (!localDesc) {
      return (
        <div className="mb-3">
          <span className="text-xs text-slate-400 italic">상세 내용이 없습니다.</span>
        </div>
      );
    }

    const lines = localDesc.split('\n');
    const isChecklist = lines.some(l => l.trim().startsWith('- [ ]') || l.trim().startsWith('- [x]'));

    if (isChecklist) {
      return (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700 mb-3 max-h-[300px] overflow-y-auto custom-scrollbar">
           <div className="space-y-2">
             {lines.map((line, idx) => {
               const trimmed = line.trim();
               const isUnchecked = trimmed.startsWith('- [ ]');
               const isChecked = trimmed.startsWith('- [x]');
               const content = trimmed.substring(5).trim();

               if (isUnchecked || isChecked) {
                  return (
                    <div 
                      key={idx} 
                      onClick={(e) => { e.stopPropagation(); handleToggleCheck(idx); }}
                      className={`
                        flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer group select-none
                        ${isChecked 
                          ? 'bg-slate-100 dark:bg-slate-800/50 border-transparent opacity-60' 
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 shadow-sm hover:border-blue-400 hover:shadow-md'}
                      `}
                    >
                       <div className={`mt-0.5 shrink-0 transition-colors ${isChecked ? 'text-slate-400' : 'text-blue-600 dark:text-blue-400'}`}>
                          {isChecked ? <CheckSquare size={18} /> : <Square size={18} strokeWidth={2} className="fill-blue-50/50 dark:fill-transparent" />}
                       </div>
                       <span className={`text-sm leading-snug ${isChecked ? 'line-through text-slate-500' : 'font-bold text-slate-800 dark:text-slate-100'}`}>
                         {content}
                       </span>
                    </div>
                  );
               } else {
                  return (
                     <p key={idx} className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed px-2 py-1">
                       {line}
                     </p>
                  )
               }
             })}
           </div>
           {updating && (
             <div className="flex items-center gap-1 mt-2 text-xs font-bold text-blue-500 justify-end">
               <Loader2 size={12} className="animate-spin" /> 저장 중...
             </div>
           )}
        </div>
      );
    }

    return (
      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700 mb-3">
        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
          {localDesc}
        </p>
      </div>
    );
  };

  if (!isVisible || !rect) return null;
  
  const isDone = task.status === TaskStatus.DONE;
  const completedIds = task.completedBy || [];
  const completedStaffList = isDone 
    ? completedIds.map(id => staff.find(s => s.id === id)).filter(Boolean)
    : [];

  return createPortal(
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      // CRITICAL: Stop propagation here to prevent TaskCard's onClick from firing and closing the preview immediately
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
        zIndex: 9999,
      }}
      className="animate-fade-in-up origin-top"
    >
      <div className={`
        bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700
        overflow-hidden flex flex-col relative
      `}>
        <div className={`h-2 w-full ${colorStyle.bg} ${colorStyle.darkBg}`}></div>

        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-base leading-relaxed break-keep">
              {task.title}
            </h4>
          </div>

          {renderDescription()}

          <div className="flex flex-col gap-2 mb-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2 rounded">
               <Clock size={12} />
               <span>작성: {new Date(task.createdAt).toLocaleDateString()}</span>
            </div>
            
            {isDone && (
              <div className="mt-2 p-2.5 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800/50">
                 <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400 font-bold mb-1.5">
                    <CheckCircle2 size={14} />
                    <span>완료됨</span>
                 </div>
                 
                 {completedStaffList.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-[10px] text-green-600 dark:text-green-500 font-medium">완료 처리한 직원:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {completedStaffList.map(s => (
                           <div key={s!.id} className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1 rounded-full border border-green-200 dark:border-green-800 shadow-sm">
                             <div 
                               className="w-4 h-4 rounded-full"
                               style={{ backgroundColor: s!.color }}
                             ></div>
                             <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{s!.name}</span>
                           </div>
                        ))}
                      </div>
                    </div>
                 ) : (
                    <p className="text-[10px] text-green-600/70 italic">완료자 정보 없음</p>
                 )}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
            <div className="flex -space-x-1.5 items-center">
               {!isDone && <span className="text-[10px] text-slate-400 mr-2 font-medium">배정:</span>}
               {!isDone && task.assigneeIds.map(id => {
                  const s = staff.find(st => st.id === id);
                  if(!s) return null;
                  return (
                    <div 
                      key={id}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold ring-2 ring-white dark:ring-slate-800 shadow-sm"
                      style={{ backgroundColor: s.color }}
                      title={s.name}
                    >
                      {s.name[0]}
                    </div>
                  )
               })}
               {!isDone && task.assigneeIds.length === 0 && (
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">전체</span>
               )}
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Removed setTimeout to fix mobile/PWA confirm dialog issues
                onDelete(task.id);
              }}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 px-3 py-2 rounded-lg transition-colors font-bold ml-auto cursor-pointer"
            >
              <Trash size={14} />
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TaskCardPreview;
