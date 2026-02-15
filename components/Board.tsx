
import React, { useState, useEffect, useCallback } from 'react';
import { Staff } from '../types';
import { Stethoscope, Activity, BedDouble, Shirt, DoorOpen, LayoutDashboard, RefreshCw } from 'lucide-react';
import { fetchDashboardStats, DashboardData } from '../services/dashboardService';
import { StatCard, RankingChart, ActivityChart } from './dashboard/DashboardWidgets';
import DateNavigator from './DateNavigator';
import { getWeekRange } from '../utils/dateUtils';

interface BoardProps {
  staff: Staff[];
  // Previous props like tasks/templates are removed as this is now a pure dashboard
}

type ViewMode = 'day' | 'week' | 'month';

const Board: React.FC<BoardProps> = ({ staff }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    
    let start = new Date(currentDate);
    let end = new Date(currentDate);

    if (viewMode === 'day') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (viewMode === 'week') {
      const range = getWeekRange(currentDate);
      start = range.start;
      end = range.end;
    } else if (viewMode === 'month') {
      start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
    }

    try {
      const result = await fetchDashboardStats(start, end);
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // View Navigation
  const handleNavigate = (dir: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      if (viewMode === 'day') next.setDate(prev.getDate() + (dir === 'next' ? 1 : -1));
      else if (viewMode === 'week') next.setDate(prev.getDate() + (dir === 'next' ? 7 : -7));
      else next.setMonth(prev.getMonth() + (dir === 'next' ? 1 : -1));
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      
      {/* Header Controls */}
      <div className="p-4 md:p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
         <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-slate-700 dark:text-slate-200">
               <LayoutDashboard size={24} />
            </div>
            <div>
               <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">통계 대시보드</h2>
               <p className="text-xs text-slate-500 dark:text-slate-400">전체 업무 현황을 한눈에 확인합니다.</p>
            </div>
         </div>

         <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-full md:w-auto">
               {(['day', 'week', 'month'] as ViewMode[]).map((m) => (
                 <button
                   key={m}
                   onClick={() => setViewMode(m)}
                   className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                     viewMode === m 
                       ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-white shadow-sm' 
                       : 'text-slate-500'
                   }`}
                 >
                   {{day:'일간', week:'주간', month:'월간'}[m]}
                 </button>
               ))}
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
               <DateNavigator 
                  currentDate={currentDate} 
                  viewMode={viewMode} 
                  onNavigate={handleNavigate}
               />
               <button 
                  onClick={loadData}
                  className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 transition-colors"
               >
                  <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
               </button>
            </div>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar pb-24">
         {loading && !data ? (
            <div className="flex h-64 items-center justify-center text-slate-400">
               데이터를 불러오는 중...
            </div>
         ) : data ? (
            <div className="space-y-6 max-w-6xl mx-auto">
               
               {/* 1. Summary Cards */}
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <StatCard 
                     title="물리치료실" 
                     count={data.ptRoom.count} 
                     icon={<Stethoscope size={24} className="text-emerald-600" />}
                     colorClass="bg-emerald-100 dark:bg-emerald-900/30"
                  />
                  <StatCard 
                     title="충격파실" 
                     count={data.shockwave.count} 
                     icon={<Activity size={24} className="text-pink-600" />}
                     colorClass="bg-pink-100 dark:bg-pink-900/30"
                  />
                  <StatCard 
                     title="배드 교체" 
                     count={data.beds.count} 
                     icon={<BedDouble size={24} className="text-blue-600" />}
                     colorClass="bg-blue-100 dark:bg-blue-900/30"
                  />
                  <StatCard 
                     title="세탁 업무" 
                     count={data.laundry.count} 
                     icon={<Shirt size={24} className="text-indigo-600" />}
                     colorClass="bg-indigo-100 dark:bg-indigo-900/30"
                  />
                  <StatCard 
                     title="탈의실" 
                     count={data.changingRoom.count} 
                     icon={<DoorOpen size={24} className="text-teal-600" />}
                     colorClass="bg-teal-100 dark:bg-teal-900/30"
                  />
               </div>

               {/* 2. Charts Section */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Activity Trend (Line Chart) */}
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                     <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4">
                        일별 활동 추이
                     </h3>
                     <ActivityChart data={data.activityByDate} />
                  </div>

                  {/* Staff Ranking (Bar Chart) */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                     <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4">
                        직원별 기여도 Top 5
                     </h3>
                     <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <RankingChart data={data.staffPerformance} staff={staff} />
                     </div>
                  </div>
               </div>

            </div>
         ) : null}
      </div>
    </div>
  );
};

export default Board;
