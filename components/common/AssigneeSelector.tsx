
import React from 'react';
import { Users, Check } from 'lucide-react';
import { Staff } from '../../types';

interface AssigneeSelectorProps {
  staff: Staff[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  label?: string;
}

const AssigneeSelector: React.FC<AssigneeSelectorProps> = ({ 
  staff, 
  selectedIds, 
  onChange, 
  label = "담당자 배정" 
}) => {
  // Filter only active staff for new assignments
  const activeStaff = staff.filter(s => s.isActive !== false);

  const toggleAssignee = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(pid => pid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-2">
        <Users size={16} /> {label}
      </label>
      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
         <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
          {activeStaff.map(member => {
            const isSelected = selectedIds.includes(member.id);
            return (
              <button
                type="button"
                key={member.id}
                onClick={() => toggleAssignee(member.id)}
                className={`
                  px-3 py-2 rounded-lg text-sm font-bold border transition-all flex items-center gap-2
                  ${isSelected 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                    : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'}
                `}
              >
                <div 
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ring-1 ${isSelected ? 'ring-white/50' : 'ring-slate-200 dark:ring-slate-500'}`}
                  style={{ backgroundColor: member.color }}
                >
                   <span className="text-white drop-shadow-md">{member.name[0]}</span>
                </div>
                {member.name}
                {isSelected && <Check size={14} className="ml-1" />}
              </button>
            );
          })}
          {activeStaff.length === 0 && <span className="text-sm text-slate-400 italic">배정 가능한 직원이 없습니다.</span>}
        </div>
        <p className="text-xs text-slate-400 mt-2 text-right">
          {selectedIds.length === 0 ? '선택하지 않으면 "전체" 담당으로 설정됩니다.' : `${selectedIds.length}명 선택됨`}
        </p>
      </div>
    </div>
  );
};

export default AssigneeSelector;
