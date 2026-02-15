
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { BedData, Staff } from '../types';
import { calculateBedStatus } from '../utils/bedUtils';
import { RefreshCw, AlertTriangle, CheckCircle2, Pencil, Check, X, CalendarClock, ThumbsUp, Undo2, UserCog } from 'lucide-react';
import AvatarStack from './common/AvatarStack';

interface BedCardProps {
  bed: BedData;
  staff: Staff[];
  interval: number;
  onChange: () => void;
  onNameChange: (id: number, name: string) => void;
  onUndo: (id: number) => void;
  onEditStaff: (id: number) => void;
}

const BedCard: React.FC<BedCardProps> = ({ bed, staff, interval, onChange, onNameChange, onUndo, onEditStaff }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(bed.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset local state when bed prop updates
  useEffect(() => {
    setEditName(bed.name);
  }, [bed.name]);

  // Status calculation (diffDays is now REMAINING days)
  const { status, diffDays: remainingDays } = useMemo(() => 
    calculateBedStatus(bed, interval), 
  [bed, interval]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSaveEdit = () => {
    if (editName.trim()) {
      onNameChange(bed.id, editName.trim());
    } else {
      setEditName(bed.name); // Revert if empty
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(bed.name);
    setIsEditing(false);
  };

  // Format date string for last change
  const lastChangedStr = useMemo(() => {
    if (!bed.lastChanged) return '기록 없음';
    const d = new Date(bed.lastChanged);
    return `${d.getMonth() + 1}.${d.getDate()} 교체됨`;
  }, [bed.lastChanged]);

  // Theme configuration (Updated as per user request)
  const theme = {
    today: 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200',
    // Danger (Overdue) -> Red
    danger: 'bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200',
    // Warning (Imminent) -> Orange
    warning: 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-200',
    success: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200',
  }[status];

  // Button Theme
  // Valid (Success) -> Blue Button
  const buttonTheme = {
    today: 'bg-slate-200 hover:bg-slate-300 text-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300 shadow-sm', // Undo Style
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-red-200 dark:shadow-none',
    warning: 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200 dark:shadow-none',
    success: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 dark:shadow-none',
  }[status];

  // Large Number Display Logic
  const MainCounter = () => {
    if (!bed.lastChanged) {
        return <span className="text-3xl font-extrabold text-red-600 dark:text-red-400">-</span>;
    }
    
    // Status Today
    if (status === 'today') {
        return (
            <div className="flex flex-col items-center">
                <ThumbsUp size={32} className="text-blue-600 dark:text-blue-400 mb-1" />
                <span className="text-xl font-black text-blue-700 dark:text-blue-300">오늘 완료</span>
            </div>
        );
    }
    
    // Overdue (Needs Changing) -> Red & Pulse
    if (remainingDays < 0) {
        return (
            <div className="flex flex-col items-center animate-pulse">
                <span className="text-sm font-bold opacity-70 mb-[-5px]">초과</span>
                <span className="text-4xl font-black text-red-700 dark:text-red-300 tracking-tighter">
                   +{Math.abs(remainingDays)}
                </span>
                <span className="text-xs font-bold opacity-70 mt-[-2px]">일</span>
            </div>
        );
    }

    if (remainingDays === 0) {
        return <span className="text-3xl font-black text-orange-700 dark:text-orange-300">D-Day</span>;
    }

    return (
        <div className="flex flex-col items-center">
            <span className="text-sm font-bold opacity-50 mb-[-5px]">남은 기간</span>
            <div className="flex items-baseline gap-1">
                <span className={`text-4xl font-black tracking-tighter ${status === 'warning' ? 'text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400'}`}>
                    {remainingDays}
                </span>
                <span className="text-sm font-bold opacity-60">일</span>
            </div>
        </div>
    );
  };

  return (
    <div className={`
      relative p-3 rounded-2xl border-2 transition-all flex flex-col shadow-sm hover:shadow-md h-full min-h-[160px]
      ${theme}
    `}>
      {/* Header: Name & Edit */}
      <div className="flex justify-between items-start mb-2 h-8">
         <div className="flex-1 min-w-0">
           {isEditing ? (
             <div className="flex items-center gap-1">
               <input
                 ref={inputRef}
                 type="text"
                 value={editName}
                 onChange={(e) => setEditName(e.target.value)}
                 onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') handleCancelEdit();
                 }}
                 className="w-full text-sm p-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold outline-none focus:ring-2 focus:ring-blue-500"
               />
               <button onClick={handleSaveEdit} className="text-green-600 hover:bg-green-100 p-1 rounded"><Check size={16}/></button>
               <button onClick={handleCancelEdit} className="text-red-500 hover:bg-red-100 p-1 rounded"><X size={16}/></button>
             </div>
           ) : (
             <div className="group flex items-center gap-1">
               <h3 className="font-bold text-base truncate" title={bed.name}>{bed.name}</h3>
               <button 
                 onClick={handleStartEdit}
                 className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded text-inherit"
                 title="이름 수정"
               >
                 <Pencil size={10} />
               </button>
             </div>
           )}
         </div>
         
         {status === 'danger' && !isEditing && (
             <AlertTriangle size={18} className="text-red-600 animate-bounce" />
         )}
         {status === 'warning' && !isEditing && (
             <AlertTriangle size={18} className="text-orange-600" />
         )}
         {status === 'today' && !isEditing && (
             <CheckCircle2 size={18} className="text-blue-600" />
         )}
         {status === 'success' && !isEditing && (
             <CheckCircle2 size={18} className="text-slate-300" />
         )}
      </div>

      {/* Body: Big Countdown Number */}
      <div className="flex-1 flex flex-col items-center justify-center py-1">
         <MainCounter />
      </div>

      {/* Footer Info: Last Change Date */}
      <div className="flex justify-center items-center gap-1 text-[10px] opacity-60 font-medium mb-3">
         <CalendarClock size={10} />
         <span>{lastChangedStr}</span>
      </div>

      {/* Action Button */}
      <div className="mt-auto">
        <button
          onClick={(e) => {
             e.stopPropagation();
             if (status === 'today') {
                onUndo(bed.id);
             } else {
                onChange();
             }
          }}
          disabled={isEditing}
          className={`
             w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm
             ${buttonTheme}
             ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {status === 'today' ? (
             <>
               <Undo2 size={14} />
               실수/취소
             </>
          ) : (
             <>
               <RefreshCw size={14} className={(status === 'danger' || status === 'warning') ? 'animate-spin-slow' : ''} />
               지금 교체
             </>
          )}
        </button>
      </div>

      {/* Staff Avatar (Absolute Top Right) */}
      {bed.lastChangedBy && bed.lastChangedBy.length > 0 && !isEditing && (
         <div 
           className="absolute top-2 right-2 cursor-pointer group"
           onClick={(e) => {
             e.stopPropagation();
             onEditStaff(bed.id);
           }}
           title="수행 직원 수정"
         >
             <div className="relative">
                <AvatarStack 
                  ids={bed.lastChangedBy} 
                  staff={staff} 
                  size="xs" 
                  max={1} 
                />
                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-700 rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                   <UserCog size={10} className="text-blue-500" />
                </div>
             </div>
         </div>
      )}
    </div>
  );
};

export default BedCard;
