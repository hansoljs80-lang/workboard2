import React from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

export type OperationStatus = 'idle' | 'loading' | 'success' | 'error';

interface StatusOverlayProps {
  status: OperationStatus;
  message: string;
}

const StatusOverlay: React.FC<StatusOverlayProps> = ({ status, message }) => {
  if (status === 'idle') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-4 min-w-[200px] transform transition-all scale-100 border border-slate-100 dark:border-slate-700">
        
        {status === 'loading' && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full animate-pulse">
            <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
        )}

        {status === 'success' && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-full animate-bounce-short">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        )}

        <div className="text-center">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
            {status === 'loading' ? '처리 중...' : '완료!'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatusOverlay;