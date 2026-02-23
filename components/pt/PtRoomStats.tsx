import React from 'react';
import { BarChart3, Trophy, Sun, Moon, Clock } from 'lucide-react';

interface StatsItem {
  id: string;
  name: string;
  color: string;
  count: number;
  isActive?: boolean;
}

interface PtRoomStatsProps {
  stats: StatsItem[];
  shiftLeaders: {
    MORNING: { name: string; count: number } | null;
    DAILY: { name: string; count: number } | null;
    EVENING: { name: string; count: number } | null;
  };
  loading: boolean;
}

const PtRoomStats: React.FC<PtRoomStatsProps> = ({ stats, shiftLeaders, loading }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
         <BarChart3 className="text-emerald-500" size={18} />
         <h3 className="font-bold text-slate-800 dark:text-slate-100">이달의 물리치료실 관리왕</h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {loading ? (
           <div className="py-8 text-center text-slate-400 text-sm">통계 계산 중...</div>
        ) : stats.length === 0 ? (
           <div className="py-8 text-center text-slate-400 text-sm">
             기록이 없습니다.
           </div>
        ) : (
           <div className="space-y-6">
              {/* Shift Best Section */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                 <div className="bg-amber-50 dark:bg-amber-900/10 p-2 rounded-lg border border-amber-100 dark:border-amber-800 flex flex-col items-center text-center">
                    <div className="p-1 bg-white dark:bg-slate-800 rounded-full mb-1 shadow-sm text-amber-500">
                      <Sun size={14} />
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-1">아침</span>
                    {shiftLeaders.MORNING ? (
                      <>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate w-full">{shiftLeaders.MORNING.name}</span>
                        <span className="text-[10px] text-amber-600 font-bold">{shiftLeaders.MORNING.count}회</span>
                      </>
                    ) : <span className="text-[10px] text-slate-400">-</span>}
                 </div>

                 <div className="bg-blue-50 dark:bg-blue-900/10 p-2 rounded-lg border border-blue-100 dark:border-blue-800 flex flex-col items-center text-center">
                    <div className="p-1 bg-white dark:bg-slate-800 rounded-full mb-1 shadow-sm text-blue-500">
                      <Clock size={14} />
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-1">일상</span>
                    {shiftLeaders.DAILY ? (
                      <>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate w-full">{shiftLeaders.DAILY.name}</span>
                        <span className="text-[10px] text-blue-600 font-bold">{shiftLeaders.DAILY.count}회</span>
                      </>
                    ) : <span className="text-[10px] text-slate-400">-</span>}
                 </div>

                 <div className="bg-indigo-50 dark:bg-indigo-900/10 p-2 rounded-lg border border-indigo-100 dark:border-indigo-800 flex flex-col items-center text-center">
                    <div className="p-1 bg-white dark:bg-slate-800 rounded-full mb-1 shadow-sm text-indigo-500">
                      <Moon size={14} />
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-1">저녁</span>
                    {shiftLeaders.EVENING ? (
                      <>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate w-full">{shiftLeaders.EVENING.name}</span>
                        <span className="text-[10px] text-indigo-600 font-bold">{shiftLeaders.EVENING.count}회</span>
                      </>
                    ) : <span className="text-[10px] text-slate-400">-</span>}
                 </div>
              </div>

              {/* Overall Ranking */}
              <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-400 px-1">종합 순위</div>
                  {stats.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                      <div className={`
                        w-6 h-6 shrink-0 flex items-center justify-center rounded-full font-bold text-xs
                        ${index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 ring-1 ring-yellow-400' : ''}
                        ${index === 1 ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ring-1 ring-slate-300' : ''}
                        ${index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 ring-1 ring-orange-300' : ''}
                        ${index > 2 ? 'text-slate-400 dark:text-slate-600' : ''}
                      `}>
                          {index + 1}
                      </div>
                      
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
                      
                      <div className="flex flex-col items-end gap-0.5 w-24">
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{item.count}회</span>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min(100, (item.count / (stats[0]?.count || 1)) * 100)}%` }}
                            ></div>
                          </div>
                      </div>
                    </div>
                  ))}
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default PtRoomStats;