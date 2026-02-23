
import React, { useState, useEffect, useCallback } from 'react';
import { Staff, PtRoomShift, PtRoomLog, PtRoomChecklistItem, PtRoomConfig, PtPeriodicItem } from '../types';
import { Stethoscope, Sun, Clock, LayoutGrid, History, Settings, CalendarRange, AlertCircle, Copy, Moon, RefreshCw, Plus } from 'lucide-react';
import StatusOverlay, { OperationStatus } from './StatusOverlay';
import StaffSelectionModal from './common/StaffSelectionModal';
import { fetchPtRoomLogs, logPtRoomAction, getPtRoomConfig, savePtRoomConfig, updatePeriodicItemDate } from '../services/ptRoomService';
import PtRoomConfigModal from './pt/PtRoomConfigModal';
import { SUPABASE_SCHEMA_SQL } from '../constants/supabaseSchema';
import GenericChecklistCard, { RuntimeChecklistItem } from './common/GenericChecklistCard';
import MobileTabSelector from './common/MobileTabSelector';
import ItemSelectorModal from './common/ItemSelectorModal';
import GenericHistoryView, { GenericLog, HistoryTabOption } from './common/GenericHistoryView';

interface PtRoomManagerProps {
  staff: Staff[];
}

type TabMode = 'status' | 'history';
type SubTab = 'MORNING' | 'DAILY' | 'EVENING' | 'PERIODIC';

