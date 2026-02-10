
import React, { useMemo } from 'react';
import { Staff } from '../../types';
import { Check } from 'lucide-react';

interface AvatarStackProps {
  ids: string[];
  staff: Staff[];
  max?: number;
  size?: 'xs' | 'sm' | 'md';
  isDone?: boolean;
}

const AvatarStack: React.FC<AvatarStackProps> = ({ 
  ids, 
  staff, 
  max = 3, 
  size = 'md',
  isDone = false 
}) => {
  // Resolve staff objects efficiently
  const displayStaff = useMemo(() => {
    if (!ids || ids.length === 0) return [];
    return ids.map(id => staff.find(s => s.id === id)).filter(Boolean) as Staff[];
  }, [ids, staff]);

  // Size Configuration
  const sizeConfig = {
    xs: { w: 'w-4', h: 'h-4', text: 'text-[8px]', ring: 'ring-1', space: '-space-x-1' },
    sm: { w: 'w-5', h: 'h-5', text: 'text-[9px]', ring: 'ring-1', space: '-space-x-1.5' },
    md: { w: 'w-6', h: 'h-6', text: 'text-[9px]', ring: 'ring-1 md:ring-2', space: '-space-x-1.5' },
  }[size];

  if (displayStaff.length === 0) {
    if (size === 'xs') return null; // Don't show "All" placeholder in tiny views
    return (
      <div className={`
        ${sizeConfig.w} ${sizeConfig.h} rounded-full 
        bg-slate-200 dark:bg-slate-700 
        flex items-center justify-center 
        ${sizeConfig.text} text-slate-500 font-bold
      `}>
        All
      </div>
    );
  }

  const visibleStaff = displayStaff.slice(0, max);
  const overflowCount = displayStaff.length - max;

  return (
    <div className={`flex items-center ${sizeConfig.space}`}>
      {visibleStaff.map((member) => (
        <div 
          key={member.id} 
          className={`
            ${sizeConfig.w} ${sizeConfig.h} rounded-full flex items-center justify-center 
            ${sizeConfig.text} text-white font-bold shadow-sm relative
            ${isDone ? 'ring-2 ring-green-500 z-10' : `${sizeConfig.ring} ring-white dark:ring-slate-800`}
          `}
          style={{ backgroundColor: member.color }}
          title={isDone ? `${member.name} (완료함)` : member.name}
        >
          {member.name[0]}
          {isDone && (
            <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full p-[1px] border border-white dark:border-slate-900">
               <Check size={size === 'xs' ? 4 : 6} className="text-white" strokeWidth={4} />
            </div>
          )}
        </div>
      ))}
      
      {overflowCount > 0 && (
        <div className={`
          ${sizeConfig.w} ${sizeConfig.h} rounded-full 
          bg-slate-200 dark:bg-slate-700 
          flex items-center justify-center 
          ${sizeConfig.text} text-slate-500 font-bold 
          ${sizeConfig.ring} ring-white dark:ring-slate-800
        `}>
          +{overflowCount}
        </div>
      )}
    </div>
  );
};

export default React.memo(AvatarStack);
