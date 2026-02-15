
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

  // 1. Process Data: Staff Performance (Who did the most?)
  const staffData = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      // Logic: Calculate score based on checklist items or 1 per log
      let score = 1;
      if (item.checklist && Array.isArray(item.checklist)) {
        // Count checked items
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

  // 2. Process Data: Activity Trend (When did it happen?)
  const trendData = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      const date = new Date(item.createdAt);
      let key = '';

      if (viewMode === 'day') {
        // Hourly: 09:00, 10:00
        key = `${String(date.getHours()).padStart(2, '0')}:00`;
      } else if (viewMode === 'year') {
        // Monthly: 2024.01
        key = `${date.getMonth() + 1}월`;
      } else {
        // Daily: 10.24
        key = `${date.getMonth() + 1}.${date.getDate()}`;
      }

      counts[key] = (counts[key] || 0) + 1;
    });

    // Fill in gaps for nicer charts (Optional, but good for UX)
    // For now, simpler implementation: purely data driven
    return counts;
  }, [items, viewMode]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      
      {/* Chart 1: Staff Ranking */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[400px]">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
           <div className={`p-2 rounded-lg bg-opacity-10 ${colorClass.replace('text-', 'bg-')}`}>
             <Users size={18} className={colorClass} />
           </div>
           <h3 className="font-bold text-slate-800 dark:text-slate-100">직원별 기여도 ({title})</h3>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
           <RankingChart data={staffData} staff={staff} color={colorClass.replace('text-', 'bg-')} />
        </div>
      </div>

      {/* Chart 2: Activity Trend */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[400px]">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
           <div className={`p-2 rounded-lg bg-opacity-10 ${colorClass.replace('text-', 'bg-')}`}>
             <TrendingUp size={18} className={colorClass} />
           </div>
           <h3 className="font-bold text-slate-800 dark:text-slate-100">기간별 활동 추이</h3>
        </div>
        <div className="flex-1 flex items-center">
           <ActivityChart data={trendData} lineColor={colorClass} />
        </div>
      </div>

    </div>
  );
};

export default CategoryDashboard;
