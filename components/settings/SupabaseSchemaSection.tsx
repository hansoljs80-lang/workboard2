
import React, { useState } from 'react';
import { Copy, FileCode, CheckCircle } from 'lucide-react';
import { SUPABASE_SCHEMA_SQL } from '../../constants/supabaseSchema';

const SupabaseSchemaSection: React.FC = () => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <FileCode size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200">1단계: 테이블 생성 (SQL Editor)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">아래 SQL 코드를 복사하여 Supabase SQL Editor에서 실행하세요.</p>
          </div>
        </div>
        <button 
          onClick={handleCopyCode}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm active:scale-95"
        >
          {copyStatus === 'copied' ? <CheckCircle size={16} className="text-green-400"/> : <Copy size={16} />}
          {copyStatus === 'copied' ? '복사됨' : 'SQL 복사'}
        </button>
      </div>
      
      <div className="relative group">
        <textarea 
          readOnly 
          value={SUPABASE_SCHEMA_SQL} 
          className="w-full h-48 p-4 bg-slate-950 text-slate-300 font-mono text-xs rounded-lg focus:outline-none custom-scrollbar resize-none leading-relaxed border border-slate-800"
          onClick={(e) => e.currentTarget.select()}
        />
        <div className="absolute top-2 right-4 text-[10px] text-slate-500 bg-slate-800 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          클릭하여 전체 선택
        </div>
      </div>

      <div className="mt-4 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
        <h4 className="font-bold mb-2 flex items-center gap-2">🚀 테이블 세팅 방법</h4>
        <ol className="list-decimal pl-5 space-y-1 text-xs md:text-sm">
          <li><strong>Supabase 대시보드</strong>에 접속하여 새 프로젝트를 생성합니다.</li>
          <li>좌측 메뉴의 <strong>SQL Editor</strong>로 이동합니다.</li>
          <li>위 코드를 붙여넣고 <strong>Run</strong> 버튼을 눌러 테이블을 생성합니다.</li>
          <li><strong>Success</strong> 메시지가 나오면 테이블 생성 완료!</li>
        </ol>
      </div>
    </div>
  );
};

export default SupabaseSchemaSection;
