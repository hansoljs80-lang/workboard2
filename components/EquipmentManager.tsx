
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Monitor, Search, Plus, Filter, AlertCircle, Copy, History, LayoutGrid, Database, Activity } from 'lucide-react';
import { Equipment, Staff, EquipmentAction } from '../types';
import { fetchEquipments, deleteEquipment, updateEquipment, addEquipment, logEquipmentAction, fetchEquipmentLogs } from '../services/equipmentService';
import StatusOverlay, { OperationStatus } from './StatusOverlay';
import EquipmentCard from './equipment/EquipmentCard';
import EquipmentFormModal from './equipment/EquipmentFormModal';
import StaffSelectionModal from './common/StaffSelectionModal';
import GenericHistoryView, { GenericLog, HistoryTabOption } from './common/GenericHistoryView';
import { SUPABASE_SCHEMA_SQL } from '../constants/supabaseSchema';
import { useDebounce } from '../hooks/useDebounce';

interface EquipmentManagerProps {
  staff?: Staff[];
}

// Helper for change description
const generateChangeLog = (oldItem: Equipment | null, newItem: Partial<Equipment> | null, action: EquipmentAction): string => {
  if (action === 'CREATE') return '신규 장비 등록';
  if (action === 'DELETE') return '장비 삭제';
  if (action === 'COUNT' && oldItem && newItem) {
    return `수량 변경: ${oldItem.count} -> ${newItem.count}`;
  }
  if (action === 'UPDATE' && oldItem && newItem) {
    const changes = [];
    if (newItem.name && oldItem.name !== newItem.name) changes.push(`이름: ${oldItem.name} -> ${newItem.name}`);
    if (newItem.count !== undefined && oldItem.count !== newItem.count) changes.push(`수량: ${oldItem.count} -> ${newItem.count}`);
    if (newItem.note !== undefined && oldItem.note !== newItem.note) changes.push('메모/비고 수정');
    if (newItem.category !== undefined && oldItem.category !== newItem.category) changes.push('분류 변경');
    if (newItem.vendorName !== undefined && oldItem.vendorName !== newItem.vendorName) changes.push('업체명 변경');
    if (changes.length === 0) return '정보 수정';
    return changes.join(', ');
  }
  return '변경 사항 있음';
};

