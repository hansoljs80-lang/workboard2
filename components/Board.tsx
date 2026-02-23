
import React, { useState, useEffect, useCallback } from 'react';
import { Staff } from '../types';
import { Stethoscope, Activity, BedDouble, Shirt, DoorOpen, LayoutDashboard, RefreshCw, BarChart2 } from 'lucide-react';
import { fetchDashboardStats, DashboardData } from '../services/dashboardService';
import { StatCard, RankingChart, ActivityChart } from './dashboard/DashboardWidgets';
import CategoryDashboard from './dashboard/CategoryDashboard';
import DateNavigator from './DateNavigator';
import { getWeekRange, getYearRange } from '../utils/dateUtils';

interface BoardProps {
  staff: Staff[];
}

type ViewMode = 'day' | 'week' | 'month' | 'year';
type DashboardTab = 'OVERVIEW' | 'PT' | 'SHOCKWAVE' | 'BED' | 'LAUNDRY' | 'CHANGING';

const Board: React.FC<BoardProps> = ({ staff }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('OVERVIEW');

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
    } else if (viewMode === 'year') {
      const range = getYearRange(currentDate);
      start = range.start;
      end = range.end;
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
      else if (viewMode === 'month') next.setMonth(prev.getMonth() + (dir === 'next' ? 1 : -1));
      else next.setFullYear(prev.getFullYear() + (dir === 'next' ? 1 : -1));
      return next;
    });
  };

  const tabs: { id: DashboardTab; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'OVERVIEW', label: '종합 요약', icon: <LayoutDashboard size={16} />, color: 'text-slate-600' },
    { id: 'PT', label: '물리치료', icon: <Stethoscope size={16} />, color: 'text-emerald-600' },
    { id: 'SHOCKWAVE', label: '충격파', icon: <Activity size={16} />, color: 'text-pink-600' },
    { id: 'BED', label: '베드 관리', icon: <BedDouble size={16} />, color: 'text-blue-600' },
    { id: 'LAUNDRY', label: '세탁', icon: <Shirt size={16} />, color: 'text-indigo-600' },
    { id: 'CHANGING', label: '탈의실', icon: <DoorOpen size={16} />, color: 'text-teal-600' },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      
      {/* Header Controls */}
      <div className="p-4 md:p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-4 shrink-0">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-slate-700 dark:text-slate-200">
                   <BarChart2 size={24} />
                </div>
                <div>
                   <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">통계 대시보드</h2>
                   <p className="text-xs text-slate-500 dark:text-slate-400">업무별 상세 분석 및 직원별 성과를 확인합니다.</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-full md:w-auto">
                   {(['day', 'week', 'month', 'year'] as ViewMode[]).map((m) => (
                     <button
                       key={m}
                       onClick={() => setViewMode(m)}
                       className={`flex-1 md:flex-none px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                         viewMode === m 
                           ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-white shadow-sm' 
                           : 'text-slate-500 dark:text-slate-400'
                       }`}
                     >
                       {{day:'일간', week:'주간', month:'월간', year:'연간'}[m]}
                     </button>
                   ))}
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
                   <DateNavigator 
                      currentDate={currentDate} 
                      viewMode={viewMode === 'year' ? 'month' : viewMode} // DateNavigator doesn't fully support year UI yet, fallback to month-like nav
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

         {/* Menu Tabs */}
         <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
            {tabs.map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap border
                    ${activeTab === tab.id 
                       ? 'bg-slate-800 dark:bg-slate-700 text-white border-slate-800 dark:border-slate-700 shadow-md' 
                       : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}
                 `}
               >
                  {tab.icon}
                  {tab.label}
               </button>
            ))}
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar pb-24">
         {loading && !data ? (
            <div className="flex h-64 items-center justify-center text-slate-400 flex-col gap-2">
               <RefreshCw className="animate-spin" />
               데이터를 분석하고 있습니다...
            </div>
         ) : data ? (
            <div className="max-w-6xl mx-auto h-full">
               
               {activeTab === 'OVERVIEW' && (
                 <div className="space-y-6 animate-fade-in">
                    {/* Summary Cards */}
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
                          title="베드 교체" 
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

                    {/* Overview Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                       {/* Activity Trend (Line Chart) */}
                       <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[300px]">
                          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4">
                             전체 활동 추이
                          </h3>
                          <div className="flex-1">
                             <ActivityChart data={data.activityByDate} />
                          </div>
                       </div>

                       {/* Staff Ranking (Bar Chart) */}
                       <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[300px]">
                          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4">
                             통합 기여도 (Top 5)
                          </h3>
                          <div className="flex-1 overflow-y-auto custom-scrollbar">
                             <RankingChart data={data.staffPerformance} staff={staff} />
                          </div>
                       </div>
                    </div>
                 </div>
               )}

               {activeTab === 'PT' && (
                  <CategoryDashboard 
                     title="물리치료실"
                     items={data.ptRoom.items}
                     staff={staff}
                     viewMode={viewMode}
                     colorClass="text-emerald-500"
                  />
               )}

               {activeTab === 'SHOCKWAVE' && (
                  <CategoryDashboard 
                     title="충격파실"
                     items={data.shockwave.items}
                     staff={staff}
                     viewMode={viewMode}
                     colorClass="text-pink-500"
                  />
               )}

               {activeTab === 'BED' && (
                  <CategoryDashboard 
                     title="베드 커버"
                     items={data.beds.items}
                     staff={staff}
                     viewMode={viewMode}
                     colorClass="text-blue-500"
                  />
               )}

               {activeTab === 'LAUNDRY' && (
                  <CategoryDashboard 
                     title="세탁 업무"
                     items={data.laundry.items}
                     staff={staff}
                     viewMode={viewMode}
                     colorClass="text-indigo-500"
                  />
               )}

               {activeTab === 'CHANGING' && (
                  <CategoryDashboard 
                     title="탈의실"
                     items={data.changingRoom.items}
                     staff={staff}
                     viewMode={viewMode}
                     colorClass="text-teal-500"
                  />
               )}

            </div>
         ) : null}
      </div>
    </div>
  );
};

export default Board;
