import React, { useState } from 'react';
import { Settings, X } from 'lucide-react';

interface RoleManagerProps {
  availableRoles: string[];
  onSaveRoles: (roles: string[]) => void;
  onClose: () => void;
  onDeleteRole: (role: string) => void;
}

const RoleManager: React.FC<RoleManagerProps> = ({ availableRoles, onSaveRoles, onClose, onDeleteRole }) => {
  const [newRoleInput, setNewRoleInput] = useState('');

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newRoleInput.trim();
    if (trimmed && !availableRoles.includes(trimmed)) {
      onSaveRoles([...availableRoles, trimmed]);
      setNewRoleInput('');
    }
  };

  return (
    <div className="bg-slate-100 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 mb-6 animate-fade-in-down">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <Settings size={16} /> 직책 목록 편집
        </h3>
        <button 
          onClick={onClose}
          className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {availableRoles.map(r => (
          <span key={r} className="bg-white dark:bg-slate-700 px-3 py-1.5 rounded-full text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 flex items-center gap-2 shadow-sm">
            {r}
            <button 
              onClick={() => onDeleteRole(r)}
              className="text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>

      <form onSubmit={handleAddRole} className="flex gap-2">
        <input 
          type="text" 
          value={newRoleInput}
          onChange={(e) => setNewRoleInput(e.target.value)}
          placeholder="새로운 직책 이름 (예: 실습생)"
          className="flex-1 p-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100"
        />
        <button 
          type="submit"
          disabled={!newRoleInput.trim()}
          className="px-4 py-2 bg-slate-800 dark:bg-slate-600 text-white text-sm font-bold rounded-lg hover:bg-slate-700 dark:hover:bg-slate-500 disabled:opacity-50"
        >
          추가
        </button>
      </form>
    </div>
  );
};

export default RoleManager;