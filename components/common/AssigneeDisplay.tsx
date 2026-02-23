
import React from 'react';
import { Staff } from '../../types';
import { Users } from 'lucide-react';

interface AssigneeDisplayProps {
  assigneeIds: string[];
  staff: Staff[];
  showNames?: boolean;
  compact?: boolean; // New prop for smaller size
}

const AssigneeDisplay: React.FC<AssigneeDisplayProps> = ({ assigneeIds, staff, showNames = true, compact = false }) => {
  const assignedStaff = assigneeIds.map(id => staff.find(s => s.id === id)).filter(Boolean);

  // Size classes based on compact mode
  const sizeClass = compact ? "w-6 h-6 text-[9px]" : "w-8 h-8 text-[10px]";
  const containerClass = compact ? "p-1.5" : "p-2.5";
  const ringClass = compact ? "ring-1" : "ring-2";

  if (assignedStaff.length === 0) {
    // All Staff / No specific assignees
    if (compact) {
       return (
         <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 opacity-80 bg-slate-200/50 dark:bg-slate-700/50 px-2 py-1 rounded-lg">
           <Users size={12} />
           <span>전체</span>
         </div>
       );
    }
    
    return (
       <div className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-200/50 dark:bg-slate-700/50 px-4 py-3 rounded-xl border border-slate-300/50 dark:border-slate-600/50 w-full shadow-sm">
         <div className="p-1.5 bg-white dark:bg-slate-600 rounded-full shrink-0 shadow-sm text-slate-600 dark:text-slate-300">
            <Users size={16} />
         </div>
         <span>전체 직원 배정</span>
       </div>
    );
  }

  // Helper to format names
  const getAssigneeNames = () => {
    const names = assignedStaff.map(s => s!.name);
    if (names.length <= 3) return names.join(', ');
    return `${names.slice(0, 3).join(', ')} 외 ${names.length - 3}명`;
  };

  return (
    <div className={`bg-white/60 dark:bg-slate-800/60 rounded-lg border border-white/50 dark:border-slate-700/50 backdrop-blur-sm ${containerClass}`}>
      <div className={`flex -space-x-2 ${showNames ? 'mb-2' : ''} px-1`}>
        {assignedStaff.slice(0, 5).map((s) => (
          <div 
            key={s!.id}
            className={`${sizeClass} rounded-full flex items-center justify-center text-white font-bold ${ringClass} ring-white dark:ring-slate-800 shadow-sm relative z-10`}
            style={{ backgroundColor: s!.color }}
          >
            {s!.name[0]}
          </div>
        ))}
        {assignedStaff.length > 5 && (
          <div className={`${sizeClass} rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold ${ringClass} ring-white dark:ring-slate-800 relative z-0`}>
            +{assignedStaff.length - 5}
          </div>
        )}
      </div>
      {showNames && (
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate px-1" title={assignedStaff.map(s => s?.name).join(', ')}>
          {getAssigneeNames()}
        </p>
      )}
    </div>
  );
};

export default React.memo(AssigneeDisplay);
