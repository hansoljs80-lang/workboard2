
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Staff, ShockwaveShift, ShockwaveLog, ShockwaveChecklistItem, ShockwaveConfig } from '../types';
import { Activity, Sun, Moon, LayoutGrid, History, CheckSquare, Square, Save, AlertCircle, Copy, Filter, Settings, Clock } from 'lucide-react';
import StatusOverlay, { OperationStatus } from './StatusOverlay';
import StaffSelectionModal from './common/StaffSelectionModal';
import { fetchShockwaveLogs, logShockwaveAction, getShockwaveConfig, saveShockwaveConfig } from '../services/shockwaveService';
import DateNavigator from './DateNavigator';
import AvatarStack from './common/AvatarStack';
import ShockwaveStats from './shockwave/ShockwaveStats';
import ShockwaveConfigModal from './shockwave/ShockwaveConfigModal';
import { getWeekRange } from '../utils/dateUtils';
import { SUPABASE_SCHEMA_SQL } from '../constants/supabaseSchema';

interface ShockwaveManagerProps {
  staff: Staff[];
}

type TabMode = 'status' | 'history';
type ViewMode = 'day' | 'week' | 'month';

const ShockwaveManager: React.FC<ShockwaveManagerProps> = ({ staff }) => {
  const [activeTab, setActiveTab] = useState<TabMode>('status');
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

    // Filter time range based on view mode
    if (activeTab === 'status') {
      start = new Date(); // Always show today for status
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
    
    // Construct payload
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
  const getTodayLogs = (shift: ShockwaveShift) => {
    if (activeTab !== 'status') return [];
    return logs
      .filter(l => l.shiftType === shift)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

  const renderChecklistCard = (
    shift: ShockwaveShift, 
    title: string, 
    icon: React.ReactNode, 
    items: { id: string, label: string }[],
    checkedState: string[],
    theme: string
  ) => {
    const todayLogs = getTodayLogs(shift);
    const lastLog = todayLogs.length > 0 ? todayLogs[0] : null;

    const effectiveChecks = (lastLog && checkedState.length === 0) 
        ? lastLog.checklist.filter(c => c.checked).map(c => c.id) 
        : checkedState;

    return (
      <div className={`flex flex-col h-full rounded-2xl border-2 transition-all shadow-sm overflow-hidden ${theme}`}>
         {/* Header */}
         <div className="p-4 flex items-center justify-between border-b border-black/5 dark:border-white/5 shrink-0">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-white/50 rounded-lg shadow-sm">{icon}</div>
               <h3 className="text-lg font-bold">{title}</h3>
            </div>
            {lastLog && (
                <div className="text-[10px] font-bold px-2 py-1 bg-white/50 rounded-md flex items-center gap-1">
                    <CheckSquare size={10} /> 완료 ({new Date(lastLog.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})})
                </div>
            )}
         </div>

         {/* Checklist Body */}
         <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-white/30 dark:bg-black/10">
            {(!items || items.length === 0) ? (
               <div className="text-center text-sm opacity-50 py-10">설정에서 업무를 추가해주세요.</div>
            ) : (
                <div className="space-y-2">
                {items.map(item => {
                    const isChecked = effectiveChecks.includes(item.id);
                    return (
                    <button
                        key={item.id}
                        onClick={() => toggleCheck(shift, item.id)}
                        className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                            isChecked 
                            ? 'bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-900/50 shadow-sm' 
                            : 'bg-white/40 dark:bg-slate-800/40 border-black/5 dark:border-white/5 hover:bg-white/60'
                        }`}
                    >
                        <div className={`mt-0.5 shrink-0 transition-colors ${isChecked ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {isChecked ? <CheckSquare size={20} /> : <Square size={20} />}
                        </div>
                        <span className={`text-sm font-medium transition-all ${isChecked ? 'text-slate-400 dark:text-slate-500 line-through decoration-slate-300 dark:decoration-slate-600' : 'text-slate-700 dark:text-slate-200'}`}>
                            {item.label}
                        </span>
                    </button>
                    );
                })}
                </div>
            )}
         </div>

         {/* Action Footer */}
         <div className="p-4 border-t border-black/5 dark:border-white/5 bg-white/20 shrink-0">
            <button
              onClick={() => handleSaveClick(shift)}
              disabled={!items || items.length === 0}
              className="w-full py-3 bg-white dark:bg-slate-800 rounded-xl font-bold shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:scale-100"
            >
               <Save size={16} /> 기록 저장
            </button>
            {todayLogs.length > 0 && (
                <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5">
                    <p className="text-[10px] font-bold opacity-60 mb-2">오늘의 기록 ({todayLogs.length}건)</p>
                    <div className="space-y-1 max-h-[60px] overflow-y-auto custom-scrollbar">
                        {todayLogs.map(log => (
                            <div key={log.id} className="flex justify-between items-center text-[10px] px-2 py-1 bg-white/40 rounded">
                                <span>{new Date(log.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                <AvatarStack ids={log.performedBy} staff={staff} size="xs" max={3} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
         </div>
      </div>
    );
  };

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
        <div className="flex-1 overflow-hidden">
           {error === 'DATA_TABLE_MISSING' && (
              <div className="mb-4 bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-200 flex flex-col md:flex-row items-center justify-center gap-3">
                 <span className="font-bold text-sm flex items-center gap-2">
                    <AlertCircle size={16} /> DB 테이블(shockwave_logs)이 필요합니다.
                 </span>
                 <button onClick={handleCopySQL} className="text-xs bg-amber-200 px-3 py-1 rounded-lg font-bold flex items-center gap-1">
                   <Copy size={12} /> SQL 복사
                 </button>
              </div>
           )}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full overflow-y-auto pb-4 custom-scrollbar">
              {renderChecklistCard(
                'MORNING', 
                '아침 업무', 
                <Sun className="text-amber-500" />,
                config.morningItems,
                morningChecks,
                'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
              )}
              {renderChecklistCard(
                'DAILY', 
                '일상 업무', 
                <Clock className="text-blue-500" />,
                config.dailyItems,
                dailyChecks,
                'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100'
              )}
              {renderChecklistCard(
                'EVENING', 
                '저녁 업무', 
                <Moon className="text-indigo-500" />,
                config.eveningItems,
                eveningChecks,
                'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100'
              )}
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
