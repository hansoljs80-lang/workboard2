
import React, { useState, useEffect, useCallback } from 'react';
import { Staff, ChangingRoomShift, ChangingRoomLog, ChangingRoomChecklistItem, ChangingRoomConfig } from '../types';
import { DoorOpen, Sun, Coffee, Eye, LayoutGrid, History, Settings, AlertCircle, Copy } from 'lucide-react';
import StatusOverlay, { OperationStatus } from './StatusOverlay';
import StaffSelectionModal from './common/StaffSelectionModal';
import { fetchChangingRoomLogs, logChangingRoomAction, getChangingRoomConfig, saveChangingRoomConfig } from '../services/changingRoomService';
import ChangingRoomHistory from './changingRoom/ChangingRoomHistory';
import ChangingRoomConfigModal from './changingRoom/ChangingRoomConfigModal';
import ChecklistCard from './changingRoom/ChecklistCard';
import { SUPABASE_SCHEMA_SQL } from '../constants/supabaseSchema';

interface ChangingRoomManagerProps {
  staff: Staff[];
}

type TabMode = 'status' | 'history';

const ChangingRoomManager: React.FC<ChangingRoomManagerProps> = ({ staff }) => {
  const [activeTab, setActiveTab] = useState<TabMode>('status');
  const [opStatus, setOpStatus] = useState<OperationStatus>('idle');
  const [opMessage, setOpMessage] = useState('');

  // Config State
  const [config, setConfig] = useState<ChangingRoomConfig>({ morningItems: [], lunchItems: [], adhocItems: [] });
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Checklist State (Local)
  const [morningChecks, setMorningChecks] = useState<string[]>([]);
  const [lunchChecks, setLunchChecks] = useState<string[]>([]);
  const [adhocChecks, setAdhocChecks] = useState<string[]>([]);
  
  // Interaction State
  const [confirmingShift, setConfirmingShift] = useState<ChangingRoomShift | null>(null);

  // Data Logic (Today's Logs for Status View)
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

  // Load Today's Logs (Only for Status View)
  const loadTodayLogs = useCallback(async () => {
    // Only load if active tab is status to save resources
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

  // Handlers
  const handleSaveConfig = async (newConfig: ChangingRoomConfig) => {
    setConfig(newConfig);
    setIsConfigOpen(false);
    await saveChangingRoomConfig(newConfig);
  };

  const toggleCheck = (shift: ChangingRoomShift, id: string) => {
    if (shift === 'MORNING') {
      setMorningChecks(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    } else if (shift === 'LUNCH') {
      setLunchChecks(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    } else {
      setAdhocChecks(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }
  };

  const handleSaveClick = (shift: ChangingRoomShift) => {
    const checks = shift === 'MORNING' ? morningChecks : shift === 'LUNCH' ? lunchChecks : adhocChecks;
    // For adhoc, allow empty save? No, typically we want some action.
    // For Routine, empty save might mean "Checked nothing but confirmed ok"? 
    // Let's warn if empty.
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
      confirmingShift === 'LUNCH' ? config.lunchItems : 
      config.adhocItems;
    
    const checks = 
      confirmingShift === 'MORNING' ? morningChecks : 
      confirmingShift === 'LUNCH' ? lunchChecks : 
      adhocChecks;
    
    const checklistData: ChangingRoomChecklistItem[] = items.map(item => ({
      id: item.id,
      label: item.label,
      checked: checks.includes(item.id)
    }));

    const res = await logChangingRoomAction(confirmingShift, checklistData, staffIds);

    if (res.success) {
      setOpStatus('success');
      setOpMessage('저장 완료');
      // Reset checklist
      if (confirmingShift === 'MORNING') setMorningChecks([]);
      else if (confirmingShift === 'LUNCH') setLunchChecks([]);
      else setAdhocChecks([]);
      
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
    alert("SQL 코드가 클립보드에 복사되었습니다.\nSupabase 대시보드 > SQL Editor에서 실행해주세요.");
  };

  // Helper to filter logs for specific shift (sorted desc)
  const getLogsForShift = (shift: ChangingRoomShift) => {
    return todayLogs
      .filter(l => l.shiftType === shift)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

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
            <p className="text-sm text-slate-500 dark:text-slate-400">
               탈의실 청결 및 비품 상태를 점검합니다.
            </p>
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
              <button
                onClick={() => setActiveTab('status')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'status' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                <LayoutGrid size={16} /> 점검 체크
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                <History size={16} /> 이력/통계
              </button>
           </div>
        </div>
      </div>

      {activeTab === 'status' ? (
        <div className="flex-1 overflow-hidden">
           {error === 'DATA_TABLE_MISSING' && (
              <div className="mb-4 bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-200 flex flex-col md:flex-row items-center justify-center gap-3">
                 <span className="font-bold text-sm flex items-center gap-2">
                    <AlertCircle size={16} /> DB 테이블(changing_room_logs)이 필요합니다.
                 </span>
                 <button onClick={handleCopySQL} className="text-xs bg-amber-200 px-3 py-1 rounded-lg font-bold flex items-center gap-1">
                   <Copy size={12} /> SQL 복사
                 </button>
              </div>
           )}
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full overflow-y-auto pb-4 custom-scrollbar">
              <ChecklistCard
                shift="MORNING"
                title="아침 점검"
                icon={<Sun className="text-amber-500" />}
                items={config.morningItems}
                checkedState={morningChecks}
                onToggleCheck={(id) => toggleCheck('MORNING', id)}
                onSave={() => handleSaveClick('MORNING')}
                theme="border-amber-200 dark:border-amber-800"
                todayLogs={getLogsForShift('MORNING')}
                staff={staff}
              />
              <ChecklistCard
                shift="LUNCH"
                title="점심 점검"
                icon={<Coffee className="text-orange-500" />}
                items={config.lunchItems}
                checkedState={lunchChecks}
                onToggleCheck={(id) => toggleCheck('LUNCH', id)}
                onSave={() => handleSaveClick('LUNCH')}
                theme="border-orange-200 dark:border-orange-800"
                todayLogs={getLogsForShift('LUNCH')}
                staff={staff}
              />
              <ChecklistCard
                shift="ADHOC"
                title="수시 점검"
                icon={<Eye className="text-teal-500" />}
                items={config.adhocItems}
                checkedState={adhocChecks}
                onToggleCheck={(id) => toggleCheck('ADHOC', id)}
                onSave={() => handleSaveClick('ADHOC')}
                theme="border-teal-200 dark:border-teal-800"
                todayLogs={getLogsForShift('ADHOC')}
                staff={staff}
              />
           </div>
        </div>
      ) : (
        <ChangingRoomHistory staff={staff} />
      )}

      {/* Staff Selection Modal */}
      <StaffSelectionModal
        isOpen={confirmingShift !== null}
        onClose={() => setConfirmingShift(null)}
        onConfirm={handleConfirmSave}
        staff={staff}
        title={
          confirmingShift === 'MORNING' ? "아침 점검 완료" : 
          confirmingShift === 'LUNCH' ? "점심 점검 완료" : 
          "수시 점검 완료"
        }
        message="작업을 수행한 직원을 선택해주세요."
        confirmLabel="저장 완료"
      />

      {/* Config Modal */}
      {isConfigOpen && (
        <ChangingRoomConfigModal 
          config={config} 
          onClose={() => setIsConfigOpen(false)}
          onSave={handleSaveConfig}
        />
      )}
    </div>
  );
};

export default ChangingRoomManager;
