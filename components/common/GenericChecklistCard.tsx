
import React from 'react';
import { CheckSquare, Square, Save, Clock, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import AvatarStack from './AvatarStack';
import { Staff } from '../../types';

export interface RuntimeChecklistItem {
  id: string; // Unique Runtime ID
  label: string;
  checked: boolean;
  originalId?: string; // Config ID
}

interface GenericChecklistCardProps {
  title: string;
  icon: React.ReactNode;
  items: RuntimeChecklistItem[]; // Runtime list
  onToggle: (id: string) => void;
  onSave: () => void;
  onAdd?: () => void; // Handler to open add modal
  onDelete?: (id: string) => void; // Handler to delete item
  theme: string;
  staff: Staff[];
  lastLog: any | null;
}

const GenericChecklistCard: React.FC<GenericChecklistCardProps> = ({
  title,
  icon,
  items,
  onToggle,
  onSave,
  onAdd,
  onDelete,
  theme,
  staff,
  lastLog
}) => {
  const isCompleted = !!lastLog;

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
               <div className="flex items-center gap-2">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                 {/* Add Button in Header */}
                 {onAdd && !isCompleted && (
                   <button 
                     onClick={onAdd}
                     className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                     title="항목 추가"
                   >
                     <Plus size={14} />
                   </button>
                 )}
               </div>
               {lastLog && (
                 <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
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
                   <CheckCircle2 size={12} />
                   <span>완료됨</span>
                </div>
                <AvatarStack ids={lastLog.performedBy} staff={staff} size="xs" max={3} />
             </div>
          )}
        </div>
      </div>

      {/* Checklist Items */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-black/20">
        {(!items || items.length === 0) ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm gap-2 opacity-60">
               <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800"><CheckSquare size={20} /></div>
               <span>항목이 없습니다.</span>
               {onAdd && !isCompleted && <button onClick={onAdd} className="text-blue-500 font-bold hover:underline">항목 추가하기</button>}
            </div>
        ) : (
            <div className="space-y-2">
            {items.map(item => {
                return (
                <div key={item.id} className="flex items-center gap-2 group">
                  <button
                      onClick={() => onToggle(item.id)}
                      disabled={isCompleted} 
                      className={`flex-1 flex items-start gap-3 p-3 rounded-xl border text-left transition-all active:scale-[0.98] ${
                          item.checked 
                          ? 'bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-900/50 shadow-sm ring-1 ring-blue-50 dark:ring-blue-900/20' 
                          : 'bg-white/60 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800'
                      } ${isCompleted ? 'opacity-80 cursor-default' : ''}`}
                  >
                      <div className={`mt-0.5 shrink-0 transition-colors ${item.checked ? 'text-blue-500' : 'text-slate-300 dark:text-slate-600'}`}>
                          {item.checked ? <CheckSquare size={20} /> : <Square size={20} />}
                      </div>
                      <span className={`text-sm font-medium transition-all ${item.checked ? 'text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
                          {item.label}
                      </span>
                  </button>
                  
                  {/* Delete Button (Only if not completed) */}
                  {!isCompleted && onDelete && (
                    <button 
                      onClick={() => onDelete(item.id)}
                      className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                      title="삭제"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                );
            })}
            </div>
        )}
      </div>

      {/* Footer Action */}
      <div className="p-4 border-t border-black/5 dark:border-white/5 bg-white/40 dark:bg-white/5 shrink-0">
        <button
            onClick={onSave}
            disabled={!items || items.length === 0}
            className={`
              w-full py-3.5 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 text-sm transition-all active:scale-95 disabled:opacity-50 disabled:scale-100
              ${isCompleted 
                ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700' 
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

export default GenericChecklistCard;
