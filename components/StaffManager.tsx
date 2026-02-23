
import React, { useState, useEffect, useMemo } from 'react';
import { Staff, Task, Template } from '../types';
import { Users, Eye, EyeOff } from 'lucide-react';
import StaffForm from './StaffForm';
import StaffList from './StaffList';
import StatusOverlay from './StatusOverlay';
import { useStaffOperations } from '../hooks/useStaffOperations';

interface StaffManagerProps {
  staffList: Staff[];
  tasks: Task[]; 
  templates: Template[]; 
  onRefresh: () => void;
}

const DEFAULT_ROLES = ['물리치료사', '작업치료사', '실장', '데스크', '아르바이트'];
const ROLES_STORAGE_KEY = 'pt_board_custom_roles';

const StaffManager: React.FC<StaffManagerProps> = ({ staffList, tasks, templates, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<string[]>(DEFAULT_ROLES);
  const [showResigned, setShowResigned] = useState(false);

  // Custom Hook for Logic & API Calls
  const { 
    handleAdd, 
    handleUpdate, 
    handleDelete, 
    opStatus, 
    opMessage 
  } = useStaffOperations({ onRefresh, tasks, templates });

  // Load saved roles on mount
  useEffect(() => {
    const savedRoles = localStorage.getItem(ROLES_STORAGE_KEY);
    if (savedRoles) {
      try {
        setAvailableRoles(JSON.parse(savedRoles));
      } catch (e) {
        console.error("Failed to parse saved roles", e);
      }
    }
  }, []);

  // Filter staff list based on toggle
  const visibleStaff = useMemo(() => {
    if (showResigned) return staffList;
    return staffList.filter(s => s.isActive !== false);
  }, [staffList, showResigned]);

  // Wrapper to handle local loading state for the form
  const onAddWrapper = async (name: string, role: string, color: string) => {
    setLoading(true);
    await handleAdd(name, role, color);
    setLoading(false);
  };

  return (
    <div className="p-4 md:p-6 w-full h-full overflow-y-auto pb-24 relative">
      <StatusOverlay status={opStatus} message={opMessage} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Users className="text-blue-600" size={28} />
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">직원 관리</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">직원 등록, 수정 및 재직 상태를 관리합니다.</p>
          </div>
        </div>

        {/* View Toggle */}
        <button 
          onClick={() => setShowResigned(!showResigned)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all border ${
            showResigned 
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600' 
              : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          {showResigned ? <Eye size={14} /> : <EyeOff size={14} />}
          {showResigned ? '퇴사자 포함 보기' : '재직자만 보기'}
        </button>
      </div>

      <StaffForm 
        onAdd={onAddWrapper}
        loading={loading}
        availableRoles={availableRoles}
        setAvailableRoles={setAvailableRoles}
      />

      <StaffList 
        staffList={visibleStaff}
        availableRoles={availableRoles}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
        onRefresh={onRefresh}
      />
    </div>
  );
};

export default StaffManager;
