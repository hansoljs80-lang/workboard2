
import React, { useState, useMemo } from 'react';
import { Staff } from '../types';
import { CheckCircle2, RefreshCw } from 'lucide-react';

interface BedChangeModalProps {
  isOpen: boolean;
  bedName: string;
  staff: Staff[];
  onClose: () => void;
  onConfirm: (staffIds: string[]) => void;
}

const BedChangeModal: React.FC<BedChangeModalProps> = ({ 
  isOpen, 
  bedName,
  staff, 
  onClose, 
  onConfirm 
}) => {
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);

  // Filter staff to show only active ones
  const activeStaff = useMemo(() => staff.filter(s => s.isActive !== false), [staff]);

  if (!isOpen) return null;

  const toggleStaff = (id: string) => {
    setSelectedStaff(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    onConfirm(selectedStaff);
    onClose();
    setSelectedStaff([]); // Reset after confirm
  };

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-fade-in-up border border-slate-100 dark:border-slate-700">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <RefreshCw size={24} />
          </div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">교체 확인</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
             <span className="font-bold text-slate-700 dark:text-slate-300">{bedName}</span> 커버를 교체한 직원을 선택하세요.
          </p>
        </div>
        
        <div className="p-5 max-h-[300px] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-2">
            {activeStaff.map(member => (
              <button
                key={member.id}
                onClick={() => toggleStaff(member.id)}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                  selectedStaff.includes(member.id) 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm' 
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
                </div>
                {selectedStaff.includes(member.id) && (
                  <CheckCircle2 size={16} className="ml-auto text-blue-500 shrink-0" />
                )}
              </button>
            ))}
          </div>
          {activeStaff.length === 0 && (
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
             className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 dark:shadow-blue-900/30 hover:bg-blue-700 transition-all active:scale-95"
           >
             교체 완료
           </button>
        </div>
      </div>
    </div>
  );
};

export default BedChangeModal;
