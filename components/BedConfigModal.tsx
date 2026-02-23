
import React, { useState } from 'react';
import { BedConfig } from '../types';
import { X, Save } from 'lucide-react';

interface BedConfigModalProps {
  config: BedConfig;
  onSave: (config: BedConfig) => void;
  onClose: () => void;
}

const BedConfigModal: React.FC<BedConfigModalProps> = ({ config, onSave, onClose }) => {
  const [localConfig, setLocalConfig] = useState(config);

  const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localConfig);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
           <h3 className="font-bold text-slate-800 dark:text-slate-100">배드 관리 설정</h3>
           <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
           <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">총 배드 개수</label>
              <input 
                type="number" 
                min="1" max="50"
                value={localConfig.count}
                onChange={(e) => setLocalConfig({...localConfig, count: parseInt(e.target.value) || 1})}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
              />
           </div>

           <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">교체 주기 (일)</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  min="1" max="365"
                  value={localConfig.interval}
                  onChange={(e) => setLocalConfig({...localConfig, interval: parseInt(e.target.value) || 1})}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                />
                <span className="text-sm text-slate-500 shrink-0">일 간격</span>
              </div>
           </div>

           <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">정기 교체 요일</label>
              <div className="grid grid-cols-7 gap-1">
                 {WEEK_DAYS.map((day, idx) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setLocalConfig({...localConfig, routineDay: idx})}
                      className={`
                        py-2 rounded-lg text-xs font-bold transition-all
                        ${localConfig.routineDay === idx 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}
                      `}
                    >
                       {day}
                    </button>
                 ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">업무 자동 생성 시 기준 요일로 사용됩니다.</p>
           </div>
           
           <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">PC 화면 한 줄 개수</label>
              <input 
                type="number" 
                min="1" max="10"
                value={localConfig.cols}
                onChange={(e) => setLocalConfig({...localConfig, cols: parseInt(e.target.value) || 1})}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
              />
              <p className="text-[10px] text-slate-400 mt-1">PC 화면에서 한 줄에 보여질 카드의 개수입니다.</p>
           </div>

           <button 
             type="submit"
             className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md flex items-center justify-center gap-2 mt-2"
           >
             <Save size={18} /> 설정 저장
           </button>
        </form>
      </div>
    </div>
  );
};

export default BedConfigModal;
