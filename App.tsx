import React, { useState, useEffect } from 'react';
import { Database } from 'lucide-react';
import Board from './components/Board';
import StaffManager from './components/StaffManager';
import Settings from './components/Settings';
import GeneralSettings from './components/GeneralSettings';
import DraftManager from './components/DraftManager';
import BedManager from './components/BedManager';
import LaundryManager from './components/LaundryManager'; 
import ShockwaveManager from './components/ShockwaveManager'; 
import PtRoomManager from './components/PtRoomManager'; 
import ChangingRoomManager from './components/ChangingRoomManager'; // New Import
import Layout from './components/Layout';
import { useAppData } from './hooks/useAppData';
import { Tab } from './types';
import { useUI } from './context/UIContext';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.BOARD);
  const { tasks, staff, templates, settings, loading, isConfigured, loadData } = useAppData();
  const { setAppTitle } = useUI();

  // Sync Global Settings
  useEffect(() => {
    if (settings && settings['app_title']) {
      setAppTitle(settings['app_title']);
    }
  }, [settings, setAppTitle]);

  useEffect(() => {
    if (!isConfigured && !loading) {
      setActiveTab(Tab.SETTINGS);
    }
  }, [isConfigured, loading]);

  const renderContent = () => {
    if (!isConfigured && activeTab !== Tab.SETTINGS && activeTab !== Tab.GENERAL_SETTINGS) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <Database size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">DB 설정이 필요합니다</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">앱을 사용하기 위해 Google Sheet 연동 설정이 필요합니다.</p>
          <button 
            onClick={() => setActiveTab(Tab.SETTINGS)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
          >
            DB 설정 페이지로 이동
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case Tab.BOARD:
        // Pass templates to Board for virtual task generation
        return <Board tasks={tasks} staff={staff} templates={templates} onRefresh={loadData} />;
      case Tab.DRAFTS:
        return (
          <DraftManager 
            templates={templates} 
            staff={staff} 
            onRefresh={loadData} 
            onNavigateToBoard={() => setActiveTab(Tab.BOARD)}
          />
        );
      case Tab.BEDS:
        return (
          <BedManager 
            staff={staff} 
            tasks={tasks} // Pass tasks for synchronization
            settings={settings} 
            onRefresh={loadData} 
            onNavigateToBoard={() => setActiveTab(Tab.BOARD)}
          />
        );
      case Tab.LAUNDRY:
        return (
          <LaundryManager staff={staff} />
        );
      case Tab.PT_ROOM:
        return (
          <PtRoomManager staff={staff} />
        );
      case Tab.SHOCKWAVE:
        return (
          <ShockwaveManager staff={staff} />
        );
      case Tab.CHANGING_ROOM: // New Case
        return (
          <ChangingRoomManager staff={staff} />
        );
      case Tab.STAFF:
        // Pass tasks and templates to enable Safe Delete logic
        return <StaffManager staffList={staff} tasks={tasks} templates={templates} onRefresh={loadData} />;
      case Tab.GENERAL_SETTINGS:
        return <GeneralSettings />;
      case Tab.SETTINGS:
        return <Settings onRefresh={loadData} />;
      default:
        return null;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
      loading={loading}
      isConfigured={isConfigured}
      onRefresh={loadData}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;