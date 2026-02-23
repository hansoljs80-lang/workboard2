
import React, { useState, useEffect } from 'react';
import { AlignLeft, ListTodo, Plus, GripVertical, X } from 'lucide-react';
import { hasChecklist } from '../../utils/checklistUtils';

interface DescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const DescriptionInput: React.FC<DescriptionInputProps> = ({ value, onChange, placeholder }) => {
  const [mode, setMode] = useState<'text' | 'checklist'>('text');
  
  // Checklist State
  const [items, setItems] = useState<string[]>([]);
  const [newItemInput, setNewItemInput] = useState('');

  // Sync external value to internal state when switching modes or initial load
  useEffect(() => {
    if (hasChecklist(value)) {
      setMode('checklist');
      const parsedItems = value.split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('- [ ]') || line.startsWith('- [x]'))
        .map(line => line.replace(/^- \[[ x]\] /, ''));
      setItems(parsedItems);
    } else {
      // Keep text mode if it's just text, but don't force it if user is interacting
      // We rely on the initial parse. If parent updates value (e.g. clear), we reflect it.
      if (!value) setItems([]);
    }
  }, []); // Run once on mount to detect type, specific updates handled below

  // Helper to update parent string based on items
  const updateParentChecklist = (newItems: string[]) => {
    setItems(newItems);
    const stringValue = newItems.map(item => `- [ ] ${item}`).join('\n');
    onChange(stringValue);
  };

  const handleAddChecklistItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (newItemInput.trim()) {
      const newItems = [...items, newItemInput.trim()];
      updateParentChecklist(newItems);
      setNewItemInput('');
    }
  };

  const removeChecklistItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    updateParentChecklist(newItems);
  };

  const handleModeChange = (newMode: 'text' | 'checklist') => {
    if (newMode === mode) return;
    setMode(newMode);

    if (newMode === 'checklist') {
      // Text -> Checklist: Split by lines
      const lines = value.split('\n').map(l => l.trim()).filter(l => l);
      updateParentChecklist(lines);
    } else {
      // Checklist -> Text: Just keep the raw value (which is already formatted)
      // or stripping markup? Let's keep raw to avoid data loss, 
      // but maybe strip "- [ ] " for better UX? 
      // User decision: let's keep it clean.
      // Actually, passing the current formatted string is fine.
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-bold text-slate-600 dark:text-slate-400">상세 내용 / 체크리스트</label>
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
           <button
             type="button"
             onClick={() => handleModeChange('text')}
             className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition-all ${mode === 'text' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500'}`}
           >
             <AlignLeft size={14} /> 텍스트
           </button>
           <button
             type="button"
             onClick={() => handleModeChange('checklist')}
             className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition-all ${mode === 'checklist' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500'}`}
           >
             <ListTodo size={14} /> 체크리스트
           </button>
        </div>
      </div>

      {mode === 'text' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none h-48 transition-shadow text-slate-900 dark:text-slate-100"
          placeholder={placeholder || "내용을 입력하세요."}
        />
      ) : (
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden min-h-[12rem]">
           <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex gap-2">
              <input 
                type="text"
                value={newItemInput}
                onChange={(e) => setNewItemInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem(e)}
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100"
                placeholder="할 일 항목 입력 후 엔터..."
              />
              <button 
                type="button"
                onClick={() => handleAddChecklistItem()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg font-bold text-sm transition-colors"
              >
                <Plus size={18} />
              </button>
           </div>
           <div className="p-2 space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
              {items.length === 0 && (
                 <p className="text-center text-slate-400 dark:text-slate-500 text-sm py-8">
                   등록된 항목이 없습니다.<br/>위 입력창에 내용을 입력하고 추가해주세요.
                 </p>
              )}
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-700 animate-fade-in group">
                   <GripVertical size={14} className="text-slate-300 cursor-move" />
                   <div className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 shrink-0"></div>
                   <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">{item}</span>
                   <button 
                     type="button"
                     onClick={() => removeChecklistItem(idx)}
                     className="text-slate-300 hover:text-red-500 transition-colors p-1"
                   >
                     <X size={16} />
                   </button>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default DescriptionInput;
