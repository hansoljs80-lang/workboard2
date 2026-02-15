
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Staff, PtRoomShift, PtRoomLog, PtRoomChecklistItem, PtRoomConfig, PtPeriodicItem } from '../types';
import { Stethoscope, Sun, Clock, LayoutGrid, History, Settings, CalendarRange, AlertCircle, Copy, Filter, RefreshCw } from 'lucide-react';
import StatusOverlay, { OperationStatus } from './StatusOverlay';
import StaffSelectionModal from './common/StaffSelectionModal';
import { fetchPtRoomLogs, logPtRoomAction, getPtRoomConfig, savePtRoomConfig, updatePeriodicItemDate } from '../services/ptRoomService';
import DateNavigator from './DateNavigator';
import PtRoomStats from './pt/PtRoomStats';
import PtRoomConfigModal from './pt/PtRoomConfigModal';
import { getWeekRange } from '../utils/dateUtils';
import { SUPABASE_SCHEMA_SQL } from '../constants/supabaseSchema';
import GenericChecklistCard, { RuntimeChecklistItem } from './common/GenericChecklistCard';
import MobileTabSelector from './common/MobileTabSelector';
import ItemSelectorModal from './common/ItemSelectorModal';

interface PtRoomManagerProps {
  staff: Staff[];
}

type TabMode = 'status' | 'history';
type ViewMode = 'day' | 'week' | 'month';
type SubTab = 'MORNING' | 'DAILY' | 'EVENING' | 'PERIODIC';

