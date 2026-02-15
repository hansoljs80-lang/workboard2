
import React from 'react';
import { Equipment } from '../../types';
import { Phone, Edit2, Trash2, Plus, Minus } from 'lucide-react';

interface EquipmentCardProps {
  item: Equipment;
  onEdit: (item: Equipment) => void;
  onDelete: (id: string) => void;
  onCountChange: (id: string, newCount: number) => void;
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({ item, onEdit, onDelete, onCountChange }) => {
  
  const handleCountUpdate = (delta: number) => {
    const newCount = Math.max(0, item.count + delta);
    onCountChange(item.id, newCount);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-shadow relative group flex flex-col">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
         <div className="min-w-0">
            {item.category && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 mb-1 inline-block truncate max-w-full">
                {item.category}
              </span>
            )}
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 leading-tight break-keep">
              {item.name}
            </h3>
         </div>
         
         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={() => onEdit(item)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded">
               <Edit2 size={14} />
            </button>
            <button onClick={() => onDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded">
               <Trash2 size={14} />
            </button>
         </div>
      </div>

      {/* Count & Info Section */}
      <div className="flex gap-3 mb-3">
         {/* Count Control (Vertical/Compact for equipment) */}
         <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg p-1 border border-slate-100 dark:border-slate-700 min-w-[3rem]">
             <button 
               onClick={() => handleCountUpdate(1)}
               className="p-1 text-slate-400 hover:text-cyan-600 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors"
             >
               <Plus size={12} />
             </button>
             <span className="text-lg font-black text-slate-800 dark:text-slate-100 py-1">{item.count}</span>
             <button 
               onClick={() => handleCountUpdate(-1)}
               className="p-1 text-slate-400 hover:text-red-600 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors"
             >
               <Minus size={12} />
             </button>
         </div>

         {/* Vendor Info */}
         <div className="flex-1 flex flex-col justify-center gap-2">
            {item.vendorName ? (
               <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] text-slate-400 font-bold mb-0.5">유지보수 / 업체</p>
                  <div className="flex justify-between items-center">
                     <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate mr-2 max-w-[50%]">
                        {item.vendorName}
                     </span>
                     {item.vendorPhone && (
                        <a 
                           href={`tel:${item.vendorPhone}`}
                           className="flex items-center gap-1 text-[10px] font-bold text-white bg-green-500 hover:bg-green-600 px-2 py-1 rounded-md transition-colors shadow-sm active:scale-95 whitespace-nowrap"
                        >
                           <Phone size={10} className="fill-current" />
                           {item.vendorPhone}
                        </a>
                     )}
                  </div>
               </div>
            ) : (
               <div className="flex-1 flex items-center justify-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                  업체 정보 없음
               </div>
            )}
         </div>
      </div>

      {/* Note */}
      {item.note && (
        <div className="mt-auto bg-slate-50 dark:bg-slate-800/30 p-2 rounded-lg text-xs text-slate-600 dark:text-slate-400">
           {item.note}
        </div>
      )}
    </div>
  );
};

export default React.memo(EquipmentCard);
