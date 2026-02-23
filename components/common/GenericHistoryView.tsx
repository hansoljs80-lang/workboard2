
import React, { useState, useMemo } from 'react';
import { Staff } from '../../types';
import DateNavigator from '../DateNavigator';
import AvatarStack from './AvatarStack';
import { 
  BarChart3, CalendarClock, CheckSquare, Filter, 
  RefreshCw, Trophy, Crown, AlertCircle, List 
} from 'lucide-react';
import { getWeekRange } from '../../utils/dateUtils';

// Generic Log Interface covering all types
export interface GenericLog {
  id: string;
  shiftType: string; // 'MORNING' | 'DAILY' | 'EVENING' | 'PERIODIC' | ...
  checklist: { id: string; label: string; checked: boolean; performedBy?: string }[];
  performedBy: string[];
  createdAt: string;
}

export interface HistoryTabOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  colorClass: string;
}

interface GenericHistoryViewProps {
  staff: Staff[];
  logs: GenericLog[];
  tabs: HistoryTabOption[];
  onLoadLogs: (start: Date, end: Date) => void;
  loading: boolean;
  error?: string;
  title?: string;
}

type ViewMode = 'day' | 'week' | 'month';
type MobileView = 'LIST' | 'STATS';

const GenericHistoryView: React.FC<GenericHistoryViewProps> = ({
  staff,
  logs,
  tabs,
  onLoadLogs,
  loading,
  error,
  title = "이력 및 통계"
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [detailFilterId, setDetailFilterId] = useState<string>('ALL');
  
  // Mobile View State (List vs Stats)
  const [mobileView, setMobileView] = useState<MobileView>('LIST');

  // 1. Load Data on Mount & Change
  React.useEffect(() => {
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
    onLoadLogs(start, end);
  }, [currentDate, viewMode]);

  // 2. Filter Logic
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Tab Filter (Shift Type)
      if (activeTab !== 'ALL' && log.shiftType !== activeTab) return false;
      
      // Detail Item Filter
      if (detailFilterId !== 'ALL') {
        // Only include logs that contain this specific item checked
        const hasItem = log.checklist.some(item => item.id === detailFilterId && item.checked);
        if (!hasItem) return false;
      }
      return true;
    });
  }, [logs, activeTab, detailFilterId]);

  // 3. Extract Unique Detail Items for Filter Dropdown
  const uniqueItems = useMemo(() => {
    const itemMap = new Map<string, string>();
    logs.forEach(log => {
      // Only collect items relevant to current activeTab if selected
      if (activeTab !== 'ALL' && log.shiftType !== activeTab) return;
      
      log.checklist.forEach(item => {
        if (item.checked) itemMap.set(item.id, item.label);
      });
    });
    return Array.from(itemMap.entries());
  }, [logs, activeTab]);

  // 4. Stats Calculation (Updated to count items)
  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    
    filteredLogs.forEach(log => {
      let weight = 0;

      // Calculate weight based on checked items
      if (detailFilterId !== 'ALL') {
         // If filtering by specific item, counting logic is effectively 1 per log
         weight = 1;
      } else {
         // General View: Sum of ALL checked items in this log
         if (log.checklist && log.checklist.length > 0) {
            weight = log.checklist.filter(i => i.checked).length;
         } else {
            // Fallback for logs without checklist structure
            weight = 1;
         }
      }

      if (weight > 0) {
        log.performedBy.forEach(pid => counts[pid] = (counts[pid] || 0) + weight);
      }
    });

    return Object.entries(counts)
      .map(([id, count]) => {
        const member = staff.find(s => s.id === id);
        return {
          id,
          name: member?.name || '미정',
          color: member?.color || '#cbd5e1',
          isActive: member?.isActive,
          count
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [filteredLogs, staff, detailFilterId]);

  // 5. Group by Date
  const groupedLogs = useMemo(() => {
    const groups: { date: string; items: GenericLog[] }[] = [];
    filteredLogs.forEach(log => {
      try {
        const dateStr = new Date(log.createdAt).toLocaleDateString('ko-KR', { 
          year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
        });
        const last = groups[groups.length - 1];
        if (last && last.date === dateStr) last.items.push(log);
        else groups.push({ date: dateStr, items: [log] });
      } catch (e) {}
    });
    return groups;
  }, [filteredLogs]);

  // Helper to get tab info
  const getTabInfo = (shiftType: string) => tabs.find(t => t.id === shiftType);

  // --- Render Components ---

  const ControlsSection = () => (
    <div className="bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800 shrink-0 flex flex-col gap-3">
         {/* Row 1: Date & View Mode */}
         <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 w-full md:w-auto">
               {['day', 'week', 'month'].map((m) => (
                 <button
                   key={m}
                   onClick={() => setViewMode(m as ViewMode)}
                   className={`flex-1 md:flex-none px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                     viewMode === m 
                       ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-white shadow-sm' 
                       : 'text-slate-500'
                   }`}
                 >
                   {{day:'일간', week:'주간', month:'월간'}[m]}
                 </button>
               ))}
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
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
                
                <button 
                  onClick={() => {
                     const s = new Date(currentDate); 
                     setCurrentDate(s);
                  }}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 hover:text-blue-500 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                   <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
            </div>
         </div>

         {/* Row 2: Filters (Tabs & Detail Dropdown) */}
         <div className="flex flex-col md:flex-row gap-2 items-start md:items-center overflow-x-auto custom-scrollbar pb-1">
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
               <button
                 onClick={() => { setActiveTab('ALL'); setDetailFilterId('ALL'); }}
                 className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === 'ALL' 
                      ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' 
                      : 'text-slate-500'
                 }`}
               >
                 전체
               </button>
               {tabs.map(tab => (
                 <button
                   key={tab.id}
                   onClick={() => { setActiveTab(tab.id); setDetailFilterId('ALL'); }}
                   className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                      activeTab === tab.id 
                        ? `${tab.colorClass} bg-white dark:bg-slate-600 shadow-sm ring-1 ring-black/5` 
                        : 'text-slate-500'
                   }`}
                 >
                   {tab.icon} {tab.label}
                 </button>
               ))}
            </div>

            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 hidden md:block"></div>

            <div className="flex items-center gap-2 w-full md:w-auto">
               <Filter size={14} className="text-slate-400 shrink-0" />
               <select
                 value={detailFilterId}
                 onChange={(e) => setDetailFilterId(e.target.value)}
                 className="w-full md:w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg px-2 py-1.5 outline-none focus:border-blue-500"
               >
                 <option value="ALL">전체 세부 항목</option>
                 {uniqueItems.map(([id, label]) => (
                   <option key={id} value={id}>{label}</option>
                 ))}
               </select>
            </div>
         </div>

         {/* Mobile View Toggle */}
         <div className="md:hidden flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setMobileView('LIST')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${
                mobileView === 'LIST' 
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500'
              }`}
            >
              <List size={14} /> 목록 ({filteredLogs.length})
            </button>
            <button
              onClick={() => setMobileView('STATS')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${
                mobileView === 'STATS' 
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500'
              }`}
            >
              <BarChart3 size={14} /> 통계/순위
            </button>
         </div>
    </div>
  );

  const StatsPanel = () => (
    <div className={`
      w-full md:w-72 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 
      bg-white dark:bg-slate-900/50 p-4 overflow-y-auto custom-scrollbar shrink-0
      ${mobileView === 'STATS' ? 'block h-full' : 'hidden md:block md:h-full'}
    `}>
        <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-blue-500" />
            <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">항목별 수행 랭킹</h3>
        </div>
        
        {stats.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-8">데이터가 없습니다.</div>
        ) : (
            <div className="space-y-3">
              {stats.map((s, idx) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        idx === 0 ? 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-400' :
                        idx === 1 ? 'bg-slate-100 text-slate-600 ring-1 ring-slate-300' :
                        idx === 2 ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-300' :
                        'text-slate-400'
                    }`}>
                        {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{backgroundColor: s.color}}></div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{s.name}</span>
                          {idx === 0 && <Crown size={10} className="text-yellow-500" />}
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-1">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(s.count / stats[0].count) * 100}%` }}></div>
                        </div>
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 w-8 text-right">{s.count}</span>
                  </div>
              ))}
            </div>
        )}
    </div>
  );

  const LogsList = () => (
    <div className={`
      flex-1 overflow-y-auto custom-scrollbar p-4 bg-slate-50/50 dark:bg-black/20
      ${mobileView === 'LIST' ? 'block' : 'hidden md:block'}
    `}>
        {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <div className="w-6 h-6 border-2 border-t-blue-500 border-slate-300 rounded-full animate-spin mb-2"></div>
              <span className="text-xs">로딩 중...</span>
            </div>
        ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-red-500 p-4 text-center">
              <AlertCircle size={24} className="mb-2" />
              <span className="text-sm font-bold">오류 발생</span>
              <p className="text-xs opacity-70 mt-1">{error}</p>
            </div>
        ) : groupedLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-2">
                  <Filter size={20} className="opacity-50" />
              </div>
              <span className="text-sm font-medium">해당 조건의 기록이 없습니다.</span>
            </div>
        ) : (
            <div className="space-y-6 max-w-3xl mx-auto pb-20 md:pb-0">
              {groupedLogs.map(group => (
                  <div key={group.date} className="animate-fade-in">
                    <div className="sticky top-0 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm z-10 py-2 mb-2 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
                        <CalendarClock size={14} className="text-slate-500" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{group.date}</span>
                    </div>
                    
                    <div className="space-y-3">
                        {group.items.map(log => {
                          const tabInfo = getTabInfo(log.shiftType);
                          return (
                              <div key={log.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                      <div className={`p-1.5 rounded-lg ${tabInfo?.colorClass || 'bg-slate-100 text-slate-500'}`}>
                                          {tabInfo?.icon || <CheckSquare size={14} />}
                                      </div>
                                      <div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                                {tabInfo?.label || log.shiftType}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {new Date(log.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                            </span>
                                          </div>
                                      </div>
                                    </div>
                                    <AvatarStack ids={log.performedBy} staff={staff} size="xs" />
                                </div>
                                
                                {/* Checklist Detail */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pl-1 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                                    {log.checklist.map((item, i) => (
                                      <div key={i} className={`flex items-center gap-1.5 text-xs ${item.checked ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 opacity-50'}`}>
                                          <div className={`w-3 h-3 rounded-sm border flex items-center justify-center ${item.checked ? 'bg-blue-500 border-blue-500' : 'border-slate-300'}`}>
                                            {item.checked && <CheckSquare size={10} className="text-white" />}
                                          </div>
                                          <span className={item.checked ? 'font-medium' : 'line-through'}>{item.label}</span>
                                          {item.performedBy && <span className="text-[9px] bg-slate-200 dark:bg-slate-700 px-1 rounded ml-auto">{item.performedBy}</span>}
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
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <ControlsSection />
      
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
         <StatsPanel />
         <LogsList />
      </div>
    </div>
  );
};

export default GenericHistoryView;