const PtRoomManager: React.FC<PtRoomManagerProps> = ({ staff }) => {
  const [activeTab, setActiveTab] = useState<TabMode>('status');
  const [mobileSubTab, setMobileSubTab] = useState<SubTab>('MORNING'); 
  const [opStatus, setOpStatus] = useState<OperationStatus>('idle');
  const [opMessage, setOpMessage] = useState('');

  // Config State
  const [config, setConfig] = useState<PtRoomConfig>({ morningItems: [], dailyItems: [], eveningItems: [], periodicItems: [] });
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Runtime Checklist State (Object Arrays)
  const [morningList, setMorningList] = useState<RuntimeChecklistItem[]>([]);
  const [dailyList, setDailyList] = useState<RuntimeChecklistItem[]>([]);
  const [eveningList, setEveningList] = useState<RuntimeChecklistItem[]>([]);
  
  // Add Item Flow State
  const [addModeShift, setAddModeShift] = useState<PtRoomShift | null>(null);
  const [pendingAddItems, setPendingAddItems] = useState<{shift: PtRoomShift, items: {id: string, label: string}[]} | null>(null);

  // Completion/Save Flow State
  const [selectedPeriodicId, setSelectedPeriodicId] = useState<string | null>(null);
  const [confirmingShift, setConfirmingShift] = useState<PtRoomShift | null>(null);

  // Data Logic
  const [currentDate, setCurrentDate] = useState(new Date());
  const [logs, setLogs] = useState<PtRoomLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | PtRoomShift>('ALL');

  // Load Config
  const loadConfig = useCallback(async () => {
    const cfg = await getPtRoomConfig();
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
      const res = await fetchPtRoomLogs(start, end);
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

  // --- Initialize Runtime Lists ---
  useEffect(() => {
    if (activeTab !== 'status') return;

    const initList = (shift: PtRoomShift, setList: React.Dispatch<React.SetStateAction<RuntimeChecklistItem[]>>) => {
        const todayLog = logs
            .filter(l => l.shiftType === shift)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        if (todayLog) {
            const restored = todayLog.checklist.map((item, idx) => ({
                id: item.id || `restored_${shift}_${idx}_${Date.now()}`,
                label: item.label,
                checked: item.checked,
                originalId: item.id,
                performedBy: item.performedBy // Restore performer
            }));
            setList(restored);
        } else {
            setList([]);
        }
    };

    initList('MORNING', setMorningList);
    initList('DAILY', setDailyList);
    initList('EVENING', setEveningList);

  }, [logs, activeTab]);


  // Handlers
  const handleSaveConfig = async (newConfig: PtRoomConfig) => {
    setConfig(newConfig);
    setIsConfigOpen(false);
    await savePtRoomConfig(newConfig);
  };

  const handleUpdateCatalog = async (shift: PtRoomShift, newItems: {id: string, label: string}[]) => {
      const newConfig = { ...config };
      if (shift === 'MORNING') newConfig.morningItems = newItems;
      else if (shift === 'DAILY') newConfig.dailyItems = newItems;
      else if (shift === 'EVENING') newConfig.eveningItems = newItems;
      
      setConfig(newConfig);
      await savePtRoomConfig(newConfig);
  };

  const toggleCheck = (shift: PtRoomShift, id: string) => {
    const update = (prev: RuntimeChecklistItem[]) => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item);
    if (shift === 'MORNING') setMorningList(update);
    else if (shift === 'DAILY') setDailyList(update);
    else setEveningList(update);
  };

  const deleteItemFromShift = (shift: PtRoomShift, id: string) => {
    const filter = (prev: RuntimeChecklistItem[]) => prev.filter(item => item.id !== id);
    if (shift === 'MORNING') setMorningList(filter);
    else if (shift === 'DAILY') setDailyList(filter);
    else setEveningList(filter);
  };

  // 1. Trigger Manual Save (Current State)
  const handleSaveClick = (shift: PtRoomShift) => {
    const list = shift === 'MORNING' ? morningList : shift === 'DAILY' ? dailyList : eveningList;
    const checkedCount = list.filter(i => i.checked).length;
    if (checkedCount === 0) {
      if(!window.confirm("체크된 항목이 없습니다. 그래도 저장하시겠습니까?")) return;
    }
    setConfirmingShift(shift);
  };

  // 2. Trigger Add Item (Opens Item Modal)
  const handleAddItemClick = (shift: PtRoomShift) => {
    setAddModeShift(shift);
  };

  // 3. Confirm Items from Modal -> Open Staff Select
  const handleItemsSelected = (items: {id: string, label: string}[]) => {
    if (addModeShift && items.length > 0) {
        setPendingAddItems({ shift: addModeShift, items });
        setAddModeShift(null); // Close item modal
    } else {
        setAddModeShift(null);
    }
  };

  // 4. Confirm Staff for New Items -> Add as Checked & Save with Performer
  const handleConfirmAddWithStaff = async (staffIds: string[]) => {
    if (!pendingAddItems) return;

    setOpStatus('loading');
    setOpMessage('항목 추가 및 저장 중...');

    const { shift, items } = pendingAddItems;
    
    // Resolve performer names
    const performerNames = staffIds.map(id => staff.find(s => s.id === id)?.name).filter(Boolean).join(', ');

    // Create new runtime items (Checked = true) with performer info
    const newRuntimeItems: RuntimeChecklistItem[] = items.map(i => ({
        id: `added_${shift}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        label: i.label,
        checked: true, // Auto-check
        originalId: i.id,
        performedBy: performerNames || undefined
    }));

    // Merge with current list
    let currentList: RuntimeChecklistItem[] = [];
    if (shift === 'MORNING') currentList = morningList;
    else if (shift === 'DAILY') currentList = dailyList;
    else currentList = eveningList;

    const updatedList = [...currentList, ...newRuntimeItems];

    // Update UI State immediately
    if (shift === 'MORNING') setMorningList(updatedList);
    else if (shift === 'DAILY') setDailyList(updatedList);
    else setEveningList(updatedList);

    // Prepare payload for DB
    const checklistData: PtRoomChecklistItem[] = updatedList.map(item => ({
      id: item.id, 
      label: item.label,
      checked: item.checked,
      performedBy: item.performedBy // Persist to DB
    }));

    // Save to DB
    const res = await logPtRoomAction(shift, checklistData, staffIds);

    if (res.success) {
        setOpStatus('success');
        setOpMessage('추가 및 완료 처리됨');
        loadLogs(); // Refresh to sync timestamp etc
    } else {
        setOpStatus('error');
        setOpMessage('저장 실패');
        alert(res.message);
    }

    setPendingAddItems(null);
    setTimeout(() => setOpStatus('idle'), 1000);
  };

  const handlePeriodicClick = (itemId: string) => {
    setSelectedPeriodicId(itemId);
    setConfirmingShift('PERIODIC');
  };

  // 5. Manual Save Confirmation
  const handleConfirmSave = async (staffIds: string[]) => {
    if (!confirmingShift) return;

    setOpStatus('loading');
    setOpMessage('저장 중...');

    if (confirmingShift === 'PERIODIC') {
       if (!selectedPeriodicId) return;
       const targetItem = config.periodicItems.find(i => i.id === selectedPeriodicId);
       if (!targetItem) return;

       // Resolve performer names for periodic item
       const performerNames = staffIds.map(id => staff.find(s => s.id === id)?.name).filter(Boolean).join(', ');

       const checklistData: PtRoomChecklistItem[] = [{
         id: targetItem.id,
         label: `${targetItem.label} (정기)`,
         checked: true,
         performedBy: performerNames || undefined
       }];
       await logPtRoomAction('PERIODIC', checklistData, staffIds);
       await updatePeriodicItemDate(selectedPeriodicId, new Date().toISOString());
       await loadConfig();
       
       setOpStatus('success');
       setOpMessage('완료 처리됨');
       setSelectedPeriodicId(null);
       loadLogs();
       setTimeout(() => setOpStatus('idle'), 1000);
       return;
    }

    const currentList = confirmingShift === 'MORNING' ? morningList : confirmingShift === 'DAILY' ? dailyList : eveningList;
    
    const checklistData: PtRoomChecklistItem[] = currentList.map(item => ({
      id: item.id, 
      label: item.label,
      checked: item.checked,
      performedBy: item.performedBy // Keep existing performers
    }));

    const res = await logPtRoomAction(confirmingShift, checklistData, staffIds);

    if (res.success) {
      setOpStatus('success');
      setOpMessage('저장 완료');
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
    alert("SQL 코드가 클립보드에 복사되었습니다.");
  };

  const getTodayLog = (shift: PtRoomShift) => {
    if (activeTab !== 'status') return null;
    const shiftLogs = logs
      .filter(l => l.shiftType === shift)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return shiftLogs.length > 0 ? shiftLogs[0] : null;
  };

  const filteredLogs = useMemo(() => {
    if (typeFilter === 'ALL') return logs;
    return logs.filter(l => l.shiftType === typeFilter);
  }, [logs, typeFilter]);

  const groupedLogs = useMemo(() => {
    const groups: { date: string; items: PtRoomLog[] }[] = [];
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

  // Stats Logic omitted for brevity (unchanged)
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
    const getLeader = (type: PtRoomShift) => {
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

  const calculateStatus = (item: PtPeriodicItem) => {
    if (!item.lastCompleted) return { status: 'danger', label: '기록 없음', diff: -999 };
    const last = new Date(item.lastCompleted);
    const today = new Date();
    last.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    const passed = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    const remaining = item.interval - passed;
    
    if (passed === 0) return { status: 'today', label: '오늘 완료', diff: 0 };
    if (remaining < 0) return { status: 'danger', label: `${Math.abs(remaining)}일 초과`, diff: remaining };
    if (remaining <= 3) return { status: 'warning', label: `${remaining}일 남음`, diff: remaining };
    return { status: 'success', label: `${remaining}일 남음`, diff: remaining };
  };

  const renderPeriodicList = () => {
    const sortedItems = [...config.periodicItems].sort((a, b) => calculateStatus(a).diff - calculateStatus(b).diff);
    return (
      <div className="flex flex-col h-auto min-h-[500px] rounded-2xl border-2 border-purple-100 dark:border-purple-900/30 bg-purple-50/30 dark:bg-purple-900/10 overflow-hidden">
         <div className="p-4 border-b border-purple-100 dark:border-purple-900/30 bg-purple-50/50 dark:bg-purple-900/20 flex justify-between items-center">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold">
               <CalendarRange size={20} />
               <span>정기 점검 항목</span>
            </div>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 px-2 py-1 rounded-full">
               총 {sortedItems.length}개
            </span>
         </div>
         <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-3">
            {sortedItems.map(item => {
               const { status, label } = calculateStatus(item);
               const isToday = status === 'today';
               return (
                  <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2">
                     <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100">{item.label}</h4>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                           status === 'danger' ? 'bg-red-100 text-red-600' :
                           status === 'warning' ? 'bg-orange-100 text-orange-600' :
                           status === 'today' ? 'bg-blue-100 text-blue-600' :
                           'bg-slate-100 text-slate-500'
                        }`}>{label}</span>
                     </div>
                     <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-slate-500">주기: {item.interval}일</span>
                        <button
                           onClick={() => handlePeriodicClick(item.id)}
                           disabled={isToday}
                           className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isToday ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm active:scale-95'
                           }`}
                        >
                           {isToday ? <RefreshCw size={14} /> : <RefreshCw size={14} />}
                           {isToday ? '완료됨' : '점검 완료'}
                        </button>
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-4 md:p-6 pb-6 overflow-hidden">
      <StatusOverlay status={opStatus} message={opMessage} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-300 dark:border-slate-700">
            <Stethoscope className="text-emerald-600" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">물리치료실 관리</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">치료실 환경 및 기기를 점검합니다.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
           {activeTab === 'status' && (
             <button
                onClick={() => setIsConfigOpen(true)}
                className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                title="점검 목록 설정"
             >
                <Settings size={20} />
             </button>
           )}
           <div className="bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex">
              <button onClick={() => setActiveTab('status')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'status' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                <LayoutGrid size={16} /> 점검 체크
              </button>
              <button onClick={() => setActiveTab('history')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
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
                 <span className="font-bold text-sm flex items-center gap-2"><AlertCircle size={16} /> DB 테이블(pt_room_logs)이 필요합니다.</span>
                 <button onClick={handleCopySQL} className="text-xs bg-amber-200 px-3 py-1 rounded-lg font-bold flex items-center gap-1"><Copy size={12} /> SQL 복사</button>
              </div>
           )}
           
           <MobileTabSelector 
             activeTab={mobileSubTab}
             onTabChange={setMobileSubTab}
             tabs={[
               { value: 'MORNING', label: '아침', icon: <Sun size={16}/>, activeColorClass: 'bg-amber-100 text-amber-700' },
               { value: 'DAILY', label: '일상', icon: <Clock size={16}/>, activeColorClass: 'bg-blue-100 text-blue-700' },
               { value: 'EVENING', label: '저녁', icon: <Sun size={16}/>, activeColorClass: 'bg-indigo-100 text-indigo-700' },
               { value: 'PERIODIC', label: '정기', icon: <CalendarRange size={16}/>, activeColorClass: 'bg-purple-100 text-purple-700' }
             ]}
           />

           {/* Cards Container */}
           <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
               <div className={`${mobileSubTab === 'MORNING' ? 'block' : 'hidden md:block'} h-full`}>
                 <GenericChecklistCard 
                   title="아침 점검"
                   icon={<Sun className="text-amber-500" />}
                   items={morningList}
                   onToggle={(id) => toggleCheck('MORNING', id)}
                   onSave={() => handleSaveClick('MORNING')}
                   onAdd={() => handleAddItemClick('MORNING')}
                   onDelete={(id) => deleteItemFromShift('MORNING', id)}
                   theme="border-amber-200 dark:border-amber-800"
                   staff={staff}
                   lastLog={getTodayLog('MORNING')}
                 />
               </div>
               <div className={`${mobileSubTab === 'DAILY' ? 'block' : 'hidden md:block'} h-full`}>
                 <GenericChecklistCard 
                   title="일상 점검"
                   icon={<Clock className="text-blue-500" />}
                   items={dailyList}
                   onToggle={(id) => toggleCheck('DAILY', id)}
                   onSave={() => handleSaveClick('DAILY')}
                   onAdd={() => handleAddItemClick('DAILY')}
                   onDelete={(id) => deleteItemFromShift('DAILY', id)}
                   theme="border-blue-200 dark:border-blue-800"
                   staff={staff}
                   lastLog={getTodayLog('DAILY')}
                 />
               </div>
               <div className={`${mobileSubTab === 'EVENING' ? 'block' : 'hidden md:block'} h-full`}>
                 <GenericChecklistCard 
                   title="저녁 점검"
                   icon={<Sun className="text-indigo-500" />}
                   items={eveningList}
                   onToggle={(id) => toggleCheck('EVENING', id)}
                   onSave={() => handleSaveClick('EVENING')}
                   onAdd={() => handleAddItemClick('EVENING')}
                   onDelete={(id) => deleteItemFromShift('EVENING', id)}
                   theme="border-indigo-200 dark:border-indigo-800"
                   staff={staff}
                   lastLog={getTodayLog('EVENING')}
                 />
               </div>
               <div className={`${mobileSubTab === 'PERIODIC' ? 'block' : 'hidden md:block'} h-full`}>
                  {renderPeriodicList()}
               </div>
             </div>
           </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-4 animate-fade-in">
           {/* Stats */}
           <div className="w-full md:w-80 shrink-0 h-64 md:h-full order-1">
              <PtRoomStats stats={stats} shiftLeaders={shiftLeaders} loading={loading} />
           </div>
           {/* Logs List */}
           <div className="flex-1 overflow-y-auto custom-scrollbar order-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
              <div className="flex justify-between items-center mb-4">
                 <DateNavigator currentDate={currentDate} viewMode={viewMode} onNavigate={() => {}} />
              </div>
              <div className="space-y-6">
                 {groupedLogs.map(g => (
                    <div key={g.date}>
                        <div className="font-bold mb-2">{g.date}</div>
                        {g.items.map(l => (
                            <div key={l.id} className="p-2 border rounded mb-2">{l.shiftType} - {new Date(l.createdAt).toLocaleTimeString()}</div>
                        ))}
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* 1. Modal for Saving existing list (Manual Save) */}
      <StaffSelectionModal
        isOpen={confirmingShift !== null}
        onClose={() => setConfirmingShift(null)}
        onConfirm={handleConfirmSave}
        staff={staff}
        title="점검 완료"
        message="작업을 수행한 직원을 선택해주세요."
        confirmLabel="저장 완료"
      />

      {/* 2. Modal for Adding New Item (Config + Selection) */}
      <ItemSelectorModal
        isOpen={addModeShift !== null}
        onClose={() => setAddModeShift(null)}
        title="항목 추가 / 관리"
        items={
            addModeShift === 'MORNING' ? config.morningItems : 
            addModeShift === 'DAILY' ? config.dailyItems : 
            config.eveningItems
        }
        onConfirm={handleItemsSelected}
        onUpdateCatalog={(newItems) => addModeShift && handleUpdateCatalog(addModeShift, newItems)}
      />

      {/* 3. Modal for Staff Select AFTER Item Add (Immediate Save) */}
      <StaffSelectionModal
        isOpen={!!pendingAddItems}
        onClose={() => setPendingAddItems(null)}
        onConfirm={handleConfirmAddWithStaff}
        staff={staff}
        title="수행 직원 선택"
        message="추가한 항목을 수행한 직원을 선택하세요. (즉시 저장됨)"
        confirmLabel="추가 및 저장"
      />

      {/* Config Modal */}
      {isConfigOpen && (
        <PtRoomConfigModal 
          config={config} 
          onClose={() => setIsConfigOpen(false)}
          onSave={handleSaveConfig}
        />
      )}
    </div>
  );
};

export default PtRoomManager;
