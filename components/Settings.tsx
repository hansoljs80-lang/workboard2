
import React from 'react';
import { Database } from 'lucide-react';
import SupabaseSchemaSection from './settings/SupabaseSchemaSection';
import SupabaseConnectionSection from './settings/SupabaseConnectionSection';

interface SettingsProps {
  onRefresh: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onRefresh }) => {
  return (
    <div className="p-4 md:p-6 w-full h-full overflow-y-auto pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Database className="text-slate-800 dark:text-slate-100" size={28} />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">DB 연결 설정 (Supabase)</h2>
      </div>
      
      {/* 1. Schema Instructions */}
      <SupabaseSchemaSection />

      {/* 2. Connection Input */}
      <SupabaseConnectionSection onRefresh={onRefresh} />
    </div>
  );
};

export default Settings;
