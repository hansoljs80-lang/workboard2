import React, { useState } from 'react';
import { ShockwaveConfig } from '../../types';
import { X, Plus, Trash2, Save, Sun, Moon } from 'lucide-react';

interface ShockwaveConfigModalProps {
  config: ShockwaveConfig;
  onSave: (config: ShockwaveConfig) => void;
  onClose: () => void;
}

const ShockwaveConfigModal: React.FC<ShockwaveConfigModalProps> = ({ config, onSave, onClose }) => {
  const [localConfig, setLocalConfig] = useState<ShockwaveConfig>(config);
  const [activeTab, setActiveTab] = useState<'morning' | 'evening'>('morning');
  const [newItemText, setNewItemText] = useState('');

  const currentList = activeTab === 'morning' ? localConfig.morningItems : localConfig.eveningItems;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    const newItem = {
      id: Date.now().toString(), // Simple ID generation
      label: newItemText.trim()
    };

    if (activeTab === 'morning') {
      setLocalConfig(prev => ({
        ...prev,
        morningItems: [...prev.morningItems, newItem]
      }));
    } else {
      setLocalConfig(prev => ({
        ...prev,
        eveningItems: [...prev.eveningItems, newItem]
      }));
    }
    setNewItemText('');
  };

  const handleDeleteItem = (id: string) => {
    if (activeTab === 'morning') {
      setLocalConfig(prev => ({
        ...prev,
        morningItems: prev.morningItems.filter(item => item.id !== id)
      }));
    } else {
      setLocalConfig(prev => ({
        ...prev,
        eveningItems: prev.eveningItems.filter(item => item.id !== id)
      }));
    }
  };

  const handleUpdateItem = (id: string, newLabel: string) => {
    if (activeTab === 'morning') {
      setLocalConfig(prev => ({
        ...prev,
        morningItems: prev.morningItems.map(item => item.id === id ? { ...item, label: newLabel } : item)
      }));
    } else {
      setLocalConfig(prev => ({
        ...prev,
        eveningItems: prev.eveningItems.map(item => item.id === id ? { ...item, label: newLabel } : item)
      }));
    }
  };

  const handleSave = () => {
    onSave(localConfig);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
           <h3 className="font-bold text-slate-800 dark:text-slate-100">충격파실 업무 목록 설정</h3>
           <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
           <button
             onClick={() => setActiveTab('morning')}
             className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
               activeTab === 'morning' 
                 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                 : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
             }`}
           >
             <Sun size={16} /> 아침 업무
           </button>
           <button
             onClick={() => setActiveTab('evening')}
             className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
               activeTab === 'evening' 
                 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' 
                 : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
             }`}
           >
             <Moon size={16} /> 저녁 업무
           </button>
        </div>
        
        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50">
           <ul className="space-y-2">
             {currentList.map(item => (
               <li key={item.id} className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm group">
                 <input 
                   type="text" 
                   value={item.label}
                   onChange={(e) => handleUpdateItem(item.id, e.target.value)}
                   className="flex-1 text-sm bg-transparent outline-none text-slate-700 dark:text-slate-200 font-medium"
                 />
                 <button 
                   onClick={() => handleDeleteItem(item.id)}
                   className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                   title="삭제"
                 >
                   <Trash2 size={16} />
                 </button>
               </li>
             ))}
             {currentList.length === 0 && (
                <li className="text-center text-slate-400 text-xs py-4">등록된 업무가 없습니다.</li>
             )}
           </ul>
        </div>

        {/* Add Item Form */}
        <form onSubmit={handleAddItem} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2">
           <input 
             type="text" 
             value={newItemText} 
             onChange={(e) => setNewItemText(e.target.value)}
             placeholder="새로운 업무 추가..."
             className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-blue-500 dark:text-slate-200"
           />
           <button 
             type="submit"
             disabled={!newItemText.trim()}
             className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             <Plus size={20} />
           </button>
        </form>

        {/* Action Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
           <button 
             onClick={handleSave}
             className="w-full py-3 bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors shadow-sm flex items-center justify-center gap-2"
           >
             <Save size={18} /> 저장 완료
           </button>
        </div>
      </div>
    </div>
  );
};

export default ShockwaveConfigModal;