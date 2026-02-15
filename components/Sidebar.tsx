
import React from 'react';
import { Users, Database, Moon, Sun, Settings as SettingsIcon, RefreshCw, PanelLeftClose, BedDouble, Shirt, Activity, Stethoscope, DoorOpen, Package, Monitor } from 'lucide-react';
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

  // Helper to close sidebar on mobile when an item is clicked
  const handleItemClick = (tab: Tab) => {
    onTabChange(tab);
    // On mobile (< 768px), close sidebar after selection
    if (window.innerWidth < 768 && onToggle) {
      onToggle();
    }
  };

  const menuItems = [
    { id: Tab.PT_ROOM, label: '물리치료실', icon: <Stethoscope size={20} /> },
    { id: Tab.SHOCKWAVE, label: '충격파실', icon: <Activity size={20} /> },
    { id: Tab.BEDS, label: '배드 커버 관리', icon: <BedDouble size={20} /> },
    { id: Tab.LAUNDRY, label: '세탁 관리', icon: <Shirt size={20} /> },
    { id: Tab.CHANGING_ROOM, label: '탈의실 관리', icon: <DoorOpen size={20} /> },
    { id: Tab.CONSUMABLES, label: '소모품 관리', icon: <Package size={20} /> },
    { id: Tab.EQUIPMENT, label: '장비 관리', icon: <Monitor size={20} /> },
    { id: Tab.STAFF, label: '직원 관리', icon: <Users size={20} /> },
  ];

  return (
    <nav className={`
      fixed inset-y-0 left-0 z-50
      h-full w-64
      bg-white/95 dark:bg-slate-900/95 backdrop-blur-md md:bg-slate-50 md:dark:bg-slate-900
      border-r border-slate-200 dark:border-slate-800
      flex flex-col
      shadow-2xl md:shadow-none
      transition-all duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      md:static md:translate-x-0
      ${isOpen ? 'md:w-64' : 'md:w-0 md:border-none md:overflow-hidden'}
    `}>
      
      {/* Sidebar Header */}
      <div className="flex flex-col gap-4 p-4 mb-2 shrink-0">
         <div className="flex items-center justify-between gap-2">
            <div className={`flex-1 min-w-0 pt-1 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
               <h1 className="font-bold text-lg text-slate-800 dark:text-slate-100 leading-tight break-keep truncate">
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
                 title="메뉴 닫기"
               >
                 <PanelLeftClose size={18} />
               </button>
            </div>
         </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item.id)}
            className={`
              w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium text-sm
              ${activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'}
            `}
          >
            {item.icon}
            {item.label}
          </button>
        ))}

        <div className="my-2 border-t border-slate-200 dark:border-slate-800 mx-2"></div>

        <button
          onClick={() => handleItemClick(Tab.GENERAL_SETTINGS)}
          className={`
            w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium text-sm
            ${activeTab === Tab.GENERAL_SETTINGS 
              ? 'bg-slate-800 text-white shadow-md' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'}
          `}
        >
          <SettingsIcon size={20} />
          일반 설정
        </button>

        <button
          onClick={() => handleItemClick(Tab.SETTINGS)}
          className={`
            w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium text-sm
            ${activeTab === Tab.SETTINGS 
              ? 'bg-slate-800 text-white shadow-md' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'}
          `}
        >
          <Database size={20} />
          DB 연결
        </button>
      </div>

      {/* Footer / Theme Toggle */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          <span className="text-sm font-bold">{theme === 'light' ? '다크 모드' : '라이트 모드'}</span>
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
