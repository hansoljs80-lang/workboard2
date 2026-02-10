
import React from 'react';
import { Staff } from '../types';
import StaffItem from './StaffItem';

interface StaffListProps {
  staffList: Staff[];
  availableRoles: string[];
  onDelete: (staff: Staff) => void;
  onUpdate: (id: string, name: string, role: string, color: string, isActive: boolean) => Promise<void>;
  onRefresh?: () => void;
}

const StaffList: React.FC<StaffListProps> = ({ staffList, availableRoles, onDelete, onUpdate, onRefresh }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-20">
      {staffList.map((member) => (
        <StaffItem 
          key={member.id}
          member={member}
          availableRoles={availableRoles}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onRefresh={onRefresh}
        />
      ))}
      
      {staffList.length === 0 && (
        <div className="col-span-full py-12 text-center text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-dashed border-2 border-slate-200 dark:border-slate-800">
          등록된 직원이 없습니다.
        </div>
      )}
    </div>
  );
};

export default React.memo(StaffList);
