import React, { useState } from 'react';
import { PtRoomConfig } from '../../types';
import { X, Save, Sun, Moon, Clock } from 'lucide-react';
import ConfigListEditor from '../common/ConfigListEditor';

interface PtRoomConfigModalProps {
  config: PtRoomConfig;
  onSave: (config: PtRoomConfig) => void;
  onClose: () => void;
}

const PtRoomConfigModal: React.FC<PtRoomConfigModalProps> = ({ config, onSave, onClose }) => {
  const [localConfig, setLocalConfig] = useState<PtRoomConfig>(config);
  const [activeTab, setActiveTab] = useState<'morning' | 'daily' | 'evening'>('morning');

  // Helper to get the key for the current tab
  const getListKey = () => {
    switch (activeTab) {
      case 'morning': return 'morningItems';
      case 'daily': return 'dailyItems';
      case 'evening': return 'eveningItems';
    }
  };

  const currentListKey = getListKey();
  const currentList = localConfig[currentListKey];

  // -- CRUD Handlers --

  const handleAddItem = (text: string) => {
    const newItem = {
      id: Date.now().toString(),
      label: text
    };
    setLocalConfig(prev => ({
      ...prev,
      [currentListKey]: [...prev[currentListKey], newItem]
    }));
  };

  const handleUpdateItem = (id: string, newLabel: string) => {
    setLocalConfig(prev => ({
      ...prev,
      [currentListKey]: prev[currentListKey].map(item => 
        item.id === id ? { ...item, label: newLabel } : item
      )
    }));
  };

  const handleDeleteItem = (id: string) => {
    setLocalConfig(prev => ({
      ...prev,
      [currentListKey]: prev[currentListKey].filter(item => item.id !== id)
    }));
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const newList = [...currentList];
    if (direction === 'up') {
      if (index === 0) return;
      [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    } else {
      if (index === newList.length - 1) return;
      [newList[index + 1], newList[index]] = [newList[index], newList[index + 1]];
    }

    setLocalConfig(prev => ({
      ...prev,
      [currentListKey]: newList
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
        <div className="flex p-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
           <button
             onClick={() => setActiveTab('morning')}
             className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
               activeTab === 'morning' 
                 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                 : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
             }`}
           >
             <Sun size={14} /> 아침
           </button>
           <button
             onClick={() => setActiveTab('daily')}
             className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
               activeTab === 'daily' 
                 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                 : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
             }`}
           >
             <Clock size={14} /> 일상
           </button>
           <button
             onClick={() => setActiveTab('evening')}
             className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
               activeTab === 'evening' 
                 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' 
                 : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
             }`}
           >
             <Moon size={14} /> 저녁
           </button>
        </div>
        
        {/* Editor Content */}
        <div className="flex-1 overflow-hidden min-h-[300px]">
          <ConfigListEditor 
            items={currentList}
            onAdd={handleAddItem}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
            onMove={handleMoveItem}
            placeholder={`${activeTab === 'morning' ? '아침' : activeTab === 'daily' ? '일상' : '저녁'} 업무 추가...`}
          />
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