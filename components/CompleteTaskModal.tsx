
import React, { useState, useEffect, useMemo } from 'react';
import { Staff, Task } from '../types';
import { CheckCircle2 } from 'lucide-react';

interface CompleteTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (staffIds: string[]) => void;
  staff: Staff[];
  task: Task | null;
}

const CompleteTaskModal: React.FC<CompleteTaskModalProps> = ({ isOpen, onClose, onConfirm, staff, task }) => {
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);

  // When modal opens, pre-select the original assignees or the current user if possible
  useEffect(() => {
    if (isOpen && task) {
      if (task.assigneeIds && task.assigneeIds.length > 0) {
        // Filter out inactive staff from default selection IF needed, 
        // but typically we keep original assignees even if resigned for completion.
        setSelectedStaff([...task.assigneeIds]);
      } else {
        setSelectedStaff([]); 
      }
    }
  }, [isOpen, task]);

  // Filter staff to show:
  // 1. Active Staff
  // 2. OR Staff who are ALREADY assigned to this task (even if they resigned, they should be finishable)
  const visibleStaff = useMemo(() => {
    return staff.filter(s => {
      const isActive = s.isActive !== false;
      const isAssigned = task?.assigneeIds?.includes(s.id);
      return isActive || isAssigned;
    });
  }, [staff, task]);

  if (!isOpen || !task) return null;

  const toggleStaff = (id: string) => {
    setSelectedStaff(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    onConfirm(selectedStaff);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-fade-in-up border border-slate-100 dark:border-slate-700">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">업무 완료 확인</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">"{task.title}" 업무를 수행한 직원을 선택해주세요.</p>
        </div>
        
        <div className="p-5 max-h-[300px] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-2">
            {visibleStaff.map(member => (
              <button
                key={member.id}
                onClick={() => toggleStaff(member.id)}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                  selectedStaff.includes(member.id) 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-300 shadow-sm' 
                    : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'}
                `}
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0"
                  style={{ backgroundColor: member.color }}
                >
                  {member.name[0]}
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className="font-bold text-sm truncate w-full text-left">{member.name}</span>
                  {member.isActive === false && (
                    <span className="text-[10px] text-slate-400">퇴사</span>
                  )}
                </div>
                {selectedStaff.includes(member.id) && (
                  <CheckCircle2 size={16} className="ml-auto text-green-500 shrink-0" />
                )}
              </button>
            ))}
          </div>
          {visibleStaff.length === 0 && (
             <p className="text-center text-slate-400 text-sm py-4">선택 가능한 직원이 없습니다.</p>
          )}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex gap-3">
           <button 
             onClick={onClose}
             className="flex-1 py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
           >
             취소
           </button>
           <button 
             onClick={handleConfirm}
             className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-200 dark:shadow-green-900/30 hover:bg-green-700 transition-all active:scale-95"
           >
             완료 처리 ({selectedStaff.length}명)
           </button>
        </div>
      </div>
    </div>
  );
};

export default CompleteTaskModal;
