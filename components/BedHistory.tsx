
import React, { useState, useCallback } from 'react';
import { Staff, BedLog } from '../types';
import { fetchBedLogs } from '../services/bedService';
import { RefreshCw, Copy, AlertCircle } from 'lucide-react';
import { SUPABASE_SCHEMA_SQL } from '../constants/supabaseSchema';
import GenericHistoryView, { GenericLog, HistoryTabOption } from './common/GenericHistoryView';

interface BedHistoryProps {
  staff: Staff[];
}

const BedHistory: React.FC<BedHistoryProps> = ({ staff }) => {
  const [logs, setLogs] = useState<BedLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Data Loader
  const handleLoadHistory = useCallback(async (start: Date, end: Date) => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetchBedLogs(start, end);
      if (res.success && res.data) {
        setLogs(res.data);
      } else {
         if (res.message?.includes('does not exist')) {
           setError('DATA_TABLE_MISSING');
         } else if (res.message) {
           setError(res.message);
         } else {
           setLogs([]);
         }
      }
    } catch (e) {
      console.error(e);
      setError('데이터를 불러오는 중 알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    alert("SQL 코드가 클립보드에 복사되었습니다.\nSupabase 대시보드 > SQL Editor에서 실행해주세요.");
  };

  // 2. Data Adapter (BedLog -> GenericLog)
  const genericLogs: GenericLog[] = logs.map(log => {
    // Resolve staff names for display in the checklist item
    const performerNames = log.performedBy
      .map(id => staff.find(s => s.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    return {
      id: log.id,
      shiftType: 'CHANGE', 
      checklist: [{ 
        // Use bedName as ID so the "Detail Filter" in GenericHistoryView groups them correctly
        // (e.g. Filter by "1번 베드", "2번 베드")
        id: log.bedName, 
        label: log.bedName, 
        checked: true,
        performedBy: performerNames || undefined
      }],
      performedBy: log.performedBy,
      createdAt: log.createdAt
    };
  });

  // 3. Tab Configuration
  const historyTabs: HistoryTabOption[] = [
    { id: 'CHANGE', label: '교체', icon: <RefreshCw size={14} />, colorClass: 'text-blue-600' }
  ];

  // 4. Missing Table Error View
  if (error === 'DATA_TABLE_MISSING') {
    return (
       <div className="flex flex-col items-center justify-center h-full text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/50 p-6 text-center m-4">
          <AlertCircle size={48} className="mb-3 opacity-50" />
          <h3 className="font-bold text-lg mb-2">이력 저장 테이블이 없습니다</h3>
          <p className="text-sm mb-4 max-w-sm">
            배드 교체 이력을 저장하려면 DB에 <code>bed_logs</code> 테이블이 필요합니다.
          </p>
          
          <div className="flex gap-2">
            <button onClick={handleCopySQL} className="px-4 py-2 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded-lg font-bold hover:bg-amber-300 dark:hover:bg-amber-700 transition-colors flex items-center gap-2">
              <Copy size={16} /> SQL 복사
            </button>
          </div>
          <p className="text-xs mt-3 opacity-70">Supabase SQL Editor에서 실행해주세요.</p>
       </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden h-full">
       <GenericHistoryView
         staff={staff}
         logs={genericLogs}
         tabs={historyTabs}
         onLoadLogs={handleLoadHistory}
         loading={loading}
         error={error}
         title="배드 커버 교체 이력"
       />
    </div>
  );
};

export default BedHistory;
