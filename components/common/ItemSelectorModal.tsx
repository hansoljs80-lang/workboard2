
import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Trash2, Pencil, Save } from 'lucide-react';

interface CatalogItem {
  id: string;
  label: string;
}

interface ItemSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: CatalogItem[];
  onConfirm: (selectedItems: CatalogItem[]) => void;
  onUpdateCatalog?: (newItems: CatalogItem[]) => void; // Callback to update master list
}

const ItemSelectorModal: React.FC<ItemSelectorModalProps> = ({
  isOpen,
  onClose,
  title,
  items,
  onConfirm,
  onUpdateCatalog
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedIds([]);
      setNewItemText('');
      setEditingId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSelection = (id: string) => {
    if (editingId) return; // Prevent selection while editing
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    const selectedItems = items.filter(item => selectedIds.includes(item.id));
    onConfirm(selectedItems);
    onClose();
  };

  // --- CRUD Operations ---

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim() || !onUpdateCatalog) return;

    const newItem: CatalogItem = {
      id: Date.now().toString(),
      label: newItemText.trim()
    };

    onUpdateCatalog([...items, newItem]);
    setNewItemText('');
    // Auto-select the newly created item
    setSelectedIds(prev => [...prev, newItem.id]);
  };

  const handleDeleteItem = (id: string) => {
    if (!onUpdateCatalog) return;
    if (window.confirm('이 항목을 목록에서 완전히 삭제하시겠습니까?')) {
      onUpdateCatalog(items.filter(i => i.id !== id));
      setSelectedIds(prev => prev.filter(pid => pid !== id));
    }
  };

  const startEditing = (item: CatalogItem) => {
    setEditingId(item.id);
    setEditText(item.label);
  };

  const saveEditing = () => {
    if (!onUpdateCatalog || !editingId) return;
    if (!editText.trim()) {
        setEditingId(null);
        return;
    }

    const newItems = items.map(item => 
      item.id === editingId ? { ...item, label: editText.trim() } : item
    );
    onUpdateCatalog(newItems);
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950 shrink-0">
           <div>
             <h3 className="font-bold text-slate-800 dark:text-slate-100">{title}</h3>
             <p className="text-xs text-slate-500 dark:text-slate-400">목록에서 선택하거나 새로 추가하세요.</p>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
             <X size={20} />
           </button>
        </div>

        {/* Add New Input */}
        {onUpdateCatalog && (
          <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <form onSubmit={handleAddItem} className="flex gap-2">
              <input 
                type="text" 
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="새 업무 내용 입력..."
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-blue-500 dark:text-slate-100"
              />
              <button 
                type="submit"
                disabled={!newItemText.trim()}
                className="bg-blue-600 text-white rounded-lg px-3 hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Plus size={20} />
              </button>
            </form>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
           {items.length === 0 ? (
             <div className="text-center text-slate-400 text-sm py-8">
               등록된 항목이 없습니다.<br/>위 입력창에서 추가해주세요.
             </div>
           ) : (
             <div className="grid gap-2">
               {items.map(item => {
                 const isSelected = selectedIds.includes(item.id);
                 const isEditingThis = editingId === item.id;

                 return (
                   <div
                     key={item.id}
                     className={`
                       flex items-center gap-2 p-2 rounded-xl border transition-all group
                       ${isSelected 
                         ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 ring-1 ring-blue-500' 
                         : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}
                     `}
                   >
                     {/* Checkbox Area */}
                     <button
                        onClick={() => toggleSelection(item.id)}
                        className="flex-1 flex items-center gap-3 text-left overflow-hidden py-1"
                        disabled={!!editingId}
                     >
                        <div className={`
                            w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors
                            ${isSelected 
                                ? 'bg-blue-500 border-blue-500 text-white' 
                                : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600'}
                        `}>
                            {isSelected && <Check size={14} />}
                        </div>
                        
                        {isEditingThis ? (
                            <input 
                                autoFocus
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full bg-transparent border-b border-blue-500 outline-none text-sm font-bold text-slate-800 dark:text-slate-100"
                            />
                        ) : (
                            <span className={`text-sm font-medium truncate ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                {item.label}
                            </span>
                        )}
                     </button>

                     {/* Action Buttons */}
                     {onUpdateCatalog && (
                         <div className="flex items-center gap-1 shrink-0">
                             {isEditingThis ? (
                                <button 
                                    onClick={saveEditing}
                                    className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg"
                                >
                                    <Save size={14} />
                                </button>
                             ) : (
                                <>
                                    <button 
                                        onClick={() => startEditing(item)}
                                        className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </>
                             )}
                         </div>
                     )}
                   </div>
                 );
               })}
             </div>
           )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0 flex gap-3">
           <button 
             onClick={onClose}
             className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors text-sm"
           >
             취소
           </button>
           <button 
             onClick={handleConfirm}
             disabled={selectedIds.length === 0}
             className="flex-[2] py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95 text-sm disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
           >
             <Plus size={16} />
             {selectedIds.length}개 리스트에 추가
           </button>
        </div>
      </div>
    </div>
  );
};

export default ItemSelectorModal;
