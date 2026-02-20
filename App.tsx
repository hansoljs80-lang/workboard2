
import React, { useState, useEffect, Suspense } from 'react';

import Layout from './components/Layout';
import PageLoader from './components/common/PageLoader';
import { useAppData } from './hooks/useAppData';
import { Tab } from './types';
import { useUI } from './context/UIContext';

// --- Code Splitting (Lazy Loading) ---
// 각 탭의 컴포넌트를 필요할 때만 불러오도록 분리합니다.
const PtRoomManager = React.lazy(() => import('./components/PtRoomManager'));
const ShockwaveManager = React.lazy(() => import('./components/ShockwaveManager'));
const BedManager = React.lazy(() => import('./components/BedManager'));
const LaundryManager = React.lazy(() => import('./components/LaundryManager'));
const ChangingRoomManager = React.lazy(() => import('./components/ChangingRoomManager'));
const ConsumablesManager = React.lazy(() => import('./components/ConsumablesManager'));
const EquipmentManager = React.lazy(() => import('./components/EquipmentManager'));
const StaffManager = React.lazy(() => import('./components/StaffManager'));
const GeneralSettings = React.lazy(() => import('./components/GeneralSettings'));
const Settings = React.lazy(() => import('./components/Settings'));

const App: React.FC = () => {
  // Default to PT Room as requested
  const [activeTab, setActiveTab] = useState<Tab>(Tab.PT_ROOM);
  const { tasks, staff, templates, settings, loading, isConfigured, loadData } = useAppData();
  const { setAppTitle } = useUI();

  // Sync Global Settings
  useEffect(() => {
    if (settings && settings['app_title']) {
      setAppTitle(settings['app_title']);
    }
  }, [settings, setAppTitle]);

  const renderContent = () => {
    return (
      <Suspense fallback={<PageLoader />}>
        {(() => {
          switch (activeTab) {
            case Tab.PT_ROOM:
              return <PtRoomManager staff={staff} />;
            case Tab.SHOCKWAVE:
              return <ShockwaveManager staff={staff} />;
            case Tab.BEDS:
              return (
                <BedManager 
                  staff={staff} 
                  tasks={tasks}
                  settings={settings} 
                  onRefresh={loadData} 
                  onNavigateToBoard={() => {}}
                />
              );
            case Tab.LAUNDRY:
              return <LaundryManager staff={staff} />;
            case Tab.CHANGING_ROOM:
              return <ChangingRoomManager staff={staff} />;
            case Tab.CONSUMABLES:
              return <ConsumablesManager staff={staff} />;
            case Tab.EQUIPMENT:
              return <EquipmentManager staff={staff} />;
            case Tab.STAFF:
              return <StaffManager staffList={staff} tasks={tasks} templates={templates} onRefresh={loadData} />;
            case Tab.GENERAL_SETTINGS:
              return <GeneralSettings />;
            case Tab.SETTINGS:
              return <Settings onRefresh={loadData} />;
            default:
              return null;
          }
        })()}
      </Suspense>
    );
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
