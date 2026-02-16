
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
          color: