
import React from 'react';
import { Consumable } from '../../types';
import { Phone, Edit2, Trash2, Plus, Minus, AlertTriangle } from 'lucide-react';

interface ConsumableCardProps {
  item: Consumable;
  onEdit: (item: Consumable) => void;
  onDelete: (id: string) => void;
  onCountChange: (id: string, newCount: number) => void;
}

const ConsumableCard: React.FC<ConsumableCardProps> = ({ item, onEdit, onDelete, onCountChange }) => {
  
  const isPackMode = !!(item.itemsPerPack && item.itemsPerPack > 1);
  const itemsPerPack = item.itemsPerPack || 1;
  const packUnit = item.packUnit || 'Box';

  // Calculate current pack count (e.g. 3200 / 800 = 4)
  // Use toFixed to handle non-integer packs cleanly if any
  const currentPacks = isPackMode ? parseFloat((item.count / itemsPerPack).toFixed(2)) : 0;

  // Check Low Stock status
  const isLowStock = item.minCount !== undefined && item.minCount > 0 && item.count <= item.minCount;

  // Theme based on stock level
  const containerClass = isLowStock 
    ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800" 
    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800";

  const handleUpdate = (isAdd: boolean) => {
    // If in pack mode, +/- buttons should add/remove 1 PACK (e.g. 800 units)
    // If not, +/- 1 UNIT
    const delta = isPackMode ? (isAdd ? itemsPerPack : -itemsPerPack) : (isAdd ? 1 : -1);
    const newCount = Math.max(0, item.count + delta);
    onCountChange(item.id, newCount);
  };

  return (
    <div className={`rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow relative group ${containerClass}`}>
      
      {/* Top Section */}
      <div className="flex justify-between items-start mb-3">
         <div>
            <div className="flex gap-2 mb-1">
                {item.category && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 inline-block">
                    {item.category}
                </span>
                )}
                {isLowStock && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300 flex items-center gap-1">
                        <AlertTriangle size={10} /> 재구매 필요
                    </span>
                )}
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 leading-tight">
              {item.name}
            </h3>
         </div>
         
         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(item)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded">
               <Edit2 size={14} />
            </button>
            <button onClick={() => onDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded">
               <Trash2 size={14} />
            </button>
         </div>
      </div>

      {/* Count Control */}
      <div className={`bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 flex items-center justify-between mb-3 border ${isLowStock ? 'border-red-100 dark:border-red-900/30' : 'border-slate-100 dark:border-slate-700'}`}>
         <button 
           onClick={() => handleUpdate(false)}
           className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 text-slate-500 hover:text-orange-600 hover:border-orange-200 active:scale-95 transition-all"
           title={isPackMode ? `-1 ${packUnit}` : `-1 ${item.unit}`}
         >
           <Minus size={16} />
         </button>
         
         <div className="text-center flex flex-col justify-center min-h-[3rem]">
            {isPackMode ? (
               <>
                 <div className="flex items-baseline justify-center gap-1">
                    <span className={`text-2xl font-black tabular-nums ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                       {currentPacks}
                    </span>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{packUnit}</span>
                 </div>
                 <span className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-[-2px]">
                    ({item.count.toLocaleString()} {item.unit})
                 </span>
               </>
            ) : (
               <>
                 <div className="flex items-baseline justify-center">
                    <span className={`text-2xl font-black tabular-nums ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'}`}>
                        {item.count}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-1 font-medium">
                        {item.unit}
                    </span>
                 </div>
               </>
            )}
         </div>

         <button 
           onClick={() => handleUpdate(true)}
           className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 text-slate-500 hover:text-blue-600 hover:border-blue-200 active:scale-95 transition-all"
           title={isPackMode ? `+1 ${packUnit}` : `+1 ${item.unit}`}
         >
           <Plus size={16} />
         </button>
      </div>

      {/* Threshold Info & Vendor */}
      <div className="space-y-2">
         {item.minCount && item.minCount > 0 ? (
             <div className="text-[10px] text-center text-slate-400">
                알림 기준: 
                {isPackMode 
                   ? ` ${parseFloat((item.minCount / itemsPerPack).toFixed(2))} ${packUnit} 이하`
                   : ` ${item.minCount} ${item.unit} 이하`
                }
             </div>
         ) : null}

         {item.vendorName && (
           <div className="flex items-center justify-between text-xs bg-white/60 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
              <span className="text-slate-500 font-bold truncate max-w-[50%]">{item.vendorName}</span>
              {item.vendorPhone ? (
                 <a 
                   href={`tel:${item.vendorPhone}`}
                   className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold hover:underline bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md"
                 >
                   <Phone size={10} className="fill-current" />
                   {item.vendorPhone}
                 </a>
              ) : (
                 <span className="text-slate-300">전화번호 없음</span>
              )}
           </div>
         )}
         
         {item.note && (
           <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 p-2 rounded-lg">
             {item.note}
           </p>
         )}
      </div>
    </div>
  );
};

export default React.memo(ConsumableCard);
