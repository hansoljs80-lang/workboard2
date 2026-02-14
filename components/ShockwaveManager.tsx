import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Staff, ShockwaveShift, ShockwaveLog, ShockwaveChecklistItem, ShockwaveConfig } from '../types';
import { Activity, Sun, Moon, LayoutGrid, History, Save, AlertCircle, Copy, Filter, Settings, Clock, CheckSquare, Square } from 'lucide-react';
import StatusOverlay, { OperationStatus } from './StatusOverlay';
import StaffSelectionModal from './common/StaffSelectionModal';
import { fetchShockwaveLogs, logShockwaveAction, getShockwaveConfig, saveShockwaveConfig } from '../services/shockwaveService';
import DateNavigator from './DateNavigator';
import AvatarStack from './common/AvatarStack';
import ShockwaveStats from './shockwave/ShockwaveStats';
import ShockwaveConfigModal from './shockwave/ShockwaveConfigModal';
import { getWeekRange } from '../utils/dateUtils';
import { SUPABASE_SCHEMA_SQL } from '../constants/supabaseSchema';
import GenericChecklistCard from './common/GenericChecklistCard';
import MobileTabSelector from './common/MobileTabSelector';

interface ShockwaveManagerProps {
  staff: Staff[];
}

type TabMode = 'status' | 'history';
type ViewMode = 'day' | 'week' | 'month';
type SubTab = 'MORNING' | 'DAILY' | 'EVENING';

