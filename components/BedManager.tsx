import React, { useState, useMemo } from 'react';
import { Staff, Task } from '../types';
import BedCard from './BedCard';
import BedConfigModal from './BedConfigModal';
import BedChangeModal from './BedChangeModal';
import BedHistory from './BedHistory';
import StatusOverlay from './StatusOverlay';
import { BedDouble, Settings, LayoutGrid, History } from 'lucide-react';
import { useBedData } from '../hooks/useBedData';
import { getNextRoutineDate } from '../utils/bedUtils';

interface BedManagerProps {
  staff: Staff[];
  tasks: Task[]; // Added to access current board state
  settings: Record<string, any>;
  onRefresh: () => void;
  onNavigateToBoard: () => void;
}

type TabMode = 'status' | 'history';

const BedManager: React.FC<BedManagerProps> = ({ staff, tasks, settings, onRefresh, onNavigateToBoard }) => {
  const [activeTab, setActiveTab] = useState<TabMode>('status');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [changeModalBedId, setChangeModalBedId] = useState<number | null>(null);
  
  // Use Custom Hook for Logic
  const { 
    beds, 
    config, 
    opStatus, 
    opMessage, 
    handleBedChange, 
    updateBedName,
    updateConfig 
  } = useBedData(settings, tasks, onRefresh);

  const weekDayName = ['일', '월', '화', '수', '목', '금', '토'][config.routineDay];
  
  // Calculate next routine date string
  const nextDateDisplay = useMemo(() => {
    const nextDate = getNextRoutineDate(config.routineDay);
    const today = new Date();
    const isToday = nextDate.getDate() === today.getDate() && nextDate.getMonth() === today.getMonth();
    
    const dateStr = nextDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    return isToday ? `${dateStr} (오늘)` : dateStr;
  }, [config.routineDay]);

  const targetBedName = useMemo(() => {
    if (changeModalBedId === null) return '';
    return beds.find(b => b.id === changeModalBedId)?.name || '';
  }, [changeModalBedId, beds]);

  return (
    <div className="p-4 md:p-6 w-full h-full overflow-y-auto pb-24 relative bg-slate-50 dark:bg-slate-950 flex flex-col">
      <StatusOverlay status={opStatus} message={opMessage} />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-300 dark:border-slate-700">
            <BedDouble className="text-emerald-600" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">배드 커버 관리</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
               {activeTab === 'status' ? (
                 <>총 {config.count}개 • {config.interval}일 주기 <span className="hidden md:inline">| 다음: {nextDateDisplay}</span></>
               ) : (
                 <>교체 이력 및 통계</>
               )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Main Tab Switcher */}
          <div className="bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex">
             <button
               onClick={() => setActiveTab('status')}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'status' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
             >
               <LayoutGrid size={16} /> 현황
             </button>
             <button
               onClick={() => setActiveTab('history')}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
             >
               <History size={16} /> 이력
             </button>
          </div>
        </div>
      </div>
      
      {/* STATUS VIEW */}
      {activeTab === 'status' && (
        <>
          {/* Action Toolbar */}
          <div className="flex justify-end gap-2 mb-4 shrink-0">
             <button 
                onClick={() => setIsConfigOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
             >
               <Settings size={18} />
               <span className="hidden md:inline">설정</span>
             </button>
          </div>

          {/* Bed Grid Layout */}
          <div 
            className="grid gap-4 flex-1 overflow-y-auto pb-4"
            style={{ 
              gridTemplateColumns: `repeat(auto-fit, minmax(160px, 1fr))`,
            }}
          >
            {/* Dynamic Column Style Injection for Desktop */}
            <style>{`
              @media (min-width: 1024px) {
                .bed-grid {
                   grid-template-columns: repeat(${config.cols}, 1fr) !important;
                }
              }
            `}</style>

            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-${config.cols} gap-4 bed-grid content-start`}>
              {beds.map(bed => (
                <BedCard 
                  key={bed.id} 
                  bed={bed}
                  staff={staff}
                  interval={config.interval}
                  onChange={() => setChangeModalBedId(bed.id)}
                  onNameChange={updateBedName}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* HISTORY VIEW */}
      {activeTab === 'history' && (
         <div className="flex-1 overflow-hidden">
            <BedHistory staff={staff} />
         </div>
      )}

      {/* Configuration Modal */}
      {isConfigOpen && (
        <BedConfigModal 
          config={config} 
          onSave={(newConfig) => {
            updateConfig(newConfig);
            setIsConfigOpen(false);
          }} 
          onClose={() => setIsConfigOpen(false)} 
        />
      )}

      {/* Bed Change Confirmation Modal */}
      <BedChangeModal 
        isOpen={changeModalBedId !== null}
        bedName={targetBedName}
        staff={staff}
        onClose={() => setChangeModalBedId(null)}
        onConfirm={(staffIds) => {
           if (changeModalBedId !== null) {
              handleBedChange(changeModalBedId, staffIds);
           }
        }}
      />
    </div>
  );
};

export default BedManager;