
import React from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { Tab } from '../types';
import { useUI } from '../context/UIContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  loading: boolean;
  isConfigured: boolean;
  onRefresh: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  loading, 
  isConfigured, 
  onRefresh 
}) => {
  const { appTitle, isSidebarOpen, toggleSidebar } = useUI();

  return (
    // Use inline style for dvh to ensure compatibility
    <div 
      className="flex flex-row bg-slate-100 dark:bg-slate-950 transition-colors duration-300 overflow-hidden"
      style={{ height: '100dvh', minHeight: '100vh' }}
    >
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={onTabChange} 
        isOpen={isSidebarOpen} 
        onToggle={toggleSidebar}
        appTitle={appTitle}
        onRefresh={onRefresh}
        loading={loading}
        isConfigured={isConfigured}
      />

      {/* Main Content Area */}
      {/* Mobile: Increased padding-bottom to 80px (pb-20) to ensure content clears the bottom nav safely */}
      <main className="flex-1 overflow-hidden relative flex flex-col w-full bg-slate-100 dark:bg-slate-950 transition-all duration-300 pb-20 md:pb-0">
        
        {/* Floating Open Button (Visible only when sidebar is closed on Desktop) */}
        {!isSidebarOpen && (
          <button 
            onClick={toggleSidebar}
            className="absolute top-3 left-3 z-40 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors hidden md:block"
            title="메뉴 열기"
          >
            <Menu size={20} />
          </button>
        )}

        {/* Global Loading Bar */}
        {loading && activeTab !== Tab.SETTINGS && activeTab !== Tab.GENERAL_SETTINGS && (
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-100 dark:bg-blue-900/30 overflow-hidden z-50">
            <div className="h-full bg-blue-500 animate-progress"></div>
          </div>
        )}
        
        <div className="h-full overflow-hidden flex flex-col">
          {children}
        </div>
      </main>

      <style>{`
        .animate-progress {
          width: 100%;
          animation: progress 2s infinite ease-in-out;
        }
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default Layout;
