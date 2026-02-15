
import React, { useState, useEffect, useMemo } from 'react';
import { Package, Search, Plus, Filter, AlertCircle, Copy, Phone } from 'lucide-react';
import { Consumable } from '../types';
import { fetchConsumables, deleteConsumable, updateConsumable } from '../services/consumableService';
import StatusOverlay, { OperationStatus } from './StatusOverlay';
import ConsumableCard from './consumables/ConsumableCard';
import ConsumableFormModal from './consumables/ConsumableFormModal';
import { SUPABASE_SCHEMA_SQL } from '../constants/supabaseSchema';
import { useDebounce } from '../hooks/useDebounce';

const ConsumablesManager: React.FC = () => {
  const [items, setItems] = useState<Consumable[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [opStatus, setOpStatus] = useState<OperationStatus>('idle');
  const [opMessage, setOpMessage] = useState('');

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  // Use debounced value for actual filtering to improve performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Consumable | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    const res = await fetchConsumables();
    if (res.success && res.data) {
      setItems(res.data);
    } else {
      if (res.message?.includes('does not exist')) {
        setError('DATA_TABLE_MISSING');
      } else {
        setError(res.message || '불러오기 실패');
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    alert("SQL 코드가 복사되었습니다.");
  };

  const handleAddClick = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (item: Consumable) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    
    setOpStatus('loading');
    setOpMessage('삭제 중...');
    const res = await deleteConsumable(id);
    if (res.success) {
      setOpStatus('success');
      setOpMessage('삭제 완료');
      loadData();
    } else {
      setOpStatus('error');
      setOpMessage('삭제 실패');
    }
    setTimeout(() => setOpStatus('idle'), 1000);
  };

  const handleCountChange = async (id: string, newCount: number) => {
    // Optimistic Update
    setItems(prev => prev.map(i => i.id === id ? { ...i, count: newCount } : i));
    
    // Silent API Call
    try {
      await updateConsumable(id, { count: newCount });
    } catch (e) {
      console.error(e);
      // Revert on failure (simplified)
      loadData();
    }
  };

  const handleFormSuccess = () => {
    loadData();
    setIsModalOpen(false);
  };

  // Filter Logic
  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category).filter(Boolean));
    return ['ALL', ...Array.from(cats)];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const query = debouncedSearchQuery.toLowerCase();
      const matchSearch = item.name.toLowerCase().includes(query) || 
                          (item.vendorName && item.vendorName.toLowerCase().includes(query));
      const matchCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [items, debouncedSearchQuery, categoryFilter]);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-4 md:p-6 pb-6 overflow-hidden">
      <StatusOverlay status={opStatus} message={opMessage} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-300 dark:border-slate-700">
            <Package className="text-orange-500" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">소모품 관리</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">비품 재고 파악 및 발주처 관리</p>
          </div>
        </div>

        <button 
          onClick={handleAddClick}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-xl font-bold shadow-md hover:bg-orange-700 transition-all active:scale-95 self-start md:self-auto"
        >
          <Plus size={20} />
          <span className="hidden md:inline">항목 추가</span>
          <span className="md:hidden">추가</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-4 shrink-0">
        <div className="relative flex-1">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
           <input 
             type="text" 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             placeholder="품명 또는 거래처 검색..."
             className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-slate-900 dark:text-slate-100"
           />
        </div>
        
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
           {categories.map(cat => (
             <button
               key={cat}
               onClick={() => setCategoryFilter(cat as string)}
               className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                 categoryFilter === cat 
                   ? 'bg-orange-600 text-white border-orange-600 shadow-sm' 
                   : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
               }`}
             >
               {cat === 'ALL' ? '전체 분류' : cat}
             </button>
           ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
        {error === 'DATA_TABLE_MISSING' ? (
           <div className="flex flex-col items-center justify-center h-64 text-amber-600 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 p-6 text-center">
              <AlertCircle size={48} className="mb-3 opacity-50" />
              <h3 className="font-bold text-lg mb-2">테이블이 없습니다</h3>
              <p className="text-sm mb-4">소모품 관리를 위해 DB 업데이트가 필요합니다.</p>
              <button onClick={handleCopySQL} className="px-4 py-2 bg-amber-200 dark:bg-amber-800 text-amber-900 rounded-lg font-bold flex items-center gap-2">
                <Copy size={16} /> SQL 코드 복사
              </button>
           </div>
        ) : filteredItems.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Package size={48} className="mb-3 opacity-20" />
              <p>
                {debouncedSearchQuery ? '검색 결과가 없습니다.' : '등록된 소모품이 없습니다.'}
              </p>
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map(item => (
                <ConsumableCard 
                  key={item.id} 
                  item={item} 
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                  onCountChange={handleCountChange}
                />
              ))}
           </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <ConsumableFormModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleFormSuccess}
          initialData={editingItem}
          categories={categories.filter(c => c !== 'ALL') as string[]}
        />
      )}
    </div>
  );
};

export default ConsumablesManager;
