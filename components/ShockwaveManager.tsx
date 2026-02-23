
import React, { useState, useEffect, useCallback } from 'react';
import { Staff, ShockwaveShift, ShockwaveLog, ShockwaveChecklistItem, ShockwaveConfig } from '../types';
import { Activity, Sun, Moon, LayoutGrid, History, Settings, AlertCircle, Copy, Filter, Clock } from 'lucide-react';
import StatusOverlay, { OperationStatus } from './StatusOverlay';
import StaffSelectionModal from './common/StaffSelectionModal';
import { fetchShockwaveLogs, logShockwaveAction, getShockwaveConfig, saveShockwaveConfig } from '../services/shockwaveService';
import AvatarStack from './common/AvatarStack';
import ShockwaveConfigModal from './shockwave/ShockwaveConfigModal';
import { SUPABASE_SCHEMA_SQL } from '../constants/supabaseSchema';
import GenericChecklistCard, { RuntimeChecklistItem } from './common/GenericChecklistCard';
import MobileTabSelector from './common/MobileTabSelector';
import ItemSelectorModal from './common/ItemSelectorModal';
import GenericHistoryView, { GenericLog, HistoryTabOption } from './common/GenericHistoryView';

interface ShockwaveManagerProps {
  staff: Staff[];
}

type TabMode = 'status' | 'history';
type SubTab = 'MORNING' | 'DAILY' | 'EVENING';