const PtRoomManager: React.FC<PtRoomManagerProps> = ({ staff }) => {
  const [activeTab, setActiveTab] = useState<TabMode>('status');
  const [mobileSubTab, setMobileSubTab] = useState<SubTab>('MORNING'); 
  const [opStatus, setOpStatus] = useState<OperationStatus>('idle');
  const [opMessage, setOpMessage] = useState('');

  // Config State
  const [config, setConfig] = useState<PtRoomConfig>({ morningItems: [], dailyItems: [], eveningItems: [], periodicItems: [] });
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Runtime Checklist State
  const [morningList, setMorningList] = useState<RuntimeChecklistItem[]>([]);
  const [dailyList, setDailyList] = useState<RuntimeChecklistItem[]>([]);
  const [eveningList, setEveningList] = useState<RuntimeChecklistItem[]>([]);
  
  // Add Item Flow State
  const [addModeShift, setAddModeShift] = useState<PtRoomShift | null>(null);
  const [pendingAddItems, setPendingAddItems] = useState<{shift: PtRoomShift, items: {id: string, label: string}[]} | null>(null);

  // Completion/Save Flow State
  const [selectedPeriodicId, setSelectedPeriodicId] = useState<string | null>(null);
  const [confirmingShift, setConfirmingShift] = useState<PtRoomShift | null>(null);

  // History Data
  const [logs, setLogs] = useState<PtRoomLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  // Load Config
  const loadConfig = useCallback(async () => {
    const cfg = await getPtRoomConfig();
    setConfig(cfg);
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Load Logs for Status
  const loadTodayLogs = useCallback(async () => {
    if (activeTab !== 'status') return;
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(); end.setHours(23,59,59,999);
    
    const res = await fetchPtRoomLogs(start, end);
    if (res.success && res.data) {
        setLogs(res.data);
    }
  }, [activeTab]);

  useEffect(() => {
    loadTodayLogs();
  }, [loadTodayLogs]);

  const handleLoadHistory = async (start: Date, end: Date) => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const res = await fetchPtRoomLogs(start, end);
      if (res.success && res.data) {
        setLogs(res.data);
      } else {
        setHistoryError(res.message || '데이터 로드 실패');
      }
    } catch (e) {
      setHistoryError('오류 발생');
    } finally {
      setHistoryLoading(false);
    }
  };

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
                performedBy: item.performedBy
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


  // ... (Keep existing handlers for Save/Config/Add/Periodic - unchanged) ...
  const handleSaveConfig = async (newConfig: PtRoomConfig) => {
    setConfig(newConfig);
    setIsConfigOpen(false);
    await savePtRoomConfig(newConfig);
  };

  const handleUpdateCatalog = async (shift: PtRoomShift, newItems: {id: string, label: string}[]) => {
      const newConfig = { ...config };
      if (shift === 'MORNING') {
        newConfig.morningItems = newItems;
      } else if (shift === 'DAILY') {
        newConfig.dailyItems = newItems;
      } else if (shift === 'EVENING') {
        newConfig.eveningItems = newItems;
      } else if (shift === 'PERIODIC') {
        // Special handling for periodic items to preserve interval/history
        const updatedPeriodicItems: PtPeriodicItem[] = newItems.map(newItem => {
          const existing = config.periodicItems.find(p => p.id === newItem.id);
          if (existing) {
            // Update label, keep interval & history
            return { ...existing, label: newItem.label };
          } else {
            // New item, default interval 30
            return { 
              id: newItem.id, 
              label: newItem.label, 
              interval: 30, 
              lastCompleted: undefined 
            };
          }
        });
        newConfig.periodicItems = updatedPeriodicItems;
      }
      
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

  const handleSaveClick = (shift: PtRoomShift) => {
    const list = shift === 'MORNING' ? morningList : shift === 'DAILY' ? dailyList : eveningList;
    if (list.filter(i => i.checked).length === 0) {
      if(!window.confirm("체크된 항목이 없습니다. 그래도 저장하시겠습니까?")) return;
    }
    setConfirmingShift(shift);
  };

  const handleAddItemClick = (shift: PtRoomShift) => {
    setAddModeShift(shift);
  };

  const handleItemsSelected = (items: {id: string, label: string}[]) => {
    if (addModeShift && items.length > 0) {
        // Periodic items are added to config directly via handleUpdateCatalog callback in ItemSelectorModal.
        // For other shifts, we add them to the runtime list here.
        if (addModeShift !== 'PERIODIC') {
            setPendingAddItems({ shift: addModeShift, items });
        }
        setAddModeShift(null);
    } else {
        setAddModeShift(null);
    }
  };

  const handleConfirmAddWithStaff = async (staffIds: string[]) => {
    if (!pendingAddItems) return;
    setOpStatus('loading'); setOpMessage('항목 추가 및 저장 중...');
    const { shift, items } = pendingAddItems;
    const performerNames = staffIds.map(id => staff.find(s => s.id === id)?.name).filter(Boolean).join(', ');
    const newRuntimeItems: RuntimeChecklistItem[] = items.map(i => ({
        id: `added_${shift}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        label: i.label,
        checked: true,
        originalId: i.id,
        performedBy: performerNames || undefined
    }));

    let currentList: RuntimeChecklistItem[] = [];
    if (shift === 'MORNING') currentList = morningList;
    else if (shift === 'DAILY') currentList = dailyList;
    else currentList = eveningList;

    const updatedList = [...currentList, ...newRuntimeItems];
    if (shift === 'MORNING') setMorningList(updatedList);
    else if (shift === 'DAILY') setDailyList(updatedList);
    else setEveningList(updatedList);

    const checklistData: PtRoomChecklistItem[] = updatedList.map(item => ({
      id: item.id, label: item.label, checked: item.checked, performedBy: item.performedBy
    }));

    const res = await logPtRoomAction(shift, checklistData, staffIds);
    if (res.success) {
        setOpStatus('success'); setOpMessage('추가 및 완료 처리됨'); loadTodayLogs();
    } else {
        setOpStatus('error'); setOpMessage('저장 실패'); alert(res.message);
    }
    setPendingAddItems(null); setTimeout(() => setOpStatus('idle'), 1000);
  };

  const handlePeriodicClick = (itemId: string) => {
    setSelectedPeriodicId(itemId);
    setConfirmingShift('PERIODIC');
  };

  const handleConfirmSave = async (staffIds: string[]) => {
    if (!confirmingShift) return;
    setOpStatus('loading'); setOpMessage('저장 중...');

    if (confirmingShift === 'PERIODIC') {
       if (!selectedPeriodicId) return;
       const targetItem = config.periodicItems.find(i => i.id === selectedPeriodicId);
       if (!targetItem) return;
       const performerNames = staffIds.map(id => staff.find(s => s.id === id)?.name).filter(Boolean).join(', ');
       const checklistData: PtRoomChecklistItem[] = [{
         id: targetItem.id, label: `${targetItem.label} (정기)`, checked: true, performedBy: performerNames || undefined
       }];
       await logPtRoomAction('PERIODIC', checklistData, staffIds);
       await updatePeriodicItemDate(selectedPeriodicId, new Date().toISOString());
       await loadConfig();
       setOpStatus('success'); setOpMessage('완료 처리됨'); setSelectedPeriodicId(null); loadTodayLogs();
       setTimeout(() => setOpStatus('idle'), 1000);
       return;
    }

    const currentList = confirmingShift === 'MORNING' ? morningList : confirmingShift === 'DAILY' ? dailyList : eveningList;
    const checklistData: PtRoomChecklistItem[] = currentList.map(item => ({
      id: item.id, label: item.label, checked: item.checked, performedBy: item.performedBy
    }));
    const res = await logPtRoomAction(confirmingShift, checklistData, staffIds);
    if (res.success) {
      setOpStatus('success'); setOpMessage('저장 완료'); loadTodayLogs();
    } else {
      setOpStatus('error'); setOpMessage('저장 실패'); alert(res.message);
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
    // 정기 항목은 사용자가 설정한 순서대로 표시 (상태별 정렬 제거)
    const sortedItems = config.periodicItems;
    return (
      <div className="flex flex-col h-full rounded-2xl border-2 border-purple-100 dark:border-purple-900/30 bg-purple-50/30 dark:bg-purple-900/10 overflow-hidden">
         <div className="p-4 border-b border-purple-100 dark:border-purple-900/30 bg-purple-50/50 dark:bg-purple-900/20 flex justify-between items-center">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold">
               <CalendarRange size={20} />
               <span>정기 점검 항목</span>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => handleAddItemClick('PERIODIC')}
                    className="p-1 rounded-full bg-purple-100 dark:bg-purple-800 hover:bg-purple-200 dark:hover:bg-purple-700 text-purple-600 dark:text-purple-300 transition-colors"
                    title="항목 추가/순서변경"
                >
                    <Settings size={14} />
                </button>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 px-2 py-1 rounded-full">
                총 {sortedItems.length}개
                </span>
            </div>
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
            {sortedItems.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs opacity-60 gap-2">
                    <span>등록된 정기 업무가 없습니다.</span>
                    <button onClick={() => handleAddItemClick('PERIODIC')} className="text-purple-500 font-bold hover:underline">항목 추가하기</button>
                </div>
            )}
         </div>
      </div>
    );
  };

  const historyTabs: HistoryTabOption[] = [
    { id: 'MORNING', label: '아침', icon: <Sun size={14} />, colorClass: 'text-amber-600' },
    { id: 'DAILY', label: '일상', icon: <Clock size={14} />, colorClass: 'text-blue-600' },
    { id: 'EVENING', label: '저녁', icon: <Moon size={14} />, colorClass: 'text-indigo-600' },
    { id: 'PERIODIC', label: '정기', icon: <CalendarRange size={14} />, colorClass: 'text-purple-600' }
  ];

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
           {/* ... existing code ... */}
           {mobileSubTab && (
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
           )}

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
        <div className="flex-1 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm animate-fade-in">
           <GenericHistoryView
             staff={staff}
             logs={logs as GenericLog[]}
             tabs={historyTabs}
             onLoadLogs={handleLoadHistory}
             loading={historyLoading}
             error={historyError}
             title="물리치료실 관리 이력"
           />
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
        title={addModeShift === 'PERIODIC' ? "정기 점검 항목 관리" : "항목 추가 / 관리"}
        items={
            addModeShift === 'MORNING' ? config.morningItems : 
            addModeShift === 'DAILY' ? config.dailyItems : 
            addModeShift === 'EVENING' ? config.eveningItems :
            config.periodicItems.map(i => ({ id: i.id, label: i.label }))
        }
        onConfirm={handleItemsSelected}
        onUpdateCatalog={(newItems) => addModeShift && handleUpdateCatalog(addModeShift, newItems)}
        confirmLabel={addModeShift === 'PERIODIC' ? "설정 완료" : undefined}
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
