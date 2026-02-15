
import React from 'react';
import { Staff } from '../../types';

// 1. Stat Card
interface StatCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  colorClass: string;
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, count, icon, colorClass, trend }) => (
  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow group">
    <div>
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-0.5">{title}</p>
      <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{count.toLocaleString()}</h3>
      {trend && <p className="text-[10px] text-slate-400 mt-0.5">{trend}</p>}
    </div>
    <div className={`p-3 rounded-xl ${colorClass} group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
  </div>
);

// 2. Bar Chart (Staff Ranking) - Compact & Stylish
interface RankingChartProps {
  data: Record<string, number>;
  staff: Staff[];
  color?: string; // e.g. 'bg-blue-500'
}

export const RankingChart: React.FC<RankingChartProps> = ({ data, staff, color = 'bg-blue-500' }) => {
  const sorted = (Object.entries(data) as [string, number][])
    .sort((a, b) => b[1] - a[1]);

  const maxVal = sorted[0]?.[1] || 1;

  if (sorted.length === 0) return <div className="h-full flex items-center justify-center text-slate-400 text-xs">데이터가 없습니다.</div>;

  return (
    <div className="space-y-2.5 overflow-y-auto custom-scrollbar pr-2 h-full">
      {sorted.map(([id, count], idx) => {
        const member = staff.find(s => s.id === id);
        const barColor = member?.color || '#94a3b8'; 
        const percentage = (count / maxVal) * 100;
        
        return (
          <div key={id} className="group">
            <div className="flex justify-between text-xs mb-1">
              <div className="flex items-center gap-2">
                 <span className={`
                    w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold
                    ${idx < 3 ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}
                 `}>
                   {idx + 1}
                 </span>
                 <span className="font-bold text-slate-700 dark:text-slate-300">
                   {member?.name || '미정'}
                   {member?.isActive === false && <span className="text-[9px] font-normal text-slate-400 ml-1">(퇴사)</span>}
                 </span>
              </div>
              <span className="font-bold text-slate-600 dark:text-slate-400">{count}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${percentage}%`, backgroundColor: barColor }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// 3. Bar Chart (Activity Trend) - Replaces Line Chart
interface ActivityChartProps {
  data: Record<string, number>;
  lineColor?: string; // Kept prop name for compatibility, used for bar color
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ data, lineColor = 'text-blue-500' }) => {
  // Sort dates properly
  const sortedLabels = Object.keys(data).sort((a, b) => a.localeCompare(b));
  const values = sortedLabels.map(d => data[d]);
  
  if (values.length === 0) return <div className="h-full flex items-center justify-center text-slate-400 text-xs">데이터가 없습니다.</div>;

  const max = Math.max(...values, 1);
  // Color extraction: "text-blue-500" -> "bg-blue-500"
  const barColorClass = lineColor.replace('text-', 'bg-');

  return (
    <div className="h-full w-full flex flex-col justify-end">
      <div className="flex items-end justify-between gap-1 h-full pt-4">
        {values.map((val, idx) => {
          const heightPercent = Math.max((val / max) * 100, 5); // Minimum 5% height
          return (
            <div key={idx} className="flex-1 flex flex-col justify-end items-center group relative h-full">
               {/* Tooltip */}
               <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] px-2 py-1 rounded font-bold whitespace-nowrap z-10 pointer-events-none mb-1">
                  {sortedLabels[idx]}: {val}건
                  <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
               </div>
               
               {/* Bar */}
               <div 
                 className={`w-full max-w-[20px] rounded-t-md opacity-80 hover:opacity-100 transition-all duration-300 ${barColorClass}`}
                 style={{ height: `${heightPercent}%` }}
               ></div>
            </div>
          );
        })}
      </div>
      
      {/* X-Axis Labels (Simplified) */}
      <div className="flex justify-between mt-2 text-[9px] text-slate-400 font-medium px-1 border-t border-slate-100 dark:border-slate-800 pt-1">
         {sortedLabels.map((label, idx) => {
            // Show start, end, and middle labels appropriately to prevent clutter
            const showLabel = idx === 0 || idx === sortedLabels.length - 1 || (sortedLabels.length > 5 && idx === Math.floor(sortedLabels.length / 2));
            return (
               <span key={idx} className={showLabel ? 'opacity-100' : 'opacity-0'}>
                 {label}
               </span>
            );
         })}
      </div>
    </div>
  );
};
