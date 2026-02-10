import React, { useState, useEffect } from 'react';
import { UserPlus, Briefcase, Settings, Palette } from 'lucide-react';
import RoleManager from './RoleManager';
import { STAFF_COLORS } from '../constants/colors';

interface StaffFormProps {
  onAdd: (name: string, role: string, color: string) => Promise<void>;
  availableRoles: string[];
  setAvailableRoles: (roles: string[]) => void;
  loading: boolean;
}

const ROLES_STORAGE_KEY = 'pt_board_custom_roles';

const StaffForm: React.FC<StaffFormProps> = ({ onAdd, availableRoles, setAvailableRoles, loading }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [color, setColor] = useState(STAFF_COLORS[Math.floor(Math.random() * STAFF_COLORS.length)]);
  const [isManagingRoles, setIsManagingRoles] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Set default role when availableRoles change
  useEffect(() => {
    if (!role && availableRoles.length > 0) {
      setRole(availableRoles[0]);
    }
  }, [availableRoles, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onAdd(name, role || '미정', color);
    setName('');
    // Pick a new random color for next entry
    setColor(STAFF_COLORS[Math.floor(Math.random() * STAFF_COLORS.length)]);
  };

  const saveRoles = (roles: string[]) => {
    setAvailableRoles(roles);
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles));
  };

  const handleDeleteRole = (roleToDelete: string) => {
    if (window.confirm(`"${roleToDelete}" 직책 항목을 목록에서 삭제하시겠습니까?`)) {
      const newRoles = availableRoles.filter(r => r !== roleToDelete);
      saveRoles(newRoles);
      if (role === roleToDelete && newRoles.length > 0) {
        setRole(newRoles[0]);
      }
    }
  };

  return (
    <>
      {/* Role Management Section (Collapsible) */}
      {isManagingRoles && (
        <RoleManager 
          availableRoles={availableRoles}
          onSaveRoles={(newRoles) => {
            saveRoles(newRoles);
            setRole(newRoles[newRoles.length - 1]); // Select new role
          }}
          onClose={() => setIsManagingRoles(false)}
          onDeleteRole={handleDeleteRole}
        />
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 dark:text-slate-100"
              placeholder="직원 이름 입력"
            />
          </div>
          <div className="w-full md:w-48">
             <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">직책</label>
              <button 
                type="button"
                onClick={() => setIsManagingRoles(!isManagingRoles)}
                className="text-[10px] flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded transition-colors"
              >
                <Settings size={10} /> {isManagingRoles ? '닫기' : '관리'}
              </button>
            </div>
            <div className="relative">
              <Briefcase className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={18} />
              <input
                list="role-options"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="선택 또는 입력"
                className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-slate-100"
              />
              <datalist id="role-options">
                {availableRoles.map(r => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>
          </div>
          
          <div className="w-full md:w-auto flex items-end">
            <div className="relative">
               <button
                 type="button"
                 onClick={() => setShowColorPicker(!showColorPicker)}
                 className="p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors h-[50px] min-w-[100px]"
               >
                 <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: color }}></div>
                 <span className="text-sm text-slate-600 dark:text-slate-300">색상</span>
               </button>
               
               {showColorPicker && (
                 <div className="absolute top-full mt-2 left-0 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 w-[240px] grid grid-cols-5 gap-2 animate-fade-in">
                   {STAFF_COLORS.map(c => (
                     <button
                       key={c}
                       type="button"
                       onClick={() => { setColor(c); setShowColorPicker(false); }}
                       className={`w-8 h-8 rounded-full hover:scale-110 transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-800' : ''}`}
                       style={{ backgroundColor: c }}
                     />
                   ))}
                   {/* Custom Color Input Wrapper */}
                   <label className="w-8 h-8 rounded-full bg-conic-gradient cursor-pointer hover:scale-110 transition-transform flex items-center justify-center overflow-hidden border border-slate-200 relative">
                     <Palette size={14} className="text-slate-500" />
                     <input 
                       type="color" 
                       value={color}
                       onChange={(e) => setColor(e.target.value)}
                       className="absolute opacity-0 inset-0 cursor-pointer w-full h-full"
                     />
                   </label>
                 </div>
               )}
               {/* Overlay to close picker */}
               {showColorPicker && (
                 <div className="fixed inset-0 z-40" onClick={() => setShowColorPicker(false)}></div>
               )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100 h-[50px]"
          >
            <UserPlus size={20} />
            추가
          </button>
        </div>
      </form>
    </>
  );
};

export default StaffForm;