const ShockwaveManager: React.FC<ShockwaveManagerProps> = ({ staff }) => {
  const [activeTab, setActiveTab] = useState<TabMode>('status');
  const [mobileSubTab, setMobileSubTab] = useState<SubTab>('MORNING');
  const [opStatus, setOpStatus] = useState<OperationStatus>('idle');
  const [opMessage, setOpMessage] = useState('');

  // Config State
  const [config, setConfig] = useState<ShockwaveConfig>({ morningItems: [], dailyItems: [], eveningItems: [] });
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Checklist State
  const [morningChecks, setMorningChecks] = useState<string[]>([]);
  const [dailyChecks, setDailyChecks] = useState<string[]>([]);
  const [eveningChecks, setEveningChecks] = useState<string[]>([]);
  const [confirmingShift, setConfirmingShift] = useState<ShockwaveShift | null>(null);

  // Data Logic
  const [currentDate, setCurrentDate] = useState(new Date());
  const [logs, setLogs] = useState<ShockwaveLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | ShockwaveShift>('ALL');

  // Load Config
  const loadConfig = useCallback(async () => {
    const cfg = await getShockwaveConfig();
    setConfig(cfg);
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Load Logs
  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    
    let start = new Date(currentDate);
    let end = new Date(currentDate);

    if (activeTab === 'status') {
      start = new Date();
      start.setHours(0, 0, 0, 0);
      end = new Date();
      end.setHours(23, 59, 59, 999);
    } else {
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
    }

    try {
      const res = await fetchShockwaveLogs(start, end);
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
  }, [currentDate, viewMode, activeTab]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Handlers
  const handleSaveConfig = async (newConfig: ShockwaveConfig) => {
    setConfig(newConfig);
    setIsConfigOpen(false);
    await saveShockwaveConfig(newConfig);
  };

  const toggleCheck = (shift: ShockwaveShift, id: string) => {
    if (shift === 'MORNING') {
      setMorningChecks(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    } else if (shift === 'DAILY') {
      setDailyChecks(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    } else {
      setEveningChecks(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }
  };

  const handleSaveClick = (shift: ShockwaveShift) => {
    const checks = shift === 'MORNING' ? morningChecks : shift === 'DAILY' ? dailyChecks : eveningChecks;
    if (checks.length === 0) {
      if(!window.confirm("체크된 항목이 없습니다. 그래도 저장하시겠습니까?")) return;
    }
    setConfirmingShift(shift);
  };

  const handleConfirmSave = async (staffIds: string[]) => {
    if (!confirmingShift) return;

    setOpStatus('loading');
    setOpMessage('저장 중...');

    const items = 
      confirmingShift === 'MORNING' ? config.morningItems : 
      confirmingShift === 'DAILY' ? config.dailyItems : 
      config.eveningItems;
    
    const checks = 
      confirmingShift === 'MORNING' ? morningChecks : 
      confirmingShift === 'DAILY' ? dailyChecks : 
      eveningChecks;
    
    const checklistData: ShockwaveChecklistItem[] = items.map(item => ({
      id: item.id,
      label: item.label,
      checked: checks.includes(item.id)
    }));

    const res = await logShockwaveAction(confirmingShift, checklistData, staffIds);

    if (res.success) {
      setOpStatus('success');
      setOpMessage('저장 완료');
      // Reset checklist
      if (confirmingShift === 'MORNING') setMorningChecks([]);
      else if (confirmingShift === 'DAILY') setDailyChecks([]);
      else setEveningChecks([]);
      
      loadLogs();
    } else {
      setOpStatus('error');
      setOpMessage('저장 실패');
      alert(res.message);
    }
    
    setTimeout(() => setOpStatus('idle'), 1000);
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    alert("SQL 코드가 클립보드에 복사되었습니다.\nSupabase 대시보드 > SQL Editor에서 실행해주세요.");
  };

  // Helper: Get today's logs for status view
  const getTodayLog = (shift: ShockwaveShift) => {
    if (activeTab !== 'status') return null;
    const shiftLogs = logs
      .filter(l => l.shiftType === shift)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return shiftLogs.length > 0 ? shiftLogs[0] : null;
  };

  // Stats Logic
  const filteredLogs = useMemo(() => {
    if (typeFilter === 'ALL') return logs;
    return logs.filter(l => l.shiftType === typeFilter);
  }, [logs, typeFilter]);

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
    const getLeader = (type: ShockwaveShift) => {
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
        DAILY: getLeader('DAILY'),
        EVENING: getLeader('EVENING')
    };
  }, [logs, staff]);

  // Group logs for history view
  const groupedLogs = useMemo(() => {
    const groups: { date: string; items: ShockwaveLog[] }[] = [];
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

  // Cards Data
  const cards = [
    {
      shift: 'MORNING' as ShockwaveShift,
      title: '아침 업무',
      icon: <Sun className="text-amber-500" />,
      items: config.morningItems,
      checks: morningChecks,
      theme: 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100',
      activeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    },
    {
      shift: 'DAILY' as ShockwaveShift,
      title: '일상 업무',
      icon: <Clock className="text-blue-500" />,
      items: config.dailyItems,
      checks: dailyChecks,
      theme: 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100',
      activeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    },
    {
      shift: 'EVENING' as ShockwaveShift,
      title: '저녁 업무',
      icon: <Moon className="text-indigo-500" />,
      items: config.eveningItems,
      checks: eveningChecks,
      theme: 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100',
      activeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
    }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-4 md:p-6 pb-24 overflow-hidden">
      <StatusOverlay status={opStatus} message={opMessage} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-300 dark:border-slate-700">
            <Activity className="text-pink-600" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">충격파실 관리</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
               매일 정기 업무를 확인하고 기록합니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
           {activeTab === 'status' && (
             <button
                onClick={() => setIsConfigOpen(true)}
                className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                title="업무 목록 설정"
             >
                <Settings size={20} />
             </button>
           )}
           <div className="bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex">
              <button
                onClick={() => setActiveTab('status')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'status' ? 'bg-pink-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                <LayoutGrid size={16} /> 업무 체크
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-pink-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                <History size={16} /> 이력/통계
              </button>
           </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'status' ? (
        <div className="flex-1 overflow-hidden flex flex-col">
           {error === 'DATA_TABLE_MISSING' && (
              <div className="mb-4 bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-200 flex flex-col md:flex-row items-center justify-center gap-3 shrink-0">
                 <span className="font-bold text-sm flex items-center gap-2">
                    <AlertCircle size={16} /> DB 테이블(shockwave_logs)이 필요합니다.
                 </span>
                 <button onClick={handleCopySQL} className="text-xs bg-amber-200 px-3 py-1 rounded-lg font-bold flex items-center gap-1">
                   <Copy size={12} /> SQL 복사
                 </button>
              </div>
           )}
           
           <MobileTabSelector 
             activeTab={mobileSubTab}
             onTabChange={setMobileSubTab}
             tabs={cards.map(c => ({
               value: c.shift,
               label: c.title.replace(' 업무', ''),
               icon: c.icon,
               activeColorClass: c.activeColor
             }))}
           />

           {/* Cards Container */}
           <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
               {cards.map(card => (
                 <div key={card.shift} className={`${mobileSubTab === card.shift ? 'block' : 'hidden md:block'} h-full`}>
                   <GenericChecklistCard 
                     title={card.title}
                     icon={card.icon}
                     items={card.items}
                     checkedIds={card.checks}
                     onToggle={(id) => toggleCheck(card.shift, id)}
                     onSave={() => handleSaveClick(card.shift)}
                     theme={card.theme}
                     staff={staff}
                     lastLog={getTodayLog(card.shift)}
                   />
                 </div>
               ))}
             </div>
           </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-4 animate-fade-in">
           {/* Sidebar Stats */}
           <div className="w-full md:w-80 shrink-0 h-64 md:h-full order-1">
              <ShockwaveStats stats={stats} shiftLeaders={shiftLeaders} loading={loading} />
           </div>

           {/* Main Log List */}
           <div className="flex-1 overflow-y-auto custom-scrollbar order-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
              <div className="flex justify-between items-center mb-4">
                 <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    {['day', 'week', 'month'].map((mode) => (
                      <button 
                        key={mode}
                        onClick={() => setViewMode(mode as ViewMode)}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === mode ? 'bg-white dark:bg-slate-600 text-pink-600 dark:text-white shadow-sm' : 'text-slate-500'}`}
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
              </div>

              {/* Filter */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                 <div className="flex items-center gap-1.5 px-2 text-xs font-bold text-slate-500 whitespace-nowrap">
                    <Filter size={14} /> 필터:
                 </div>
                 {['ALL', 'MORNING', 'DAILY', 'EVENING'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setTypeFilter(type as any)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                            typeFilter === type 
                            ? 'bg-pink-600 text-white border-pink-600 shadow-sm' 
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        {type === 'ALL' ? '전체' : type === 'MORNING' ? '아침' : type === 'DAILY' ? '일상' : '저녁'}
                    </button>
                 ))}
              </div>

              {/* List */}
              {loading ? (
                 <div className="py-20 text-center text-slate-400">데이터 불러오는 중...</div>
              ) : groupedLogs.length === 0 ? (
                 <div className="py-20 text-center text-slate-400">기록이 없습니다.</div>
              ) : (
                 <div className="space-y-6">
                    {groupedLogs.map(group => (
                       <div key={group.date}>
                          <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-10 py-2 px-1 mb-2 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-300 text-sm flex items-center gap-2">
                             {group.date}
                          </div>
                          <div className="space-y-3">
                             {group.items.map(log => {
                                const isMorning = log.shiftType === 'MORNING';
                                const isDaily = log.shiftType === 'DAILY';
                                const themeClass = isMorning 
                                   ? 'border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800' 
                                   : isDaily 
                                     ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800'
                                     : 'border-indigo-200 bg-indigo-50 dark:bg-indigo-900/10 dark:border-indigo-800';
                                
                                return (
                                   <div key={log.id} className={`p-3 rounded-xl border ${themeClass}`}>
                                      <div className="flex justify-between items-start mb-2">
                                         <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-full ${
                                                isMorning ? 'bg-amber-100 text-amber-600' 
                                                : isDaily ? 'bg-blue-100 text-blue-600'
                                                : 'bg-indigo-100 text-indigo-600'
                                            }`}>
                                               {isMorning ? <Sun size={14}/> : isDaily ? <Clock size={14} /> : <Moon size={14}/>}
                                            </div>
                                            <div>
                                               <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                                  {isMorning ? '아침 업무' : isDaily ? '일상 업무' : '저녁 업무'}
                                               </span>
                                               <span className="text-xs text-slate-500 ml-2">
                                                  {new Date(log.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                               </span>
                                            </div>
                                         </div>
                                         <AvatarStack ids={log.performedBy} staff={staff} size="sm" />
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 pl-1">
                                         {log.checklist.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                                               {item.checked ? (
                                                  <CheckSquare size={12} className="text-green-500 shrink-0" />
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
      )}

      {/* Staff Selection Modal */}
      <StaffSelectionModal
        isOpen={confirmingShift !== null}
        onClose={() => setConfirmingShift(null)}
        onConfirm={handleConfirmSave}
        staff={staff}
        title={
          confirmingShift === 'MORNING' ? "아침 업무 완료" : 
          confirmingShift === 'DAILY' ? "일상 업무 완료" : 
          "저녁 업무 완료"
        }
        message="작업을 수행한 직원을 선택해주세요."
        confirmLabel="저장 완료"
      />

      {/* Config Modal */}
      {isConfigOpen && (
        <ShockwaveConfigModal 
          config={config} 
          onClose={() => setIsConfigOpen(false)}
          onSave={handleSaveConfig}
        />
      )}
    </div>
  );
};

export default ShockwaveManager;