const EquipmentManager: React.FC<EquipmentManagerProps> = ({ staff = [] }) => {
  const [activeTab, setActiveTab] = useState<'status' | 'history'>('status');
  const [items, setItems] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [opStatus, setOpStatus] = useState<OperationStatus>('idle');
  const [opMessage, setOpMessage] = useState('');

  // History State
  const [historyLogs, setHistoryLogs] = useState<GenericLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);

  // Pending Action State
  const [pendingAction, setPendingAction] = useState<{
    type: EquipmentAction;
    data: any;
    targetItem?: Equipment;
  } | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    const res = await fetchEquipments();
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

  const handleLoadHistory = useCallback(async (start: Date, end: Date) => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const res = await fetchEquipmentLogs(start, end);
      if (res.success && res.data) {
        const genericLogs: GenericLog[] = res.data.map(log => ({
          id: log.id,
          shiftType: log.actionType,
          checklist: [{ id: '1', label: `${log.itemName} (${log.changes})`, checked: true }],
          performedBy: log.performedBy,
          createdAt: log.createdAt
        }));
        setHistoryLogs(genericLogs);
      } else {
        if (res.message?.includes('does not exist')) {
           setHistoryError('DATA_TABLE_MISSING');
        } else {
           setHistoryError(res.message || '로그 로드 실패');
        }
      }
    } catch (e) {
      setHistoryError('오류 발생');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    alert("SQL 코드가 복사되었습니다.");
  };

  // -- Action Triggers --

  const handleAddClick = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (item: Equipment) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    if (!window.confirm('정말 이 장비를 삭제하시겠습니까? (이력은 보존됩니다)')) return;
    
    setPendingAction({
      type: 'DELETE',
      data: { id },
      targetItem: item
    });
  };

  const handleCountChange = (id: string, newCount: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    setPendingAction({
      type: 'COUNT',
      data: { id, count: newCount },
      targetItem: item
    });
  };

  const handleFormSubmit = (data: Omit<Equipment, 'id' | 'updatedAt'>) => {
    setIsModalOpen(false);
    setPendingAction({
      type: editingItem ? 'UPDATE' : 'CREATE',
      data: data,
      targetItem: editingItem || undefined
    });
  };

  // -- Action Execution --

  const handleConfirmAction = async (staffIds: string[]) => {
    if (!pendingAction) return;

    setOpStatus('loading');
    setOpMessage('저장 중...');

    const { type, data, targetItem } = pendingAction;
    let success = false;
    let changeDescription = '';
    let itemName = targetItem?.name || data.name || '알 수 없음';

    try {
      if (type === 'CREATE') {
        const res = await addEquipment(data);
        if (!res.success) throw new Error(res.message);
        changeDescription = generateChangeLog(null, data, 'CREATE');
        itemName = data.name;
        success = true;
      }
      else if (type === 'UPDATE' && targetItem) {
        const res = await updateEquipment(targetItem.id, data);
        if (!res.success) throw new Error(res.message);
        changeDescription = generateChangeLog(targetItem, data, 'UPDATE');
        success = true;
      }
      else if (type === 'DELETE' && targetItem) {
        const res = await deleteEquipment(data.id);
        if (!res.success) throw new Error(res.message);
        changeDescription = generateChangeLog(targetItem, null, 'DELETE');
        success = true;
      }
      else if (type === 'COUNT' && targetItem) {
        const res = await updateEquipment(data.id, { count: data.count });
        if (!res.success) throw new Error(res.message);
        changeDescription = generateChangeLog(targetItem, { ...targetItem, count: data.count }, 'COUNT');
        success = true;
      }

      if (success) {
        await logEquipmentAction(itemName, type, changeDescription, staffIds);
        setOpStatus('success');
        setOpMessage('완료되었습니다.');
        loadData();
      }
    } catch (e: any) {
      console.error(e);
      setOpStatus('error');
      setOpMessage(e.message || '오류가 발생했습니다.');
    } finally {
      setPendingAction(null);
      setTimeout(() => setOpStatus('idle'), 1000);
    }
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

  const historyTabs: HistoryTabOption[] = [
    { id: 'CREATE', label: '등록', icon: <Plus size={14} />, colorClass: 'text-green-600' },
    { id: 'UPDATE', label: '수정', icon: <Database size={14} />, colorClass: 'text-blue-600' },
    { id: 'COUNT', label: '수량', icon: <Activity size={14} />, colorClass: 'text-orange-600' },
    { id: 'DELETE', label: '삭제', icon: <AlertCircle size={14} />, colorClass: 'text-red-600' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-4 md:p-6 pb-6 overflow-hidden">
      <StatusOverlay status={opStatus} message={opMessage} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-300 dark:border-slate-700">
            <Monitor className="text-cyan-600" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">장비 관리</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">보유 장비 현황 및 유지보수 업체 관리</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
           {/* Tab Switcher */}
           <div className="bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex">
              <button 
                onClick={() => setActiveTab('status')} 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'status' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                <LayoutGrid size={16} /> 현황
              </button>
              <button 
                onClick={() => setActiveTab('history')} 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                <History size={16} /> 변경 이력
              </button>
           </div>

           {activeTab === 'status' && (
             <button 
               onClick={handleAddClick}
               className="flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-xl font-bold shadow-md hover:bg-slate-700 transition-all active:scale-95"
             >
               <Plus size={20} />
               <span className="hidden md:inline">장비 등록</span>
             </button>
           )}
        </div>
      </div>

      {activeTab === 'status' ? (
        <>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 mb-4 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="장비명 또는 업체 검색..."
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none text-slate-900 dark:text-slate-100"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat as string)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                    categoryFilter === cat 
                      ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm' 
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
                  <p className="text-sm mb-4">장비 관리를 위해 DB 업데이트가 필요합니다.</p>
                  <button onClick={handleCopySQL} className="px-4 py-2 bg-amber-200 dark:bg-amber-800 text-amber-900 rounded-lg font-bold flex items-center gap-2">
                    <Copy size={16} /> SQL 코드 복사
                  </button>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <Monitor size={48} className="mb-3 opacity-20" />
                  <p>
                    {debouncedSearchQuery ? '검색 결과가 없습니다.' : '등록된 장비가 없습니다.'}
                  </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredItems.map(item => (
                    <EquipmentCard 
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
        </>
      ) : (
        <div className="flex-1 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm animate-fade-in">
           <GenericHistoryView
             staff={staff}
             logs={historyLogs}
             tabs={historyTabs}
             onLoadLogs={handleLoadHistory}
             loading={historyLoading}
             error={historyError === 'DATA_TABLE_MISSING' ? 'DB 테이블(equipment_logs)이 필요합니다.' : historyError}
             title="장비 변경 이력"
           />
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <EquipmentFormModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleFormSubmit}
          initialData={editingItem}
          categories={categories.filter(c => c !== 'ALL') as string[]}
        />
      )}

      {/* Staff Select Modal */}
      <StaffSelectionModal
        isOpen={!!pendingAction}
        onClose={() => setPendingAction(null)}
        onConfirm={handleConfirmAction}
        staff={staff}
        title="담당자 확인"
        message={
           pendingAction?.type === 'DELETE' ? '삭제를 수행한 직원을 선택하세요.' :
           pendingAction?.type === 'CREATE' ? '신규 등록한 직원을 선택하세요.' :
           pendingAction?.type === 'COUNT' ? '수량을 변경한 직원을 선택하세요.' :
           '정보를 수정한 직원을 선택하세요.'
        }
        confirmLabel="저장 완료"
      />
    </div>
  );
};

export default EquipmentManager;
