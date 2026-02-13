import React, { useState, useEffect, useMemo } from 'react';
import { Staff, BedLog } from '../types';
import { fetchBedLogs } from '../services/bedService';
import DateNavigator from './DateNavigator';
import AvatarStack from './common/AvatarStack';
import BedStats from './bed/BedStats';
import { History, CalendarClock, AlertCircle } from 'lucide-react';
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

  // Fetch Logs when date or mode changes
  useEffect(() => {
    const loadLogs = async () => {
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
             setError('이력 저장용 테이블(bed_logs)이 생성되지 않았습니다. DB 설정에서 스크립트를 실행해주세요.');
           } else {
             setLogs([]); // No data
           }
        }
      } catch (e) {
        console.error(e);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, [currentDate, viewMode]);

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
      const dateStr = new Date(log.createdAt).toLocaleDateString('ko-KR', { 
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
      });
      
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.date === dateStr) {
        lastGroup.items.push(log);
      } else {
        groups.push({ date: dateStr, items: [log] });
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

        <div className="text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
           총 <span className="text-blue-600 dark:text-blue-400 text-lg">{logs.length}</span>건 교체
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-4">
          
          {/* LEFT: Statistics (Leaderboard) */}
          <div className="w-full md:w-80 shrink-0 h-64 md:h-full md:order-1 order-1">
             <BedStats stats={stats} loading={loading} />
          </div>

          {/* RIGHT: Detailed Logs */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pb-20 md:order-2 order-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
            {loading ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <div className="w-8 h-8 border-4 border-slate-300 border-t-blue-500 rounded-full animate-spin mb-2"></div>
                  <span>이력 불러오는 중...</span>
               </div>
            ) : error ? (
               <div className="flex flex-col items-center justify-center h-full text-amber-500 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/50 p-6">
                  <AlertCircle size={32} className="mb-2" />
                  <p className="font-bold">데이터를 불러올 수 없습니다</p>
                  <p className="text-xs mt-1 opacity-80 text-center">{error}</p>
               </div>
            ) : logs.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600">
                  <History size={48} className="opacity-20 mb-3" />
                  <p>해당 기간에 교체 기록이 없습니다.</p>
               </div>
            ) : (
               <div className="space-y-6">
                 {groupedLogs.map(group => (
                   <div key={group.date}>
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
               </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default BedHistory;