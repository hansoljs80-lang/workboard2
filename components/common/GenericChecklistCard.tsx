
import React, { useMemo } from 'react';
import { CheckSquare, Square, Save, Clock, AlertCircle } from 'lucide-react';
import AvatarStack from './AvatarStack';
import { Staff } from '../../types';

interface CheckItem {
  id: string;
  label: string;
}

interface GenericChecklistCardProps {
  title: string;
  icon: React.ReactNode;
  items: CheckItem[];
  checkedIds: string[]; // Current local state
  onToggle: (id: string) => void;
  onSave: () => void;
  theme: string; // Tailwind classes string for border/bg
  staff: Staff[];
  
  // Optional log data to show completion status
  lastLog?: {
    createdAt: string;
    performedBy: string[];
    checklist: { id: string; checked: boolean }[];
  } | null;
}

const GenericChecklistCard: React.FC<GenericChecklistCardProps> = ({
  title,
  icon,
  items,
  checkedIds,
  onToggle,
  onSave,
  theme,
  staff,
  lastLog
}) => {
  // Determine effective state:
  // If we have a log from today AND user hasn't touched the checkboxes yet, show the log's state.
  const isCompleted = !!lastLog;
  
  const effectiveChecks = useMemo(() => {
    if (isCompleted && checkedIds.length === 0) {
      return lastLog?.checklist.filter(c => c.checked).map(c => c.id) || [];
    }
    return checkedIds;
  }, [isCompleted, checkedIds, lastLog]);

  // Calculate progress for visual bar
  const progress = items.length > 0 
    ? Math.round((effectiveChecks.length / items.length) * 100) 
    : 0;

  return (
    <div className={`flex flex-col h-full rounded-2xl border-2 transition-all shadow-sm overflow-hidden bg-white dark:bg-slate-900 ${theme}`}>
      {/* Header */}
      <div className="p-4 border-b border-black/5 dark:border-white/5 shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/60 dark:bg-black/20 rounded-lg shadow-sm backdrop-blur-sm">
              {icon}
            </div>
            <div>
               <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">{title}</h3>
               {lastLog && (
                 <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                   <Clock size={10} />
                   최근: {new Date(lastLog.createdAt).toLocaleTimeString('ko-KR', {hour: '2-digit', minute:'2-digit'})}
                 </span>
               )}
            </div>
          </div>
          
          {/* Completion Badge */}
          {lastLog && (
             <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md text-[10px] font-bold shadow-sm">
                   <CheckSquare size={12} />
                   <span>완료됨</span>
                </div>
                <AvatarStack ids={lastLog.performedBy} staff={staff} size="xs" max={3} />
             </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
           <div 
             className={`h-full transition-all duration-500 ease-out ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
             style={{ width: `${progress}%` }}
           ></div>
        </div>
      </div>

      {/* Checklist Body */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-black/20">
        {(!items || items.length === 0) ? (
           <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm gap-2 opacity-60 py-8">
              <AlertCircle size={24} />
              <span>설정에서 업무를 추가해주세요.</span>
           </div>
        ) : (
            <div className="space-y-2">
            {items.map(item => {
                const isChecked = effectiveChecks.includes(item.id);
                return (
                <button
                    key={item.id}
                    onClick={() => onToggle(item.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all active:scale-[0.98] ${
                        isChecked 
                        ? 'bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-900/50 shadow-sm ring-1 ring-emerald-500/20' 
                        : 'bg-white/60 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                >
                    <div className={`mt-0.5 shrink-0 transition-colors ${isChecked ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`}>
                        {isChecked ? <CheckSquare size={20} /> : <Square size={20} />}
                    </div>
                    <span className={`text-sm font-medium transition-all ${isChecked ? 'text-slate-400 dark:text-slate-500 line-through decoration-slate-300 dark:decoration-slate-600' : 'text-slate-700 dark:text-slate-200'}`}>
                        {item.label}
                    </span>
                </button>
                );
            })}
            </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-4 border-t border-black/5 dark:border-white/5 bg-white/40 dark:bg-white/5 shrink-0">
        <button
          onClick={onSave}
          disabled={!items || items.length === 0}
          className={`
             w-full py-3.5 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 text-sm transition-all active:scale-95 disabled:opacity-50 disabled:scale-100
             ${isCompleted 
               ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700' 
               : 'bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-700 dark:hover:bg-slate-600'}
          `}
        >
           <Save size={16} /> 
           {isCompleted ? '수정 후 다시 저장' : '기록 저장'}
        </button>
      </div>
    </div>
  );
};

export default React.memo(GenericChecklistCard);
