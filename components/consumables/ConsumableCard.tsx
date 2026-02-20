
import React, { useState, useEffect } from 'react';
import { Consumable } from '../../types';
import { Phone, Edit2, Trash2, Plus, Minus, AlertTriangle, Check, ShoppingCart } from 'lucide-react';

interface ConsumableCardProps {
  item: Consumable;
  onEdit: (item: Consumable) => void;
  onDelete: (id: string) => void;
  onCountChange: (id: string, newCount: number) => void;
}

const ConsumableCard: React.FC<ConsumableCardProps> = ({ item, onEdit, onDelete, onCountChange }) => {
  const [localCount, setLocalCount] = useState(item.count);

  useEffect(() => {
    setLocalCount(item.count);
  }, [item.count]);

  const isPackMode = !!(item.itemsPerPack && item.itemsPerPack > 1);
  const itemsPerPack = item.itemsPerPack || 1;
  const packUnit = item.packUnit || 'Box';
  const currentPacks = isPackMode ? parseFloat((localCount / itemsPerPack).toFixed(2)) : 0;
  const isLowStock = item.minCount !== undefined && item.minCount > 0 && localCount <= item.minCount;
  const hasChanged = localCount !== item.count;

  const handleUpdate = (isAdd: boolean) => {
    const delta = isPackMode ? (isAdd ? itemsPerPack : -itemsPerPack) : (isAdd ? 1 : -1);
    setLocalCount(prev => Math.max(0, prev + delta));
  };

  const handleSaveCount = () => {
    onCountChange(item.id, localCount);
  };

  return (
    <div className={`rounded-lg border transition-all duration-200 hover:shadow-md relative group overflow-hidden ${
      isLowStock
        ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/60'
        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/60'
    }`}>

      {/* 좌측 색 라인 */}
      <div className={`absolute top-0 left-0 w-1 h-full ${
        isLowStock ? 'bg-red-400' : 'bg-indigo-400 dark:bg-indigo-500'
      }`} />

      <div className="pl-3 pr-2.5 pt-2.5 pb-2.5">

        {/* 헤더 */}
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 mb-1 flex-wrap">
              {item.category && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 tracking-wide uppercase">
                  {item.category}
                </span>
              )}
              {isLowStock && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center gap-0.5">
                  <AlertTriangle size={9} />재구매
                </span>
              )}
            </div>
            <h3 className="font-bold text-[13px] text-slate-800 dark:text-slate-100 leading-snug truncate pr-1">
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

        {/* 수량 컨트롤 */}
        <div className={`flex items-center justify-between rounded border px-2 py-1.5 mb-2 transition-colors ${
          hasChanged
            ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700'
            : isLowStock
            ? 'bg-red-50/50 border-red-100 dark:bg-red-950/20 dark:border-red-900/40'
            : 'bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-700/50'
        }`}>
          <button
            onClick={() => handleUpdate(false)}
            className="w-6 h-6 flex items-center justify-center bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600 text-slate-400 hover:text-orange-500 hover:border-orange-300 active:scale-90 transition-all"
          >
            <Minus size={11} />
          </button>

          <div className="text-center">
            {isPackMode ? (
              <>
                <div className="flex items-baseline justify-center gap-0.5">
                  <span className={`text-lg font-black tabular-nums leading-none ${
                    hasChanged ? 'text-blue-600 dark:text-blue-400' : isLowStock ? 'text-red-500 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'
                  }`}>{currentPacks}</span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-0.5">{packUnit}</span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums leading-none">
                  {localCount.toLocaleString()} {item.unit}
                </p>
              </>
            ) : (
              <div className="flex items-baseline justify-center gap-0.5">
                <span className={`text-lg font-black tabular-nums leading-none ${
                  hasChanged ? 'text-blue-600 dark:text-blue-400' : isLowStock ? 'text-red-500 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'
                }`}>{localCount}</span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-0.5">{item.unit}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => handleUpdate(true)}
            className="w-6 h-6 flex items-center justify-center bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600 text-slate-400 hover:text-blue-500 hover:border-blue-300 active:scale-90 transition-all"
          >
            <Plus size={11} />
          </button>
        </div>

        {/* 하단 */}
        {hasChanged ? (
          <button
            onClick={handleSaveCount}
            className="w-full py-1.5 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all active:scale-95"
          >
            <Check size={12} />저장
          </button>
        ) : (
          <div className="space-y-1">
            {item.minCount && item.minCount > 0 ? (
              <p className="text-[10px] text-center text-slate-400 dark:text-slate-500">
                알림: {isPackMode
                  ? `${parseFloat((item.minCount / itemsPerPack).toFixed(2))} ${packUnit}`
                  : `${item.minCount} ${item.unit}`} 이하
              </p>
            ) : null}

            {item.vendorName && (
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 px-2 py-1 rounded border border-slate-100 dark:border-slate-700/50">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate max-w-[55%]">{item.vendorName}</span>
                {item.vendorPhone ? (
                  <a
                    href={`tel:${item.vendorPhone}`}
                    className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <Phone size={9} className="fill-current" />
                    {item.vendorPhone}
                  </a>
                ) : (
                  <span className="text-[10px] text-slate-300 dark:text-slate-600">번호 없음</span>
                )}
              </div>
            )}

            {item.purchaseUrl && (
              <a
                href={item.purchaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 w-full py-1 rounded border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                <ShoppingCart size={10} />
                구매 링크 바로가기
              </a>
            )}

            {item.note && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 px-1.5 py-1 rounded border border-slate-100 dark:border-slate-700/40 truncate">
                {item.note}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(ConsumableCard);
