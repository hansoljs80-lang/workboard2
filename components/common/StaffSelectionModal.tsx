import React, { useState, useMemo, useEffect } from 'react';
import { Staff } from '../../types';
import { CheckCircle2, Users, X } from 'lucide-react';

interface StaffSelectionModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  staff: Staff[];
  initialSelectedIds?: string[]; // Pre-selection support
  onClose: () => void;
  onConfirm: (staffIds: string[]) => void;
  confirmLabel?: string;
  allowMultiple?: boolean; // Toggle multi-select
}

const StaffSelectionModal: React.FC<StaffSelectionModalProps> = ({ 
  isOpen, 
  title = "직원 선택",
  message = "수행한 직원을 선택해주세요.",
  staff, 
  initialSelectedIds = [],
  onClose, 
  onConfirm,
  confirmLabel = "선택 완료",
  allowMultiple = true
}) => {
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);

  // Initialize selection when modal opens
  // FIX: Only run when isOpen changes to true. 
  // We exclude initialSelectedIds from dependency to prevent state reset when parent re-renders 
  // (which creates a new [] reference for the default prop).
  useEffect(() => {
    if (isOpen) {
      setSelectedStaff([...initialSelectedIds]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); 

  // Filter active staff only
  const activeStaff = useMemo(() => staff.filter(s => s.isActive !== false), [staff]);

  if (!isOpen) return null;

  const toggleStaff = (id: string) => {
    if (allowMultiple) {
      setSelectedStaff(prev => 
        prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
      );
    } else {
      // Single select behavior
      setSelectedStaff(prev => prev.includes(id) ? [] : [id]);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedStaff);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[99999] animate-fade-in"
      onClick={(e) => e.stopPropagation()} // Prevent clicks from bubbling to board
    >
      <div 
        className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up border border-slate-200 dark:border-slate-700 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
             <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-full text-blue-600 dark:text-blue-400">
               <Users size={16} />
             </div>
             <div>
               <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">{title}</h3>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={20} />
          </button>
        </div>
        
        {message && (
          <div className="px-4 pt-3 pb-0">
            <p className="text-xs text-slate-500 dark:text-slate-400">{message}</p>
          </div>
        )}
        
        <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-2 gap-2">
            {activeStaff.map(member => (
              <button
                key={member.id}
                onClick={() => toggleStaff(member.id)}
                className={`p-3 rounded-xl border flex items-center gap-2 transition-all text-left ${
                  selectedStaff.includes(member.id) 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-500' 
                    : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'}
                `}
              >
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[10px] shadow-sm shrink-0"
                  style={{ backgroundColor: member.color }}
                >
                  {member.name[0]}
                </div>
                <span className="font-bold text-sm truncate flex-1">{member.name}</span>
                {selectedStaff.includes(member.id) && (
                  <CheckCircle2 size={16} className="text-blue-500 shrink-0" />
                )}
              </button>
            ))}
          </div>
          {activeStaff.length === 0 && (
             <p className="text-center text-slate-400 text-sm py-4">선택 가능한 직원이 없습니다.</p>
          )}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex gap-3 shrink-0">
           <button 
             onClick={onClose}
             className="flex-1 py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-sm"
           >
             취소
           </button>
           <button 
             onClick={handleConfirm}
             disabled={selectedStaff.length === 0}
             className="flex-[2] py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 dark:shadow-blue-900/30 hover:bg-blue-700 transition-all active:scale-95 text-sm disabled:opacity-50 disabled:active:scale-100"
           >
             {confirmLabel} ({selectedStaff.length})
           </button>
        </div>
      </div>
    </div>
  );
};

export default StaffSelectionModal;