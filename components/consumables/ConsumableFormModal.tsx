
import React, { useState, useEffect } from 'react';
import { Consumable } from '../../types';
import { X, Save, Layers, AlertCircle } from 'lucide-react';
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
  
  // Pack Management State
  const [isPackMode, setIsPackMode] = useState(false);
  const [packData, setPackData] = useState({
    packUnit: 'Box',
    itemsPerPack: 100,
    currentPacks: 0 // Used for input, eventually updates formData.count
  });

  // Reorder Threshold State (Input value)
  const [alertThresholdInput, setAlertThresholdInput] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  
  // Suggestions
  const UNIT_SUGGESTIONS = ['개', 'ea', '장', 'ml', 'L'];
  const PACK_SUGGESTIONS = ['Box', 'Set', '통', '권', '포', 'Roll'];

  useEffect(() => {
    if (initialData) {
      const hasPackInfo = initialData.itemsPerPack && initialData.itemsPerPack > 1;
      const minCount = initialData.minCount || 0;
      
      setFormData({
        name: initialData.name,
        category: initialData.category || '',
        count: initialData.count,
        unit: initialData.unit,
        vendorName: initialData.vendorName || '',
        vendorPhone: initialData.vendorPhone || '',
        note: initialData.note || ''
      });

      if (hasPackInfo) {
        setIsPackMode(true);
        const perPack = initialData.itemsPerPack || 100;
        setPackData({
          packUnit: initialData.packUnit || 'Box',
          itemsPerPack: perPack,
          currentPacks: parseFloat((initialData.count / perPack).toFixed(2))
        });
        // If in pack mode, show threshold as packs
        setAlertThresholdInput(parseFloat((minCount / perPack).toFixed(2)));
      } else {
        // If in unit mode, show threshold as units
        setAlertThresholdInput(minCount);
      }
    }
  }, [initialData]);

  // Effect: When pack data changes in Pack Mode, update the Total Count automatically
  useEffect(() => {
    if (isPackMode) {
      const total = Math.round(packData.currentPacks * packData.itemsPerPack);
      setFormData(prev => ({ ...prev, count: total }));
    }
  }, [packData, isPackMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      const finalData: any = { ...formData };
      
      // Calculate Total Min Count based on mode
      let totalMinCount = 0;
      if (isPackMode) {
        totalMinCount = Math.round(alertThresholdInput * packData.itemsPerPack);
        finalData.itemsPerPack = packData.itemsPerPack;
        finalData.packUnit = packData.packUnit;
      } else {
        totalMinCount = alertThresholdInput;
        finalData.itemsPerPack = 1;
        finalData.packUnit = null;
      }
      finalData.minCount = totalMinCount;

      if (initialData) {
        await updateConsumable(initialData.id, finalData);
      } else {
        await addConsumable(finalData);
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
           
           {/* 1. Basic Info */}
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

           {/* 2. Unit & Count Strategy */}
           <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 transition-all">
              <div className="flex justify-between items-center mb-4">
                 <label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Layers size={16} className="text-blue-500" /> 재고 및 알림 설정
                 </label>
                 
                 {/* Mode Toggle */}
                 <div className="flex bg-white dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setIsPackMode(false)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${!isPackMode ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-400'}`}
                    >
                      낱개
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPackMode(true)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${isPackMode ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400'}`}
                    >
                      묶음(Box)
                    </button>
                 </div>
              </div>

              {isPackMode ? (
                 <div className="space-y-4 animate-fade-in">
                    {/* Pack Definition */}
                    <div className="grid grid-cols-2 gap-4 bg-white dark:bg-slate-900 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                        <div className="col-span-2 text-[10px] font-bold text-blue-500 mb-[-8px]">묶음 기준 설정</div>
                        <div>
                           <label className="block text-[10px] text-slate-400 mb-1">묶음 단위명</label>
                           <input 
                             list="pack-units"
                             value={packData.packUnit}
                             onChange={(e) => setPackData({...packData, packUnit: e.target.value})}
                             className="w-full p-2 border-b border-slate-200 dark:border-slate-700 bg-transparent text-sm font-bold outline-none focus:border-blue-500 text-center"
                             placeholder="Box"
                           />
                           <datalist id="pack-units">{PACK_SUGGESTIONS.map(u => <option key={u} value={u} />)}</datalist>
                        </div>
                        <div>
                           <label className="block text-[10px] text-slate-400 mb-1">1 묶음 당 낱개 수</label>
                           <div className="flex items-center gap-1">
                             <input 
                               type="number" min="1"
                               value={packData.itemsPerPack}
                               onChange={(e) => setPackData({...packData, itemsPerPack: parseInt(e.target.value) || 1})}
                               className="w-full p-2 border-b border-slate-200 dark:border-slate-700 bg-transparent text-sm font-bold outline-none focus:border-blue-500 text-center"
                             />
                             <span className="text-xs text-slate-400 font-medium">개</span>
                           </div>
                        </div>
                        <div className="col-span-2 text-center text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800 py-1 rounded">
                           1 {packData.packUnit || 'Box'} = {packData.itemsPerPack} {formData.unit}
                        </div>
                    </div>

                    {/* Current Quantity */}
                    <div className="grid grid-cols-2 gap-4 items-end">
                       <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">현재 묶음 수량</label>
                          <div className="flex items-center gap-2">
                             <input 
                               type="number" min="0" step="0.1"
                               value={packData.currentPacks}
                               onChange={(e) => setPackData({...packData, currentPacks: parseFloat(e.target.value) || 0})}
                               className="w-full p-2.5 bg-white dark:bg-slate-800 border-2 border-blue-100 dark:border-blue-900/50 rounded-lg text-lg font-black text-blue-600 dark:text-blue-400 text-center focus:border-blue-500 outline-none"
                             />
                             <span className="text-sm font-bold text-slate-500">{packData.packUnit}</span>
                          </div>
                       </div>
                       
                       <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg flex flex-col justify-center items-center h-[52px]">
                          <span className="text-[10px] text-slate-400">총 낱개 (자동계산)</span>
                          <div className="font-bold text-slate-600 dark:text-slate-300">
                             {formData.count.toLocaleString()} <span className="text-xs font-normal">{formData.unit}</span>
                          </div>
                       </div>
                    </div>

                    {/* Reorder Threshold (Packs) */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                           <AlertCircle size={12} className="text-red-500" /> 
                           재구매 알림 기준 (묶음)
                        </label>
                        <div className="flex items-center gap-2">
                           <input 
                             type="number" min="0" step="0.1"
                             value={alertThresholdInput}
                             onChange={(e) => setAlertThresholdInput(parseFloat(e.target.value) || 0)}
                             className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-bold text-center"
                           />
                           <span className="text-sm text-slate-500">{packData.packUnit} 이하일 때</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                           약 {(alertThresholdInput * packData.itemsPerPack).toLocaleString()} {formData.unit} 이하가 되면 빨간색으로 표시됩니다.
                        </p>
                    </div>
                    
                    {/* Unit Name (Bottom) */}
                    <div>
                        <label className="block text-[10px] text-slate-400 mb-1">낱개 단위명 (최소 단위)</label>
                        <input 
                          type="text" 
                          list="unit-options"
                          value={formData.unit}
                          onChange={e => setFormData({...formData, unit: e.target.value})}
                          className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm"
                          placeholder="예: 개, ea"
                        />
                        <datalist id="unit-options">{UNIT_SUGGESTIONS.map(u => <option key={u} value={u} />)}</datalist>
                    </div>
                 </div>
              ) : (
                 <div className="space-y-4 animate-fade-in">
                    <div className="flex gap-3 items-end">
                        <div className="flex-1">
                           <label className="block text-xs font-bold text-slate-500 mb-1">현재 총 재고량</label>
                           <input 
                             type="number" 
                             min="0"
                             value={formData.count}
                             onChange={e => setFormData({...formData, count: parseInt(e.target.value) || 0})}
                             className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-xl font-black text-center focus:border-blue-500 outline-none"
                           />
                        </div>
                        <div className="w-24">
                           <label className="block text-xs font-bold text-slate-500 mb-1">단위</label>
                           <input 
                             type="text" 
                             list="unit-options"
                             value={formData.unit}
                             onChange={e => setFormData({...formData, unit: e.target.value})}
                             className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-center"
                             placeholder="개"
                           />
                           <datalist id="unit-options">{UNIT_SUGGESTIONS.map(u => <option key={u} value={u} />)}</datalist>
                        </div>
                    </div>

                    {/* Reorder Threshold (Units) */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                           <AlertCircle size={12} className="text-red-500" /> 
                           재구매 알림 기준 (낱개)
                        </label>
                        <div className="flex items-center gap-2">
                           <input 
                             type="number" min="0"
                             value={alertThresholdInput}
                             onChange={(e) => setAlertThresholdInput(parseInt(e.target.value) || 0)}
                             className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-bold text-center"
                           />
                           <span className="text-sm text-slate-500">{formData.unit} 이하일 때</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                           설정한 개수 이하가 되면 빨간색으로 표시됩니다.
                        </p>
                    </div>
                 </div>
              )}
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
             className="flex-[2] py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
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
