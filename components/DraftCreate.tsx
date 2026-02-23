
import React, { useState } from 'react';
import DraftForm from './DraftForm';
import { PenSquare } from 'lucide-react';
import { Staff } from '../types';

interface DraftCreateProps {
  staff: Staff[]; // Receive staff
  onSuccess: () => void;
  onRefresh: () => Promise<void>; 
}

const DraftCreate: React.FC<DraftCreateProps> = ({ staff, onSuccess, onRefresh }) => {
  const [loading, setLoading] = useState(false);

  const handleSuccess = async () => {
    // 1. Show loading state while fetching new data
    setLoading(true);
    try {
      // 2. Wait for the data fetch to complete
      await onRefresh(); 
    } catch (e) {
      console.error("Refresh failed", e);
    } finally {
      // 3. Stop loading and navigate
      setLoading(false);
      onSuccess();
    }
  };

  return (
    <div className="p-4 md:p-6 w-full h-full overflow-y-auto pb-24">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-300 dark:border-slate-700">
          <PenSquare className="text-blue-600" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">업무 등록</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">자주 수행하는 업무를 이곳에 등록하세요. 등록된 업무는 삭제 전까지 목록에 계속 유지됩니다.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-300 dark:border-slate-800 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">목록 갱신 중...</span>
            </div>
          </div>
        )}
        <div className="p-1 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700"></div>
        <div className="p-0">
           <DraftForm staff={staff} onSuccess={handleSuccess} setLoading={setLoading} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default DraftCreate;
