
import React, { useState, useEffect } from 'react';
import { Equipment } from '../../types';
import { X, Save } from 'lucide-react';

interface EquipmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Equipment, 'id' | 'updatedAt'>) => void;
  initialData?: Equipment | null;
  categories: string[];
}

const EquipmentFormModal: React.FC<EquipmentFormModalProps> = ({ 
  isOpen, onClose, onSubmit, initialData, categories 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    count: 1,
    vendorName: '',
    vendorPhone: '',
    note: ''
  });

  // Suggestions for categories
  const DEFAULT_CATEGORIES = ['치료기기', '진단기기', '운동기구', 'PC/가전', '기타'];
  const suggestionCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...categories]));

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        category: initialData.category || '',
        count: initialData.count,
        vendorName: initialData.vendorName || '',
        vendorPhone: initialData.vendorPhone || '',
        note: initialData.note || ''
      });
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    // Pass data to parent
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950 shrink-0">
           <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
             {initialData ? '장비 정보 수정' : '장비 등록'}
           </h3>
           <button onClick={onClose}><X size={24} className="text-slate-400 hover:text-slate-600" /></button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
           
           {/* Name & Category */}
           <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                 <label className="block text-xs font-bold text-slate-500 mb-1">장비명 (필수)</label>
                 <input 
                   type="text" 
                   required
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                   className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold"
                   placeholder="예: 체외충격파 치료기 (Piezo)"
                 />
              </div>
              <div className="col-span-1">
                 <label className="block text-xs font-bold text-slate-500 mb-1">분류</label>
                 <input 
                   list="category-options"
                   value={formData.category}
                   onChange={e => setFormData({...formData, category: e.target.value})}
                   className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                   placeholder="선택 또는 입력"
                 />
                 <datalist id="category-options">
                    {suggestionCategories.map(c => <option key={c} value={c} />)}
                 </datalist>
              </div>
              <div className="col-span-1">
                 <label className="block text-xs font-bold text-slate-500 mb-1">보유 수량</label>
                 <input 
                   type="number" 
                   min="0"
                   value={formData.count}
                   onChange={e => setFormData({...formData, count: parseInt(e.target.value) || 0})}
                   className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold"
                 />
              </div>
           </div>

           {/* Vendor Info */}
           <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">유지보수 업체 정보</h4>
              <div className="space-y-3">
                 <div>
                    <label className="block text-xs text-slate-500 mb-1">업체명</label>
                    <input 
                      type="text" 
                      value={formData.vendorName}
                      onChange={e => setFormData({...formData, vendorName: e.target.value})}
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                      placeholder="관리 업체 이름"
                    />
                 </div>
                 <div>
                    <label className="block text-xs text-slate-500 mb-1">전화번호</label>
                    <input 
                      type="tel" 
                      value={formData.vendorPhone}
                      onChange={e => setFormData({...formData, vendorPhone: e.target.value})}
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                      placeholder="010-0000-0000"
                    />
                 </div>
              </div>
           </div>

           {/* Note */}
           <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">비고 / 메모</label>
              <textarea 
                value={formData.note}
                onChange={e => setFormData({...formData, note: e.target.value})}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm h-20 resize-none"
                placeholder="AS 접수 번호, 모델명, 시리얼 넘버, 구입 시기 등..."
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
             disabled={!formData.name}
             className="flex-[2] py-3 bg-cyan-600 text-white font-bold rounded-xl shadow-lg hover:bg-cyan-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
           >
             <Save size={18} />
             확인 (직원 선택으로 이동)
           </button>
        </div>
      </div>
    </div>
  );
};

export default EquipmentFormModal;
