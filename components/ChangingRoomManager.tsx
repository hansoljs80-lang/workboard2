
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Staff, ChangingRoomShift, ChangingRoomLog, ChangingRoomChecklistItem, ChangingRoomConfig } from '../types';
import { DoorOpen, Sun, Coffee, Eye, LayoutGrid, History, Settings, AlertCircle, Copy } from 'lucide-react';
import StatusOverlay, { OperationStatus } from './StatusOverlay';
import StaffSelectionModal from './common/StaffSelectionModal';
import { fetchChangingRoomLogs, logChangingRoomAction, getChangingRoomConfig, saveChangingRoomConfig } from '../services/changingRoomService';
import ChangingRoomHistory from './changingRoom/ChangingRoomHistory';
import ChangingRoomConfigModal from './changingRoom/ChangingRoomConfigModal';
import ChecklistCard from './changingRoom/ChecklistCard';
import { SUPABASE_SCHEMA_SQL } from '../constants/supabaseSchema';
import MobileTabSelector from './common/MobileTabSelector';
import ItemSelectorModal from './common/ItemSelectorModal';
import { RuntimeChecklistItem } from './common/GenericChecklistCard';

interface ChangingRoomManagerProps {
  staff: Staff[];
}

type TabMode = 'status' | 'history';
type SubTab = 'MORNING' | 'LUNCH' | 'ADHOC';

