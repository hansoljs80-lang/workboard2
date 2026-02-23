
import React from 'react';
import DateNavigator from './DateNavigator';
import ViewToggle from './ViewToggle';
import { useUI } from '../context/UIContext';

interface BoardHeaderProps {
  currentDate: Date;
  viewMode: 'day' | 'week' | 'month';
  onNavigate: (direction: 'prev' | 'next') => void;
  onViewChange: (mode: 'day' | 'week' | 'month') => void;
  onDateSelect?: (date: Date) => void;
}

const BoardHeader: React.FC<BoardHeaderProps> = ({ 
  currentDate, 
  viewMode, 
  onNavigate, 
  onViewChange,
  onDateSelect
}) => {
  const { isSidebarOpen } = useUI();

  return (
    <div className={`
      px-4 py-3 md:px-6 bg-white dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0 shadow-sm z-20 transition-all duration-300
      ${!isSidebarOpen ? 'md:pl-16' : ''} 
    `}>
      {/* 
         md:pl-16 adds padding on desktop when sidebar is closed to accommodate the floating Menu button.
      */}
      <DateNavigator 
        currentDate={currentDate} 
        viewMode={viewMode} 
        onNavigate={onNavigate} 
        onDateSelect={onDateSelect}
      />
      <ViewToggle 
        currentMode={viewMode} 
        onChange={onViewChange} 
      />
    </div>
  );
};

export default React.memo(BoardHeader);
