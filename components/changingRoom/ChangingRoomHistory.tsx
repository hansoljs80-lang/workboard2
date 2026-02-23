
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Staff, ChangingRoomLog, ChangingRoomShift } from '../../types';
import { fetchChangingRoomLogs } from '../../services/changingRoomService';
import DateNavigator from '../DateNavigator';
import AvatarStack from '../common/AvatarStack';
import ChangingRoomStats from './ChangingRoomStats';
import { getWeekRange } from '../../utils/dateUtils';
import { History, LayoutGrid, Filter, Sun, Coffee, Eye, CheckSquare, Square, RefreshCw, Database, AlertCircle, Copy } from 'lucide-react';
import { SUPABASE_SCHEMA_SQL } from '../../constants/supabaseSchema';

interface ChangingRoomHistoryProps {
  staff: Staff[];
}

type ViewMode = 'day' | 'week' | 'month';

const ChangingRoomHistory: React.FC<ChangingRoomHistoryProps> = ({ staff }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [logs, setLogs] = useState<ChangingRoomLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | ChangingRoomShift>('ALL');

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
      const res = await fetchChangingRoomLogs(start, end);
      if (res.success && res.data) {
        setLogs(res.data);
      } else {
         if (res.message?.includes('does not exist')) {
           setError('DATA_TABLE_MISSING');
         } else {
           setLogs([]);
         }
      }
    } catch (e) {
      console.error(e);
      setError('데이터 불러오기 실패');
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    alert("SQL 코드가 클립보드에 복사되었습니다.\nSupabase 대시보드 > SQL Editor에서 실행해주세요.");
  };

  // Filter Logic
  const filteredLogs = useMemo(() => {
    if (typeFilter === 'ALL') return logs;
    return logs.filter(l => l.shiftType === typeFilter);
  }, [logs, typeFilter]);

  // Grouping Logic
  const groupedLogs = useMemo(() => {
    const groups: { date: string; items: ChangingRoomLog[] }[] = [];
    filteredLogs.forEach(log => {
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
        } catch (e) {}
    });
    return groups;
  }, [filteredLogs]);

  // Stats Logic
  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLogs.forEach(log => {
      log.performedBy.forEach(id => {
        counts[id] = (counts[id] || 0) + 1;
      });
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
      .sort((a, b) => b.count - a.count);
  }, [filteredLogs, staff]);

  const shiftLeaders = useMemo(() => {
    const getLeader = (type: ChangingRoomShift) => {
        const counts: Record<string, number> = {};
        logs.filter(l => l.shiftType === type).forEach(l => {
            l.performedBy.forEach(id => counts[id] = (counts[id] || 0) + 1);
        });
        let max = 0;
        let leaderId = null;
        Object.entries(counts).forEach(([id, c]) => {
            if(c > max) { max = c; leaderId = id; }
        });
        if(leaderId) {
            const s = staff.find(st => st.id === leaderId);
            return s ? { name: s.name, count: max } : null;
        }
        return null;
    };
    return {
        MORNING: getLeader('MORNING'),
        LUNCH: getLeader('LUNCH'),
        ADHOC: getLeader('ADHOC')
    };
  }, [logs, staff]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
        {/* Controls */}
        <div className="flex flex-col gap-4 mb-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    {['day', 'week', 'month'].map((mode) => (
                    <button 
                        key={mode}
                        onClick={() => setViewMode(mode as ViewMode)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === mode ? 'bg-white dark:bg-slate-600 text-teal-600 dark:text-white shadow-sm' : 'text-slate-500'}`}
                    >
                        {{'day': '일간', 'week': '주간', 'month': '월간'}[mode]}
                    </button>
                    ))}
                </div>

                <DateNavigator 
                    currentDate={currentDate} 
                    viewMode={viewMode} 
                    onNavigate={(dir) => {
                        setCurrentDate(prev => {
                            const next = new Date(prev);
                            if (viewMode === 'day') next.setDate(prev.getDate() + (dir === 'next' ? 1 : -1));
                            else if (viewMode === 'week') next.setDate(prev.getDate() + (dir === 'next' ? 7 : -7));
                            else next.setMonth(prev.getMonth() + (dir === 'next' ? 1 : -1));
                            return next;
                        });
                    }}
                />

                <div className="flex items-center gap-2">
                    <button 
                        onClick={loadLogs}
                        className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 transition-colors shadow-sm active:scale-95"
                        title="새로고침"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                 <div className="flex items-center gap-1.5 px-2 text-xs font-bold text-slate-500 whitespace-nowrap">
                    <Filter size={14} /> 필터:
                 </div>
                 {['ALL', 'MORNING', 'LUNCH', 'ADHOC'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setTypeFilter(type as any)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                            typeFilter === type 
                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm' 
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        {type === 'ALL' ? '전체' : type === 'MORNING' ? '아침' : type === 'LUNCH' ? '점심' : '수시'}
                    </button>
                 ))}
            </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-4">
           {/* Sidebar Stats */}
           <div className="w-full md:w-80 shrink-0 h-64 md:h-full md:order-1 order-1">
              <ChangingRoomStats stats={stats} shiftLeaders={shiftLeaders} loading={loading} />
           </div>

           {/* Main Log List */}
           <div className="flex-1 overflow-y-auto custom-scrollbar md:order-2 order-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 relative">
              {loading ? (
                 <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <div className="w-8 h-8 border-4 border-slate-300 border-t-teal-500 rounded-full animate-spin mb-2"></div>
                    <span>데이터 불러오는 중...</span>
                 </div>
              ) : error === 'DATA_TABLE_MISSING' ? (
                 <div className="flex flex-col items-center justify-center h-full text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/50 p-6 text-center">
                    <Database size={48} className="mb-3 opacity-50" />
                    <h3 className="font-bold text-lg mb-2">테이블이 없습니다</h3>
                    <button onClick={handleCopySQL} className="px-4 py-2 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded-lg font-bold hover:bg-amber-300 transition-colors flex items-center gap-2 mx-auto">
                      <Copy size={16} /> SQL 복사
                    </button>
                 </div>
              ) : groupedLogs.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600 text-center p-4">
                    <History size={48} className="opacity-20 mb-3" />
                    <p className="font-bold">기록이 없습니다.</p>
                 </div>
              ) : (
                 <div className="space-y-6">
                    {groupedLogs.map(group => (
                       <div key={group.date}>
                          <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-10 py-2 px-1 mb-2 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-300 text-sm flex items-center gap-2">
                             {group.date}
                          </div>
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                             {group.items.map(log => {
                                const isMorning = log.shiftType === 'MORNING';
                                const isLunch = log.shiftType === 'LUNCH';
                                const themeClass = isMorning 
                                   ? 'border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800' 
                                   : isLunch 
                                     ? 'border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800'
                                     : 'border-teal-200 bg-teal-50 dark:bg-teal-900/10 dark:border-teal-800';
                                
                                return (
                                   <div key={log.id} className={`p-3 rounded-xl border ${themeClass}`}>
                                      <div className="flex justify-between items-start mb-3">
                                         <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-full ${
                                                isMorning ? 'bg-amber-100 text-amber-600' 
                                                : isLunch ? 'bg-orange-100 text-orange-600'
                                                : 'bg-teal-100 text-teal-600'
                                            }`}>
                                               {isMorning ? <Sun size={14}/> : isLunch ? <Coffee size={14} /> : <Eye size={14}/>}
                                            </div>
                                            <div>
                                               <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                                  {isMorning ? '아침 점검' : isLunch ? '점심 점검' : '수시 점검'}
                                               </span>
                                               <span className="text-xs text-slate-500 ml-2">
                                                  {new Date(log.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                               </span>
                                            </div>
                                         </div>
                                         <AvatarStack ids={log.performedBy} staff={staff} size="sm" />
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-1">
                                         {log.checklist.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                                               {item.checked ? (
                                                  <CheckSquare size={12} className="text-teal-500 shrink-0" />
                                               ) : (
                                                  <Square size={12} className="text-slate-300 shrink-0" />
                                               )}
                                               <span className={item.checked ? '' : 'opacity-50 line-through'}>{item.label}</span>
                                            </div>
                                         ))}
                                      </div>
                                   </div>
                                );
                             })}
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

export default ChangingRoomHistory;
