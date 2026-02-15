
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
      <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">{count.toLocaleString()}</h3>
      {trend && <p className="text-xs text-slate-400 mt-1">{trend}</p>}
    </div>
    <div className={`p-4 rounded-xl ${colorClass}`}>
      {icon}
    </div>
  </div>
);

// 2. Bar Chart (Staff Ranking) - Enhanced
interface RankingChartProps {
  data: Record<string, number>;
  staff: Staff[];
  color?: string; // e.g. 'bg-blue-500'
}

export const RankingChart: React.FC<RankingChartProps> = ({ data, staff, color = 'bg-blue-500' }) => {
  // Cast Object.entries to ensure values are treated as numbers
  const sorted = (Object.entries(data) as [string, number][])
    .sort((a, b) => b[1] - a[1]);
    // .slice(0, 10); // Show Top 10

  const maxVal = sorted[0]?.[1] || 1;

  if (sorted.length === 0) return <div className="text-center text-slate-400 py-10 text-sm">데이터가 없습니다.</div>;

  return (
    <div className="space-y-3">
      {sorted.map(([id, count], idx) => {
        const member = staff.find(s => s.id === id);
        // Fallback color if member has no color or member not found
        const barColor = member?.color || '#94a3b8'; 
        
        return (
          <div key={id} className="flex items-center gap-3 group">
            <div className="w-6 text-xs font-bold text-slate-400 text-center shrink-0">{idx + 1}</div>
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1 font-bold">
                <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1">
                   {member?.name || '미정'}
                   {member?.isActive === false && <span className="text-[9px] font-normal text-slate-400">(퇴사)</span>}
                </span>
                <span className="text-slate-600 dark:text-slate-400">{count}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000 relative"
                  style={{ width: `${(count / maxVal) * 100}%`, backgroundColor: barColor }}
                >
                   {/* Shine effect */}
                   <div className="absolute top-0 left-0 bottom-0 right-0 bg-white/20" />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// 3. Activity Line Chart (SVG) - Enhanced with Labels
interface ActivityChartProps {
  data: Record<string, number>;
  lineColor?: string;
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ data, lineColor = 'text-blue-500' }) => {
  // Sort dates properly
  const sortedLabels = Object.keys(data).sort((a, b) => {
     // Simple lexicographical sort works for ISO-like strings or fixed formats, 
     // but ideally we rely on the provider sending sorted keys or comparable strings.
     return a.localeCompare(b);
  });

  const values = sortedLabels.map(d => data[d]);
  
  if (values.length === 0) return <div className="h-full flex items-center justify-center text-slate-400 text-sm">데이터가 없습니다.</div>;

  const max = Math.max(...values, 1); // Avoid division by zero
  // Add some padding to top
  const graphMax = max * 1.1; 

  const height = 100;
  const width = 100; 

  // Generate SVG Points
  const points = values.map((val, idx) => {
    const x = (idx / (values.length - 1 || 1)) * 100;
    const y = 100 - (val / graphMax) * 100;
    return `${x},${y}`;
  }).join(' ');

  // Generate Area Path (close the loop)
  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 relative w-full min-h-[150px]">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          {/* Background Area */}
          <polygon points={areaPoints} className={`${lineColor.replace('text-', 'fill-')} opacity-10`} />

          {/* Grid Lines */}
          <line x1="0" y1="0" x2="100" y2="0" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="0.5" strokeDasharray="2" />
          <line x1="0" y1="25" x2="100" y2="25" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="0.5" strokeDasharray="2" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="0.5" strokeDasharray="2" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="0.5" strokeDasharray="2" />
          <line x1="0" y1="100" x2="100" y2="100" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="1" />
          
          {/* Polyline */}
          <polyline 
             points={points} 
             fill="none" 
             stroke="currentColor" 
             className={lineColor} 
             strokeWidth="2" 
             strokeLinecap="round" 
             strokeLinejoin="round" 
             vectorEffect="non-scaling-stroke"
          />
          
          {/* Dots */}
          {values.map((val, idx) => {
             const x = (idx / (values.length - 1 || 1)) * 100;
             const y = 100 - (val / graphMax) * 100;
             return (
               <g key={idx} className="group">
                 <circle cx={x} cy={y} r="1.5" className={`${lineColor.replace('text-', 'fill-')} stroke-white dark:stroke-slate-900`} strokeWidth="0.5" />
                 {/* Tooltip on hover */}
                 <foreignObject x={x - 10} y={y - 15} width="20" height="20" className="opacity-0 group-hover:opacity-100 transition-opacity overflow-visible">
                    <div className="bg-slate-800 text-white text-[8px] px-1 py-0.5 rounded text-center whitespace-nowrap transform -translate-x-1/2 -translate-y-full pointer-events-none">
                      {val}
                    </div>
                 </foreignObject>
               </g>
             );
          })}
        </svg>
      </div>
      
      {/* X-Axis Labels */}
      <div className="flex justify-between mt-2 text-[9px] text-slate-400 font-medium px-1">
         {/* Show only some labels to avoid clutter */}
         {sortedLabels.map((label, idx) => {
            // Show first, last, and intermittent labels
            const total = sortedLabels.length;
            const step = Math.ceil(total / 6); 
            if (idx === 0 || idx === total - 1 || idx % step === 0) {
               return <span key={idx}>{label}</span>;
            }
            return null; 
         })}
      </div>
    </div>
  );
};
