
import React from 'react';
import { Loader2 } from 'lucide-react';

const PageLoader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-slate-50 dark:bg-slate-950 animate-fade-in">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={40} className="text-blue-600 animate-spin" />
        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
          기능을 불러오는 중입니다...
        </span>
      </div>
    </div>
  );
};

export default PageLoader;
