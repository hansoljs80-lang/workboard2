
import React, { useMemo } from 'react';
import { Staff } from '../../types';
import { RankingChart, ActivityChart } from './DashboardWidgets';
import { Users, TrendingUp } from 'lucide-react';

interface CategoryDashboardProps {
  title: string;
  items: any[];
  staff: Staff[];
  viewMode: 'day' | 'week' | 'month' | 'year';
  colorClass: string; // e.g., 'text-blue-500'
}

const CategoryDashboard: React.FC<CategoryDashboardProps> = ({ 
  title, 
  items, 
  staff, 
  viewMode, 
  colorClass 
}) => {

  const staffData = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      let score = 1;
      if (item.checklist && Array.isArray(item.checklist)) {
        const checkedCount = item.checklist.filter((i: any) => i.checked).length;
        score = checkedCount > 0 ? checkedCount : 1; 
      }
      
      if (item.performedBy && Array.isArray(item.performedBy)) {
        item.performedBy.forEach((id: string) => {
          counts[id] = (counts[id] || 0) + score;
        });
      }
    });
    return counts;
  }, [items]);

  const trendData = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      const date = new Date(item.createdAt);
      let key = '';

      if (viewMode === 'day') {
        key = `${String(date.getHours()).padStart(2, '0')}시`;
      } else if (viewMode === 'year') {
        key = `${date.getMonth() + 1}월`;
      } else {
        key = `${date.getMonth() + 1}/${date.getDate()}`;
      }

      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [items, viewMode]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
      
      {/* Chart 1: Staff Ranking */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[320px]">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
           <div className={`p-1.5 rounded-lg bg-opacity-10 ${colorClass.replace('text-', 'bg-')}`}>
             <Users size={16} className={colorClass} />
           </div>
           <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">직원별 기여도 ({title})</h3>
        </div>
        <div className="flex-1 overflow-hidden">
           <RankingChart data={staffData} staff={staff} color={colorClass.replace('text-', 'bg-')} />
        </div>
      </div>

      {/* Chart 2: Activity Trend (Bar) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[320px]">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
           <div className={`p-1.5 rounded-lg bg-opacity-10 ${colorClass.replace('text-', 'bg-')}`}>
             <TrendingUp size={16} className={colorClass} />
           </div>
           <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">기간별 활동 추이</h3>
        </div>
        <div className="flex-1 w-full px-2">
           <ActivityChart data={trendData} lineColor={colorClass} />
        </div>
      </div>

    </div>
  );
};

export default CategoryDashboard;
