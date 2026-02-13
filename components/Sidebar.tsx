import React from 'react';
import { LayoutDashboard, Users, Database, ClipboardList, Moon, Sun, Settings as SettingsIcon, Menu, RefreshCw, PanelLeftClose, BedDouble, Shirt, Activity } from 'lucide-react';
import { Tab } from '../types';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  isOpen?: boolean;
  onToggle?: () => void;
  appTitle?: string;
  onRefresh?: () => void;
  loading?: boolean;
  isConfigured?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  isOpen = true, 
  onToggle,
  appTitle = "PT Works",
  onRefresh,
  loading = false,
  isConfigured = false
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className={`
      h-16 md:h-full 
      fixed bottom-0 left-0 right-0 
      md:static 
      bg-slate-50 dark:bg-slate-900 
      border-t md:border-t-0 
      flex md:flex-col items-center md:items-stretch 
      justify-between md:justify-start 
      z-30 
      shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:shadow-none
      transition-all duration-300 ease-in-out
      overflow-hidden md:overflow-x-hidden md:overflow-y-auto custom-scrollbar
      ${isOpen ? 'md:w-64 md:border-r border-slate-300 dark:border-slate-800' : 'md:w-0 md:p-0 md:overflow-hidden md:border-none opacity-100 md:opacity-0 pointer-events-auto md:pointer-events-none'}
    `}>
      
      {/* Desktop Sidebar Header (Title + Controls) */}
      <div className="hidden md:flex flex-col gap-4 p-4 mb-2 shrink-0">
         <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 pt-1">
               <h1 className="font-bold text-lg text-slate-800 dark:text-slate-100 leading-tight break-keep">
                 {appTitle}
               </h1>
            </div>
            <div className="flex gap-1 shrink-0">
               {isConfigured && onRefresh && (
                 <button 
                   onClick={onRefresh}
                   disabled={loading}
                   className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors ${loading ? 'animate-spin text-blue-500' : ''}`}
                   title="새로고침"
                 >
                   <RefreshCw size={18} />
                 </button>
               )}
               <button 
                 onClick={onToggle}
                 className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                 title="사이드바 닫기"
               >
                 <PanelLeftClose size={18} />
               </button>
            </div>
         </div>
         <div className="h-px bg-slate-200 dark:bg-slate-800 w-full"></div>
      </div>

      <div className="flex-1 flex md:flex-col items-center md:items-stretch justify-between md:justify-start w-full md:px-4 md:gap-1">
        <NavButton 
          active={activeTab === Tab.BOARD} 
          onClick={() => onTabChange(Tab.BOARD)} 
          icon={<LayoutDashboard size={24} />} 
          label="보드" 
          fullLabel="업무 보드"
        />
        
        <div className="hidden md:block h-px bg-slate-200 dark:bg-slate-800 my-2 mx-2 shrink-0"></div>
        
        <NavButton 
          active={activeTab === Tab.DRAFTS} 
          onClick={() => onTabChange(Tab.DRAFTS)} 
          icon={<ClipboardList size={24} />} 
          label="목록"
          fullLabel="업무 목록" 
        />

        <NavButton 
          active={activeTab === Tab.BEDS} 
          onClick={() => onTabChange(Tab.BEDS)} 
          icon={<BedDouble size={24} />} 
          label="배드"
          fullLabel="배드 커버 관리" 
        />

        <NavButton 
          active={activeTab === Tab.LAUNDRY} 
          onClick={() => onTabChange(Tab.LAUNDRY)} 
          icon={<Shirt size={24} />} 
          label="빨래"
          fullLabel="빨래 업무" 
        />

        <NavButton 
          active={activeTab === Tab.SHOCKWAVE} 
          onClick={() => onTabChange(Tab.SHOCKWAVE)} 
          icon={<Activity size={24} />} 
          label="충격파"
          fullLabel="충격파실 관리" 
        />

        <div className="hidden md:block h-px bg-slate-200 dark:bg-slate-800 my-2 mx-2 shrink-0"></div>

        <NavButton 
          active={activeTab === Tab.STAFF} 
          onClick={() => onTabChange(Tab.STAFF)} 
          icon={<Users size={24} />} 
          label="직원"
          fullLabel="직원 관리" 
        />
        
        {/* Spacer - Desktop only */}
        <div className="hidden md:block md:flex-1 min-h-[20px]" /> 
        
        <div className="hidden md:block mb-2 px-2 border-t border-slate-300 dark:border-slate-800 pt-4 whitespace-nowrap overflow-hidden shrink-0">
           <p className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">설정</p>
        </div>

        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          className="flex md:flex-row flex-col items-center md:justify-start justify-center flex-1 md:flex-none w-auto md:w-full md:px-4 md:py-3 md:mb-1 rounded-xl transition-all duration-200 text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800 gap-1 md:gap-3 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm overflow-hidden min-w-0"
        >
          <span className="shrink-0">{theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}</span>
          <span className="text-[10px] md:text-sm font-medium md:font-semibold whitespace-nowrap">
             <span className="md:hidden">테마</span>
             <span className="hidden md:inline">{theme === 'dark' ? '라이트 모드' : '다크 모드'}</span>
          </span>
        </button>

        <NavButton 
          active={activeTab === Tab.GENERAL_SETTINGS} 
          onClick={() => onTabChange(Tab.GENERAL_SETTINGS)} 
          icon={<SettingsIcon size={24} />} 
          label="설정"
          fullLabel="일반 설정" 
        />

        <NavButton 
          active={activeTab === Tab.SETTINGS} 
          onClick={() => onTabChange(Tab.SETTINGS)} 
          icon={<Database size={24} />} 
          label="DB"
          fullLabel="DB 설정" 
        />
      </div>
    </nav>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; fullLabel?: string }> = ({ active, onClick, icon, label, fullLabel }) => (
  <button 
    onClick={onClick}
    className={`flex md:flex-row flex-col items-center md:justify-start justify-center flex-1 md:flex-none w-auto md:w-full md:px-4 md:py-3 md:mb-1 rounded-xl transition-all duration-200 gap-1 md:gap-3 border overflow-hidden min-w-0 ${
      active 
        ? 'bg-white dark:bg-blue-900/20 border-slate-300 dark:border-blue-800/50 shadow-sm text-blue-700 dark:text-blue-300' 
        : 'border-transparent hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-500 dark:text-slate-500 hover:shadow-sm'
    }`}
  >
    <span className={`shrink-0 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>{icon}</span>
    <span className="text-[10px] md:text-sm font-medium md:font-semibold whitespace-nowrap opacity-100 transition-opacity truncate w-full md:w-auto text-center md:text-left">
      <span className={fullLabel ? "md:hidden" : ""}>{label}</span>
      {fullLabel && <span className="hidden md:inline">{fullLabel}</span>}
    </span>
  </button>
);

export default Sidebar;