const ChangingRoomManager: React.FC<ChangingRoomManagerProps> = ({ staff }) => {
  const [activeTab, setActiveTab] = useState<TabMode>('status');
  const [mobileSubTab, setMobileSubTab] = useState<SubTab>('MORNING');
  const [opStatus, setOpStatus] = useState<OperationStatus>('idle');
  const [opMessage, setOpMessage] = useState('');

  // Config State
  const [config, setConfig] = useState<ChangingRoomConfig>({ morningItems: [], lunchItems: [], adhocItems: [] });
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Runtime Checklist State
  const [morningList, setMorningList] = useState<RuntimeChecklistItem[]>([]);
  const [lunchList, setLunchList] = useState<RuntimeChecklistItem[]>([]);
  const [adhocList, setAdhocList] = useState<RuntimeChecklistItem[]>([]);
  
  const [addModeShift, setAddModeShift] = useState<ChangingRoomShift | null>(null);
  const [confirmingShift, setConfirmingShift] = useState<ChangingRoomShift | null>(null);

  // Data Logic
  const [todayLogs, setTodayLogs] = useState<ChangingRoomLog[]>([]);
  const [error, setError] = useState('');

  // Load Config
  const loadConfig = useCallback(async () => {
    const cfg = await getChangingRoomConfig();
    setConfig(cfg);
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Load Today's Logs
  const loadTodayLogs = useCallback(async () => {
    if (activeTab !== 'status') return;

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    try {
      const res = await fetchChangingRoomLogs(start, end);
      if (res.success && res.data) {
        setTodayLogs(res.data);
        setError('');
      } else {
         if (res.message?.includes('does not exist')) {
           setError('DATA_TABLE_MISSING');
         } else {
           setTodayLogs([]);
         }
      }
    } catch (e) {
      console.error(e);
    }
  }, [activeTab]);

  useEffect(() => {
    loadTodayLogs();
  }, [loadTodayLogs]);

  // Init Lists (CHANGED: Default empty if no log)
  useEffect(() => {
    if (activeTab !== 'status') return;

    const initList = (shift: ChangingRoomShift, setList: React.Dispatch<React.SetStateAction<RuntimeChecklistItem[]>>) => {
        const todayLog = todayLogs
            .filter(l => l.shiftType === shift)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        if (todayLog) {
            const restored = todayLog.checklist.map((item, idx) => ({
                id: item.id || `restored_${shift}_${idx}_${Date.now()}`,
                label: item.label,
                checked: item.checked,
                originalId: item.id
            }));
            setList(restored);
        }
    };

    initList('MORNING', setMorningList);
    initList('LUNCH', setLunchList);
    initList('ADHOC', setAdhocList);

  }, [todayLogs, activeTab]);

  // Handlers
  const handleSaveConfig = async (newConfig: ChangingRoomConfig) => {
    setConfig(newConfig);
    setIsConfigOpen(false);
    await saveChangingRoomConfig(newConfig);
  };

  const handleUpdateCatalog = async (shift: ChangingRoomShift, newItems: {id: string, label: string}[]) => {
      const newConfig = { ...config };
      if (shift === 'MORNING') newConfig.morningItems = newItems;
      else if (shift === 'LUNCH') newConfig.lunchItems = newItems;
      else if (shift === 'ADHOC') newConfig.adhocItems = newItems;
      
      setConfig(newConfig);
      await saveChangingRoomConfig(newConfig);
  };

  const toggleCheck = (shift: ChangingRoomShift, id: string) => {
    const update = (prev: RuntimeChecklistItem[]) => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item);
    if (shift === 'MORNING') setMorningList(update);
    else if (shift === 'LUNCH') setLunchList(update);
    else setAdhocList(update);
  };

  const addItemToShift = (shift: ChangingRoomShift, itemsToAdd: {id: string, label: string}[]) => {
    const newItems = itemsToAdd.map(i => ({
        id: `added_${shift}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        label: i.label,
        checked: false,
        originalId: i.id
    }));

    if (shift === 'MORNING') setMorningList(prev => [...prev, ...newItems]);
    else if (shift === 'LUNCH') setLunchList(prev => [...prev, ...newItems]);
    else setAdhocList(prev => [...prev, ...newItems]);
  };

  const deleteItemFromShift = (shift: ChangingRoomShift, id: string) => {
    const filter = (prev: RuntimeChecklistItem[]) => prev.filter(item => item.id !== id);
    if (shift === 'MORNING') setMorningList(filter);
    else if (shift === 'LUNCH') setLunchList(filter);
    else setAdhocList(filter);
  };

  const handleSaveClick = (shift: ChangingRoomShift) => {
    const list = shift === 'MORNING' ? morningList : shift === 'LUNCH' ? lunchList : adhocList;
    if (list.filter(i => i.checked).length === 0) {
      if(!window.confirm("체크된 항목이 없습니다. 그래도 저장하시겠습니까?")) return;
    }
    setConfirmingShift(shift);
  };

  const handleConfirmSave = async (staffIds: string[]) => {
    if (!confirmingShift) return;

    setOpStatus('loading');
    setOpMessage('저장 중...');

    const currentList = confirmingShift === 'MORNING' ? morningList : confirmingShift === 'LUNCH' ? lunchList : adhocList;
    const checklistData: ChangingRoomChecklistItem[] = currentList.map(item => ({
      id: item.id, 
      label: item.label,
      checked: item.checked
    }));

    const res = await logChangingRoomAction(confirmingShift, checklistData, staffIds);

    if (res.success) {
      setOpStatus('success');
      setOpMessage('저장 완료');
      loadTodayLogs();
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

  const getLogsForShift = (shift: ChangingRoomShift) => {
    return todayLogs
      .filter(l => l.shiftType === shift)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  // Card Components
  const morningCard = (
    <ChecklistCard
      shift="MORNING"
      title="아침 점검"
      icon={<Sun className="text-amber-500" />}
      items={morningList}
      onToggleCheck={(id) => toggleCheck('MORNING', id)}
      onSave={() => handleSaveClick('MORNING')}
      onAdd={() => setAddModeShift('MORNING')}
      onDelete={(id) => deleteItemFromShift('MORNING', id)}
      theme="border-amber-200 dark:border-amber-800"
      todayLogs={getLogsForShift('MORNING')}
      staff={staff}
    />
  );

  const lunchCard = (
    <ChecklistCard
      shift="LUNCH"
      title="점심 점검"
      icon={<Coffee className="text-orange-500" />}
      items={lunchList}
      onToggleCheck={(id) => toggleCheck('LUNCH', id)}
      onSave={() => handleSaveClick('LUNCH')}
      onAdd={() => setAddModeShift('LUNCH')}
      onDelete={(id) => deleteItemFromShift('LUNCH', id)}
      theme="border-orange-200 dark:border-orange-800"
      todayLogs={getLogsForShift('LUNCH')}
      staff={staff}
    />
  );

  const adhocCard = (
    <ChecklistCard
      shift="ADHOC"
      title="수시 점검"
      icon={<Eye className="text-teal-500" />}
      items={adhocList}
      onToggleCheck={(id) => toggleCheck('ADHOC', id)}
      onSave={() => handleSaveClick('ADHOC')}
      onAdd={() => setAddModeShift('ADHOC')}
      onDelete={(id) => deleteItemFromShift('ADHOC', id)}
      theme="border-teal-200 dark:border-teal-800"
      todayLogs={getLogsForShift('ADHOC')}
      staff={staff}
    />
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-4 md:p-6 pb-24 overflow-hidden">
      <StatusOverlay status={opStatus} message={opMessage} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-300 dark:border-slate-700">
            <DoorOpen className="text-teal-600" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">탈의실 관리</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">탈의실 청결 및 비품 상태를 점검합니다.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
           {activeTab === 'status' && (
             <button onClick={() => setIsConfigOpen(true)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                <Settings size={20} />
             </button>
           )}
           <div className="bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex">
              <button onClick={() => setActiveTab('status')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'status' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}><LayoutGrid size={16} /> 점검 체크</button>
              <button onClick={() => setActiveTab('history')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}><History size={16} /> 이력/통계</button>
           </div>
        </div>
      </div>

      {activeTab === 'status' ? (
        <div className="flex-1 overflow-hidden flex flex-col">
           {error === 'DATA_TABLE_MISSING' && (
              <div className="mb-4 bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-200 flex flex-col md:flex-row items-center justify-center gap-3 shrink-0">
                 <span className="font-bold text-sm flex items-center gap-2"><AlertCircle size={16} /> DB 테이블(changing_room_logs)이 필요합니다.</span>
                 <button onClick={handleCopySQL} className="text-xs bg-amber-200 px-3 py-1 rounded-lg font-bold flex items-center gap-1"><Copy size={12} /> SQL 복사</button>
              </div>
           )}
           
           <MobileTabSelector 
             activeTab={mobileSubTab}
             onTabChange={setMobileSubTab}
             tabs={[
               { value: 'MORNING', label: '아침', icon: <Sun size={16}/>, activeColorClass: 'bg-amber-100 text-amber-700' },
               { value: 'LUNCH', label: '점심', icon: <Coffee size={16}/>, activeColorClass: 'bg-orange-100 text-orange-700' },
               { value: 'ADHOC', label: '수시', icon: <Eye size={16}/>, activeColorClass: 'bg-teal-100 text-teal-700' }
             ]}
           />

           <div className="md:hidden flex-1 overflow-y-auto pb-4 custom-scrollbar">
              {mobileSubTab === 'MORNING' && morningCard}
              {mobileSubTab === 'LUNCH' && lunchCard}
              {mobileSubTab === 'ADHOC' && adhocCard}
           </div>

           <div className="hidden md:grid md:grid-cols-3 gap-4 h-full overflow-y-auto pb-4 custom-scrollbar">
              {morningCard}
              {lunchCard}
              {adhocCard}
           </div>
        </div>
      ) : (
        <ChangingRoomHistory staff={staff} />
      )}

      <StaffSelectionModal
        isOpen={confirmingShift !== null}
        onClose={() => setConfirmingShift(null)}
        onConfirm={handleConfirmSave}
        staff={staff}
        title="점검 완료"
        confirmLabel="저장 완료"
      />

      {isConfigOpen && (
        <ChangingRoomConfigModal 
          config={config} 
          onClose={() => setIsConfigOpen(false)}
          onSave={handleSaveConfig}
        />
      )}

      {/* Add Item Modal with CRUD */}
      <ItemSelectorModal
        isOpen={addModeShift !== null}
        onClose={() => setAddModeShift(null)}
        title="항목 추가 / 관리"
        items={
            addModeShift === 'MORNING' ? config.morningItems : 
            addModeShift === 'LUNCH' ? config.lunchItems : 
            config.adhocItems
        }
        onConfirm={(items) => addModeShift && addItemToShift(addModeShift, items)}
        onUpdateCatalog={(newItems) => addModeShift && handleUpdateCatalog(addModeShift, newItems)}
      />
    </div>
  );
};

export default ChangingRoomManager;
