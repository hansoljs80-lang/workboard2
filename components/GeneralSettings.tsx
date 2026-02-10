
import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle, Loader2 } from 'lucide-react';
import { useUI } from '../context/UIContext';
import { updateSetting } from '../services/api';

const GeneralSettings: React.FC = () => {
  const { appTitle, setAppTitle } = useUI();
  const [localTitle, setLocalTitle] = useState(appTitle);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setLocalTitle(appTitle);
  }, [appTitle]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localTitle.trim()) return;
    
    setIsLoading(true);
    
    try {
      // 1. Update DB
      const res = await updateSetting('app_title', localTitle);
      
      if (res.success) {
        // 2. Update Local State & UI
        setAppTitle(localTitle);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      } else {
        alert("설정 저장 실패: " + res.message);
      }
    } catch (error) {
      console.error(error);
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 w-full h-full overflow-y-auto pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="text-slate-800 dark:text-slate-100" size={28} />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">일반 설정</h2>
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 max-w-2xl">
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
          앱 기본 정보
        </h3>
        
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
              헤더 타이틀 (앱 이름)
            </label>
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-slate-100 transition-all"
              placeholder="예: 물리치료실 업무 보드"
            />
            <p className="text-xs text-slate-400 mt-2">
              상단 헤더에 표시될 이름을 설정합니다. (DB에 저장되어 모든 기기에 동기화됩니다)
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!localTitle.trim() || isLoading}
              className="px-6 py-2.5 bg-slate-800 dark:bg-slate-700 text-white rounded-lg font-bold hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70"
            >
              {isLoading ? (
                 <>
                   <Loader2 size={18} className="animate-spin" />
                   저장 중...
                 </>
              ) : isSaved ? (
                <>
                  <CheckCircle size={18} className="text-green-400" />
                  저장됨
                </>
              ) : (
                <>
                  <Save size={18} />
                  설정 저장
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300">
        <p className="font-bold mb-1">📢 알림</p>
        <p>설정 저장이 작동하지 않는다면 <strong>DB 설정 &gt; 스크립트 배포</strong> 메뉴에서 최신 코드로 업데이트되었는지 확인해주세요. (Settings 시트 지원 필요)</p>
      </div>
    </div>
  );
};

export default GeneralSettings;