const ShockwaveManager: React.FC<ShockwaveManagerProps> = ({ staff }) => {
  const [activeTab, setActiveTab] = useState<TabMode>('status');
  const [mobileSubTab, setMobileSubTab] = useState<SubTab>('MORNING');
  const [opStatus, setOpStatus] = useState<OperationStatus>('idle');
  const [opMessage, setOpMessage] = useState('');

  // Config State
  const [config, setConfig] = useState<ShockwaveConfig>({ morningItems: [], dailyItems: [], eveningItems: [] });
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Runtime Checklist State
  const [morningList, setMorningList] = useState<RuntimeChecklistItem[]>([]);
  const [dailyList, setDailyList] = useState<RuntimeChecklistItem[]>([]);
  const [eveningList, setEveningList] = useState<RuntimeChecklistItem[]>([]);
  
  // Add Modal State
  const [addModeShift, setAddModeShift] = useState<ShockwaveShift | null>(null);
  const [pendingAddItems, setPendingAddItems] = useState<{shift: ShockwaveShift, items: {id: string, label: string}[]} | null>(null);

  // Save Modal State
  const [confirmingShift, setConfirmingShift] = useState<ShockwaveShift | null>(null);

  // History Data
  const [logs, setLogs] = useState<ShockwaveLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  // Load Config
  const loadConfig = useCallback(async () => {
    const cfg = await getShockwaveConfig();
    setConfig(cfg);
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Load Recent Logs for Today Status
  const loadTodayLogs = useCallback(async () => {
    if (activeTab !== 'status') return;
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(); end.setHours(23,59,59,999);
    
    const res = await fetchShockwaveLogs(start, end);
    if (res.success && res.data) {
        setLogs(res.data);
    }
  }, [activeTab]);

  useEffect(() => {
    loadTodayLogs();
  }, [loadTodayLogs]);

  // Handler for GenericHistoryView to load data
  const handleLoadHistory = async (start: Date, end: Date) => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const res = await fetchShockwaveLogs(start, end);
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

  // Init Lists (Today)
  useEffect(() => {
    if (activeTab !== 'status') return;

    const initList = (shift: ShockwaveShift, setList: React.Dispatch<React.SetStateAction<RuntimeChecklistItem[]>>) => {
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

  // ... (Keep existing handlers for Save/Config/Add - no changes needed there) ...
  const handleSaveConfig = async (newConfig: ShockwaveConfig) => {
    setConfig(newConfig);
    setIsConfigOpen(false);
    await saveShockwaveConfig(newConfig);
  };

  const handleUpdateCatalog = async (shift: ShockwaveShift, newItems: {id: string, label: string}[]) => {
      const newConfig = { ...config };
      if (shift === 'MORNING') newConfig.morningItems = newItems;
      else if (shift === 'DAILY') newConfig.dailyItems = newItems;
      else if (shift === 'EVENING') newConfig.eveningItems = newItems;
      setConfig(newConfig);
      await saveShockwaveConfig(newConfig);
  };

  const toggleCheck = (shift: ShockwaveShift, id: string) => {
    const update = (prev: RuntimeChecklistItem[]) => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item);
    if (shift === 'MORNING') setMorningList(update);
    else if (shift === 'DAILY') setDailyList(update);
    else setEveningList(update);
  };

  const addItemToShift = (shift: ShockwaveShift, itemsToAdd: {id: string, label: string}[]) => {
    const newItems = itemsToAdd.map(i => ({
        id: `added_${shift}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        label: i.label,
        checked: false,
        originalId: i.id
    }));
    if (shift === 'MORNING') setMorningList(prev => [...prev, ...newItems]);
    else if (shift === 'DAILY') setDailyList(prev => [...prev, ...newItems]);
    else setEveningList(prev => [...prev, ...newItems]);
  };

  const deleteItemFromShift = (shift: ShockwaveShift, id: string) => {
    const filter = (prev: RuntimeChecklistItem[]) => prev.filter(item => item.id !== id);
    if (shift === 'MORNING') setMorningList(filter);
    else if (shift === 'DAILY') setDailyList(filter);
    else setEveningList(filter);
  };

  const handleSaveClick = (shift: ShockwaveShift) => {
    const list = shift === 'MORNING' ? morningList : shift === 'DAILY' ? dailyList : eveningList;
    if (list.filter(i => i.checked).length === 0) {
      if(!window.confirm("체크된 항목이 없습니다. 그래도 저장하시겠습니까?")) return;
    }
    setConfirmingShift(shift);
  };

  const handleAddItemClick = (shift: ShockwaveShift) => {
    setAddModeShift(shift);
  };

  const handleItemsSelected = (items: {id: string, label: string}[]) => {
    if (addModeShift && items.length > 0) {
        setPendingAddItems({ shift: addModeShift, items });
        setAddModeShift(null); 
    } else {
        setAddModeShift(null);
    }
  };

  const handleConfirmAddWithStaff = async (staffIds: string[]) => {
    if (!pendingAddItems) return;
    setOpStatus('loading');
    setOpMessage('항목 추가 및 저장 중...');
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

    const checklistData: ShockwaveChecklistItem[] = updatedList.map(item => ({
      id: item.id, label: item.label, checked: item.checked, performedBy: item.performedBy
    }));

    const res = await logShockwaveAction(shift, checklistData, staffIds);
    if (res.success) {
      setOpStatus('success'); setOpMessage('추가 및 완료 처리됨'); loadTodayLogs();
    } else {
      setOpStatus('error'); setOpMessage('저장 실패'); alert(res.message);
    }
    setPendingAddItems(null); setTimeout(() => setOpStatus('idle'), 1000);
  };

  const handleConfirmSave = async (staffIds: string[]) => {
    if (!confirmingShift) return;
    setOpStatus('loading'); setOpMessage('저장 중...');
    const currentList = confirmingShift === 'MORNING' ? morningList : confirmingShift === 'DAILY' ? dailyList : eveningList;
    const checklistData: ShockwaveChecklistItem[] = currentList.map(item => ({
      id: item.id, label: item.label, checked: item.checked, performedBy: item.performedBy
    }));
    const res = await logShockwaveAction(confirmingShift, checklistData, staffIds);
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

  const getTodayLog = (shift: ShockwaveShift) => {
    if (activeTab !== 'status') return null;
    const shiftLogs = logs.filter(l => l.shiftType === shift)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return shiftLogs.length > 0 ? shiftLogs[0] : null;
  };

  // Convert generic logs for view
  const historyTabs: HistoryTabOption[] = [
    { id: 'MORNING', label: '아침', icon: <Sun size={14} />, colorClass: 'text-amber-600' },
    { id: 'DAILY', label: '일상', icon: <Clock size={14} />, colorClass: 'text-blue-600' },
    { id: 'EVENING', label: '저녁', icon: <Moon size={14} />, colorClass: 'text-indigo-600' }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-4 md:p-6 pb-6 overflow-hidden">
      <StatusOverlay status={opStatus} message={opMessage} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-300 dark:border-slate-700">
            <Activity className="text-pink-600" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">충격파실 관리</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">매일 정기 업무를 확인하고 기록합니다.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
           {activeTab === 'status' && (
             <button onClick={() => setIsConfigOpen(true)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                <Settings size={20} />
             </button>
           )}
           <div className="bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex">
              <button onClick={() => setActiveTab('status')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'status' ? 'bg-pink-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}><LayoutGrid size={16} /> 업무 체크</button>
              <button onClick={() => setActiveTab('history')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-pink-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}><History size={16} /> 이력/통계</button>
           </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'status' ? (
        <div className="flex-1 overflow-hidden flex flex-col">
           {/* ... SQL missing alert logic same as before ... */}
           {historyError === 'DATA_TABLE_MISSING' && (
              <div className="mb-4 bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-200 flex flex-col md:flex-row items-center justify-center gap-3 shrink-0">
                 <span className="font-bold text-sm flex items-center gap-2"><AlertCircle size={16} /> DB 테이블 필요</span>
                 <button onClick={handleCopySQL} className="text-xs bg-amber-200 px-3 py-1 rounded-lg font-bold">SQL 복사</button>
              </div>
           )}
           
           <MobileTabSelector 
             activeTab={mobileSubTab}
             onTabChange={setMobileSubTab}
             tabs={[
               { value: 'MORNING', label: '아침', icon: <Sun size={16}/>, activeColorClass: 'bg-amber-100 text-amber-700' },
               { value: 'DAILY', label: '일상', icon: <Clock size={16}/>, activeColorClass: 'bg-blue-100 text-blue-700' },
               { value: 'EVENING', label: '저녁', icon: <Moon size={16}/>, activeColorClass: 'bg-indigo-100 text-indigo-700' }
             ]}
           />

           <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
               {/* Morning */}
               <div className={`${mobileSubTab === 'MORNING' ? 'block' : 'hidden md:block'} h-full`}>
                 <GenericChecklistCard 
                   title="아침 업무"
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
               {/* Daily */}
               <div className={`${mobileSubTab === 'DAILY' ? 'block' : 'hidden md:block'} h-full`}>
                 <GenericChecklistCard 
                   title="일상 업무"
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
               {/* Evening */}
               <div className={`${mobileSubTab === 'EVENING' ? 'block' : 'hidden md:block'} h-full`}>
                 <GenericChecklistCard 
                   title="저녁 업무"
                   icon={<Moon className="text-indigo-500" />}
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
             title="충격파실 관리 이력"
           />
        </div>
      )}

      {/* Staff Select Manual Save */}
      <StaffSelectionModal
        isOpen={confirmingShift !== null}
        onClose={() => setConfirmingShift(null)}
        onConfirm={handleConfirmSave}
        staff={staff}
        title="업무 완료"
        confirmLabel="저장 완료"
      />

      {/* Staff Select for Add Item */}
      <StaffSelectionModal
        isOpen={!!pendingAddItems}
        onClose={() => setPendingAddItems(null)}
        onConfirm={handleConfirmAddWithStaff}
        staff={staff}
        title="수행 직원 선택"
        message="추가한 항목을 수행한 직원을 선택하세요."
        confirmLabel="추가 및 저장"
      />

      {isConfigOpen && (
        <ShockwaveConfigModal 
          config={config} 
          onClose={() => setIsConfigOpen(false)}
          onSave={handleSaveConfig}
        />
      )}

      {/* Add Item Modal */}
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
    </div>
  );
};

export default ShockwaveManager;
