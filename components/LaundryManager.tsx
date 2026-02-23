
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Staff, LaundryLog, LaundryAction } from '../types';
import { Shirt, Wind, CheckCircle2, History, LayoutGrid, AlertCircle, Database, Waves, ArrowRight, Copy, Filter, Clock, Plus, Trash2, List, BarChart3 } from 'lucide-react';
import StatusOverlay, { OperationStatus } from './StatusOverlay';
import StaffSelectionModal from './common/StaffSelectionModal';
import { fetchLaundryLogs, logLaundryAction, deleteLaundryLog } from '../services/laundryService';
import DateNavigator from './DateNavigator';
import AvatarStack from './common/AvatarStack';
import LaundryStats from './laundry/LaundryStats';
import { getWeekRange } from '../utils/dateUtils';
import { SUPABASE_SCHEMA_SQL } from '../constants/supabaseSchema';

interface LaundryManagerProps {
  staff: Staff[];
}

type TabMode = 'status' | 'history';
type ViewMode = 'day' | 'week' | 'month';
type MobileHistoryView = 'LIST' | 'STATS';

const LaundryManager: React.FC<LaundryManagerProps> = ({ staff }) => {
  const [activeTab, setActiveTab] = useState<TabMode>('status');
  const [opStatus, setOpStatus] = useState<OperationStatus>('idle');
  const [opMessage, setOpMessage] = useState('');
  
  // Selection Logic
  const [selectedAction, setSelectedAction] = useState<LaundryAction | null>(null);
  
  // Data Logic
  const [currentDate, setCurrentDate] = useState(new Date());
  const [logs, setLogs] = useState<LaundryLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('month'); // History view mode
  const [error, setError] = useState('');

  // Filter State
  const [typeFilter, setTypeFilter] = useState<'ALL' | LaundryAction>('ALL');
  
  // Mobile History State
  const [mobileHistoryView, setMobileHistoryView] = useState<MobileHistoryView>('LIST');

  // 1. Fetch Logs
  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    
    // For Status Tab: Always fetch TODAY's logs
    // For History Tab: Fetch based on currentDate & viewMode
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
      const res = await fetchLaundryLogs(start, end);
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

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    alert("SQL 코드가 클립보드에 복사되었습니다.\nSupabase 대시보드 > SQL Editor에서 실행해주세요.");
  };

  // 2. Action Handlers
  const handleStageClick = (action: LaundryAction) => {
    setSelectedAction(action);
  };

  const handleConfirmAction = async (staffIds: string[]) => {
    if (!selectedAction) return;
    
    setOpStatus('loading');
    setOpMessage('기록 저장 중...');
    
    const res = await logLaundryAction(selectedAction, staffIds);
    
    if (res.success) {
      setOpStatus('success');
      setOpMessage('저장 완료');
      loadLogs(); // Refresh
    } else {
      setOpStatus('error');
      setOpMessage('저장 실패');
      if (res.message?.includes('does not exist')) {
         alert("저장 실패: 'laundry_logs' 테이블이 없습니다. DB 설정을 확인하세요.");
         setError('DATA_TABLE_MISSING');
      } else {
         alert(res.message);
      }
    }
    
    setTimeout(() => setOpStatus('idle'), 1000);
  };

  const handleDeleteLog = async (id: string) => {
    if (!window.confirm('이 기록을 삭제하시겠습니까?')) return;
    
    setOpStatus('loading');
    setOpMessage('삭제 중...');
    
    const res = await deleteLaundryLog(id);
    
    if (res.success) {
      setOpStatus('success');
      setOpMessage('삭제 완료');
      loadLogs();
    } else {
      setOpStatus('error');
      setOpMessage('삭제 실패');
      alert(res.message);
    }
    setTimeout(() => setOpStatus('idle'), 1000);
  };

  // 3. Status View Helpers
  const getTodayLogs = (action: LaundryAction) => {
    if (activeTab !== 'status') return []; 
    return logs
      .filter(l => l.actionType === action)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const renderStageCard = (action: LaundryAction, title: string, icon: React.ReactNode, theme: string, description: string) => {
    const actionLogs = getTodayLogs(action);
    const hasLogs = actionLogs.length > 0;
    
    return (
      <div 
        onClick={() => handleStageClick(action)}
        className={`
          relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all shadow-sm hover:shadow-lg active:scale-[0.98] group overflow-hidden w-full min-h-[240px] cursor-pointer
          ${theme}
        `}
      >
        <div className={`p-3 rounded-full mb-2 transition-transform group-hover:scale-110 shadow-sm mt-2 bg-white/50`}>
           {icon}
        </div>
        
        <h3 className="text-lg font-bold mb-1">{title}</h3>
        <p className="text-xs opacity-70 mb-4">{description}</p>

        <div className="flex-1 w-full bg-white/60 dark:bg-black/20 rounded-xl overflow-hidden flex flex-col mb-2 border border-black/5 dark:border-white/5">
           {hasLogs ? (
             <div className="overflow-y-auto custom-scrollbar flex-1 max-h-[120px] p-2 space-y-1">
                {actionLogs.map((log) => (
                  <div key={log.id} className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-lg flex items-center justify-between shadow-sm animate-fade-in text-left group/item">
                     <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                        <Clock size={12} className="text-slate-400" />
                        {new Date(log.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                     </div>
                     <div className="flex items-center gap-2">
                        <AvatarStack ids={log.performedBy} staff={staff} size="xs" max={2} />
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLog(log.id);
                            }}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover/item:opacity-100 transition-opacity"
                            title="삭제"
                        >
                            <Trash2 size={12} />
                        </button>
                     </div>
                  </div>
                ))}
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-xs opacity-50 p-4 min-h-[80px]">
                <Clock size={20} className="mb-1" />
                <span>아직 기록 없음</span>
             </div>
           )}
           
           <div className="p-2 text-[10px] font-bold bg-black/5 dark:bg-white/5 text-center flex items-center justify-center gap-1">
              <Plus size={10} /> 터치하여 기록 추가
           </div>
        </div>
      </div>
    );
  };

  // 4. History View Helpers
  const filteredLogs = useMemo(() => {
    if (typeFilter === 'ALL') return logs;
    return logs.filter(l => l.actionType === typeFilter);
  }, [logs, typeFilter]);

  const groupedLogs = useMemo(() => {
    const groups: { date: string; items: LaundryLog[] }[] = [];
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

  // General Stats
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

  // Category Leaders Stats (Wash/Dry/Fold Winners)
  const categoryLeaders = useMemo(() => {
    const counts: Record<LaundryAction, Record<string, number>> = {
      WASH: {},
      DRY: {},
      FOLD: {}
    };

    logs.forEach(log => {
      const type = log.actionType;
      // Safety check if log type matches known types
      if (counts[type]) {
        log.performedBy.forEach(staffId => {
          counts[type][staffId] = (counts[type][staffId] || 0) + 1;
        });
      }
    });

    const getLeader = (type: LaundryAction) => {
      const typeCounts = counts[type];
      let max = 0;
      let leaderId = null;
      
      Object.entries(typeCounts).forEach(([id, count]) => {
        if (count > max) {
          max = count;
          leaderId = id;
        }
      });

      if (leaderId) {
        const s = staff.find(staff => staff.id === leaderId);
        if (s) return { staff: { name: s.name, color: s.color }, count: max };
      }
      return null;
    };

    return {
      WASH: getLeader('WASH'),
      DRY: getLeader('DRY'),
      FOLD: getLeader('FOLD'),
    };
  }, [logs, staff]);

  // UI Action Labels
  const actionLabels: Record<LaundryAction, string> = {
    'WASH': '빨래 넣기',
    'DRY': '건조기 가동',
    'FOLD': '빨래 정리'
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-4 md:p-6 overflow-hidden">
      <StatusOverlay status={opStatus} message={opMessage} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-300 dark:border-slate-700">
            <Shirt className="text-indigo-600" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">빨래 업무</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
               매일 반복되는 세탁 업무를 단계별로 관리합니다.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex self-start md:self-auto">
           <button
             onClick={() => setActiveTab('status')}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'status' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
           >
             <LayoutGrid size={16} /> 오늘의 빨래
           </button>
           <button
             onClick={() => setActiveTab('history')}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
           >
             <History size={16} /> 이력/통계
           </button>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'status' ? (
        <div className="flex-1 overflow-y-auto custom-scrollbar w-full">
           <div className="flex flex-col items-center justify-start md:justify-center min-h-full max-w-5xl mx-auto w-full animate-fade-in pb-24">
              {error === 'DATA_TABLE_MISSING' && (
                  <div className="mb-6 w-full bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200 flex flex-col md:flex-row items-center justify-center gap-4">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={20} className="text-amber-600" />
                        <span className="font-bold">이력 저장을 위한 DB 테이블이 없습니다.</span>
                    </div>
                    <button 
                      onClick={handleCopySQL}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-200 text-amber-900 rounded-lg hover:bg-amber-300 transition-colors font-bold text-sm shadow-sm"
                    >
                      <Copy size={14} /> SQL 코드 복사
                    </button>
                  </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                  {renderStageCard(
                    'WASH', 
                    '1. 빨래 넣기', 
                    <Waves size={32} className="text-blue-500" />,
                    'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900/40',
                    '세탁기 가동 시작'
                  )}
                  
                  <div className="md:hidden flex justify-center -my-3 opacity-30 text-slate-400">
                    <ArrowRight size={24} className="rotate-90" />
                  </div>

                  {renderStageCard(
                    'DRY', 
                    '2. 건조기 가동', 
                    <Wind size={32} className="text-orange-500" />,
                    'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-100 hover:bg-orange-100 dark:hover:bg-orange-900/40',
                    '건조기로 옮기기'
                  )}

                  <div className="md:hidden flex justify-center -my-3 opacity-30 text-slate-400">
                    <ArrowRight size={24} className="rotate-90" />
                  </div>

                  {renderStageCard(
                    'FOLD', 
                    '3. 빨래 정리', 
                    <CheckCircle2 size={32} className="text-emerald-500" />,
                    'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 hover:bg-emerald-100 dark:hover:bg-emerald-900/40',
                    '개어서 수납함으로'
                  )}
              </div>
              
              <p className="mt-8 text-sm text-slate-400 dark:text-slate-500 flex items-center gap-2">
                <AlertCircle size={14} />
                카드를 터치하여 수행 인원을 기록하세요. (하루에 여러 번 기록 가능)
              </p>
           </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row animate-fade-in gap-0 md:gap-4">
           {/* Top Controls for History */}
           <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm mb-4 md:mb-0 shrink-0">
              <div className="flex flex-col gap-3">
                 <div className="flex justify-between items-center">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        {['day', 'week', 'month'].map((mode) => (
                        <button 
                            key={mode}
                            onClick={() => setViewMode(mode as ViewMode)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === mode ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500'}`}
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

                 {/* Type Filter */}
                 <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    <div className="flex items-center gap-1.5 px-2 text-xs font-bold text-slate-500 whitespace-nowrap">
                        <Filter size={14} /> 필터:
                    </div>
                    {['ALL', 'WASH', 'DRY', 'FOLD'].map((type) => {
                        let label = '전체 보기';
                        if (type === 'WASH') label = '세탁';
                        if (type === 'DRY') label = '건조';
                        if (type === 'FOLD') label = '정리';
                        
                        return (
                            <button
                                key={type}
                                onClick={() => setTypeFilter(type as any)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                                    typeFilter === type 
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                {label}
                            </button>
                        );
                    })}
                 </div>

                 {/* Mobile View Toggle */}
                 <div className="md:hidden flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button
                        onClick={() => setMobileHistoryView('LIST')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${
                            mobileHistoryView === 'LIST' 
                            ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' 
                            : 'text-slate-500'
                        }`}
                    >
                        <List size={14} /> 목록 ({groupedLogs.length})
                    </button>
                    <button
                        onClick={() => setMobileHistoryView('STATS')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${
                            mobileHistoryView === 'STATS' 
                            ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' 
                            : 'text-slate-500'
                        }`}
                    >
                        <BarChart3 size={14} /> 통계/순위
                    </button>
                 </div>
              </div>
           </div>

           {/* Stats Panel */}
           <div className={`
              w-full md:w-80 shrink-0 md:h-full md:order-1 order-1
              ${mobileHistoryView === 'STATS' ? 'block h-full' : 'hidden md:block'}
           `}>
              <LaundryStats stats={stats} categoryLeaders={categoryLeaders} loading={loading} />
           </div>

           {/* Main: Logs */}
           <div className={`
              flex-1 overflow-y-auto custom-scrollbar md:order-2 order-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4
              ${mobileHistoryView === 'LIST' ? 'block' : 'hidden md:block'}
           `}>
              {loading ? (
                 <div className="py-20 text-center text-slate-400">데이터 불러오는 중...</div>
              ) : groupedLogs.length === 0 ? (
                 <div className="py-20 text-center text-slate-400">
                    {typeFilter === 'ALL' ? '기록이 없습니다.' : '선택한 작업의 기록이 없습니다.'}
                 </div>
              ) : (
                 <div className="space-y-6 pb-20 md:pb-0">
                    {groupedLogs.map(group => (
                       <div key={group.date}>
                          <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-10 py-2 px-1 mb-2 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-300 text-sm flex items-center gap-2">
                             {group.date}
                          </div>
                          <div className="space-y-2">
                             {group.items.map(log => {
                                let icon, colorClass, text;
                                switch(log.actionType) {
                                   case 'WASH': icon=<Waves size={16}/>; colorClass="text-blue-500 bg-blue-50 dark:bg-blue-900/20"; text="빨래 넣기"; break;
                                   case 'DRY': icon=<Wind size={16}/>; colorClass="text-orange-500 bg-orange-50 dark:bg-orange-900/20"; text="건조기 가동"; break;
                                   case 'FOLD': icon=<CheckCircle2 size={16}/>; colorClass="text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"; text="빨래 정리"; break;
                                   default: icon=<Shirt size={16}/>; colorClass="text-slate-500"; text="기타";
                                }
                                
                                return (
                                   <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                      <div className="flex items-center gap-3">
                                         <div className={`p-2 rounded-full ${colorClass}`}>{icon}</div>
                                         <div>
                                            <p className="font-bold text-sm text-slate-700 dark:text-slate-200">{text}</p>
                                            <p className="text-xs text-slate-400">
                                               {new Date(log.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                         </div>
                                      </div>
                                      <AvatarStack ids={log.performedBy} staff={staff} size="sm" />
                                   </div>
                                )
                             })}
                          </div>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        </div>
      )}

      {/* Action Modal */}
      <StaffSelectionModal 
        isOpen={selectedAction !== null}
        onClose={() => setSelectedAction(null)}
        onConfirm={handleConfirmAction}
        staff={staff}
        title={selectedAction ? actionLabels[selectedAction] : ''}
        message="작업을 수행한 직원을 선택해주세요."
        confirmLabel="완료 처리"
      />
    </div>
  );
};

export default LaundryManager;
