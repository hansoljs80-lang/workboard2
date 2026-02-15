
import React, { useState, useEffect } from 'react';
import { Consumable } from '../../types';
import { X, Save, Plus } from 'lucide-react';
import { addConsumable, updateConsumable } from '../../services/consumableService';

interface ConsumableFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Consumable | null;
  categories: string[];
}

const ConsumableFormModal: React.FC<ConsumableFormModalProps> = ({ 
  isOpen, onClose, onSuccess, initialData, categories 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    count: 0,
    unit: '개',
    vendorName: '',
    vendorPhone: '',
    note: ''
  });
  const [loading, setLoading] = useState(false);

  // Suggestions for units
  const UNIT_SUGGESTIONS = ['개', 'Box', '통', 'EA', 'Set', '권', 'Box (대)', 'Box (소)'];

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        category: initialData.category || '',
        count: initialData.count,
        unit: initialData.unit,
        vendorName: initialData.vendorName || '',
        vendorPhone: initialData.vendorPhone || '',
        note: initialData.note || ''
      });
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      if (initialData) {
        await updateConsumable(initialData.id, formData);
      } else {
        await addConsumable(formData);
      }
      onSuccess();
    } catch (e) {
      alert('저장 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950 shrink-0">
           <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
             {initialData ? '소모품 수정' : '소모품 등록'}
           </h3>
           <button onClick={onClose}><X size={24} className="text-slate-400 hover:text-slate-600" /></button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
           
           {/* Name & Category */}
           <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                 <label className="block text-xs font-bold text-slate-500 mb-1">품명 (필수)</label>
                 <input 
                   type="text" 
                   required
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                   className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold"
                   placeholder="예: 초음파 겔"
                 />
              </div>
              <div className="col-span-2 md:col-span-1">
                 <label className="block text-xs font-bold text-slate-500 mb-1">분류</label>
                 <input 
                   list="category-options"
                   value={formData.category}
                   onChange={e => setFormData({...formData, category: e.target.value})}
                   className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                   placeholder="선택 또는 입력"
                 />
                 <datalist id="category-options">
                    {categories.map(c => <option key={c} value={c} />)}
                 </datalist>
              </div>
           </div>

           {/* Count & Unit */}
           <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
              <label className="block text-xs font-bold text-slate-500 mb-2">재고 수량 설정</label>
              <div className="flex gap-2 items-center">
                 <input 
                   type="number" 
                   min="0"
                   value={formData.count}
                   onChange={e => setFormData({...formData, count: parseInt(e.target.value) || 0})}
                   className="w-24 p-2 text-center text-lg font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg"
                 />
                 
                 <div className="flex-1 relative">
                    <input 
                      type="text" 
                      list="unit-options"
                      value={formData.unit}
                      onChange={e => setFormData({...formData, unit: e.target.value})}
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm"
                      placeholder="단위 (예: Box, 개, 통)"
                    />
                    <datalist id="unit-options">
                       {UNIT_SUGGESTIONS.map(u => <option key={u} value={u} />)}
                    </datalist>
                 </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                 * 단위 예시: "Box", "통", "10개입 Box" 등 자유롭게 입력 가능
              </p>
           </div>

           {/* Vendor Info */}
           <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">거래처 정보</h4>
              <div className="space-y-3">
                 <div>
                    <label className="block text-xs text-slate-500 mb-1">업체명</label>
                    <input 
                      type="text" 
                      value={formData.vendorName}
                      onChange={e => setFormData({...formData, vendorName: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                      placeholder="구매처 이름"
                    />
                 </div>
                 <div>
                    <label className="block text-xs text-slate-500 mb-1">전화번호</label>
                    <input 
                      type="tel" 
                      value={formData.vendorPhone}
                      onChange={e => setFormData({...formData, vendorPhone: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                      placeholder="010-0000-0000"
                    />
                 </div>
              </div>
           </div>

           {/* Note */}
           <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">메모</label>
              <textarea 
                value={formData.note}
                onChange={e => setFormData({...formData, note: e.target.value})}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm h-20 resize-none"
                placeholder="특이사항, 규격, URL 등..."
              />
           </div>

        </form>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 shrink-0 flex gap-3">
           <button 
             onClick={onClose}
             className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
           >
             취소
           </button>
           <button 
             onClick={handleSubmit}
             disabled={loading || !formData.name}
             className="flex-[2] py-3 bg-orange-600 text-white font-bold rounded-xl shadow-lg hover:bg-orange-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
           >
             <Save size={18} />
             {loading ? '저장 중...' : '저장하기'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default ConsumableFormModal;
