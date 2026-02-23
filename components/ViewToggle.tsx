import React from 'react';
import { List, Calendar } from 'lucide-react';

type ViewMode = 'day' | 'week' | 'month';

interface ViewToggleProps {
  currentMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ currentMode, onChange }) => {
  const modes: ViewMode[] = ['day', 'week', 'month'];

  return (
    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
      {modes.map((mode) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${
            currentMode === mode
              ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {mode === 'day' ? <List size={14} /> : <Calendar size={14} />}
          {mode === 'day' ? '일간' : mode === 'week' ? '주간' : '월간'}
        </button>
      ))}
    </div>
  );
};

export default ViewToggle;