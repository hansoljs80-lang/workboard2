
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { BedData, Staff } from '../types';
import { calculateBedStatus } from '../utils/bedUtils';
import { RefreshCw, History, AlertTriangle, CheckCircle2, Pencil, Check, X } from 'lucide-react';
import AvatarStack from './common/AvatarStack';

interface BedCardProps {
  bed: BedData;
  staff: Staff[];
  interval: number;
  onChange: () => void;
  onNameChange: (id: number, name: string) => void;
}

const BedCard: React.FC<BedCardProps> = ({ bed, staff, interval, onChange, onNameChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(bed.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset local state when bed prop updates
  useEffect(() => {
    setEditName(bed.name);
  }, [bed.name]);

  // Use Utility for consistent status calculation
  const { status, days, label } = useMemo(() => 
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

  const theme = {
    danger: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
    success: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400',
  }[status];

  const buttonTheme = {
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white',
    success: 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50',
  }[status];

  return (
    <div className={`
      relative p-4 rounded-2xl border-2 transition-all flex flex-col gap-3 shadow-sm hover:shadow-md
      ${theme}
    `}>
      <div className="flex justify-between items-start min-h-[52px]">
        <div className="flex-1 min-w-0 pr-2">
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
             <div className="group flex items-center gap-2">
               <h3 className="font-bold text-lg truncate" title={bed.name}>{bed.name}</h3>
               <button 
                 onClick={handleStartEdit}
                 className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/10 rounded text-inherit"
                 title="이름 수정"
               >
                 <Pencil size={12} />
               </button>
             </div>
           )}
           
           <div className="flex items-center gap-1.5 text-xs font-bold mt-1 opacity-80">
             {status === 'success' ? <CheckCircle2 size={12} /> : <History size={12} />}
             {label}
           </div>
        </div>
        
        {status === 'danger' && !isEditing && (
           <div className="animate-pulse text-red-500 shrink-0">
              <AlertTriangle size={20} />
           </div>
        )}
      </div>

      <div className="mt-auto pt-2">
        <button
          onClick={onChange}
          disabled={isEditing}
          className={`
             w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm
             ${buttonTheme}
             ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <RefreshCw size={16} />
          지금 교체
        </button>
      </div>

      {days >= 0 && bed.lastChanged && !isEditing && (
         <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
            <span className="text-[10px] opacity-40 font-mono">
               {bed.lastChanged.substring(5, 10)}
            </span>
            {/* Show avatar of who changed it */}
            {bed.lastChangedBy && bed.lastChangedBy.length > 0 && (
               <AvatarStack 
                 ids={bed.lastChangedBy} 
                 staff={staff} 
                 size="xs" 
                 max={2} 
               />
            )}
         </div>
      )}
    </div>
  );
};

export default BedCard;
