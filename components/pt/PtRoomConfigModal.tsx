import React, { useState } from 'react';
import { PtRoomConfig } from '../../types';
import { X, Save, Sun, Moon, Clock, CalendarRange, Trash2, Plus } from 'lucide-react';
import ConfigListEditor from '../common/ConfigListEditor';

interface PtRoomConfigModalProps {
  config: PtRoomConfig;
  onSave: (config: PtRoomConfig) => void;
  onClose: () => void;
}

const PtRoomConfigModal: React.FC<PtRoomConfigModalProps> = ({ config, onSave, onClose }) => {
  const [localConfig, setLocalConfig] = useState<PtRoomConfig>(config);
  const [activeTab, setActiveTab] = useState<'morning' | 'daily' | 'evening' | 'periodic'>('morning');

  // Helper to get the key for the current tab
  const getListKey = () => {
    switch (activeTab) {
      case 'morning': return 'morningItems';
      case 'daily': return 'dailyItems';
      case 'evening': return 'eveningItems';
      case 'periodic': return 'periodicItems';
    }
  };

  const currentListKey = getListKey();
  
  // -- CRUD Handlers for Regular Lists --
  const handleAddItem = (text: string) => {
    const newItem = { id: Date.now().toString(), label: text };
    setLocalConfig(prev => ({
      ...prev,
      [currentListKey]: [...(prev[currentListKey] as any[] || []), newItem]
    }));
  };

  const handleUpdateItem = (id: string, newLabel: string) => {
    setLocalConfig(prev => ({
      ...prev,
      [currentListKey]: (prev[currentListKey] as any[] || []).map(item => 
        item.id === id ? { ...item, label: newLabel } : item
      )
    }));
  };

  const handleDeleteItem = (id: string) => {
    setLocalConfig(prev => ({
      ...prev,
      [currentListKey]: (prev[currentListKey] as any[] || []).filter(item => item.id !== id)
    }));
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const newList = [...(localConfig[currentListKey] as any[])];
    if (direction === 'up') {
      if (index === 0) return;
      [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    } else {
      if (index === newList.length - 1) return;
      [newList[index + 1], newList[index]] = [newList[index], newList[index + 1]];
    }
    setLocalConfig(prev => ({ ...prev, [currentListKey]: newList }));
  };

  // -- Special Handlers for Periodic Items (With Interval) --
  const [periodicForm, setPeriodicForm] = useState({ label: '', interval: 30 });

  const handleAddPeriodic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodicForm.label.trim()) return;
    
    const newItem = {
      id: Date.now().toString(),
      label: periodicForm.label,
      interval: periodicForm.interval,
      lastCompleted: undefined // New item has no history
    };

    setLocalConfig(prev => ({
      ...prev,
      periodicItems: [...prev.periodicItems, newItem]
    }));
    setPeriodicForm({ label: '', interval: 30 });
  };

  const handleDeletePeriodic = (id: string) => {
    setLocalConfig(prev => ({
      ...prev,
      periodicItems: prev.periodicItems.filter(item => item.id !== id)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950 shrink-0">
           <h3 className="font-bold text-slate-800 dark:text-slate-100">물리치료실 업무 설정</h3>
           <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0 overflow-x-auto custom-scrollbar">
           <button
             onClick={() => setActiveTab('morning')}
             className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
               activeTab === 'morning' 
                 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                 : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
             }`}
           >
             <Sun size={14} /> 아침
           </button>
           <button
             onClick={() => setActiveTab('daily')}
             className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
               activeTab === 'daily' 
                 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                 : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
             }`}
           >
             <Clock size={14} /> 일상
           </button>
           <button
             onClick={() => setActiveTab('evening')}
             className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
               activeTab === 'evening' 
                 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' 
                 : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
             }`}
           >
             <Moon size={14} /> 저녁
           </button>
           <button
             onClick={() => setActiveTab('periodic')}
             className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
               activeTab === 'periodic' 
                 ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' 
                 : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
             }`}
           >
             <CalendarRange size={14} /> 정기
           </button>
        </div>
        
        {/* Editor Content */}
        <div className="flex-1 overflow-hidden min-h-[300px]">
          {activeTab === 'periodic' ? (
            <div className="flex flex-col h-full">
               <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50 space-y-2">
                  {localConfig.periodicItems.map((item) => (
                    <div key={item.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center">
                       <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.label}</p>
                          <p className="text-xs text-slate-500">주기: <span className="text-purple-600 font-bold">{item.interval}일</span></p>
                       </div>
                       <button onClick={() => handleDeletePeriodic(item.id)} className="text-slate-400 hover:text-red-500 p-2">
                          <Trash2 size={16} />
                       </button>
                    </div>
                  ))}
                  {localConfig.periodicItems.length === 0 && (
                    <div className="text-center text-slate-400 text-xs py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      등록된 정기 업무가 없습니다.
                    </div>
                  )}
               </div>
               
               {/* Add Form for Periodic */}
               <form onSubmit={handleAddPeriodic} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2 shrink-0">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={periodicForm.label} 
                      onChange={(e) => setPeriodicForm({...periodicForm, label: e.target.value})}
                      placeholder="업무 내용 입력"
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-blue-500 dark:text-slate-200"
                    />
                    <div className="flex items-center gap-1 w-24">
                       <input 
                         type="number" 
                         min="1" max="365"
                         value={periodicForm.interval}
                         onChange={(e) => setPeriodicForm({...periodicForm, interval: parseInt(e.target.value) || 1})}
                         className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-center outline-none focus:border-blue-500 dark:text-slate-200 font-bold"
                       />
                       <span className="text-xs text-slate-500 whitespace-nowrap">일</span>
                    </div>
                  </div>
                  <button 
                    type="submit"
                    disabled={!periodicForm.label.trim()}
                    className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm font-bold text-sm flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> 항목 추가
                  </button>
               </form>
            </div>
          ) : (
            <ConfigListEditor 
              items={localConfig[currentListKey] as any[]}
              onAdd={handleAddItem}
              onUpdate={handleUpdateItem}
              onDelete={handleDeleteItem}
              onMove={handleMoveItem}
              placeholder={`${activeTab === 'morning' ? '아침' : activeTab === 'daily' ? '일상' : '저녁'} 업무 추가...`}
            />
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shrink-0">
           <button 
             onClick={() => onSave(localConfig)}
             className="w-full py-3 bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors shadow-sm flex items-center justify-center gap-2"
           >
             <Save size={18} /> 저장 완료
           </button>
        </div>
      </div>
    </div>
  );
};

export default PtRoomConfigModal;
