import React from 'react';
import { Staff } from '../../types';
import { BarChart3, Trophy } from 'lucide-react';

interface StatsItem {
  id: string;
  name: string;
  color: string;
  count: number;
  isActive?: boolean;
}

interface BedStatsProps {
  stats: StatsItem[];
  loading: boolean;
}

const BedStats: React.FC<BedStatsProps> = ({ stats, loading }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
         <BarChart3 className="text-blue-500" size={18} />
         <h3 className="font-bold text-slate-800 dark:text-slate-100">교체 실적 현황</h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {loading ? (
           <div className="py-8 text-center text-slate-400 text-sm">통계 계산 중...</div>
        ) : stats.length === 0 ? (
           <div className="py-8 text-center text-slate-400 text-sm">데이터가 없습니다.</div>
        ) : (
           <div className="space-y-3">
              {stats.map((item, index) => (
                <div key={item.id} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                   {/* Rank Badge */}
                   <div className={`
                     w-6 h-6 shrink-0 flex items-center justify-center rounded-full font-bold text-xs
                     ${index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 ring-1 ring-yellow-400' : ''}
                     ${index === 1 ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ring-1 ring-slate-300' : ''}
                     ${index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 ring-1 ring-orange-300' : ''}
                     ${index > 2 ? 'text-slate-400 dark:text-slate-600' : ''}
                   `}>
                      {index + 1}
                   </div>
                   
                   {/* Avatar & Name */}
                   <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0"
                        style={{ backgroundColor: item.color }}
                      >
                        {item.name[0]}
                      </div>
                      <div className="flex flex-col min-w-0">
                         <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                           {item.name}
                           {index === 0 && <Trophy size={12} className="inline ml-1 text-yellow-500" />}
                         </span>
                         {item.isActive === false && <span className="text-[10px] text-slate-400">퇴사</span>}
                      </div>
                   </div>
                   
                   {/* Count Bar */}
                   <div className="flex flex-col items-end gap-0.5 w-24">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{item.count}회</span>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                         <div 
                           className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                           style={{ width: `${Math.min(100, (item.count / (stats[0]?.count || 1)) * 100)}%` }}
                         ></div>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        )}
      </div>
    </div>
  );
};

export default BedStats;