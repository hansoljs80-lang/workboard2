
import React, { useState, useEffect } from 'react';
import { Equipment } from '../../types';
import { Phone, Edit2, Trash2, Plus, Minus, Check } from 'lucide-react';

interface EquipmentCardProps {
  item: Equipment;
  onEdit: (item: Equipment) => void;
  onDelete: (id: string) => void;
  onCountChange: (id: string, newCount: number) => void;
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({ item, onEdit, onDelete, onCountChange }) => {
  const [localCount, setLocalCount] = useState(item.count);

  useEffect(() => {
    setLocalCount(item.count);
  }, [item.count]);

  const handleCountUpdate = (delta: number) => {
    setLocalCount(prev => Math.max(0, prev + delta));
  };

  const handleSaveCount = () => {
    onCountChange(item.id, localCount);
  };

  const hasChanged = localCount !== item.count;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700/60 transition-all duration-200 hover:shadow-md relative group overflow-hidden">

      {/* 좌측 색 라인 */}
      <div className="absolute top-0 left-0 w-1 h-full bg-teal-400 dark:bg-teal-500" />

      <div className="pl-3 pr-2.5 pt-2.5 pb-2.5">

        {/* 헤더 */}
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0 flex-1">
            {item.category && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 tracking-wide uppercase mb-1 inline-block">
                {item.category}
              </span>
            )}
            <h3 className="font-bold text-[13px] text-slate-800 dark:text-slate-100 leading-snug break-keep pr-1">
              {item.name}
            </h3>
          </div>

          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
            <button onClick={() => onEdit(item)} className="p-1 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
              <Edit2 size={12} />
            </button>
            <button onClick={() => onDelete(item.id)} className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* 수량 컨트롤 + 업체 정보 */}
        <div className="flex gap-2">

          {/* 수량 컨트롤 */}
          <div className={`flex flex-col items-center justify-center rounded border py-1 px-1.5 min-w-[2.25rem] transition-colors ${
            hasChanged
              ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700'
              : 'bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-700/50'
          }`}>
            <button
              onClick={() => handleCountUpdate(1)}
              className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-teal-600 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors"
            >
              <Plus size={10} />
            </button>
            <span className={`text-base font-black tabular-nums leading-none py-0.5 ${
              hasChanged ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-100'
            }`}>
              {localCount}
            </span>
            <button
              onClick={() => handleCountUpdate(-1)}
              className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors"
            >
              <Minus size={10} />
            </button>
          </div>

          {/* 업체 정보 or 저장 */}
          <div className="flex-1 min-w-0">
            {hasChanged ? (
              <button
                onClick={handleSaveCount}
                className="w-full h-full flex flex-col items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-all active:scale-95 gap-0.5 py-1.5"
              >
                <Check size={13} />
                저장
              </button>
            ) : item.vendorName ? (
              <div className="bg-slate-50 dark:bg-slate-800/60 px-2 py-1.5 rounded border border-slate-100 dark:border-slate-700/50 h-full flex flex-col justify-center gap-1">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{item.vendorName}</p>
                <div className="space-y-0.5">
                  {item.vendorPhone && (
                    <a
                      href={`tel:${item.vendorPhone}`}
                      className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      <Phone size={9} className="fill-current shrink-0" />
                      <span className="truncate">{item.vendorPhone}</span>
                    </a>
                  )}
                  {item.vendorPhone2 && (
                    <a
                      href={`tel:${item.vendorPhone2}`}
                      className="flex items-center gap-1 text-[10px] font-semibold text-blue-500 dark:text-blue-400 hover:underline"
                    >
                      <Phone size={9} className="shrink-0" />
                      <span className="truncate">{item.vendorPhone2} <span className="text-slate-400 font-normal">담당</span></span>
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/30 rounded border border-dashed border-slate-200 dark:border-slate-700 h-full py-2">
                업체 정보 없음
              </div>
            )}
          </div>
        </div>

        {/* 메모 */}
        {item.note && (
          <p className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 px-1.5 py-1 rounded border border-slate-100 dark:border-slate-700/40 truncate mt-2">
            {item.note}
          </p>
        )}
      </div>
    </div>
  );
};

export default React.memo(EquipmentCard);
