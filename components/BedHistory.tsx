import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Staff, BedLog } from '../types';
import { fetchBedLogs } from '../services/bedService';
import DateNavigator from './DateNavigator';
import AvatarStack from './common/AvatarStack';
import BedStats from './bed/BedStats';
import { History, CalendarClock, AlertCircle, RefreshCw, Database } from 'lucide-react';
import { getWeekRange } from '../utils/dateUtils';

interface BedHistoryProps {
  staff: Staff[];
}

type ViewMode = 'day' | 'week' | 'month';

const BedHistory: React.FC<BedHistoryProps> = ({ staff }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('month'); // Default to month for better stats view
  const [currentDate, setCurrentDate] = useState(new Date());
  const [logs, setLogs] = useState<BedLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch Logs function
  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    
    let start = new Date(currentDate);
    let end = new Date(currentDate);

    if (viewMode === 'day') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (viewMode === 'week') {
      const range = getWeekRange(currentDate);
      start = range.start;
      end = range.end;
    } else if (viewMode === 'month') {
      start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
    }

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
           setLogs([]); // No data
         }
      }
    } catch (e) {
      console.error(e);
      setError('데이터를 불러오는 중 알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode]);

  // Initial load & Reload on change
  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleNavigate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      if (viewMode === 'day') next.setDate(prev.getDate() + (direction === 'next' ? 1 : -1));
      if (viewMode === 'week') next.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
      if (viewMode === 'month') next.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return next;
    });
  };

  // Group logs by date for display
  const groupedLogs = useMemo(() => {
    const groups: { date: string; items: BedLog[] }[] = [];
    logs.forEach(log => {
      try {
        const dateStr = new Date(log.createdAt).toLocaleDateString('ko-KR', { 
          year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
        });
        
        const lastGroup = groups[groups.length - 1];
        if (lastGroup && lastGroup.date === dateStr) {
          lastGroup.items.push(log);
        } else {
          groups.push({ date: dateStr, items: [log] });
        }
      } catch (e) {
        console.warn("Invalid date in log", log);
      }
    });
    return groups;
  }, [logs]);

  // Calculate Statistics (Who changed how many)
  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(log => {
      if (Array.isArray(log.performedBy) && log.performedBy.length > 0) {
        log.performedBy.forEach(staffId => {
          counts[staffId] = (counts[staffId] || 0) + 1;
        });
      }
    });

    return Object.entries(counts)
      .map(([id, count]) => {
        const member = staff.find(s => s.id === id);
        return {
          id,
          name: member?.name || '미정',
          color: member?.color || '#cbd5e1',
          count,
          isActive: member?.isActive
        };
      })
      .sort((a, b) => b.count - a.count); // Descending
  }, [logs, staff]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
           {['day', 'week', 'month'].map((mode) => (
             <button 
               key={mode}
               onClick={() => setViewMode(mode as ViewMode)}
               className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === mode ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500'}`}
             >
               {{'day': '일간', 'week': '주간', 'month': '월간'}[mode]}
             </button>
           ))}
        </div>

        <DateNavigator 
           currentDate={currentDate} 
           viewMode={viewMode} 
           onNavigate={handleNavigate}
           onDateSelect={(d) => {
             setCurrentDate(d);
             setViewMode('day');
           }}
        />

        <div className="flex items-center gap-2">
            <div className="text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
               총 <span className="text-blue-600 dark:text-blue-400 text-lg">{logs.length}</span>건
            </div>
            <button 
              onClick={loadLogs}
              className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 transition-colors shadow-sm active:scale-95"
              title="새로고침"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-4">
          
          {/* LEFT: Statistics (Leaderboard) */}
          {/* On mobile: Fixed height, On Desktop: Full height sidebar */}
          <div className="w-full md:w-80 shrink-0 h-64 md:h-full md:order-1 order-1">
             <BedStats stats={stats} loading={loading} />
          </div>

          {/* RIGHT: Detailed Logs */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pb-20 md:pb-4 md:order-2 order-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 relative">
            {loading ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <div className="w-8 h-8 border-4 border-slate-300 border-t-blue-500 rounded-full animate-spin mb-2"></div>
                  <span>이력 불러오는 중...</span>
               </div>
            ) : error === 'DATA_TABLE_MISSING' ? (
               <div className="flex flex-col items-center justify-center h-full text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/50 p-6 text-center">
                  <Database size={48} className="mb-3 opacity-50" />
                  <h3 className="font-bold text-lg mb-2">이력 저장 테이블이 없습니다</h3>
                  <p className="text-sm mb-4 max-w-sm">
                    배드 교체 이력을 저장하려면 DB에 <code>bed_logs</code> 테이블이 필요합니다.
                  </p>
                  <div className="text-xs bg-white dark:bg-black/20 p-3 rounded-lg text-left inline-block mb-4 border border-amber-200 dark:border-amber-800">
                    1. <strong>DB 설정</strong> 메뉴로 이동<br/>
                    2. <strong>Supabase Schema</strong> 복사<br/>
                    3. Supabase SQL Editor에서 실행
                  </div>
                  <button onClick={loadLogs} className="px-4 py-2 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600 transition-colors">
                    테이블 생성 후 다시 시도
                  </button>
               </div>
            ) : error ? (
               <div className="flex flex-col items-center justify-center h-full text-red-500 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800/50 p-6 text-center">
                  <AlertCircle size={32} className="mb-2" />
                  <p className="font-bold">오류 발생</p>
                  <p className="text-xs mt-1 opacity-80">{error}</p>
                  <button onClick={loadLogs} className="mt-4 px-4 py-2 bg-white border border-red-200 text-red-500 rounded-lg text-sm font-bold shadow-sm">
                    다시 시도
                  </button>
               </div>
            ) : logs.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600 text-center p-4">
                  <History size={48} className="opacity-20 mb-3" />
                  <p className="font-bold">기록이 없습니다.</p>
                  <p className="text-xs mt-1 opacity-70">
                    해당 기간에 교체된 배드 커버가 없습니다.<br/>
                    '현황' 탭에서 교체 작업을 수행하면 이곳에 기록됩니다.
                  </p>
               </div>
            ) : (
               <div className="space-y-6">
                 {groupedLogs.map(group => (
                   <div key={group.date} className="animate-fade-in">
                     <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-10 py-2 px-1 mb-2 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-300 text-sm flex items-center gap-2">
                       <CalendarClock size={16} />
                       {group.date}
                     </div>
                     <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                       {group.items.map(log => (
                         <div key={log.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm shadow-sm border border-slate-100 dark:border-slate-600">
                                 {log.bedName.replace(/[^0-9]/g, '')}
                               </div>
                               <div>
                                 <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{log.bedName}</h4>
                                 <span className="text-xs text-slate-500">
                                   {new Date(log.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                 </span>
                               </div>
                            </div>
                            <div>
                              <AvatarStack ids={log.performedBy} staff={staff} size="sm" />
                            </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 ))}
                 
                 <div className="pt-8 text-center text-xs text-slate-300 dark:text-slate-600">
                   기록의 끝입니다.
                 </div>
               </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default BedHistory;