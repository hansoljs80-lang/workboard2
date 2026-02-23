
import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, AlertCircle, Key, Lock } from 'lucide-react';
import { getSupabaseConfig, setSupabaseConfig } from '../../services/supabase';
import { fetchAllData } from '../../services/api';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../constants/supabaseConfig';

interface ConnectionSectionProps {
  onRefresh: () => void;
}

const SupabaseConnectionSection: React.FC<ConnectionSectionProps> = ({ onRefresh }) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  // Check if config is hardcoded in code
  const isHardcoded = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

  useEffect(() => {
    const config = getSupabaseConfig();
    setUrl(config.url);
    setAnonKey(config.anonKey);
    
    // Auto-test connection on mount if hardcoded
    if (isHardcoded && config.url && config.anonKey) {
       testConnection();
    }
  }, []);

  const testConnection = async () => {
    setStatus('saving'); // reusing saving state for 'testing'
    const res = await fetchAllData();
    if (res.success) {
      setStatus('success');
      setMsg('연결 성공! (설정이 코드에 고정되어 있습니다)');
    } else {
      setStatus('error');
      setMsg('연결 실패. 코드에 입력된 설정을 확인하세요.');
    }
  };

  const handleSave = async () => {
    if (!url || !anonKey) {
      alert("URL과 Key를 모두 입력해주세요.");
      return;
    }

    setStatus('saving');
    setSupabaseConfig(url, anonKey);
    
    // Test connection
    const res = await fetchAllData();
    if (res.success) {
      setStatus('success');
      setMsg('연결 성공! 데이터베이스와 정상적으로 통신했습니다.');
      onRefresh();
    } else {
      setStatus('error');
      setMsg('연결 실패. URL과 Key가 올바른지 확인하세요.');
      console.error(res.message);
    }
  };

  if (isHardcoded) {
    return (
      <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-xl shadow-sm border border-blue-200 dark:border-blue-900/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Lock size={100} />
        </div>
        
        <div className="flex items-center gap-2 mb-4 relative z-10">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <Lock size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200">프로젝트 연결 (고정됨)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <code>constants/supabaseConfig.ts</code> 파일에 설정이 고정되어 있습니다.
            </p>
          </div>
        </div>

        <div className="space-y-3 relative z-10">
           <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
             <p className="text-xs font-bold text-slate-500 mb-1">Project URL</p>
             <p className="font-mono text-sm text-slate-700 dark:text-slate-300 truncate">{SUPABASE_URL}</p>
           </div>
           
           <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
             <p className="text-xs font-bold text-slate-500 mb-1">Anon Public Key</p>
             <p className="font-mono text-sm text-slate-700 dark:text-slate-300 truncate">
               {SUPABASE_ANON_KEY.substring(0, 10)}...**********************
             </p>
           </div>

           {status === 'success' ? (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg flex items-center gap-2 border border-green-100 dark:border-green-800">
                <CheckCircle size={18} /> 
                <span className="text-sm font-medium">{msg}</span>
              </div>
           ) : status === 'error' ? (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg flex items-center gap-2 border border-red-100 dark:border-red-800">
                <AlertCircle size={18} /> 
                <span className="text-sm font-medium">{msg}</span>
              </div>
           ) : (
             <div className="mt-4 p-3 text-slate-500 text-sm">
               연결 확인 중...
             </div>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
          <Key size={20} />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200">2단계: 프로젝트 연결</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Supabase 프로젝트 설정(API)에서 URL과 Key를 가져오세요.</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Project URL
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-project-id.supabase.co"
            className="w-full p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-mono text-slate-600 dark:text-slate-200"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Anon Public Key
          </label>
          <input
            type="password"
            value={anonKey}
            onChange={(e) => setAnonKey(e.target.value)}
            placeholder="eyJh......"
            className="w-full p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-mono text-slate-600 dark:text-slate-200"
          />
        </div>
      </div>
      
      <button
        onClick={handleSave}
        disabled={status === 'saving'}
        className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 transition-colors shadow-md"
      >
        {status === 'saving' ? '연결 중...' : '저장 및 연결 테스트'}
        <Save size={18} />
      </button>

      {status === 'success' && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg flex items-center gap-2 border border-green-100 dark:border-green-800">
          <CheckCircle size={18} /> 
          <span className="text-sm font-medium">{msg}</span>
        </div>
      )}
      
      {status === 'error' && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg flex items-center gap-2 border border-red-100 dark:border-red-800">
          <AlertCircle size={18} /> 
          <span className="text-sm font-medium">{msg}</span>
        </div>
      )}
    </div>
  );
};

export default SupabaseConnectionSection;
