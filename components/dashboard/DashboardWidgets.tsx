
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
  <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between transition-transform hover:scale-[1.02]">
    <div>
      <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">{title}</p>
      <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">{count}</h3>
      {trend && <p className="text-xs text-slate-400 mt-1">{trend}</p>}
    </div>
    <div className={`p-4 rounded-xl ${colorClass}`}>
      {icon}
    </div>
  </div>
);

// 2. Simple Bar Chart (Staff Ranking)
interface RankingChartProps {
  data: Record<string, number>;
  staff: Staff[];
}

export const RankingChart: React.FC<RankingChartProps> = ({ data, staff }) => {
  // Cast Object.entries to ensure values are treated as numbers
  const sorted = (Object.entries(data) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // Top 5

  const maxVal = sorted[0]?.[1] || 1;

  if (sorted.length === 0) return <div className="text-center text-slate-400 py-10">데이터가 없습니다.</div>;

  return (
    <div className="space-y-4">
      {sorted.map(([id, count], idx) => {
        const member = staff.find(s => s.id === id);
        return (
          <div key={id} className="flex items-center gap-3">
            <div className="w-8 text-sm font-bold text-slate-400 text-center">#{idx + 1}</div>
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1 font-bold">
                <span className="text-slate-700 dark:text-slate-200">{member?.name || '미정'}</span>
                <span className="text-blue-600 dark:text-blue-400">{count}회</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                  style={{ width: `${(count / maxVal) * 100}%`, backgroundColor: member?.color }}
                ></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// 3. Simple Activity Line Chart (SVG)
interface ActivityChartProps {
  data: Record<string, number>;
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ data }) => {
  // Sort dates
  const sortedDates = Object.keys(data).sort((a, b) => {
     // Simple string comparison for 'MM.DD' format works mostly, but safer to parse if year was involved.
     // Assuming aggregated keys are sortable.
     return a.localeCompare(b);
  });

  const values = sortedDates.map(d => data[d]);
  if (values.length === 0) return <div className="h-40 flex items-center justify-center text-slate-400">데이터가 없습니다.</div>;

  const max = Math.max(...values, 5); // Minimum scale
  const height = 150;
  const width = 100; // Percentage

  // Generate SVG Points
  const points = values.map((val, idx) => {
    const x = (idx / (values.length - 1 || 1)) * 100;
    const y = 100 - (val / max) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="h-48 w-full relative pt-4">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
        {/* Grid Lines */}
        <line x1="0" y1="0" x2="100" y2="0" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="0.5" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="0.5" />
        <line x1="0" y1="100" x2="100" y2="100" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="0.5" />
        
        {/* Polyline */}
        <polyline 
           points={points} 
           fill="none" 
           stroke="currentColor" 
           className="text-blue-500" 
           strokeWidth="2" 
           strokeLinecap="round" 
           strokeLinejoin="round" 
        />
        
        {/* Dots */}
        {values.map((val, idx) => {
           const x = (idx / (values.length - 1 || 1)) * 100;
           const y = 100 - (val / max) * 100;
           return (
             <circle key={idx} cx={x} cy={y} r="1.5" className="fill-blue-500 stroke-white dark:stroke-slate-900" strokeWidth="0.5" />
           );
        })}
      </svg>
      
      {/* X-Axis Labels */}
      <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium">
         {sortedDates.filter((_, i) => i % Math.ceil(sortedDates.length / 5) === 0).map(d => (
            <span key={d}>{d}</span>
         ))}
      </div>
    </div>
  );
};
