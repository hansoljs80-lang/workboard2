import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Trash2, Plus, Pencil } from 'lucide-react';

export interface ConfigItem {
  id: string;
  label: string;
}

interface ConfigListEditorProps {
  items: ConfigItem[];
  onAdd: (label: string) => void;
  onUpdate: (id: string, label: string) => void;
  onDelete: (id: string) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  placeholder?: string;
  emptyMessage?: string;
}

const ConfigListEditor: React.FC<ConfigListEditorProps> = ({
  items,
  onAdd,
  onUpdate,
  onDelete,
  onMove,
  placeholder = "항목 내용을 입력하세요",
  emptyMessage = "등록된 항목이 없습니다."
}) => {
  const [newItemText, setNewItemText] = useState('');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    onAdd(newItemText.trim());
    setNewItemText('');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* List Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50">
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li 
              key={item.id} 
              className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm group hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
            >
              {/* Reorder Buttons */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button 
                  onClick={() => onMove(index, 'up')}
                  disabled={index === 0}
                  className="text-slate-300 hover:text-blue-500 disabled:opacity-20 disabled:hover:text-slate-300 transition-colors p-0.5"
                  type="button"
                >
                  <ChevronUp size={14} />
                </button>
                <button 
                  onClick={() => onMove(index, 'down')}
                  disabled={index === items.length - 1}
                  className="text-slate-300 hover:text-blue-500 disabled:opacity-20 disabled:hover:text-slate-300 transition-colors p-0.5"
                  type="button"
                >
                  <ChevronDown size={14} />
                </button>
              </div>

              {/* Editable Input */}
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={item.label}
                  onChange={(e) => onUpdate(item.id, e.target.value)}
                  className="w-full text-sm bg-transparent outline-none text-slate-700 dark:text-slate-200 font-medium border-b border-transparent focus:border-blue-500 hover:border-slate-300 py-1 transition-all placeholder:text-slate-400"
                  placeholder="내용을 입력하세요"
                />
                <Pencil size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Delete Button */}
              <button 
                onClick={() => onDelete(item.id)}
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 shrink-0"
                title="삭제"
                type="button"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
          {items.length === 0 && (
            <li className="text-center text-slate-400 text-xs py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              {emptyMessage}
            </li>
          )}
        </ul>
      </div>

      {/* Add Item Form */}
      <form onSubmit={handleAddItem} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2 shrink-0">
        <input 
          type="text" 
          value={newItemText} 
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-blue-500 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 transition-all"
        />
        <button 
          type="submit"
          disabled={!newItemText.trim()}
          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <Plus size={20} />
        </button>
      </form>
    </div>
  );
};

export default ConfigListEditor;